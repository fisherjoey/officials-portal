import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { generateCBOAEmailTemplate } from '../../lib/emailTemplate'
import { Logger } from '../../lib/logger'
import { recordBulkEmail } from '../../lib/emailHistory'

/**
 * Normalize URLs in HTML content to ensure they have proper protocols.
 * This fixes links like href="example.com/..." to href="https://example.com/..."
 * Only applied to email sending, not stored content.
 */
function normalizeUrlsInHtml(html: string): string {
  // Match href="..." attributes where the URL doesn't start with a protocol, #, /, or mailto:
  return html.replace(
    /href="(?!(https?:\/\/|mailto:|tel:|#|\/))/gi,
    'href="https://'
  )
}

interface EmailRequest {
  subject: string
  recipientGroups: string[]
  customEmails: string[]
  htmlContent: string
  rankFilter?: string
}

interface MemberRecord {
  email: string
  role: string
  certification_level?: string
  rank?: number
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

// Send email via Microsoft Graph API
async function sendEmail(
  accessToken: string,
  toAddresses: string[],
  subject: string,
  htmlContent: string
): Promise<void> {
  const senderEmail = 'announcements@example.com'
  const graphEndpoint = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`

  // Microsoft Graph has a limit of 500 recipients per email
  // We'll batch if needed
  const batchSize = 500
  const batches = []

  for (let i = 0; i < toAddresses.length; i += batchSize) {
    batches.push(toAddresses.slice(i, i + batchSize))
  }

  for (const batch of batches) {
    const emailMessage = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: htmlContent
        },
        from: {
          emailAddress: {
            address: 'announcements@example.com'
          }
        },
        // Send to self as the "To" recipient
        toRecipients: [
          {
            emailAddress: {
              address: senderEmail
            }
          }
        ],
        // BCC all actual recipients for privacy
        bccRecipients: batch.map(email => ({
          emailAddress: {
            address: email
          }
        }))
      },
      saveToSentItems: true // Save to Sent Items folder
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
}

// Get member emails from Supabase based on recipient groups
async function getRecipientEmails(
  recipientGroups: string[],
  customEmails: string[],
  rankFilter?: string
): Promise<string[]> {
  const emails = new Set<string>()

  // Add custom emails
  customEmails.forEach(email => {
    if (email && email.includes('@')) {
      emails.add(email.toLowerCase())
    }
  })

  // If no groups selected, just return custom emails
  if (recipientGroups.length === 0) {
    return Array.from(emails)
  }

  // Fetch members from Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured')
      return Array.from(emails)
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/members?select=email,role,certification_level,rank`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Failed to fetch members from Supabase')
      return Array.from(emails)
    }

    const members: MemberRecord[] = await response.json()

    // Filter members based on recipient groups
    members.forEach(member => {
      if (!member.email) return

      let shouldInclude = false

      for (const group of recipientGroups) {
        if (group === 'all') {
          shouldInclude = true
          break
        }

        if (group === 'officials' && member.role === 'official') {
          shouldInclude = true
          break
        }

        if (group === 'executives' && member.role === 'executive') {
          shouldInclude = true
          break
        }

        if (group === 'admins' && member.role === 'admin') {
          shouldInclude = true
          break
        }

        if (group === 'evaluators' && member.role === 'evaluator') {
          shouldInclude = true
          break
        }

        if (group === 'mentors' && member.role === 'mentor') {
          shouldInclude = true
          break
        }

        // Level-based groups
        if (group.startsWith('level') && member.certification_level) {
          const levelNum = group.replace('level', '')
          if (member.certification_level.includes(levelNum)) {
            shouldInclude = true
            break
          }
        }

      }

      // Apply rank filter if specified
      if (shouldInclude && rankFilter) {
        if (member.rank === undefined) {
          shouldInclude = false
        } else {
          // Extract threshold number from format like "150+"
          const threshold = parseInt(rankFilter.replace('+', ''))
          if (member.rank < threshold) {
            shouldInclude = false
          }
        }
      }

      if (shouldInclude) {
        emails.add(member.email.toLowerCase())
      }
    })
  } catch (error) {
    console.error('Error fetching members:', error)
    // Continue with custom emails at least
  }

  return Array.from(emails)
}

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const logger = Logger.fromEvent('send-email', event)

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Parse request body
    const requestBody: EmailRequest = JSON.parse(event.body || '{}')
    const { subject, recipientGroups, customEmails, htmlContent, rankFilter } = requestBody

    logger.info('email', 'send_email_start', `Sending bulk email: ${subject}`, {
      metadata: { subject, recipientGroups, customEmailCount: customEmails?.length || 0, rankFilter }
    })

    // Validation
    if (!subject || !subject.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Subject is required' })
      }
    }

    if (!htmlContent || !htmlContent.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email content is required' })
      }
    }

    if ((!recipientGroups || recipientGroups.length === 0) && (!customEmails || customEmails.length === 0)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'At least one recipient is required' })
      }
    }

    // Check environment variables
    if (!process.env.MICROSOFT_TENANT_ID ||
        !process.env.MICROSOFT_CLIENT_ID ||
        !process.env.MICROSOFT_CLIENT_SECRET) {
      logger.error('email', 'send_email_config_error', 'Microsoft Graph credentials not configured')
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Microsoft Graph credentials not configured' })
      }
    }

    // Get recipient emails
    const recipientEmails = await getRecipientEmails(
      recipientGroups || [],
      customEmails || [],
      rankFilter
    )

    if (recipientEmails.length === 0) {
      logger.warn('email', 'send_email_no_recipients', 'No valid recipients found', {
        metadata: { recipientGroups, customEmailCount: customEmails?.length || 0 }
      })
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No valid recipients found' })
      }
    }

    logger.info('email', 'send_email_recipients', `Found ${recipientEmails.length} recipients`, {
      metadata: { recipientCount: recipientEmails.length, recipientGroups }
    })

    // Get access token
    const accessToken = await getAccessToken()

    // Normalize URLs to ensure they have https:// protocol
    const normalizedContent = normalizeUrlsInHtml(htmlContent)

    // Wrap content in email template
    const emailHtml = generateCBOAEmailTemplate({
      subject,
      content: normalizedContent,
      previewText: subject
    })

    // Send email
    await sendEmail(accessToken, recipientEmails, subject, emailHtml)

    // Record to email history
    await recordBulkEmail({
      subject,
      htmlContent: emailHtml,
      recipientCount: recipientEmails.length,
      recipientList: recipientEmails,
      recipientGroups: recipientGroups || [],
      rankFilter,
      status: 'sent',
    })

    // Audit log for bulk email
    await logger.audit('EMAIL_SENT', 'email', null, {
      actorId: 'system',
      actorEmail: 'system',
      newValues: { subject, recipientCount: recipientEmails.length, recipientGroups },
      description: `Bulk email sent: "${subject}" to ${recipientEmails.length} recipients`
    })

    logger.info('email', 'send_email_success', `Email sent to ${recipientEmails.length} recipients`, {
      metadata: { subject, recipientCount: recipientEmails.length }
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        recipientCount: recipientEmails.length,
        message: `Email sent successfully to ${recipientEmails.length} recipients`
      })
    }

  } catch (error: any) {
    // Record failed email attempt
    const requestBody: EmailRequest = JSON.parse(event.body || '{}')
    await recordBulkEmail({
      subject: requestBody.subject || 'Unknown',
      htmlContent: requestBody.htmlContent || '',
      recipientCount: 0,
      recipientList: [],
      recipientGroups: requestBody.recipientGroups || [],
      rankFilter: requestBody.rankFilter,
      status: 'failed',
      errorMessage: error.message || 'Unknown error',
    })

    logger.error('email', 'send_email_error', 'Error sending email', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to send email'
      })
    }
  }
}
