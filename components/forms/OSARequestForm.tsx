'use client'

import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { IconCheck, IconAlertCircle, IconLoader2, IconPlus, IconTrash, IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { orgConfig } from '@/config/organization'

// Province options
const PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'ON', label: 'Ontario' },
  { value: 'QC', label: 'Quebec' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'YT', label: 'Yukon' },
]

// Days of week options
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Level of play options
const LEVELS_OF_PLAY = [
  'U11', 'U13', 'U15', 'U17', 'U19',
  'Junior High', 'HS-JV', 'HS-SV',
  'College/University', 'Adult', 'Other'
]

// Gender options
const GENDERS = ['Male', 'Female']

// Event types
const EVENT_TYPES = ['Exhibition Game(s)', 'League', 'Tournament'] as const

// Discipline policy options (from config)
const DISCIPLINE_POLICIES = orgConfig.booking.disciplinePolicies

// Validation regex patterns
const PHONE_REGEX = /^(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/
const POSTAL_CODE_REGEX = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/i

// Format phone number as user types: (403) 555-1234
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

// Format postal code as user types: T2P 1A1
const formatPostalCode = (value: string): string => {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (cleaned.length <= 3) return cleaned
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`
}

// Phone validation helper
const phoneSchema = z.string()
  .optional()
  .refine(
    (val) => !val || val.trim() === '' || PHONE_REGEX.test(val.replace(/\s/g, '')),
    { message: 'Please enter a valid phone number' }
  )

// Postal code validation helper
const postalCodeSchema = z.string()
  .min(1, 'Postal code is required')
  .refine(
    (val) => POSTAL_CODE_REGEX.test(val.trim()),
    { message: 'Please enter a valid postal code' }
  )

// Schema for a single exhibition game entry
const exhibitionGameSchema = z.object({
  date: z.string()
    .min(1, 'Date is required')
    .refine(
      (val) => {
        if (!val) return true
        const selectedDate = new Date(val)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return selectedDate >= today
      },
      { message: 'Date cannot be in the past' }
    ),
  time: z.string().min(1, 'Time is required'),
  numberOfGames: z.string()
    .min(1, 'Number of games is required')
    .refine(
      (val) => {
        const num = parseInt(val, 10)
        return !isNaN(num) && num >= 1 && num <= 50
      },
      { message: 'Enter a valid number (1-50)' }
    ),
})

// Schema for a single event
const eventSchema = z.object({
  eventType: z.enum(EVENT_TYPES, { message: 'Please select an event type' }),

  // League fields
  leagueName: z.string().optional(),
  leagueStartDate: z.string().optional(),
  leagueEndDate: z.string().optional(),
  leagueDaysOfWeek: z.array(z.string()).optional(),
  leaguePlayerGender: z.array(z.string()).optional(),
  leagueLevelOfPlay: z.array(z.string()).optional(),

  // Exhibition fields
  exhibitionGameLocation: z.string().optional(),
  exhibitionPlayerGender: z.array(z.string()).optional(),
  exhibitionLevelOfPlay: z.array(z.string()).optional(),
  exhibitionGames: z.array(exhibitionGameSchema).optional(),

  // Tournament fields
  tournamentName: z.string().optional(),
  tournamentStartDate: z.string().optional(),
  tournamentEndDate: z.string().optional(),
  tournamentNumberOfGames: z.string().optional(),
  tournamentPlayerGender: z.array(z.string()).optional(),
  tournamentLevelOfPlay: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (data.eventType === 'League') {
    if (!data.leagueName || data.leagueName.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'League name is required (min 2 characters)', path: ['leagueName'] })
    }
    if (!data.leagueStartDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Start date is required', path: ['leagueStartDate'] })
    } else {
      const startDate = new Date(data.leagueStartDate)
      if (startDate < today) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Start date cannot be in the past', path: ['leagueStartDate'] })
      }
    }
    if (!data.leagueEndDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date is required', path: ['leagueEndDate'] })
    } else if (data.leagueStartDate) {
      const startDate = new Date(data.leagueStartDate)
      const endDate = new Date(data.leagueEndDate)
      if (endDate < startDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date must be on or after start date', path: ['leagueEndDate'] })
      }
    }
    if (!data.leagueDaysOfWeek?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select at least one day', path: ['leagueDaysOfWeek'] })
    }
    if (!data.leaguePlayerGender?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select player gender', path: ['leaguePlayerGender'] })
    }
    if (!data.leagueLevelOfPlay?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select level of play', path: ['leagueLevelOfPlay'] })
    }
  }

  if (data.eventType === 'Exhibition Game(s)') {
    if (!data.exhibitionGameLocation || data.exhibitionGameLocation.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Game location is required (min 2 characters)', path: ['exhibitionGameLocation'] })
    }
    if (!data.exhibitionGames?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least one game is required', path: ['exhibitionGames'] })
    }
    if (!data.exhibitionPlayerGender?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select player gender', path: ['exhibitionPlayerGender'] })
    }
    if (!data.exhibitionLevelOfPlay?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select level of play', path: ['exhibitionLevelOfPlay'] })
    }
  }

  if (data.eventType === 'Tournament') {
    if (!data.tournamentName || data.tournamentName.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Tournament name is required (min 2 characters)', path: ['tournamentName'] })
    }
    if (!data.tournamentStartDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Start date is required', path: ['tournamentStartDate'] })
    } else {
      const startDate = new Date(data.tournamentStartDate)
      if (startDate < today) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Start date cannot be in the past', path: ['tournamentStartDate'] })
      }
    }
    if (!data.tournamentEndDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date is required', path: ['tournamentEndDate'] })
    } else if (data.tournamentStartDate) {
      const startDate = new Date(data.tournamentStartDate)
      const endDate = new Date(data.tournamentEndDate)
      if (endDate < startDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date must be on or after start date', path: ['tournamentEndDate'] })
      }
    }
    if (!data.tournamentNumberOfGames) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Estimated number of games is required', path: ['tournamentNumberOfGames'] })
    } else {
      const num = parseInt(data.tournamentNumberOfGames, 10)
      if (isNaN(num) || num < 1 || num > 500) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid number (1-500)', path: ['tournamentNumberOfGames'] })
      }
    }
    if (!data.tournamentPlayerGender?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select player gender', path: ['tournamentPlayerGender'] })
    }
    if (!data.tournamentLevelOfPlay?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select level of play', path: ['tournamentLevelOfPlay'] })
    }
  }
})

// Full form schema
const osaFormSchema = z.object({
  // Organization
  organizationName: z.string()
    .min(2, 'Organization name is required (min 2 characters)')
    .max(100, 'Organization name is too long (max 100 characters)'),

  // Billing
  billingContactName: z.string()
    .min(2, 'Billing contact name is required (min 2 characters)')
    .max(100, 'Name is too long (max 100 characters)'),
  billingEmail: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email is too long'),
  billingPhone: phoneSchema,
  billingAddress: z.string()
    .min(5, 'Billing address is required (min 5 characters)')
    .max(200, 'Address is too long (max 200 characters)'),
  billingCity: z.string()
    .min(2, 'City is required (min 2 characters)')
    .max(100, 'City name is too long'),
  billingProvince: z.string().min(1, 'Province is required'),
  billingPostalCode: postalCodeSchema,

  // Event Contact
  eventContactName: z.string()
    .min(2, 'Event contact name is required (min 2 characters)')
    .max(100, 'Name is too long (max 100 characters)'),
  eventContactEmail: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email is too long'),
  eventContactPhone: phoneSchema,

  // Events array
  events: z.array(eventSchema).min(1, 'At least one event is required'),

  // Policies
  disciplinePolicy: z.string().min(1, 'Please select a discipline policy'),
  agreement: z.boolean().refine(val => val === true, 'You must agree to the exclusivity agreement'),
})

type OSAFormData = z.infer<typeof osaFormSchema>
type EventData = z.infer<typeof eventSchema>

// Reusable input styles
const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors"
const labelStyles = "block text-sm font-semibold text-gray-700 mb-1"
const errorStyles = "text-red-500 text-sm mt-1"
const sectionTitleStyles = "text-xl font-bold text-brand-secondary mb-4"

// Checkbox Group Component
function CheckboxGroup({
  label,
  options,
  value = [],
  onChange,
  error,
  required
}: {
  label: string
  options: string[]
  value?: string[]
  onChange: (value: string[]) => void
  error?: string
  required?: boolean
}) {
  const handleToggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  return (
    <div className="mb-4">
      <label className={labelStyles}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
        {options.map(option => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(option)}
              onChange={() => handleToggle(option)}
              className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
            />
            <span className="text-sm text-gray-700">{option}</span>
          </label>
        ))}
      </div>
      {error && <p className={errorStyles}>{error}</p>}
    </div>
  )
}

// Get event type color
function getEventTypeColor(eventType: string): string {
  return eventType ? 'border-gray-300 bg-gray-50' : 'border-gray-300 bg-white'
}

// Get event type badge color
function getEventTypeBadgeColor(eventType: string): string {
  return 'bg-gray-100 text-gray-800'
}

// Event Card Component
function EventCard({
  index,
  control,
  register,
  errors,
  watch,
  remove,
  canRemove,
}: {
  index: number
  control: any
  register: any
  errors: any
  watch: any
  remove: () => void
  canRemove: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const eventType = watch(`events.${index}.eventType`)
  const eventErrors = errors?.events?.[index]

  const getEventTitle = () => {
    if (!eventType) return `Event ${index + 1}`

    if (eventType === 'League') {
      const name = watch(`events.${index}.leagueName`)
      return name ? `${name}` : `Event ${index + 1}: League`
    }
    if (eventType === 'Tournament') {
      const name = watch(`events.${index}.tournamentName`)
      return name ? `${name}` : `Event ${index + 1}: Tournament`
    }
    if (eventType === 'Exhibition Game(s)') {
      const location = watch(`events.${index}.exhibitionGameLocation`)
      return location ? `Exhibition at ${location}` : `Event ${index + 1}: Exhibition`
    }
    return `Event ${index + 1}`
  }

  return (
    <div className={`border-2 rounded-lg overflow-hidden ${eventType ? getEventTypeColor(eventType) : 'border-gray-300 bg-white'}`}>
      {/* Card Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-secondary text-white font-bold text-sm">
            {index + 1}
          </span>
          <div>
            <h4 className="font-semibold text-gray-800">{getEventTitle()}</h4>
            {eventType && (
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getEventTypeBadgeColor(eventType)}`}>
                {eventType}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                remove()
              }}
              className="p-2 text-red-500 hover:bg-red-100 rounded-md transition-colors"
              title="Remove event"
            >
              <IconTrash size={18} />
            </button>
          )}
          <button
            type="button"
            className="p-2 text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
          >
            {isExpanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Card Content */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-200">
          {/* Event Type Selection */}
          <div className="mb-4">
            <label className={labelStyles}>
              Event Type <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {EVENT_TYPES.map(type => (
                <label key={type} className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-white/50 transition-colors bg-white">
                  <input
                    type="radio"
                    value={type}
                    {...register(`events.${index}.eventType`)}
                    className="w-5 h-5 text-brand-primary border-gray-300 focus:ring-brand-primary"
                  />
                  <span className="text-gray-700 font-medium">{type}</span>
                </label>
              ))}
            </div>
            {eventErrors?.eventType && <p className={errorStyles}>{eventErrors.eventType.message}</p>}
          </div>

          {/* League Details */}
          {eventType === 'League' && (
            <LeagueFields
              index={index}
              control={control}
              register={register}
              errors={eventErrors}
            />
          )}

          {/* Exhibition Details */}
          {eventType === 'Exhibition Game(s)' && (
            <ExhibitionFields
              index={index}
              control={control}
              register={register}
              errors={eventErrors}
            />
          )}

          {/* Tournament Details */}
          {eventType === 'Tournament' && (
            <TournamentFields
              index={index}
              control={control}
              register={register}
              errors={eventErrors}
            />
          )}
        </div>
      )}
    </div>
  )
}

// League Fields Component
function LeagueFields({ index, control, register, errors }: { index: number; control: any; register: any; errors: any }) {
  return (
    <div className="space-y-4 p-4 bg-white rounded-lg">
      <h5 className="font-semibold text-blue-800">League Details</h5>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`events.${index}.leagueName`} className={labelStyles}>
            League Name <span className="text-red-500">*</span>
          </label>
          <input
            id={`events.${index}.leagueName`}
            type="text"
            {...register(`events.${index}.leagueName`)}
            className={inputStyles}
          />
          {errors?.leagueName && <p className={errorStyles}>{errors.leagueName.message}</p>}
        </div>

        <div>
          <label htmlFor={`events.${index}.leagueStartDate`} className={labelStyles}>
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            id={`events.${index}.leagueStartDate`}
            type="date"
            {...register(`events.${index}.leagueStartDate`)}
            className={inputStyles}
          />
          {errors?.leagueStartDate && <p className={errorStyles}>{errors.leagueStartDate.message}</p>}
        </div>

        <div>
          <label htmlFor={`events.${index}.leagueEndDate`} className={labelStyles}>
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            id={`events.${index}.leagueEndDate`}
            type="date"
            {...register(`events.${index}.leagueEndDate`)}
            className={inputStyles}
          />
          {errors?.leagueEndDate && <p className={errorStyles}>{errors.leagueEndDate.message}</p>}
        </div>
      </div>

      <Controller
        name={`events.${index}.leagueDaysOfWeek`}
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            label="Days of Week"
            options={DAYS_OF_WEEK}
            value={field.value}
            onChange={field.onChange}
            error={errors?.leagueDaysOfWeek?.message}
            required
          />
        )}
      />

      <Controller
        name={`events.${index}.leaguePlayerGender`}
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            label="Player Gender"
            options={GENDERS}
            value={field.value}
            onChange={field.onChange}
            error={errors?.leaguePlayerGender?.message}
            required
          />
        )}
      />

      <Controller
        name={`events.${index}.leagueLevelOfPlay`}
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            label="Level of Play"
            options={LEVELS_OF_PLAY}
            value={field.value}
            onChange={field.onChange}
            error={errors?.leagueLevelOfPlay?.message}
            required
          />
        )}
      />
    </div>
  )
}

// Exhibition Fields Component with multiple games support
function ExhibitionFields({ index, control, register, errors }: { index: number; control: any; register: any; errors: any }) {
  const { fields: gameFields, append: appendGame, remove: removeGame } = useFieldArray({
    control,
    name: `events.${index}.exhibitionGames`,
  })

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg">
      <h5 className="font-semibold text-orange-800">Exhibition Game Details</h5>

      <div>
        <label htmlFor={`events.${index}.exhibitionGameLocation`} className={labelStyles}>
          Game Location <span className="text-red-500">*</span>
        </label>
        <input
          id={`events.${index}.exhibitionGameLocation`}
          type="text"
          {...register(`events.${index}.exhibitionGameLocation`)}
          className={inputStyles}
          placeholder="e.g., Community Sports Centre"
        />
        {errors?.exhibitionGameLocation && <p className={errorStyles}>{errors.exhibitionGameLocation.message}</p>}
      </div>

      {/* Multiple Games Section */}
      <div>
        <label className={labelStyles}>
          Game Dates & Times <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Add each game date/time. You can add multiple games for the same event.
        </p>

        <div className="space-y-3">
          {gameFields.map((field, gameIndex) => (
            <div key={field.id} className="flex flex-wrap gap-3 items-start p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex-1 min-w-[140px]">
                <label className="text-xs font-medium text-gray-600">Date</label>
                <input
                  type="date"
                  {...register(`events.${index}.exhibitionGames.${gameIndex}.date`)}
                  className={inputStyles}
                />
                {errors?.exhibitionGames?.[gameIndex]?.date && (
                  <p className={errorStyles}>{errors.exhibitionGames[gameIndex].date.message}</p>
                )}
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs font-medium text-gray-600">Start Time</label>
                <input
                  type="time"
                  {...register(`events.${index}.exhibitionGames.${gameIndex}.time`)}
                  className={inputStyles}
                />
                {errors?.exhibitionGames?.[gameIndex]?.time && (
                  <p className={errorStyles}>{errors.exhibitionGames[gameIndex].time.message}</p>
                )}
              </div>
              <div className="w-24">
                <label className="text-xs font-medium text-gray-600"># Games</label>
                <input
                  type="number"
                  min="1"
                  {...register(`events.${index}.exhibitionGames.${gameIndex}.numberOfGames`)}
                  className={inputStyles}
                  placeholder="1"
                />
                {errors?.exhibitionGames?.[gameIndex]?.numberOfGames && (
                  <p className={errorStyles}>{errors.exhibitionGames[gameIndex].numberOfGames.message}</p>
                )}
              </div>
              {gameFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGame(gameIndex)}
                  className="mt-5 p-2 text-red-500 hover:bg-red-100 rounded-md transition-colors"
                  title="Remove game"
                >
                  <IconTrash size={18} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => appendGame({ date: '', time: '', numberOfGames: '1' })}
          className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-md transition-colors"
        >
          <IconPlus size={16} />
          Add Another Game Date/Time
        </button>

        {errors?.exhibitionGames && typeof errors.exhibitionGames.message === 'string' && (
          <p className={errorStyles}>{errors.exhibitionGames.message}</p>
        )}
      </div>

      <Controller
        name={`events.${index}.exhibitionPlayerGender`}
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            label="Player Gender"
            options={GENDERS}
            value={field.value}
            onChange={field.onChange}
            error={errors?.exhibitionPlayerGender?.message}
            required
          />
        )}
      />

      <Controller
        name={`events.${index}.exhibitionLevelOfPlay`}
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            label="Level of Play"
            options={LEVELS_OF_PLAY}
            value={field.value}
            onChange={field.onChange}
            error={errors?.exhibitionLevelOfPlay?.message}
            required
          />
        )}
      />
    </div>
  )
}

// Tournament Fields Component
function TournamentFields({ index, control, register, errors }: { index: number; control: any; register: any; errors: any }) {
  return (
    <div className="space-y-4 p-4 bg-white rounded-lg">
      <h5 className="font-semibold text-green-800">Tournament Details</h5>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`events.${index}.tournamentName`} className={labelStyles}>
            Tournament Name <span className="text-red-500">*</span>
          </label>
          <input
            id={`events.${index}.tournamentName`}
            type="text"
            {...register(`events.${index}.tournamentName`)}
            className={inputStyles}
          />
          {errors?.tournamentName && <p className={errorStyles}>{errors.tournamentName.message}</p>}
        </div>

        <div>
          <label htmlFor={`events.${index}.tournamentNumberOfGames`} className={labelStyles}>
            Estimated Number of Games <span className="text-red-500">*</span>
          </label>
          <input
            id={`events.${index}.tournamentNumberOfGames`}
            type="number"
            min="1"
            {...register(`events.${index}.tournamentNumberOfGames`)}
            className={inputStyles}
          />
          {errors?.tournamentNumberOfGames && <p className={errorStyles}>{errors.tournamentNumberOfGames.message}</p>}
        </div>

        <div>
          <label htmlFor={`events.${index}.tournamentStartDate`} className={labelStyles}>
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            id={`events.${index}.tournamentStartDate`}
            type="date"
            {...register(`events.${index}.tournamentStartDate`)}
            className={inputStyles}
          />
          {errors?.tournamentStartDate && <p className={errorStyles}>{errors.tournamentStartDate.message}</p>}
        </div>

        <div>
          <label htmlFor={`events.${index}.tournamentEndDate`} className={labelStyles}>
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            id={`events.${index}.tournamentEndDate`}
            type="date"
            {...register(`events.${index}.tournamentEndDate`)}
            className={inputStyles}
          />
          {errors?.tournamentEndDate && <p className={errorStyles}>{errors.tournamentEndDate.message}</p>}
        </div>
      </div>

      <Controller
        name={`events.${index}.tournamentPlayerGender`}
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            label="Player Gender"
            options={GENDERS}
            value={field.value}
            onChange={field.onChange}
            error={errors?.tournamentPlayerGender?.message}
            required
          />
        )}
      />

      <Controller
        name={`events.${index}.tournamentLevelOfPlay`}
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            label="Level of Play"
            options={LEVELS_OF_PLAY}
            value={field.value}
            onChange={field.onChange}
            error={errors?.tournamentLevelOfPlay?.message}
            required
          />
        )}
      />
    </div>
  )
}

// Main Form Component
export default function OSARequestForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors }
  } = useForm<OSAFormData>({
    resolver: zodResolver(osaFormSchema),
    defaultValues: {
      events: [{
        eventType: undefined as any,
        leagueDaysOfWeek: [],
        leaguePlayerGender: [],
        leagueLevelOfPlay: [],
        exhibitionPlayerGender: [],
        exhibitionLevelOfPlay: [],
        exhibitionGames: [{ date: '', time: '', numberOfGames: '1' }],
        tournamentPlayerGender: [],
        tournamentLevelOfPlay: [],
      }],
      agreement: false,
    }
  })

  const { fields: eventFields, append: appendEvent, remove: removeEvent } = useFieldArray({
    control,
    name: 'events',
  })

  const events = watch('events')
  const eventCount = events?.length || 0

  const onSubmit = async (data: OSAFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Transform the data for the webhook
      // Each event becomes its own entry, but they share org/billing/contact info
      const payload = {
        // Shared info
        organizationName: data.organizationName,
        billingContactName: data.billingContactName,
        billingEmail: data.billingEmail,
        billingPhone: data.billingPhone,
        billingAddress: data.billingAddress,
        billingCity: data.billingCity,
        billingProvince: data.billingProvince,
        billingPostalCode: data.billingPostalCode,
        eventContactName: data.eventContactName,
        eventContactEmail: data.eventContactEmail,
        eventContactPhone: data.eventContactPhone,
        disciplinePolicy: data.disciplinePolicy,
        agreement: data.agreement,
        submissionTime: new Date().toISOString(),

        // Events array
        events: data.events.map((event, idx) => ({
          eventIndex: idx + 1,
          eventType: event.eventType,

          // League fields (transformed to comma-separated strings)
          leagueName: event.leagueName,
          leagueStartDate: event.leagueStartDate,
          leagueEndDate: event.leagueEndDate,
          leagueDaysOfWeek: event.leagueDaysOfWeek?.join(', '),
          leaguePlayerGender: event.leaguePlayerGender?.join(', '),
          leagueLevelOfPlay: event.leagueLevelOfPlay?.join(', '),

          // Exhibition fields
          exhibitionGameLocation: event.exhibitionGameLocation,
          exhibitionGames: event.exhibitionGames,
          exhibitionPlayerGender: event.exhibitionPlayerGender?.join(', '),
          exhibitionLevelOfPlay: event.exhibitionLevelOfPlay?.join(', '),

          // Tournament fields
          tournamentName: event.tournamentName,
          tournamentStartDate: event.tournamentStartDate,
          tournamentEndDate: event.tournamentEndDate,
          tournamentNumberOfGames: event.tournamentNumberOfGames,
          tournamentPlayerGender: event.tournamentPlayerGender?.join(', '),
          tournamentLevelOfPlay: event.tournamentLevelOfPlay?.join(', '),
        })),
      }

      const response = await fetch('/.netlify/functions/osa-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit form')
      }

      // Redirect to success page
      router.push('/get-officials/success')
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addNewEvent = () => {
    appendEvent({
      eventType: undefined as any,
      leagueDaysOfWeek: [],
      leaguePlayerGender: [],
      leagueLevelOfPlay: [],
      exhibitionPlayerGender: [],
      exhibitionLevelOfPlay: [],
      exhibitionGames: [{ date: '', time: '', numberOfGames: '1' }],
      tournamentPlayerGender: [],
      tournamentLevelOfPlay: [],
    })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Organization Information */}
        <div>
          <h3 className={sectionTitleStyles}>Organization Information</h3>
          <div>
            <label htmlFor="organizationName" className={labelStyles}>
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              id="organizationName"
              type="text"
              {...register('organizationName')}
              className={inputStyles}
              placeholder="e.g., Youth Sports League"
            />
            {errors.organizationName && <p className={errorStyles}>{errors.organizationName.message}</p>}
          </div>
        </div>

        {/* Section 2: Billing Information */}
        <div>
          <h3 className={sectionTitleStyles}>Billing Information</h3>
          <p className="text-sm text-gray-600 mb-4">
            Payment is due within 30 days of invoice date. For events starting after April 1st, payment is required in advance.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="billingContactName" className={labelStyles}>
                Billing Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                id="billingContactName"
                type="text"
                {...register('billingContactName')}
                className={inputStyles}
              />
              {errors.billingContactName && <p className={errorStyles}>{errors.billingContactName.message}</p>}
            </div>

            <div>
              <label htmlFor="billingEmail" className={labelStyles}>
                Billing Email <span className="text-red-500">*</span>
              </label>
              <input
                id="billingEmail"
                type="email"
                {...register('billingEmail')}
                className={inputStyles}
              />
              {errors.billingEmail && <p className={errorStyles}>{errors.billingEmail.message}</p>}
            </div>

            <div>
              <label htmlFor="billingPhone" className={labelStyles}>
                Billing Phone
              </label>
              <Controller
                name="billingPhone"
                control={control}
                render={({ field }) => (
                  <input
                    id="billingPhone"
                    type="tel"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                    onBlur={field.onBlur}
                    className={inputStyles}
                    placeholder="(403) 555-1234"
                    maxLength={14}
                  />
                )}
              />
              {errors.billingPhone && <p className={errorStyles}>{errors.billingPhone.message}</p>}
            </div>

            <div>
              <label htmlFor="billingAddress" className={labelStyles}>
                Billing Address <span className="text-red-500">*</span>
              </label>
              <input
                id="billingAddress"
                type="text"
                {...register('billingAddress')}
                className={inputStyles}
              />
              {errors.billingAddress && <p className={errorStyles}>{errors.billingAddress.message}</p>}
            </div>

            <div>
              <label htmlFor="billingCity" className={labelStyles}>
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="billingCity"
                type="text"
                {...register('billingCity')}
                className={inputStyles}
              />
              {errors.billingCity && <p className={errorStyles}>{errors.billingCity.message}</p>}
            </div>

            <div>
              <label htmlFor="billingProvince" className={labelStyles}>
                Province <span className="text-red-500">*</span>
              </label>
              <select
                id="billingProvince"
                {...register('billingProvince')}
                className={inputStyles}
              >
                <option value="">Select province</option>
                {PROVINCES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              {errors.billingProvince && <p className={errorStyles}>{errors.billingProvince.message}</p>}
            </div>

            <div>
              <label htmlFor="billingPostalCode" className={labelStyles}>
                Postal Code <span className="text-red-500">*</span>
              </label>
              <Controller
                name="billingPostalCode"
                control={control}
                render={({ field }) => (
                  <input
                    id="billingPostalCode"
                    type="text"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(formatPostalCode(e.target.value))}
                    onBlur={field.onBlur}
                    className={inputStyles}
                    placeholder="T2P 1A1"
                    maxLength={7}
                  />
                )}
              />
              {errors.billingPostalCode && <p className={errorStyles}>{errors.billingPostalCode.message}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Event Contact */}
        <div>
          <h3 className={sectionTitleStyles}>Event Contact</h3>
          <p className="text-sm text-gray-600 mb-4">
            This person will be contacted regarding scheduling and game day coordination.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventContactName" className={labelStyles}>
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                id="eventContactName"
                type="text"
                {...register('eventContactName')}
                className={inputStyles}
              />
              {errors.eventContactName && <p className={errorStyles}>{errors.eventContactName.message}</p>}
            </div>

            <div>
              <label htmlFor="eventContactEmail" className={labelStyles}>
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                id="eventContactEmail"
                type="email"
                {...register('eventContactEmail')}
                className={inputStyles}
              />
              {errors.eventContactEmail && <p className={errorStyles}>{errors.eventContactEmail.message}</p>}
            </div>

            <div>
              <label htmlFor="eventContactPhone" className={labelStyles}>
                Contact Phone
              </label>
              <Controller
                name="eventContactPhone"
                control={control}
                render={({ field }) => (
                  <input
                    id="eventContactPhone"
                    type="tel"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                    onBlur={field.onBlur}
                    className={inputStyles}
                    placeholder="(403) 555-1234"
                    maxLength={14}
                  />
                )}
              />
              {errors.eventContactPhone && <p className={errorStyles}>{errors.eventContactPhone.message}</p>}
            </div>
          </div>
        </div>

        {/* Section 4: Events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={sectionTitleStyles}>Events</h3>
            <span className="px-3 py-1 bg-brand-secondary text-white rounded-full text-sm font-medium">
              {eventCount} {eventCount === 1 ? 'Event' : 'Events'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Add one or more events. Each event will be processed separately but share the same organization and contact information.
          </p>

          <div className="space-y-4">
            {eventFields.map((field, index) => (
              <EventCard
                key={field.id}
                index={index}
                control={control}
                register={register}
                errors={errors}
                watch={watch}
                remove={() => removeEvent(index)}
                canRemove={eventFields.length > 1}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addNewEvent}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 text-brand-secondary font-semibold bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg transition-colors"
          >
            <IconPlus size={20} />
            Add Another Event
          </button>

          {errors.events && typeof errors.events.message === 'string' && (
            <p className={errorStyles}>{errors.events.message}</p>
          )}
        </div>

        {/* Section 5: Discipline Policy */}
        <div>
          <h3 className={sectionTitleStyles}>Discipline Policy</h3>
          <p className="text-sm text-gray-600 mb-4">
            Which discipline policy will govern your event(s)?
          </p>
          <div className="space-y-3">
            {DISCIPLINE_POLICIES.map(policy => (
              <label key={policy} className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  value={policy}
                  {...register('disciplinePolicy')}
                  className="w-5 h-5 text-brand-primary border-gray-300 focus:ring-brand-primary"
                />
                <span className="text-gray-700">{policy}</span>
              </label>
            ))}
          </div>
          {errors.disciplinePolicy && <p className={errorStyles}>{errors.disciplinePolicy.message}</p>}
        </div>

        {/* Section 6: Agreement */}
        <div>
          <h3 className={sectionTitleStyles}>Exclusivity Agreement</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">
              By checking this box, you agree that {orgConfig.name} will be
              the <strong>exclusive provider</strong> of {orgConfig.labels.officials.toLowerCase()} for your event(s). This ensures consistent
              quality, coordination, and coverage for all your {orgConfig.labels.games.toLowerCase()}.
            </p>
          </div>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('agreement')}
              className="w-5 h-5 mt-0.5 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
            />
            <span className="text-gray-700">
              I agree that {orgConfig.name} will be the exclusive provider of {orgConfig.labels.officials.toLowerCase()} for {eventCount === 1 ? 'this event' : 'these events'}. <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.agreement && <p className={errorStyles}>{errors.agreement.message}</p>}
        </div>

        {/* Submit Error Message */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <IconAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-700">Submission Error</p>
              <p className="text-red-600 text-sm">{submitError}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            <span className="inline-flex items-center justify-center">
              {isSubmitting ? (
                <>
                  <IconLoader2 className="animate-spin mr-2" size={20} />
                  Submitting...
                </>
              ) : (
                <>
                  <IconCheck className="mr-2" size={20} />
                  Submit {eventCount} {eventCount === 1 ? 'Event' : 'Events'}
                </>
              )}
            </span>
          </Button>
        </div>

        {/* Privacy Notice */}
        <p className="text-xs text-gray-500 text-center">
          Your information will be used to process your officiating services request and will be stored securely.
          <a href="/contact?category=scheduling" className="text-brand-primary hover:text-brand-secondary"> Contact us</a> with any questions.
        </p>
      </form>
    </Card>
  )
}
