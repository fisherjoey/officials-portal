'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { IconSend, IconCheck, IconAlertCircle, IconBulb, IconX } from '@tabler/icons-react'
import { orgConfig } from '@/config/organization'

// Pattern detection for suggesting the right form
type FormSuggestion = {
  type: 'booking' | 'become-referee'
  title: string
  description: string
  href: string
  linkText: string
} | null

const BOOKING_PATTERNS = [
  // Direct booking intent
  /\b(need|want|looking for|require|hire|book)\b.*\b(refs?|referees?|officials?|umpires?)\b/i,
  /\b(refs?|referees?|officials?)\b.*\b(for|to|at)\b.*\b(our|my|the|a)\b/i,
  // Event types that need officials
  /\b(tournament|tourney|league|exhibition|scrimmage|game|games|match|matches)\b.*\b(need|refs?|officials?|referees?)\b/i,
  /\b(hosting|organizing|running|have)\b.*\b(tournament|tourney|league|event|games?)\b/i,
  // Scheduling/booking language
  /\b(schedule|scheduling|assign|assignment|cover|coverage)\b.*\b(refs?|officials?|referees?|games?)\b/i,
  /how (do|can) (i|we) (get|book|hire|request)/i,
  /\b(officiating services|officiating request)\b/i,
  // Numbers + games pattern
  /\b\d+\s*(games?|courts?|gyms?)\b/i,
  // Date patterns with events
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b.*\b(tournament|event|games?|league)\b/i,
]

const BECOME_REFEREE_PATTERNS = [
  // Direct intent to become
  /\b(want|like|interested|looking)\b.*\b(to\s+)?(become|be|start|try)\b.*\b(a\s+)?(ref|referee|official|umpire)\b/i,
  /\b(how|where)\b.*\b(do|can|to)\b.*\b(i|we)\b.*\b(become|join|sign up|register|apply|get certified|start)\b/i,
  /\b(become|becoming|join|joining)\b.*\b(a\s+)?(ref|referee|official|association)\b/i,
  // Training/certification
  /\b(training|certification|certified|course|clinic|class)\b.*\b(refs?|referees?|officials?|officiating)\b/i,
  /\b(refs?|referees?|officials?|officiating)\b.*\b(training|certification|course|clinic)\b/i,
  // Membership questions
  /\b(join|membership|member|sign up|register)\b.*\b(association|officials?)\b/i,
  // New official patterns
  /\bnew (to )?officiating\b/i,
  /\b(never|haven't|have not)\b.*\b(officiated|reffed|refereed)\b/i,
  /\bnew official program\b/i,
  // Requirements
  /\b(what|requirements?|qualifications?|need)\b.*\b(to\s+)?(become|be|start)\b.*\b(ref|referee|official)\b/i,
]

function detectFormSuggestion(message: string, subject: string): FormSuggestion {
  const combined = `${subject} ${message}`.toLowerCase()

  // Check for booking patterns
  for (const pattern of BOOKING_PATTERNS) {
    if (pattern.test(combined)) {
      return {
        type: 'booking',
        title: 'Looking to book officials?',
        description: 'Our Officiating Services Request form is the fastest way to book officials for your event.',
        href: '/get-officials',
        linkText: 'Go to Booking Form',
      }
    }
  }

  // Check for become-a-referee patterns
  for (const pattern of BECOME_REFEREE_PATTERNS) {
    if (pattern.test(combined)) {
      return {
        type: 'become-referee',
        title: 'Interested in becoming an official?',
        description: 'Our New Officials application page has everything you need to get started.',
        href: '/become-a-referee',
        linkText: 'Apply to Become an Official',
      }
    }
  }

  return null
}

// Contact form categories - emails are handled server-side via environment variables
const contactCategories = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'scheduling', label: 'Officiating Services / Booking' },
  { value: 'billing', label: 'Billing / Payments' },
  { value: 'membership', label: 'Membership' },
  { value: 'education', label: 'Education / Training' },
  { value: 'website', label: 'Website / Technical' },
  { value: 'performance', label: 'Performance / Evaluation' },
  { value: 'recruiting', label: 'Recruitment' },
  { value: 'other', label: 'Other' },
] as const

const validCategories = contactCategories.map(c => c.value)

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  category: z.string().min(1, 'Please select a category'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
})

type ContactFormData = z.infer<typeof contactSchema>

const inputStyles = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors"
const labelStyles = "block text-sm font-semibold text-gray-700 mb-2"
const errorStyles = "text-red-500 text-sm mt-1"

export default function ContactForm() {
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLFormElement>(null)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)

  // Get category from URL params
  const categoryParam = searchParams.get('category')
  const defaultCategory = categoryParam && validCategories.includes(categoryParam) ? categoryParam : ''

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      category: defaultCategory,
      subject: '',
      message: '',
    }
  })

  // Watch message and subject for smart suggestions
  const watchedMessage = watch('message')
  const watchedSubject = watch('subject')

  // Detect if user should use a different form
  const formSuggestion = useMemo(() => {
    if (suggestionDismissed) return null
    if (!watchedMessage || watchedMessage.length < 15) return null
    return detectFormSuggestion(watchedMessage, watchedSubject || '')
  }, [watchedMessage, watchedSubject, suggestionDismissed])

  // Scroll to form and set category when URL has category param
  useEffect(() => {
    if (categoryParam && validCategories.includes(categoryParam)) {
      setValue('category', categoryParam)
      // Scroll to form after a brief delay to ensure page is loaded
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [categoryParam, setValue])

  const onSubmit = async (data: ContactFormData) => {
    setSubmitStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/.netlify/functions/contact-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message')
      }

      setSubmitStatus('success')
      reset()
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message. Please try again.')
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <IconCheck size={32} className="text-green-600" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
        <p className="text-green-700 mb-6">
          Thank you for contacting us. We&apos;ll get back to you as soon as possible.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setSubmitStatus('idle')}
        >
          Send Another Message
        </Button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <IconAlertCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Failed to send message</p>
            <p className="text-red-600 text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className={labelStyles}>
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className={inputStyles}
            placeholder="John Doe"
          />
          {errors.name && <p className={errorStyles}>{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className={labelStyles}>
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={inputStyles}
            placeholder="john@example.com"
          />
          {errors.email && <p className={errorStyles}>{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="category" className={labelStyles}>
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          {...register('category')}
          className={inputStyles}
        >
          <option value="">Select a category...</option>
          {contactCategories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        {errors.category && <p className={errorStyles}>{errors.category.message}</p>}
      </div>

      <div>
        <label htmlFor="subject" className={labelStyles}>
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          id="subject"
          type="text"
          {...register('subject')}
          className={inputStyles}
          placeholder="What is this regarding?"
        />
        {errors.subject && <p className={errorStyles}>{errors.subject.message}</p>}
      </div>

      <div>
        <label htmlFor="message" className={labelStyles}>
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          {...register('message')}
          rows={6}
          className={inputStyles}
          placeholder="Please provide as much detail as possible..."
        />
        {errors.message && <p className={errorStyles}>{errors.message.message}</p>}

        {/* Smart form suggestion */}
        {formSuggestion && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-4 relative">
            <button
              type="button"
              onClick={() => setSuggestionDismissed(true)}
              className="absolute top-2 right-2 text-amber-400 hover:text-amber-600 transition-colors"
              aria-label="Dismiss suggestion"
            >
              <IconX size={18} />
            </button>
            <div className="flex items-start gap-3 pr-6">
              <IconBulb size={24} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">{formSuggestion.title}</p>
                <p className="text-amber-700 text-sm mt-1">{formSuggestion.description}</p>
                <Link
                  href={formSuggestion.href}
                  className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-brand-primary hover:text-brand-secondary transition-colors"
                >
                  {formSuggestion.linkText} →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          className="w-full md:w-auto"
          disabled={submitStatus === 'loading'}
        >
          {submitStatus === 'loading' ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Sending...
            </>
          ) : (
            <>
              <IconSend size={20} className="mr-2" />
              Send Message
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
