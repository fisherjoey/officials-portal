'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { IconCheck } from '@tabler/icons-react'
import { orgConfig } from '@/config/organization'

export default function OfficialsBookingForm() {
  const [eventType, setEventType] = useState('')
  const [formData, setFormData] = useState({
    // Organization Info
    organizationName: '',

    // Billing Info
    billingContactName: '',
    billingEmail: '',
    billingAddress: '',
    city: '',
    province: 'Alberta',
    postalCode: '',
    paymentAgreed: false,

    // Event Contact
    eventContactName: '',
    eventContactEmail: '',

    // Event Details
    eventType: '',

    // League specific
    leagueName: '',
    leagueStartDate: '',
    leagueEndDate: '',
    leagueGender: '',
    leagueLevel: '',

    // Tournament specific
    tournamentName: '',
    tournamentDates: '',
    tournamentGender: '',
    tournamentLevel: '',

    // Exhibition specific
    exhibitionDate: '',
    exhibitionGender: '',
    exhibitionLevel: '',
    numberOfGames: '',

    additionalInfo: ''
  })

  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Here you would normally send the data to your API
    // For now, just show success
    setIsSubmitted(true)

    // Reset after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({
        organizationName: '',
        billingContactName: '',
        billingEmail: '',
        billingAddress: '',
        city: '',
        province: 'Alberta',
        postalCode: '',
        paymentAgreed: false,
        eventContactName: '',
        eventContactEmail: '',
        eventType: '',
        leagueName: '',
        leagueStartDate: '',
        leagueEndDate: '',
        leagueGender: '',
        leagueLevel: '',
        tournamentName: '',
        tournamentDates: '',
        tournamentGender: '',
        tournamentLevel: '',
        exhibitionDate: '',
        exhibitionGender: '',
        exhibitionLevel: '',
        numberOfGames: '',
        additionalInfo: ''
      })
      setEventType('')
    }, 3000)
  }

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto p-12 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <IconCheck className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-brand-secondary mb-4">Request Submitted Successfully!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your {orgConfig.labels.officials.toLowerCase()} request. We&apos;ll review your submission and contact you within 24-48 hours.
        </p>
        <p className="text-sm text-gray-500">
          A confirmation email has been sent to your provided email address.
        </p>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Organization Information */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-brand-secondary mb-4">Organization Information</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
              Organization/Association Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="organizationName"
              name="organizationName"
              required
              value={formData.organizationName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-secondary focus:border-brand-secondary"
            />
          </div>
        </div>
      </Card>

      {/* Billing Information */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-brand-secondary mb-4">Billing Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="billingContactName" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="billingContactName"
              name="billingContactName"
              required
              value={formData.billingContactName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-secondary focus:border-brand-secondary"
            />
          </div>

          <div>
            <label htmlFor="billingEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="billingEmail"
              name="billingEmail"
              required
              value={formData.billingEmail}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-secondary focus:border-brand-secondary"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Billing Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="billingAddress"
              name="billingAddress"
              required
              value={formData.billingAddress}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-secondary focus:border-brand-secondary"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="city"
              name="city"
              required
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-secondary focus:border-brand-secondary"
            />
          </div>

          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              required
              value={formData.postalCode}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-secondary focus:border-brand-secondary"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              name="paymentAgreed"
              checked={formData.paymentAgreed}
              onChange={handleInputChange}
              required
              className="mt-1 mr-2"
            />
            <span className="text-sm text-gray-700">
              I understand that I will be invoiced for officiating services at the current rates
              and agree to pay within 30 days of invoice receipt. <span className="text-red-500">*</span>
            </span>
          </label>
        </div>
      </Card>

      {/* Event Contact */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-brand-secondary mb-4">Event Contact (if different from billing)</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="eventContactName" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name
            </label>
            <input
              type="text"
              id="eventContactName"
              name="eventContactName"
              value={formData.eventContactName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-secondary focus:border-brand-secondary"
            />
          </div>

          <div>
            <label htmlFor="eventContactEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="eventContactEmail"
              name="eventContactEmail"
              value={formData.eventContactEmail}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-secondary focus:border-brand-secondary"
            />
          </div>
        </div>
      </Card>

      {/* Event Type Selection */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-brand-secondary mb-4">Event Type</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => {
              setEventType('league')
              setFormData(prev => ({ ...prev, eventType: 'league' }))
            }}
            className={`p-4 border-2 rounded-lg text-center transition-colors ${
              eventType === 'league'
                ? 'border-brand-secondary bg-brand-secondary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h4 className="font-semibold">League</h4>
            <p className="text-sm text-gray-600 mt-1">Regular season games</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setEventType('tournament')
              setFormData(prev => ({ ...prev, eventType: 'tournament' }))
            }}
            className={`p-4 border-2 rounded-lg text-center transition-colors ${
              eventType === 'tournament'
                ? 'border-brand-secondary bg-brand-secondary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h4 className="font-semibold">Tournament</h4>
            <p className="text-sm text-gray-600 mt-1">Multi-day events</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setEventType('exhibition')
              setFormData(prev => ({ ...prev, eventType: 'exhibition' }))
            }}
            className={`p-4 border-2 rounded-lg text-center transition-colors ${
              eventType === 'exhibition'
                ? 'border-brand-secondary bg-brand-secondary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h4 className="font-semibold">Exhibition</h4>
            <p className="text-sm text-gray-600 mt-1">Single games or events</p>
          </button>
        </div>
      </Card>

      {/* Dynamic Event Details based on type */}
      {eventType && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-brand-secondary mb-4">Event Details</h3>

          {/* Add specific form fields based on event type */}
          {eventType === 'league' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="leagueName" className="block text-sm font-medium text-gray-700 mb-1">
                  League Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="leagueName"
                  name="leagueName"
                  required
                  value={formData.leagueName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              {/* Add more league-specific fields */}
            </div>
          )}

          {eventType === 'tournament' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="tournamentName" className="block text-sm font-medium text-gray-700 mb-1">
                  Tournament Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="tournamentName"
                  name="tournamentName"
                  required
                  value={formData.tournamentName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              {/* Add more tournament-specific fields */}
            </div>
          )}

          {eventType === 'exhibition' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="exhibitionDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Game Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="exhibitionDate"
                  name="exhibitionDate"
                  required
                  value={formData.exhibitionDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              {/* Add more exhibition-specific fields */}
            </div>
          )}
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button type="submit" variant="primary" size="lg">
          Submit {orgConfig.labels.officials} Request
        </Button>
      </div>
    </form>
  )
}