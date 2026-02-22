import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://example.com'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface MemberToMigrate {
  name: string
  email: string
  role?: string
}

// Get Microsoft Graph access token for sending emails
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
    throw new Error(`Failed to get Microsoft access token`)
  }

  const data = await response.json()
  return data.access_token
}

// Send migration email
async function sendMigrationEmail(
  accessToken: string,
  toEmail: string,
  resetUrl: string,
  name?: string
): Promise<void> {
  const senderEmail = 'no-reply@example.com'
  const graphEndpoint = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`

  const emailHtml = `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <tr>
    <td style="padding: 20px 10px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff;" align="center">
        <tr>
          <td style="background-color: #1f2937; padding: 24px 20px; border-bottom: 3px solid #F97316; text-align: center;">
            <img src="https://i.imgur.com/BQe360J.png" alt="Logo" style="max-width: 70px; height: auto; display: inline-block; margin-bottom: 12px;">
            <h1 style="color: #ffffff; margin: 0 0 4px 0; font-size: 18px; font-weight: 700;">Your Officials Association</h1>
            <p style="color: #ffffff; margin: 0; font-size: 14px; font-weight: 500; opacity: 0.95;">Excellence in Basketball Officiating</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px 20px; color: #333333; font-size: 16px; line-height: 1.6;">
            <h1 style="color: #003DA5; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 700;">Portal Update - Action Required</h1>
            <p style="margin: 0 0 16px 0;">${name ? `Hi ${name},` : 'Hello,'}</p>
            <p style="margin: 0 0 16px 0;">We've upgraded the member portal to provide you with a better experience. As part of this upgrade, you'll need to set a new password for your account.</p>
            <p style="margin: 0 0 16px 0;"><strong>Your email address (${toEmail}) remains the same</strong> - you just need to create a new password.</p>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background-color: #F97316; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Set New Password</a>
            </p>
            <p style="margin: 0 0 16px 0;">This link will expire in 24 hours. If you have any questions, please <a href="https://example.com/contact?category=general" style="color: #F97316;">contact us</a>.</p>
            <p style="margin: 0;">Best regards,<br><strong style="color: #003DA5;">Executive Board</strong></p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #1F2937; color: #D1D5DB; padding: 30px 20px; text-align: center; font-size: 14px; border-top: 3px solid #F97316;">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #ffffff;">Your Officials Association</p>
            <p style="margin: 0;">City, State, Country</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
  `.trim()

  const emailMessage = {
    message: {
      subject: 'Portal Update - Set Your New Password',
      body: { contentType: 'HTML', content: emailHtml },
      from: { emailAddress: { address: senderEmail } },
      toRecipients: [{ emailAddress: { address: toEmail } }]
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

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // Verify authorization - accept either migration secret or Supabase admin token
  const authHeader = event.headers.authorization || event.headers.Authorization
  const migrationSecret = process.env.MIGRATION_SECRET

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]

    // Check if it's the migration secret
    if (migrationSecret && token === migrationSecret) {
      // Authorized via migration secret
    } else {
      // Try Supabase token
      const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

      if (authError || !callerUser) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
      }

      const callerRole = callerUser.app_metadata?.role || callerUser.user_metadata?.role
      if (callerRole?.toLowerCase() !== 'admin') {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Admin access required' }) }
      }
    }
  } else {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const body = JSON.parse(event.body || '{}')
  const { dryRun = true, sendEmails = false, members = [], action } = body as {
    dryRun?: boolean
    sendEmails?: boolean
    members?: MemberToMigrate[]
    action?: string
  }

  // Handle backup action - export current Supabase users
  if (action === 'backup') {
    try {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
      if (error) throw error

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          count: users.length,
          users: users.map(u => ({
            id: u.id,
            email: u.email,
            name: u.user_metadata?.full_name || u.user_metadata?.name,
            role: u.app_metadata?.role,
            created_at: u.created_at,
            email_confirmed_at: u.email_confirmed_at,
            user_metadata: u.user_metadata,
            app_metadata: u.app_metadata
          }))
        })
      }
    } catch (err: any) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) }
    }
  }

  // Use embedded member list if none provided
  const membersToMigrate: MemberToMigrate[] = members.length > 0 ? members : await getMemberList()

  if (membersToMigrate.length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'No members to migrate. Provide members array in request body.' })
    }
  }

  try {
    // Fetch all Supabase users
    const { data: { users: supabaseUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    const supabaseEmails = new Set(supabaseUsers.map(u => u.email?.toLowerCase()))

    const results = {
      total: membersToMigrate.length,
      alreadyInSupabase: 0,
      needsMigration: 0,
      migrated: 0,
      flaggedForPasswordChange: 0,
      emailsSent: 0,
      errors: [] as string[],
      skipped: [] as string[]
    }

    let msToken: string | null = null
    if (sendEmails && !dryRun) {
      msToken = await getMicrosoftAccessToken()
    }

    for (const member of membersToMigrate) {
      const emailLower = member.email.toLowerCase()

      if (supabaseEmails.has(emailLower)) {
        // User already exists in Supabase - flag for password change
        results.alreadyInSupabase++

        if (!dryRun) {
          const existingUser = supabaseUsers.find(u => u.email?.toLowerCase() === emailLower)
          if (existingUser) {
            await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
              user_metadata: {
                ...existingUser.user_metadata,
                needs_password_change: true,
                migrated_from_netlify: true
              }
            })
            results.flaggedForPasswordChange++
          }
        }
      } else {
        // User needs to be created in Supabase
        results.needsMigration++

        if (!dryRun) {
          try {
            // Create user in Supabase with email confirmed
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email: member.email,
              email_confirm: true,
              user_metadata: {
                full_name: member.name,
                name: member.name,
                needs_password_change: true,
                migrated_from_netlify: true
              },
              app_metadata: {
                role: member.role || 'official'
              }
            })

            if (createError) {
              results.errors.push(`Failed to create ${member.email}: ${createError.message}`)
              continue
            }

            results.migrated++

            // Send password reset email if enabled
            if (sendEmails && msToken) {
              try {
                const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
                  type: 'recovery',
                  email: member.email,
                  options: { redirectTo: `${siteUrl}/auth/callback` }
                })

                if (linkData?.properties?.action_link) {
                  await sendMigrationEmail(
                    msToken,
                    member.email,
                    linkData.properties.action_link,
                    member.name
                  )
                  results.emailsSent++
                }
              } catch (emailErr: any) {
                results.errors.push(`Failed to send email to ${member.email}: ${emailErr.message}`)
              }
            }
          } catch (err: any) {
            results.errors.push(`Error migrating ${member.email}: ${err.message}`)
          }
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        dryRun,
        sendEmails,
        results
      })
    }
  } catch (error: any) {
    console.error('Migration error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}

// Load members from embedded JSON file (built into the function)
async function getMemberList(): Promise<MemberToMigrate[]> {
  // This is the member list from scripts/members-to-migrate.json
  // Embedded directly to avoid file system access in serverless function
  return []
}
