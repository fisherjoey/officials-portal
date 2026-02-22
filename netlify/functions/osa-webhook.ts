import { Handler, HandlerEvent } from '@netlify/functions'
import { generateCBOAEmailTemplate } from '../../lib/emailTemplate'
import { Logger } from '../../lib/logger'
import { osaExcelSync, OSASubmissionData } from '../../lib/excel-sync'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Supabase client for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * OSA (Officiating Services Agreement) Form Webhook
 *
 * Receives form submissions and sends branded emails
 * to the client, scheduler, treasurer, and optionally president.
 *
 * Now supports multi-event submissions where each event creates
 * a separate database row but shares org/billing/contact info.
 */

// Exhibition game entry
interface ExhibitionGame {
  date: string
  time: string
  numberOfGames: string
}

// Single event data
interface EventData {
  eventIndex: number
  eventType: string // "Exhibition Game(s)" | "League" | "Tournament"

  // League fields
  leagueName?: string
  leagueStartDate?: string
  leagueEndDate?: string
  leagueDaysOfWeek?: string
  leaguePlayerGender?: string
  leagueLevelOfPlay?: string

  // Exhibition fields
  exhibitionGameLocation?: string
  exhibitionGames?: ExhibitionGame[]
  exhibitionPlayerGender?: string
  exhibitionLevelOfPlay?: string

  // Tournament fields
  tournamentName?: string
  tournamentStartDate?: string
  tournamentEndDate?: string
  tournamentNumberOfGames?: string | number
  tournamentPlayerGender?: string
  tournamentLevelOfPlay?: string
}

// Multi-event form data (new format)
interface MultiEventFormData {
  // Organization
  organizationName: string

  // Billing
  billingContactName: string
  billingEmail: string
  billingPhone?: string
  billingAddress?: string
  billingCity?: string
  billingProvince?: string
  billingPostalCode?: string

  // Event Contact
  eventContactName: string
  eventContactEmail: string
  eventContactPhone?: string

  // Events array
  events: EventData[]

  // Policies
  disciplinePolicy: string
  agreement?: boolean | string

  // Submission metadata
  submissionTime?: string
}

// Legacy single-event format (for backwards compatibility)
interface LegacyFormData {
  organizationName: string
  billingContactName: string
  billingEmail: string
  billingPhone?: string
  billingAddress?: string
  billingCity?: string
  billingProvince?: string
  billingPostalCode?: string
  eventContactName: string
  eventContactEmail: string
  eventContactPhone?: string
  eventType: string
  leagueName?: string
  leagueStartDate?: string
  leagueEndDate?: string
  leagueDaysOfWeek?: string
  leaguePlayerGender?: string
  leagueLevelOfPlay?: string
  exhibitionGameLocation?: string
  exhibitionNumberOfGames?: string | number
  exhibitionGameDate?: string
  exhibitionStartTime?: string
  exhibitionPlayerGender?: string
  exhibitionLevelOfPlay?: string
  tournamentName?: string
  tournamentStartDate?: string
  tournamentEndDate?: string
  tournamentNumberOfGames?: string | number
  tournamentPlayerGender?: string
  tournamentLevelOfPlay?: string
  disciplinePolicy: string
  agreement?: string
  submissionTime?: string
}

// Get Microsoft Graph access token
async function getAccessToken(): Promise<string> {
  const tokenEndpoint = `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID || '',
    client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get access token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

// Load file as base64
async function loadFileAsBase64(filename: string): Promise<string | null> {
  try {
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'documents', filename),
      path.join(process.cwd(), 'public', filename),
      path.join(__dirname, '..', '..', 'public', 'documents', filename),
      path.join(__dirname, '..', '..', 'public', filename),
    ]

    for (const filePath of possiblePaths) {
      try {
        const fileBuffer = fs.readFileSync(filePath)
        return fileBuffer.toString('base64')
      } catch {
        // Try next path
      }
    }

    console.error(`File not found: ${filename}`)
    return null
  } catch (error) {
    console.error(`Error loading file ${filename}:`, error)
    return null
  }
}

// Get content type from filename
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':
      return 'application/pdf'
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'xls':
      return 'application/vnd.ms-excel'
    default:
      return 'application/octet-stream'
  }
}

// Send email via Microsoft Graph API with optional attachments and CC
async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  htmlContent: string,
  attachments?: Array<{ name: string; content: string; contentType: string }>,
  cc?: string[]
): Promise<void> {
  const senderEmail = process.env.OSA_SENDER_EMAIL || 'scheduler@example.com'
  const graphEndpoint = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`

  const emailMessage: any = {
    message: {
      subject: subject,
      body: {
        contentType: 'HTML',
        content: htmlContent
      },
      from: {
        emailAddress: {
          address: senderEmail
        }
      },
      toRecipients: [
        {
          emailAddress: {
            address: to
          }
        }
      ]
    },
    saveToSentItems: true
  }

  // Add CC recipients if provided
  if (cc && cc.length > 0) {
    emailMessage.message.ccRecipients = cc.map(email => ({
      emailAddress: {
        address: email
      }
    }))
  }

  // Add attachments if provided
  if (attachments && attachments.length > 0) {
    emailMessage.message.attachments = attachments.map(att => ({
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: att.name,
      contentType: att.contentType,
      contentBytes: att.content
    }))
  }

  const response = await fetch(graphEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailMessage)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email to ${to}: ${error}`)
  }
}

// Helper to get event-specific details from an event
function getEventDetails(event: EventData): {
  eventName: string
  startDate: string
  endDate?: string
  numberOfGames?: string | number
  location?: string
  playerGender?: string
  levelOfPlay?: string
  daysOfWeek?: string
  startTime?: string
  exhibitionGames?: ExhibitionGame[]
} {
  switch (event.eventType) {
    case 'League':
      return {
        eventName: event.leagueName || 'League',
        startDate: event.leagueStartDate || '',
        endDate: event.leagueEndDate,
        playerGender: event.leaguePlayerGender,
        levelOfPlay: event.leagueLevelOfPlay,
        daysOfWeek: event.leagueDaysOfWeek,
      }
    case 'Tournament':
      return {
        eventName: event.tournamentName || 'Tournament',
        startDate: event.tournamentStartDate || '',
        endDate: event.tournamentEndDate,
        numberOfGames: event.tournamentNumberOfGames,
        playerGender: event.tournamentPlayerGender,
        levelOfPlay: event.tournamentLevelOfPlay,
      }
    case 'Exhibition Game(s)':
    default:
      // For exhibition, calculate total games and get first date
      const games = event.exhibitionGames || []
      const totalGames = games.reduce((sum, g) => sum + (parseInt(g.numberOfGames) || 0), 0)
      const firstGame = games[0]
      return {
        eventName: 'Exhibition Game(s)',
        startDate: firstGame?.date || '',
        numberOfGames: totalGames || games.length,
        location: event.exhibitionGameLocation,
        playerGender: event.exhibitionPlayerGender,
        levelOfPlay: event.exhibitionLevelOfPlay,
        startTime: firstGame?.time,
        exhibitionGames: games,
      }
  }
}

// Generate HTML for a single event's details
function generateEventDetailsHtml(event: EventData): string {
  const details = getEventDetails(event)

  if (event.eventType === 'League') {
    return `
      <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">League Name:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${details.eventName}</td></tr>
      <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Start Date:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${details.startDate}</td></tr>
      ${details.endDate ? `<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">End Date:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${details.endDate}</td></tr>` : ''}
      ${details.daysOfWeek ? `<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Day(s) of Week:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${details.daysOfWeek}</td></tr>` : ''}
      ${details.playerGender ? `<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Player Gender:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${details.playerGender}</td></tr>` : ''}
      ${details.levelOfPlay ? `<tr><td style="padding: 12px; font-weight: 600;">Level of Play:</td>
          <td style="padding: 12px;">${details.levelOfPlay}</td></tr>` : ''}
    `
  } else if (event.eventType === 'Tournament') {
    return `
      <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Tournament Name:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${details.eventName}</td></tr>
      <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Start Date:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${details.startDate}</td></tr>
      ${details.endDate ? `<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">End Date:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${details.endDate}</td></tr>` : ''}
      ${details.numberOfGames ? `<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Number of Games:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${details.numberOfGames}</td></tr>` : ''}
      ${details.playerGender ? `<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Player Gender:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${details.playerGender}</td></tr>` : ''}
      ${details.levelOfPlay ? `<tr><td style="padding: 12px; font-weight: 600;">Level of Play:</td>
          <td style="padding: 12px;">${details.levelOfPlay}</td></tr>` : ''}
    `
  } else {
    // Exhibition Game(s) - show all game dates/times
    const games = details.exhibitionGames || []
    let gamesHtml = ''
    if (games.length > 1) {
      gamesHtml = `
        <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; vertical-align: top;">Game Schedule:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              <ul style="margin: 0; padding-left: 20px;">
                ${games.map(g => `<li>${g.date} at ${g.time} (${g.numberOfGames} game${parseInt(g.numberOfGames) > 1 ? 's' : ''})</li>`).join('')}
              </ul>
            </td></tr>
      `
    } else if (games.length === 1) {
      gamesHtml = `
        <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Game Date:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${games[0].date}</td></tr>
        <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Start Time:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${games[0].time}</td></tr>
        <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Number of Games:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${games[0].numberOfGames}</td></tr>
      `
    }

    return `
      <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Event Type:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Exhibition Game(s)</td></tr>
      ${details.location ? `<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Game Location:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${details.location}</td></tr>` : ''}
      ${gamesHtml}
      ${details.playerGender ? `<tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Player Gender:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${details.playerGender}</td></tr>` : ''}
      ${details.levelOfPlay ? `<tr><td style="padding: 12px; font-weight: 600;">Level of Play:</td>
          <td style="padding: 12px;">${details.levelOfPlay}</td></tr>` : ''}
    `
  }
}

// Generate client confirmation email content for multiple events
function generateMultiEventClientEmailContent(data: MultiEventFormData): string {
  const eventCount = data.events.length
  const eventSummary = eventCount === 1
    ? `your <strong>${data.events[0].eventType}</strong>`
    : `your <strong>${eventCount} events</strong>`

  // Generate event details for each event
  const eventsHtml = data.events.map((event, index) => {
    const details = getEventDetails(event)
    return `
      <h3 style="color: #1e3a5f; margin-top: 24px; margin-bottom: 12px;">Event ${index + 1}: ${event.eventType}</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f9fafb; border: 2px solid #e5e7eb;">
        ${generateEventDetailsHtml(event)}
      </table>
    `
  }).join('')

  return `
    <h1>Booking Confirmation</h1>

    <p>Thank you for booking ${eventSummary} with the Your Officials Association.</p>

    <h2>Organization Information</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f9fafb; border: 2px solid #e5e7eb;">
      <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; width: 40%;">Organization:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${data.organizationName}</td></tr>
      <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Event Contact:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${data.eventContactName}</td></tr>
      <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Email:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${data.eventContactEmail}</td></tr>
      ${data.eventContactPhone ? `<tr><td style="padding: 12px; font-weight: 600;">Phone:</td>
          <td style="padding: 12px;">${data.eventContactPhone}</td></tr>` : ''}
    </table>

    <h2>Event Details</h2>
    ${eventsHtml}

    <h2>Discipline Policy</h2>
    <p>You have indicated your discipline policy will be: <strong>${data.disciplinePolicy}</strong></p>

    ${data.disciplinePolicy.toLowerCase().includes('own') ? `
    <p style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; margin: 16px 0;">
      <strong>Important:</strong> Since you are using your own document to address disciplinary issues, please provide a copy to the Vice President prior to the start of your event.
    </p>
    ` : ''}

    <p>The Scheduling & Assigning team will review your submission and be in touch if any additional information is needed. If you were unable to provide all game dates or details in the form, please <a href="https://example.com/contact?category=scheduling">contact our scheduling team</a> with your complete schedule.</p>

    <h2>Attached Documents</h2>
    <p>For your reference, we have attached:</p>
    <ul>
      <li>Fee Schedule (Sept 2025 - Aug 2028)</li>
      <li>Invoice Policy</li>
      ${data.events[0]?.eventType === 'League' ? `
      <li>League Scheduling Template (Excel) - use if you have Microsoft Excel</li>
      <li>League Scheduling Template (Google Sheets) - use if you prefer Google Sheets</li>
      ` : ''}
      ${data.events[0]?.eventType === 'Tournament' ? `
      <li>Tournament Scheduling Template (Excel) - use if you have Microsoft Excel</li>
      <li>Tournament Scheduling Template (Google Sheets) - use if you prefer Google Sheets</li>
      ` : ''}
    </ul>
    ${data.events[0]?.eventType === 'League' || data.events[0]?.eventType === 'Tournament' ? `
    <p style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 12px 16px; margin: 16px 0;">
      <strong>Scheduling Template:</strong> Please fill out the attached scheduling template with your game schedule details and submit it through our <a href="https://example.com/contact?category=scheduling">contact form</a> (select "Officiating Services / Booking"). We've included two versions - choose the Excel version if using Microsoft Excel, or the Google Sheets version if you'll be uploading to Google Drive.
    </p>
    ` : ''}

    <h2>Payment Information</h2>
    <p>Payments can be made by cheque or e-transfer. <a href="https://example.com/contact?category=billing">Contact our billing team</a> (select "Billing / Payments") for payment details.</p>

    <p>Thank you for booking your officials with the Your Officials Association. We look forward to providing our trained and certified referees to make your ${eventCount === 1 ? 'event' : 'events'} a success.</p>

    <p>Best Regards,<br>
    <strong>Your Officials Association</strong><br>
    Scheduling Group<br>
    <a href="https://example.com/contact?category=scheduling">Contact us</a><br>
    <a href="https://www.example.com">www.example.com</a></p>
  `
}

// Generate scheduler notification email content for multiple events
function generateMultiEventSchedulerEmailContent(data: MultiEventFormData): string {
  const eventCount = data.events.length

  // Generate event details for each event
  const eventsHtml = data.events.map((event, index) => {
    return `
      <h3 style="color: #1e3a5f; margin-top: 24px; margin-bottom: 12px;">Event ${index + 1}: ${event.eventType}</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        ${generateEventDetailsHtml(event)}
      </table>
    `
  }).join('')

  return `
    <h1>New OSA Request: ${eventCount} Event${eventCount > 1 ? 's' : ''}</h1>

    <p>A new Officiating Services Agreement request has been submitted with <strong>${eventCount} event${eventCount > 1 ? 's' : ''}</strong>.</p>

    <h2>Organization</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; width: 40%; background-color: #f9fafb;">Organization Name:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${data.organizationName}</td></tr>
    </table>

    <h2>Event Contact</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; width: 40%; background-color: #f9fafb;">Contact Name:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${data.eventContactName}</td></tr>
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background-color: #f9fafb;">Contact Email:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;"><a href="mailto:${data.eventContactEmail}">${data.eventContactEmail}</a></td></tr>
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background-color: #f9fafb;">Contact Phone:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${data.eventContactPhone || 'N/A'}</td></tr>
    </table>

    ${eventsHtml}

    <h2>Discipline Policy</h2>
    <p><strong>${data.disciplinePolicy}</strong></p>

    <h2>Billing Information</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; width: 40%; background-color: #f9fafb;">Billing Contact:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${data.billingContactName}</td></tr>
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background-color: #f9fafb;">Billing Email:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;"><a href="mailto:${data.billingEmail}">${data.billingEmail}</a></td></tr>
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background-color: #f9fafb;">Billing Phone:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${data.billingPhone || 'N/A'}</td></tr>
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background-color: #f9fafb;">Billing Address:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${[data.billingAddress, data.billingCity, data.billingProvince, data.billingPostalCode].filter(Boolean).join(', ') || 'N/A'}</td></tr>
    </table>

    <p style="color: #6b7280; font-size: 14px;"><em>Submitted: ${data.submissionTime || new Date().toISOString()}</em></p>
  `
}

// Generate treasurer billing email content for multiple events
function generateMultiEventTreasurerEmailContent(data: MultiEventFormData): string {
  const eventCount = data.events.length

  // Generate event summary
  const eventSummaryHtml = data.events.map((event, index) => {
    const details = getEventDetails(event)
    return `
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${event.eventType}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${details.eventName}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${details.startDate}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${details.numberOfGames || 'TBD'}</td>
      </tr>
    `
  }).join('')

  return `
    <h1>New OSA - Billing Information (${eventCount} Event${eventCount > 1 ? 's' : ''})</h1>

    <p>A new Officiating Services Agreement has been submitted. Below are the billing details.</p>

    <h2>Events Summary</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr style="background-color: #f9fafb;">
        <th style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left;">#</th>
        <th style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left;">Type</th>
        <th style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left;">Name</th>
        <th style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left;">Start Date</th>
        <th style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left;">Games</th>
      </tr>
      ${eventSummaryHtml}
    </table>

    <h2>Organization</h2>
    <p><strong>${data.organizationName}</strong></p>

    <h2>Billing Details</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; width: 40%; background-color: #f9fafb;">Billing Contact:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${data.billingContactName}</td></tr>
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background-color: #f9fafb;">Billing Email:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;"><a href="mailto:${data.billingEmail}">${data.billingEmail}</a></td></tr>
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background-color: #f9fafb;">Billing Phone:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${data.billingPhone || 'N/A'}</td></tr>
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background-color: #f9fafb;">Billing Address:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${data.billingAddress || 'N/A'}</td></tr>
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background-color: #f9fafb;">City:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${data.billingCity || 'N/A'}</td></tr>
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background-color: #f9fafb;">Province:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${data.billingProvince || 'N/A'}</td></tr>
      <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; background-color: #f9fafb;">Postal Code:</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${data.billingPostalCode || 'N/A'}</td></tr>
    </table>

    <p style="color: #6b7280; font-size: 14px;"><em>Submitted: ${data.submissionTime || new Date().toISOString()}</em></p>
  `
}

// Helper to parse date strings to Date objects (handles various formats)
function parseDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date.toISOString().split('T')[0] // Return YYYY-MM-DD
  } catch {
    return null
  }
}

// Helper to parse number of games
function parseNumberOfGames(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null
  const num = typeof value === 'number' ? value : parseInt(value, 10)
  return isNaN(num) ? null : num
}

// Save a single event submission to Supabase database
async function saveEventToDatabase(
  data: MultiEventFormData,
  event: EventData,
  submissionGroupId: string,
  emailResults: { client: boolean; scheduler: boolean; treasurer: boolean; president: boolean }
): Promise<{ id: string } | null> {
  try {
    const details = getEventDetails(event)

    const { data: inserted, error } = await supabase
      .from('osa_submissions')
      .insert({
        organization_name: data.organizationName,

        billing_contact_name: data.billingContactName,
        billing_email: data.billingEmail,
        billing_phone: data.billingPhone || null,
        billing_address: data.billingAddress || null,
        billing_city: data.billingCity || null,
        billing_province: data.billingProvince || null,
        billing_postal_code: data.billingPostalCode || null,

        event_contact_name: data.eventContactName,
        event_contact_email: data.eventContactEmail,
        event_contact_phone: data.eventContactPhone || null,

        event_type: event.eventType,

        // Multi-event tracking
        submission_group_id: submissionGroupId,
        event_index: event.eventIndex,

        // League fields
        league_name: event.leagueName || null,
        league_start_date: parseDate(event.leagueStartDate),
        league_end_date: parseDate(event.leagueEndDate),
        league_days_of_week: event.leagueDaysOfWeek || null,
        league_player_gender: event.leaguePlayerGender || null,
        league_level_of_play: event.leagueLevelOfPlay || null,

        // Exhibition fields
        exhibition_game_location: event.exhibitionGameLocation || null,
        exhibition_number_of_games: details.numberOfGames ? parseNumberOfGames(details.numberOfGames) : null,
        exhibition_game_date: event.exhibitionGames?.[0] ? parseDate(event.exhibitionGames[0].date) : null,
        exhibition_start_time: event.exhibitionGames?.[0]?.time || null,
        exhibition_player_gender: event.exhibitionPlayerGender || null,
        exhibition_level_of_play: event.exhibitionLevelOfPlay || null,
        exhibition_games: event.exhibitionGames || null,

        // Tournament fields
        tournament_name: event.tournamentName || null,
        tournament_start_date: parseDate(event.tournamentStartDate),
        tournament_end_date: parseDate(event.tournamentEndDate),
        tournament_number_of_games: parseNumberOfGames(event.tournamentNumberOfGames),
        tournament_player_gender: event.tournamentPlayerGender || null,
        tournament_level_of_play: event.tournamentLevelOfPlay || null,

        // Common fields
        discipline_policy: data.disciplinePolicy,
        agreement: data.agreement ? 'true' : null,

        // Metadata
        status: 'new',
        submission_time: data.submissionTime ? new Date(data.submissionTime).toISOString() : new Date().toISOString(),
        emails_sent: emailResults,
        raw_form_data: { ...data, currentEvent: event }
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to save OSA event to database:', error)
      return null
    }

    return inserted
  } catch (error) {
    console.error('Error saving OSA event:', error)
    return null
  }
}

// Convert legacy single-event format to multi-event format
function convertLegacyToMultiEvent(legacy: LegacyFormData): MultiEventFormData {
  return {
    organizationName: legacy.organizationName,
    billingContactName: legacy.billingContactName,
    billingEmail: legacy.billingEmail,
    billingPhone: legacy.billingPhone,
    billingAddress: legacy.billingAddress,
    billingCity: legacy.billingCity,
    billingProvince: legacy.billingProvince,
    billingPostalCode: legacy.billingPostalCode,
    eventContactName: legacy.eventContactName,
    eventContactEmail: legacy.eventContactEmail,
    eventContactPhone: legacy.eventContactPhone,
    disciplinePolicy: legacy.disciplinePolicy,
    agreement: legacy.agreement,
    submissionTime: legacy.submissionTime,
    events: [{
      eventIndex: 1,
      eventType: legacy.eventType,
      leagueName: legacy.leagueName,
      leagueStartDate: legacy.leagueStartDate,
      leagueEndDate: legacy.leagueEndDate,
      leagueDaysOfWeek: legacy.leagueDaysOfWeek,
      leaguePlayerGender: legacy.leaguePlayerGender,
      leagueLevelOfPlay: legacy.leagueLevelOfPlay,
      exhibitionGameLocation: legacy.exhibitionGameLocation,
      exhibitionGames: legacy.exhibitionGameDate ? [{
        date: legacy.exhibitionGameDate,
        time: legacy.exhibitionStartTime || '',
        numberOfGames: String(legacy.exhibitionNumberOfGames || 1)
      }] : undefined,
      exhibitionPlayerGender: legacy.exhibitionPlayerGender,
      exhibitionLevelOfPlay: legacy.exhibitionLevelOfPlay,
      tournamentName: legacy.tournamentName,
      tournamentStartDate: legacy.tournamentStartDate,
      tournamentEndDate: legacy.tournamentEndDate,
      tournamentNumberOfGames: legacy.tournamentNumberOfGames,
      tournamentPlayerGender: legacy.tournamentPlayerGender,
      tournamentLevelOfPlay: legacy.tournamentLevelOfPlay,
    }]
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  const logger = Logger.fromEvent('osa-webhook', event)

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  // Optional: Verify webhook secret for security
  const webhookSecret = process.env.OSA_WEBHOOK_SECRET
  if (webhookSecret) {
    const providedSecret = event.headers['x-webhook-secret'] || event.headers['X-Webhook-Secret']
    if (providedSecret !== webhookSecret) {
      logger.warn('osa', 'webhook_auth_failed', 'Invalid webhook secret')
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      }
    }
  }

  try {
    // Parse form data
    const rawData = JSON.parse(event.body || '{}')

    // Determine if this is multi-event format (has events array) or legacy format
    let formData: MultiEventFormData
    if (rawData.events && Array.isArray(rawData.events)) {
      formData = rawData as MultiEventFormData
    } else if (rawData.eventType) {
      // Legacy single-event format - convert to multi-event
      formData = convertLegacyToMultiEvent(rawData as LegacyFormData)
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid form data format',
          message: 'Expected either events array or eventType field'
        })
      }
    }

    const eventCount = formData.events.length
    logger.info('osa', 'webhook_received', `OSA form submission: ${formData.organizationName} - ${eventCount} event(s)`, {
      metadata: { organization: formData.organizationName, eventCount }
    })

    // Validate required fields
    if (!formData.organizationName || !formData.eventContactEmail || !formData.events.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields',
          required: ['organizationName', 'eventContactEmail', 'events'],
          received: {
            organizationName: !!formData.organizationName,
            eventContactEmail: !!formData.eventContactEmail,
            eventsCount: formData.events?.length || 0
          }
        })
      }
    }

    // Check Microsoft Graph credentials
    if (!process.env.MICROSOFT_TENANT_ID ||
        !process.env.MICROSOFT_CLIENT_ID ||
        !process.env.MICROSOFT_CLIENT_SECRET) {
      logger.error('osa', 'config_error', 'Microsoft Graph credentials not configured')
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email service not configured' })
      }
    }

    // Get access token
    const accessToken = await getAccessToken()

    // Load attachments for client email
    const feeSchedulePdf = await loadFileAsBase64('Fee-Schedule.pdf')
    const invoicePolicyPdf = await loadFileAsBase64('Invoice-Policy.pdf')

    const attachments: Array<{ name: string; content: string; contentType: string }> = []
    if (feeSchedulePdf) {
      attachments.push({
        name: 'Fee Schedule 2025-2028.pdf',
        content: feeSchedulePdf,
        contentType: 'application/pdf'
      })
    }
    if (invoicePolicyPdf) {
      attachments.push({
        name: 'Invoice Policy.pdf',
        content: invoicePolicyPdf,
        contentType: 'application/pdf'
      })
    }

    // Determine the primary event type for scheduling templates
    // Since we now support single event type, all events should be the same type
    const eventTypesSummary = Array.from(new Set(formData.events.map(e => e.eventType))).join(', ')
    const primaryEventType = formData.events[0]?.eventType

    // Add scheduling templates based on event type (League or Tournament only - not Exhibition)
    if (primaryEventType === 'League') {
      const leagueExcel = await loadFileAsBase64('League-Scheduling-Template.xlsx')
      const leagueGoogle = await loadFileAsBase64('League-Scheduling-Template-Google.xlsx')
      if (leagueExcel) {
        attachments.push({
          name: 'League Scheduling Template (Excel).xlsx',
          content: leagueExcel,
          contentType: getContentType('xlsx')
        })
      }
      if (leagueGoogle) {
        attachments.push({
          name: 'League Scheduling Template (Google Sheets).xlsx',
          content: leagueGoogle,
          contentType: getContentType('xlsx')
        })
      }
    } else if (primaryEventType === 'Tournament') {
      const tournamentExcel = await loadFileAsBase64('Tournament-Scheduling-Template.xlsx')
      const tournamentGoogle = await loadFileAsBase64('Tournament-Scheduling-Template-Google.xlsx')
      if (tournamentExcel) {
        attachments.push({
          name: 'Tournament Scheduling Template (Excel).xlsx',
          content: tournamentExcel,
          contentType: getContentType('xlsx')
        })
      }
      if (tournamentGoogle) {
        attachments.push({
          name: 'Tournament Scheduling Template (Google Sheets).xlsx',
          content: tournamentGoogle,
          contentType: getContentType('xlsx')
        })
      }
    }

    const results = {
      client: false,
      scheduler: false,
      treasurer: false,
      president: false
    }

    const schedulerEmail = process.env.OSA_SCHEDULER_EMAIL || 'scheduler@example.com'

    // 1. Send email to CLIENT (with attachments, CC scheduler) - ONE email for all events
    try {
      const clientContent = generateMultiEventClientEmailContent(formData)
      const clientHtml = generateCBOAEmailTemplate({
        subject: `Confirmation of booking - ${formData.organizationName} (${eventCount} event${eventCount > 1 ? 's' : ''})`,
        content: clientContent,
        previewText: `Thank you for booking ${eventCount} event${eventCount > 1 ? 's' : ''} with your organization`,
        external: true
      })

      await sendEmail(
        accessToken,
        formData.eventContactEmail,
        `Confirmation of booking - ${formData.organizationName} (${eventCount} event${eventCount > 1 ? 's' : ''})`,
        clientHtml,
        attachments.length > 0 ? attachments : undefined,
        [schedulerEmail]
      )
      results.client = true
      logger.info('osa', 'email_sent', `Client confirmation sent to ${formData.eventContactEmail} (CC: ${schedulerEmail})`)
    } catch (error) {
      logger.error('osa', 'email_failed', `Failed to send client email`, error as Error)
    }

    // 2. Send email to SCHEDULER - ONE email for all events
    try {
      const schedulerContent = generateMultiEventSchedulerEmailContent(formData)
      const schedulerHtml = generateCBOAEmailTemplate({
        subject: `New OSA Request: ${formData.organizationName} - ${eventCount} event${eventCount > 1 ? 's' : ''} (${eventTypesSummary})`,
        content: schedulerContent,
        previewText: `New OSA with ${eventCount} event${eventCount > 1 ? 's' : ''} from ${formData.organizationName}`
      })

      await sendEmail(
        accessToken,
        schedulerEmail,
        `New OSA Request: ${formData.organizationName} - ${eventCount} event${eventCount > 1 ? 's' : ''} (${eventTypesSummary})`,
        schedulerHtml
      )
      results.scheduler = true
      logger.info('osa', 'email_sent', `Scheduler notification sent to ${schedulerEmail}`)
    } catch (error) {
      logger.error('osa', 'email_failed', `Failed to send scheduler email`, error as Error)
    }

    // 3. Send email to TREASURER - only if billing email is NEW (not already in database)
    const treasurerEmail = process.env.OSA_TREASURER_EMAIL || 'treasurer@example.com'

    // Check if billing email already exists in the database
    let billingEmailExists = false
    try {
      const { data: existingSubmissions, error: lookupError } = await supabase
        .from('osa_submissions')
        .select('id')
        .eq('billing_email', formData.billingEmail)
        .limit(1)

      if (lookupError) {
        logger.warn('osa', 'billing_lookup_failed', `Failed to check if billing email exists: ${lookupError.message}`)
      } else {
        billingEmailExists = existingSubmissions && existingSubmissions.length > 0
      }
    } catch (error) {
      logger.warn('osa', 'billing_lookup_error', `Error checking billing email: ${(error as Error).message}`)
    }

    if (!billingEmailExists) {
      // New billing contact - send treasurer email with billing info
      try {
        const treasurerContent = generateMultiEventTreasurerEmailContent(formData)
        const treasurerHtml = generateCBOAEmailTemplate({
          subject: `OSA Billing Info: ${formData.organizationName} - ${eventCount} event${eventCount > 1 ? 's' : ''}`,
          content: treasurerContent,
          previewText: `Billing info for ${formData.organizationName}`
        })

        await sendEmail(
          accessToken,
          treasurerEmail,
          `OSA Billing Info: ${formData.organizationName} - ${eventCount} event${eventCount > 1 ? 's' : ''}`,
          treasurerHtml
        )
        results.treasurer = true
        logger.info('osa', 'email_sent', `Treasurer notification sent to ${treasurerEmail} (new billing contact)`)
      } catch (error) {
        logger.error('osa', 'email_failed', `Failed to send treasurer email`, error as Error)
      }
    } else {
      logger.info('osa', 'treasurer_email_skipped', `Billing email ${formData.billingEmail} already exists in database - skipping treasurer notification`)
    }

    // 4. Send email to PRESIDENT (optional - enable via env var) - ONE email for all events
    const presidentEmail = process.env.OSA_PRESIDENT_EMAIL
    if (presidentEmail) {
      try {
        const presidentContent = generateMultiEventSchedulerEmailContent(formData)
        const presidentHtml = generateCBOAEmailTemplate({
          subject: `New OSA Request: ${formData.organizationName} - ${eventCount} event${eventCount > 1 ? 's' : ''}`,
          content: presidentContent,
          previewText: `New OSA with ${eventCount} event${eventCount > 1 ? 's' : ''} from ${formData.organizationName}`
        })

        await sendEmail(
          accessToken,
          presidentEmail,
          `New OSA Request: ${formData.organizationName} - ${eventCount} event${eventCount > 1 ? 's' : ''}`,
          presidentHtml
        )
        results.president = true
        logger.info('osa', 'email_sent', `President notification sent to ${presidentEmail}`)
      } catch (error) {
        logger.error('osa', 'email_failed', `Failed to send president email`, error as Error)
      }
    }

    // 5. Save each event to database with shared submission_group_id
    const submissionGroupId = uuidv4()
    const submissionIds: string[] = []

    for (const event of formData.events) {
      try {
        const dbResult = await saveEventToDatabase(formData, event, submissionGroupId, results)
        if (dbResult) {
          submissionIds.push(dbResult.id)
          logger.info('osa', 'submission_saved', `OSA event ${event.eventIndex} saved to database with ID: ${dbResult.id}`)
        } else {
          logger.warn('osa', 'submission_save_failed', `Failed to save OSA event ${event.eventIndex} to database`)
        }
      } catch (error) {
        logger.error('osa', 'submission_save_error', `Error saving OSA event ${event.eventIndex} to database`, error as Error)
      }
    }

    // 6. Sync each event to Excel (if configured)
    if (submissionIds.length > 0 && osaExcelSync.isConfigured()) {
      for (let i = 0; i < formData.events.length; i++) {
        const event = formData.events[i]
        const submissionId = submissionIds[i]
        if (!submissionId) continue

        try {
          const details = getEventDetails(event)
          const excelData: OSASubmissionData = {
            id: submissionId,
            created_at: formData.submissionTime || new Date().toISOString(),
            organization_name: formData.organizationName,
            event_type: event.eventType,
            event_name: details.eventName,
            start_date: details.startDate,
            end_date: details.endDate,
            number_of_games: details.numberOfGames ? Number(details.numberOfGames) : undefined,
            days_of_week: details.daysOfWeek,
            player_gender: details.playerGender,
            level_of_play: details.levelOfPlay,
            game_location: details.location,
            start_time: details.startTime,
            event_contact_name: formData.eventContactName,
            event_contact_email: formData.eventContactEmail,
            event_contact_phone: formData.eventContactPhone,
            billing_contact_name: formData.billingContactName,
            billing_email: formData.billingEmail,
            billing_phone: formData.billingPhone,
            billing_address: formData.billingAddress,
            billing_city: formData.billingCity,
            billing_province: formData.billingProvince,
            billing_postal_code: formData.billingPostalCode,
            discipline_policy: formData.disciplinePolicy,
            status: 'new',
            notes: eventCount > 1 ? `Event ${event.eventIndex} of ${eventCount} (Group: ${submissionGroupId})` : ''
          }
          await osaExcelSync.addSubmission(excelData)
          logger.info('osa', 'excel_synced', `OSA event ${event.eventIndex} synced to Excel`)
        } catch (error) {
          logger.error('osa', 'excel_sync_error', `Failed to sync event ${event.eventIndex} to Excel (non-fatal)`, error as Error)
        }
      }
    }

    // Audit log
    await logger.audit('OSA_SUBMITTED', 'osa', submissionGroupId, {
      actorId: 'external',
      actorEmail: formData.eventContactEmail,
      newValues: {
        organization: formData.organizationName,
        eventCount,
        submissionIds,
        events: formData.events.map(e => ({
          type: e.eventType,
          name: getEventDetails(e).eventName
        }))
      },
      description: `OSA submitted by ${formData.organizationName} with ${eventCount} event${eventCount > 1 ? 's' : ''}`
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `OSA form processed successfully (${eventCount} event${eventCount > 1 ? 's' : ''})`,
        submissionGroupId,
        submissionIds,
        eventCount,
        results
      })
    }

  } catch (error: any) {
    logger.error('osa', 'webhook_error', 'Error processing OSA webhook', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to process form submission'
      })
    }
  }
}
