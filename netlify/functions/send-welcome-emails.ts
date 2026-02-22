import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const migrationSecret = process.env.MIGRATION_SECRET

interface UserToEmail {
  name: string
  email: string
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
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
async function sendEmailViaGraph(
  accessToken: string,
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<void> {
  const senderEmail = 'announcements@example.com'
  const graphEndpoint = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`

  const emailMessage = {
    message: {
      subject: subject,
      body: {
        contentType: 'HTML',
        content: htmlContent
      },
      from: {
        emailAddress: { address: senderEmail }
      },
      toRecipients: [
        { emailAddress: { address: toEmail } }
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

// Generate invite email HTML (matches supabase-auth-admin.ts template)
function generateInviteEmailHtml(inviteUrl: string, name?: string): string {
  const siteUrl = 'https://example.com'
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <tr>
    <td style="padding: 20px 10px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff;" align="center">
        <!-- Header -->
        <tr>
          <td style="background-color: #1f2937; padding: 24px 20px; border-bottom: 3px solid #F97316; text-align: center;">
            <img src="https://i.imgur.com/BQe360J.png" alt="Logo" style="max-width: 70px; height: auto; display: inline-block; margin-bottom: 12px;">
            <h1 style="color: #ffffff; margin: 0 0 4px 0; font-size: 18px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.3;">Your Officials Association</h1>
            <p style="color: #ffffff; margin: 0; font-size: 14px; font-weight: 500; opacity: 0.95;">Excellence in Basketball Officiating</p>
          </td>
        </tr>
        <!-- Main Content -->
        <tr>
          <td style="padding: 30px 20px; color: #333333; font-size: 16px; line-height: 1.6;">
            <h1 style="color: #003DA5; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 700; line-height: 1.3;">You're Invited to Join!</h1>
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${name ? `Hi ${name.split(' ')[0]},` : 'Hello,'}</p>
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">You have been invited to create an account on the <strong style="color: #003DA5; font-weight: 600;">Your Officials Association</strong> member portal.</p>
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">As a member, you'll have access to:</p>
            <ul style="margin: 0 0 16px 0; padding-left: 20px;">
              <li style="margin-bottom: 8px; font-size: 16px; line-height: 1.5;"><strong style="color: #003DA5;">Resources</strong> - Training materials, rulebooks, and guides</li>
              <li style="margin-bottom: 8px; font-size: 16px; line-height: 1.5;"><strong style="color: #003DA5;">The Bounce</strong> - Our official newsletter</li>
              <li style="margin-bottom: 8px; font-size: 16px; line-height: 1.5;"><strong style="color: #003DA5;">Calendar</strong> - Upcoming events and training sessions</li>
              <li style="margin-bottom: 8px; font-size: 16px; line-height: 1.5;"><strong style="color: #003DA5;">Rule Modifications</strong> - League-specific rule changes</li>
            </ul>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${inviteUrl}" style="display: inline-block; padding: 14px 28px; min-height: 44px; background-color: #F97316; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
            </p>
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">If you have any questions about your membership, please don't hesitate to <a href="${siteUrl}/contact?category=membership" style="color: #F97316;">contact us</a>.</p>
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">We look forward to having you on our team!</p>
            <p style="margin: 0; font-size: 16px; line-height: 1.6;">Best regards,<br><strong style="color: #003DA5; font-weight: 600;">Executive Board</strong></p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color: #1F2937; color: #D1D5DB; padding: 30px 20px; text-align: center; font-size: 14px; line-height: 1.7; border-top: 3px solid #F97316;">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #ffffff;">Your Officials Association</p>
            <p style="margin: 0 0 15px 0;">City, State, Country</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 20px auto;">
              <tr>
                <td style="padding: 0 8px;"><a href="${siteUrl}" style="color: #F97316; text-decoration: none; font-size: 14px;">Website</a></td>
                <td style="padding: 0 8px;"><a href="${siteUrl}/portal" style="color: #F97316; text-decoration: none; font-size: 14px;">Member Portal</a></td>
                <td style="padding: 0 8px;"><a href="${siteUrl}/contact?category=membership" style="color: #F97316; text-decoration: none; font-size: 14px;">Contact Us</a></td>
              </tr>
            </table>
            <p style="margin: 20px 0 0 0; font-size: 13px; color: #9ca3af;">&copy; 2025 Your Officials Association. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
  `.trim()
}

const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('send-welcome-emails', event)

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // Verify migration secret
  const authHeader = event.headers.authorization
  if (!authHeader || authHeader !== `Bearer ${migrationSecret}`) {
    logger.warn('auth', 'unauthorized_request', 'Unauthorized welcome email request')
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    const body = JSON.parse(event.body || '{}')
    const { users, dryRun = false } = body as { users: UserToEmail[], dryRun?: boolean }

    logger.info('email', 'welcome_emails_start', `Starting welcome email batch (dryRun: ${dryRun})`, {
      metadata: { userCount: users?.length || 0, dryRun }
    })

    if (!users || !Array.isArray(users)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'users array is required' }) }
    }

    // Fetch all Supabase users to verify they exist
    let allSupabaseUsers: any[] = []
    let page = 1
    const perPage = 1000

    while (true) {
      const { data: { users: pageUsers }, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
      if (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: `Failed to fetch users: ${error.message}` }) }
      }
      if (!pageUsers || pageUsers.length === 0) break
      allSupabaseUsers = allSupabaseUsers.concat(pageUsers)
      if (pageUsers.length < perPage) break
      page++
    }

    const supabaseUserMap = new Map(allSupabaseUsers.map(u => [u.email?.toLowerCase(), u]))
    const results: { email: string; status: string; error?: string }[] = []
    const siteUrl = 'https://example.com'

    // Get Graph API access token (only if not dry run)
    let accessToken: string | null = null
    if (!dryRun) {
      try {
        accessToken = await getAccessToken()
      } catch (err: any) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: `Graph API auth failed: ${err.message}` }) }
      }
    }

    for (const user of users) {
      try {
        const emailLower = user.email.toLowerCase()

        if (dryRun) {
          results.push({ email: user.email, status: 'dry_run' })
          continue
        }

        // Generate invite link via Supabase (matching supabase-auth-admin.ts)
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email: emailLower,
          options: {
            data: {
              full_name: user.name,
              name: user.name,
              role: 'official'
            },
            redirectTo: `${siteUrl}/auth/callback`
          }
        })

        if (linkError || !linkData?.properties?.action_link) {
          results.push({ email: user.email, status: 'error', error: linkError?.message || 'Failed to generate reset link' })
          continue
        }

        // Use the action link directly (no localhost replacement needed on production)
        const inviteLink = linkData.properties.action_link

        // Generate email HTML
        const emailHtml = generateInviteEmailHtml(inviteLink, user.name)

        // Send via Microsoft Graph
        await sendEmailViaGraph(accessToken!, user.email, "You're Invited to Join!", emailHtml)
        results.push({ email: user.email, status: 'sent' })

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (err: any) {
        results.push({ email: user.email, status: 'error', error: err.message })
      }
    }

    const sent = results.filter(r => r.status === 'sent').length
    const errors = results.filter(r => r.status === 'error').length
    const skipped = results.filter(r => r.status === 'skipped').length
    const dryRunCount = results.filter(r => r.status === 'dry_run').length

    // Log summary
    logger.info('email', 'welcome_emails_complete', `Welcome emails batch complete`, {
      metadata: { total: users.length, sent, errors, skipped, dryRun: dryRunCount }
    })

    // Audit log if emails were actually sent
    if (sent > 0) {
      await logger.audit('EMAIL_SENT', 'email', null, {
        actorId: 'system',
        actorEmail: 'system',
        newValues: { type: 'welcome_emails', sent, errors, skipped },
        description: `Sent ${sent} welcome emails`
      })
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        summary: { total: users.length, sent, errors, skipped, dryRun: dryRunCount, supabaseUsersFound: allSupabaseUsers.length },
        results
      })
    }

  } catch (error: any) {
    logger.error('email', 'welcome_emails_error', 'Error sending welcome emails', error instanceof Error ? error : new Error(String(error)))
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
  }
}

export { handler }
