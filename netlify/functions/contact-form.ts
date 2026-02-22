import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { generateEmailTemplate } from '../../lib/emailTemplate'
import { Logger } from '../../lib/logger'

interface ContactFormData {
  name: string
  email: string
  category: string
  subject: string
  message: string
}

// Email routing configuration
// Configure these in your environment variables or update the defaults below
const categoryEmailMap: Record<string, string> = {
  general: process.env.EMAIL_GENERAL || 'secretary@example.com',
  scheduling: process.env.EMAIL_SCHEDULING || 'scheduler@example.com',
  billing: process.env.EMAIL_BILLING || 'treasurer@example.com',
  membership: process.env.EMAIL_MEMBERSHIP || 'memberservices@example.com',
  education: process.env.EMAIL_EDUCATION || 'education@example.com',
  website: process.env.EMAIL_WEBSITE || 'webmaster@example.com',
  performance: process.env.EMAIL_PERFORMANCE || 'performance@example.com',
  recruiting: process.env.EMAIL_RECRUITING || 'recruiting@example.com',
  other: process.env.EMAIL_OTHER || 'secretary@example.com',
}

const categoryLabels: Record<string, string> = {
  general: 'General Inquiry',
  scheduling: 'Officiating Services / Booking',
  billing: 'Billing / Payments',
  membership: 'Membership',
  education: 'Education / Training',
  website: 'Website / Technical',
  performance: 'Performance / Evaluation',
  recruiting: 'Recruitment',
  other: 'Other',
}

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

async function sendContactEmail(
  accessToken: string,
  toAddress: string,
  fromName: string,
  fromEmail: string,
  subject: string,
  htmlContent: string
): Promise<void> {
  // Configure the sender email address via environment variable
  const senderEmail = process.env.EMAIL_SENDER || 'announcements@example.com'
  const graphEndpoint = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`

  const emailMessage = {
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
            address: toAddress
          }
        }
      ],
      replyTo: [
        {
          emailAddress: {
            name: fromName,
            address: fromEmail
          }
        }
      ]
    },
    saveToSentItems: true
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
    throw new Error(`Failed to send email: ${error}`)
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const logger = Logger.fromEvent('contact-form', event)

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const body: ContactFormData = JSON.parse(event.body || '{}')
    const { name, email, category, subject, message } = body

    // Validation
    if (!name || name.trim().length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Name is required' })
      }
    }

    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid email is required' })
      }
    }

    if (!category || !categoryEmailMap[category]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid category is required' })
      }
    }

    if (!subject || subject.trim().length < 5) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Subject is required' })
      }
    }

    if (!message || message.trim().length < 20) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message must be at least 20 characters' })
      }
    }

    // Check environment variables
    if (!process.env.MICROSOFT_TENANT_ID ||
        !process.env.MICROSOFT_CLIENT_ID ||
        !process.env.MICROSOFT_CLIENT_SECRET) {
      logger.error('email', 'contact_form_config_error', 'Microsoft Graph credentials not configured')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Email service not configured' })
      }
    }

    const recipientEmail = categoryEmailMap[category]
    const categoryLabel = categoryLabels[category] || 'General Inquiry'

    logger.info('email', 'contact_form_submit', `Contact form submission: ${categoryLabel}`, {
      metadata: { category, recipientEmail, senderEmail: email }
    })

    // Build email content
    const emailContent = `
      <h1>New Contact Form Submission</h1>

      <p>A new message has been submitted through the website contact form.</p>

      <h2>Sender Information</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; width: 150px;">Name:</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600;">Email:</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600;">Category:</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${escapeHtml(categoryLabel)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600;">Subject:</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${escapeHtml(subject)}</td>
        </tr>
      </table>

      <h2>Message</h2>
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
      </div>

      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
        <strong>Note:</strong> You can reply directly to this email to respond to ${escapeHtml(name)}.
      </p>
    `

    const emailHtml = generateEmailTemplate({
      subject: `[Contact Form] ${subject}`,
      content: emailContent,
      previewText: `New contact form submission from ${name}`
    })

    // Get access token and send email
    const accessToken = await getAccessToken()
    await sendContactEmail(
      accessToken,
      recipientEmail,
      name,
      email,
      `[Contact Form] ${subject}`,
      emailHtml
    )

    logger.info('email', 'contact_form_sent', `Contact form email sent to ${recipientEmail}`, {
      metadata: { category, recipientEmail, senderName: name }
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Your message has been sent successfully'
      })
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('email', 'contact_form_error', 'Error processing contact form', error instanceof Error ? error : new Error(String(error)))

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to send message. Please try again later.'
      })
    }
  }
}
