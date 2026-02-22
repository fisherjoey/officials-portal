import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'
import { recordPasswordResetEmail } from '../../lib/emailHistory'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://example.com'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Get Microsoft Graph access token
async function getMicrosoftAccessToken(): Promise<string> {
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
    throw new Error(`Failed to get Microsoft access token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

// Send email via Microsoft Graph
async function sendEmailViaMicrosoftGraph(
  accessToken: string,
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<void> {
  const senderEmail = 'no-reply@example.com'
  const graphEndpoint = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`

  const emailMessage = {
    message: {
      subject,
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

// Generate password reset email HTML
function generatePasswordResetEmailHtml(resetUrl: string, email: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <tr>
    <td style="padding: 20px 10px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff;" align="center">
        <tr>
          <td style="background-color: #1f2937; padding: 24px 20px; border-bottom: 3px solid #F97316; text-align: center;">
            <img src="https://i.imgur.com/BQe360J.png" alt="Logo" style="max-width: 70px; height: auto; display: inline-block; margin-bottom: 12px;">
            <h1 style="color: #ffffff; margin: 0 0 4px 0; font-size: 18px; font-weight: 700;">Your Officials Association</h1>
            <p style="color: #ffffff; margin: 0; font-size: 14px; opacity: 0.95;">Excellence in Basketball Officiating</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px 20px; color: #333333; font-size: 16px; line-height: 1.6;">
            <h1 style="color: #003DA5; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 700;">Reset Your Password</h1>
            <p style="margin: 0 0 16px 0;">We received a request to reset the password for your <strong style="color: #003DA5;">Member Portal</strong> account associated with <strong style="color: #003DA5;">${email}</strong>.</p>
            <p style="margin: 0 0 16px 0;">Click the button below to set a new password:</p>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background-color: #F97316; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
            </p>
            <p style="margin: 0 0 16px 0;">This link will expire in 24 hours for security purposes.</p>
            <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; margin: 16px 0;">
              <p style="margin: 0; font-size: 14px; color: #92400E;"><strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email.</p>
            </div>
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">If the button doesn't work, copy this link: ${resetUrl}</p>
            <p style="margin: 0;">Best regards,<br><strong style="color: #003DA5;">Executive Board</strong></p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #1F2937; color: #D1D5DB; padding: 30px 20px; text-align: center; font-size: 14px; border-top: 3px solid #F97316;">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #ffffff;">Your Officials Association</p>
            <p style="margin: 0 0 15px 0;">City, State, Country</p>
            <p style="margin: 0; font-size: 13px; color: #9ca3af;">&copy; 2025 Your Officials Association. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
  `.trim()
}

export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('auth-password-reset', event)

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    const { email } = JSON.parse(event.body || '{}')
    logger.info('auth', 'password_reset_request', `Password reset requested for ${email}`, {
      metadata: { email }
    })

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' })
      }
    }

    // Check if Microsoft Graph is configured
    if (!process.env.MICROSOFT_TENANT_ID || !process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Email service not configured' })
      }
    }

    // Check if user exists
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      // Don't reveal if user exists or not - return success anyway
      logger.info('auth', 'password_reset_no_user', `Password reset request for non-existent user`, {
        metadata: { email }
      })
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'If an account exists, a reset email will be sent.' })
      }
    }

    // Generate password reset link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    })

    if (linkError) {
      logger.error('auth', 'password_reset_link_failed', `Failed to generate reset link for ${email}`, new Error(linkError.message))
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'If an account exists, a reset email will be sent.' })
      }
    }

    // Send email via Microsoft Graph
    const msToken = await getMicrosoftAccessToken()
    const resetUrl = linkData.properties?.action_link || ''
    const emailHtml = generatePasswordResetEmailHtml(resetUrl, email)

    await sendEmailViaMicrosoftGraph(
      msToken,
      email,
      'Reset Your Portal Password',
      emailHtml
    )

    // Record to email history
    await recordPasswordResetEmail({
      recipientEmail: email,
      htmlContent: emailHtml,
      sentByEmail: 'self-service',
      status: 'sent',
    })

    // Audit log
    await logger.audit('PASSWORD_RESET', 'auth_user', user.id, {
      actorId: user.id,
      actorEmail: email,
      targetUserEmail: email,
      description: `Password reset email sent to ${email}`
    })

    logger.info('auth', 'password_reset_success', `Password reset email sent to ${email}`, {
      metadata: { email, userId: user.id }
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Password reset email sent.' })
    }

  } catch (error) {
    logger.error('auth', 'password_reset_error', 'Password reset error', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to process request' })
    }
  }
}
