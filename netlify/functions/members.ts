import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Microsoft Graph API for sending emails
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
    throw new Error('Failed to get Microsoft access token')
  }

  const data = await response.json()
  return data.access_token
}

async function sendEmailViaMicrosoftGraph(
  accessToken: string,
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<void> {
  const senderEmail = 'announcements@example.com'
  const graphEndpoint = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`

  const emailMessage = {
    message: {
      subject,
      body: { contentType: 'HTML', content: htmlContent },
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
    throw new Error('Failed to send email')
  }
}

function generateInviteEmailHtml(inviteUrl: string, name?: string): string {
  const siteUrl = 'https://example.com'
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
            <h1 style="color: #003DA5; font-size: 24px; margin-top: 0; margin-bottom: 16px;">You're Invited to Join Us!</h1>
            <p style="margin: 0 0 16px 0;">${name ? `Hi ${name.split(' ')[0]},` : 'Hello,'}</p>
            <p style="margin: 0 0 16px 0;">You have been invited to create an account on the <strong style="color: #003DA5;">Your Officials Association</strong> member portal.</p>
            <p style="margin: 0 0 16px 0;">As a member, you'll have access to:</p>
            <ul style="margin: 0 0 16px 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;"><strong style="color: #003DA5;">Resources</strong> - Training materials, rulebooks, and guides</li>
              <li style="margin-bottom: 8px;"><strong style="color: #003DA5;">The Bounce</strong> - Our official newsletter</li>
              <li style="margin-bottom: 8px;"><strong style="color: #003DA5;">Calendar</strong> - Upcoming events and training sessions</li>
              <li style="margin-bottom: 8px;"><strong style="color: #003DA5;">Rule Modifications</strong> - League-specific rule changes</li>
            </ul>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${inviteUrl}" style="display: inline-block; padding: 14px 28px; background-color: #F97316; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600;">Accept Invitation</a>
            </p>
            <p style="margin: 0;">Best regards,<br><strong style="color: #003DA5;">Executive Board</strong></p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #1F2937; color: #D1D5DB; padding: 30px 20px; text-align: center; font-size: 14px; border-top: 3px solid #F97316;">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #ffffff;">Your Officials Association</p>
            <p style="margin: 0 0 15px 0;">City, State, Country</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 20px auto;">
              <tr>
                <td style="padding: 0 8px;"><a href="${siteUrl}" style="color: #F97316; text-decoration: none;">Website</a></td>
                <td style="padding: 0 8px;"><a href="${siteUrl}/portal" style="color: #F97316; text-decoration: none;">Member Portal</a></td>
                <td style="padding: 0 8px;"><a href="${siteUrl}/contact?category=membership" style="color: #F97316; text-decoration: none;">Contact Us</a></td>
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

export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('members', event)

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    switch (event.httpMethod) {
      case 'GET': {
        const { netlify_user_id, user_id, id, email } = event.queryStringParameters || {}

        // Get member by email
        if (email) {
          const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('email', email)
            .single()

          // PGRST116 = no rows found - return null, not an error
          if (error && error.code !== 'PGRST116') throw error

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data || null)
          }
        }

        // Get member by Supabase Auth user ID
        if (user_id) {
          const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('user_id', user_id)
            .single()

          // PGRST116 = no rows found - return null, not an error
          if (error && error.code !== 'PGRST116') throw error

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data || null)
          }
        }

        // Get member by Netlify user ID (legacy support)
        if (netlify_user_id) {
          const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('netlify_user_id', netlify_user_id)
            .single()

          // PGRST116 = no rows found - return null, not an error
          if (error && error.code !== 'PGRST116') throw error

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data || null)
          }
        }

        // Get member by ID
        if (id) {
          const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('id', id)
            .single()

          if (error) throw error

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
          }
        }

        // Get all members
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('name', { ascending: true })

        if (error) throw error

        // Fetch auth users to check who has actually signed in
        const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()

        // Add account_setup_complete flag to each member
        const membersWithStatus = data?.map(member => {
          let accountSetupComplete = false

          if (member.user_id) {
            const authUser = authUsers?.find(u => u.id === member.user_id)
            // Account is complete if user has signed in at least once
            accountSetupComplete = !!authUser?.last_sign_in_at
          }

          return {
            ...member,
            account_setup_complete: accountSetupComplete
          }
        }) || []

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(membersWithStatus)
        }
      }

      case 'POST': {
        const body = JSON.parse(event.body || '{}')
        const { email, name, role, skipInvite, ...memberData } = body

        logger.info('crud', 'create_member_start', `Creating member: ${email || name || 'unknown'}`, {
          metadata: { email, name, skipInvite }
        })

        if (!email) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Email is required' })
          }
        }

        // Check if member with this email already exists
        const { data: existingMember } = await supabase
          .from('members')
          .select('id')
          .eq('email', email.toLowerCase())
          .single()

        if (existingMember) {
          logger.warn('crud', 'create_member_exists', `Member already exists with email: ${email}`, {
            metadata: { email }
          })
          return {
            statusCode: 409,
            headers,
            body: JSON.stringify({ error: 'Member with this email already exists' })
          }
        }

        // Check if auth user already exists
        const { data: authData } = await supabase.auth.admin.listUsers()
        const existingUsers = authData?.users || []
        const existingAuthUser = existingUsers.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

        let authUserId: string | null = null
        let inviteSent = false

        if (existingAuthUser) {
          // Auth user exists - link to them
          authUserId = existingAuthUser.id
        } else if (!skipInvite) {
          // Create auth user and send invite
          try {
            const siteUrl = 'https://example.com'
            const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
              type: 'invite',
              email: email.toLowerCase(),
              options: {
                data: {
                  full_name: name,
                  name: name,
                  role: role || 'official'
                },
                redirectTo: `${siteUrl}/auth/callback`
              }
            })

            if (linkError) {
              logger.error('crud', 'create_member_invite_failed', `Failed to create auth user: ${linkError.message}`, new Error(linkError.message))
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: `Failed to create auth user: ${linkError.message}` })
              }
            }

            authUserId = linkData.user?.id || null
            const inviteUrl = linkData.properties?.action_link

            // Send invite email via Microsoft Graph
            if (inviteUrl) {
              try {
                const msToken = await getMicrosoftAccessToken()
                const emailHtml = generateInviteEmailHtml(inviteUrl, name)
                await sendEmailViaMicrosoftGraph(msToken, email, "You're Invited to Join Us!", emailHtml)
                inviteSent = true
                logger.info('crud', 'create_member_invite_sent', `Invite email sent to ${email}`, {
                  metadata: { email, authUserId }
                })
              } catch (emailErr) {
                logger.error('crud', 'create_member_email_failed', `Failed to send invite email to ${email}`, emailErr instanceof Error ? emailErr : new Error(String(emailErr)))
                // Continue - auth user is created, email just didn't send
              }
            }
          } catch (authErr) {
            logger.error('crud', 'create_member_auth_failed', 'Auth user creation failed', authErr instanceof Error ? authErr : new Error(String(authErr)))
            // Continue without auth user
          }
        }

        // Create member record with user_id link
        const { data, error } = await supabase
          .from('members')
          .insert([{
            ...memberData,
            email: email.toLowerCase(),
            name,
            role: role || 'official',
            user_id: authUserId
          }])
          .select()
          .single()

        if (error) throw error

        // Audit log
        await logger.audit('CREATE', 'member', data.id, {
          actorId: authUserId || 'system',
          actorEmail: email,
          newValues: { email, name, role: role || 'official' },
          description: `Created member ${email}`
        })

        logger.info('crud', 'create_member_success', `Member created: ${email}`, {
          metadata: { memberId: data.id, email, inviteSent }
        })

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ ...data, inviteSent })
        }
      }

      case 'PUT': {
        const body = JSON.parse(event.body || '{}')
        const { id, ...updates } = body

        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID is required for updates' })
          }
        }

        logger.info('crud', 'update_member_start', `Updating member ${id}`, {
          metadata: { memberId: id, updates: Object.keys(updates) }
        })

        // Get old values for audit
        const { data: oldData } = await supabase
          .from('members')
          .select('*')
          .eq('id', id)
          .single()

        const { data, error } = await supabase
          .from('members')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        // If role was updated, sync to Supabase Auth user metadata
        if (updates.role && data.user_id) {
          try {
            await supabase.auth.admin.updateUserById(data.user_id, {
              app_metadata: { role: updates.role }
            })
            logger.info('crud', 'role_sync_success', `Synced role to auth for user ${data.user_id}`, {
              metadata: { userId: data.user_id, newRole: updates.role }
            })
          } catch (authError) {
            // Log but don't fail the request - members table was already updated
            logger.error('crud', 'role_sync_failed', `Failed to sync role to auth for user ${data.user_id}`, authError instanceof Error ? authError : new Error(String(authError)))
          }
        }

        // Audit log
        await logger.audit('UPDATE', 'member', id, {
          actorId: data.user_id || 'system',
          actorEmail: data.email || 'system',
          oldValues: oldData || undefined,
          newValues: updates,
          description: `Updated member ${data.email || data.name || id}`
        })

        logger.info('crud', 'update_member_success', `Member ${id} updated`, {
          metadata: { memberId: id, email: data.email }
        })

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        }
      }

      case 'DELETE': {
        const id = event.queryStringParameters?.id

        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID is required for deletion' })
          }
        }

        logger.info('crud', 'delete_member_start', `Deleting member ${id}`, {
          metadata: { memberId: id }
        })

        // Get member info for audit and auth cleanup before deletion
        const { data: member } = await supabase
          .from('members')
          .select('*')
          .eq('id', id)
          .single()

        // Delete the member record
        const { error } = await supabase
          .from('members')
          .delete()
          .eq('id', id)

        if (error) throw error

        // Also delete the auth user if they have one
        // First try by user_id, then fallback to email lookup
        let authUserDeleted = false

        if (member?.user_id) {
          try {
            await supabase.auth.admin.deleteUser(member.user_id)
            authUserDeleted = true
            logger.info('crud', 'delete_member_auth_deleted', `Auth user deleted for member ${id}`, {
              metadata: { memberId: id, userId: member.user_id }
            })
          } catch (authErr) {
            logger.error('crud', 'delete_member_auth_failed', 'Failed to delete auth user by user_id', authErr instanceof Error ? authErr : new Error(String(authErr)))
          }
        }

        // If user_id was null or deletion failed, try to find auth user by email
        if (!authUserDeleted && member?.email) {
          try {
            const { data: authData } = await supabase.auth.admin.listUsers()
            const authUser = authData?.users?.find((u: any) => u.email?.toLowerCase() === member.email.toLowerCase())

            if (authUser) {
              await supabase.auth.admin.deleteUser(authUser.id)
              logger.info('crud', 'delete_member_auth_deleted_by_email', `Auth user deleted by email lookup for member ${id}`, {
                metadata: { memberId: id, userId: authUser.id, email: member.email }
              })
            }
          } catch (authErr) {
            logger.error('crud', 'delete_member_auth_email_lookup_failed', 'Failed to delete auth user by email', authErr instanceof Error ? authErr : new Error(String(authErr)))
            // Continue - member is deleted, auth cleanup failed
          }
        }

        // Audit log
        await logger.audit('DELETE', 'member', id, {
          actorId: 'system',
          actorEmail: 'system',
          oldValues: member || undefined,
          description: `Deleted member ${member?.email || member?.name || id}`
        })

        logger.info('crud', 'delete_member_success', `Member ${id} deleted`, {
          metadata: { memberId: id, email: member?.email }
        })

        return {
          statusCode: 204,
          headers,
          body: ''
        }
      }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        }
    }
  } catch (error) {
    logger.error('crud', 'members_api_error', 'Members API error', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  }
}
