import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://example.com'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Accept Invite - Proxy for Supabase magic links
 *
 * This endpoint receives a never-expiring token, validates it,
 * generates a fresh Supabase magic link, and redirects the user.
 *
 * Flow:
 * 1. User clicks example.com/accept-invite?token=xxx
 * 2. Page calls this function to validate and get redirect URL
 * 3. Function generates fresh Supabase invite link
 * 4. User is redirected to complete signup
 */
export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('accept-invite', event)

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  // Support both GET (for simple redirects) and POST (for AJAX)
  const token = event.queryStringParameters?.token ||
    (event.body ? JSON.parse(event.body).token : null)

  if (!token) {
    logger.warn('invite', 'missing_token', 'Accept invite called without token')
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Missing invite token',
        message: 'No invite token provided. Please use the link from your email.'
      })
    }
  }

  try {
    // Look up the token
    const { data: inviteToken, error: tokenError } = await supabaseAdmin
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (tokenError || !inviteToken) {
      logger.warn('invite', 'invalid_token', `Invalid invite token: ${token.substring(0, 8)}...`)
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Invalid invite token',
          message: 'This invite link is not valid. Please request a new invite at example.com/get-invite'
        })
      }
    }

    // Check if already used
    if (inviteToken.used_at) {
      logger.info('invite', 'token_already_used', `Token already used for ${inviteToken.email}`)
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invite already used',
          message: 'This invite has already been used. If you need to reset your password, use the login page.',
          alreadyUsed: true
        })
      }
    }

    // Verify the member still exists and is active
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('id, name, email, role, status, user_id')
      .eq('email', inviteToken.email.toLowerCase())
      .single()

    if (memberError || !member) {
      logger.warn('invite', 'member_not_found', `Member not found for token: ${inviteToken.email}`)
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Member not found',
          message: 'Your membership could not be found. Please contact for assistance.'
        })
      }
    }

    if (member.status !== 'active') {
      logger.warn('invite', 'member_inactive', `Inactive member tried to accept invite: ${inviteToken.email}`)
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Membership inactive',
          message: 'Your membership is not currently active. Please contact for assistance.'
        })
      }
    }

    // Check if user already exists in auth (by email, not just member.user_id)
    // Need to paginate through all users since listUsers has a default limit
    let allUsers: any[] = []
    let page = 1
    const perPage = 1000
    while (true) {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage
      })
      if (error || !users || users.length === 0) break
      allUsers = allUsers.concat(users)
      if (users.length < perPage) break
      page++
    }
    const authUser = allUsers.find(u => u.email?.toLowerCase() === inviteToken.email.toLowerCase())

    logger.info('invite', 'auth_user_check', `Checking auth user for ${inviteToken.email}`, {
      metadata: {
        found: !!authUser,
        lastSignIn: authUser?.last_sign_in_at || 'never',
        userId: authUser?.id
      }
    })

    if (authUser?.last_sign_in_at) {
      logger.info('invite', 'already_active_account', `User already has active account: ${inviteToken.email}`)
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Account already active',
          message: 'Your account is already set up. Please use "Forgot Password" on the login page if you need to reset your password.',
          alreadyActive: true
        })
      }
    }

    // User exists but never signed in - delete to recreate with fresh invite
    if (authUser) {
      logger.info('invite', 'deleting_pending_user', `Deleting pending auth user ${authUser.id} for ${inviteToken.email}`)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id)
      if (deleteError) {
        logger.error('invite', 'delete_user_failed', `Failed to delete user ${authUser.id}`, new Error(deleteError.message))
      } else {
        logger.info('invite', 'deleted_pending_user', `Successfully deleted pending auth user for ${inviteToken.email}`)
      }
    }

    // Generate a fresh Supabase magic link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: inviteToken.email,
      options: {
        data: {
          full_name: member.name || inviteToken.name,
          name: member.name || inviteToken.name,
          role: member.role || inviteToken.role || 'official'
        },
        redirectTo: `${siteUrl}/auth/callback`
      }
    })

    if (linkError) {
      logger.error('invite', 'link_generation_failed', `Failed to generate link for ${inviteToken.email}`, new Error(linkError.message))
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to generate invite',
          message: 'Unable to process your invite. Please try again or request a new invite.'
        })
      }
    }

    // Update member's user_id
    if (linkData.user?.id) {
      await supabaseAdmin
        .from('members')
        .update({ user_id: linkData.user.id })
        .eq('id', member.id)
    }

    // Mark token as used
    await supabaseAdmin
      .from('invite_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', inviteToken.id)

    const redirectUrl = linkData.properties?.action_link || ''

    logger.info('invite', 'token_redeemed', `Invite token redeemed for ${inviteToken.email}`)

    // Return redirect URL (the page will handle the redirect)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        redirectUrl,
        message: 'Redirecting to complete your account setup...'
      })
    }

  } catch (error) {
    logger.error('invite', 'accept_invite_error', 'Error processing invite', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal error',
        message: 'An error occurred processing your invite. Please try again.'
      })
    }
  }
}
