import { z } from 'zod'
import { optionalString } from './common'

export const EVENT_TYPES = ['training', 'meeting', 'league', 'social'] as const

// Schema for form inputs (dates as strings from datetime-local)
export const calendarEventFormSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  type: z.enum(EVENT_TYPES, {
    errorMap: () => ({ message: 'Event type is required' }),
  }),
  start: z.string().min(1, 'Start date/time is required'),
  end: z.string().min(1, 'End date/time is required'),
  location: optionalString,
  description: optionalString,
  instructor: optionalString,
  maxParticipants: z.union([
    z.string().transform((val) => val ? parseInt(val) : undefined),
    z.number(),
    z.undefined(),
  ]).optional(),
  registrationLink: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
}).refine((data) => {
  const start = new Date(data.start)
  const end = new Date(data.end)
  return end >= start
}, {
  message: 'End time must be after start time',
  path: ['end'],
})

export type CalendarEventFormData = z.infer<typeof calendarEventFormSchema>

// Convert form data to the event object format
export function formDataToEvent(data: CalendarEventFormData) {
  return {
    title: data.title,
    type: data.type,
    start: new Date(data.start),
    end: new Date(data.end),
    location: data.location || undefined,
    description: data.description || undefined,
    instructor: data.instructor || undefined,
    maxParticipants: typeof data.maxParticipants === 'number' ? data.maxParticipants : undefined,
    registrationLink: data.registrationLink || undefined,
  }
}
