'use client'

import React from 'react'
import { Controller } from 'react-hook-form'

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

// Reusable styles
const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors"
const labelStyles = "block text-sm font-semibold text-gray-700 mb-1"
const errorStyles = "text-red-500 text-sm mt-1"

interface Step2BillingProps {
  register: any
  control: any
  errors: any
}

export default function Step2Billing({ register, control, errors }: Step2BillingProps) {
  return (
    <div>
      <h3 className="text-xl font-bold text-brand-secondary mb-4">Billing Information</h3>
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
  )
}
