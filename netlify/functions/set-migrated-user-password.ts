import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('set-migrated-user-password', event)

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { email, password } = JSON.parse(event.body || '{}')
    logger.info('auth', 'set_migrated_password_start', `Setting password for migrated user`, {
      metadata: { email }
    })

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and password required' })
      }
    }

    if (password.length < 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Password must be at least 8 characters' })
      }
    }

    // Find user by email (with pagination to handle all users)
    let allUsers: any[] = []
    let page = 1
    const perPage = 1000

    while (true) {
      const { data: { users: pageUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage
      })

      if (listError) throw listError

      if (!pageUsers || pageUsers.length === 0) break
      allUsers = allUsers.concat(pageUsers)
      if (pageUsers.length < perPage) break
      page++
    }

    const user = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      }
    }

    // Verify this is a migrated user who needs password setup
    const isMigrated = user.user_metadata?.migrated_from_netlify === true
    const needsPasswordChange = user.user_metadata?.needs_password_change === true

    if (!isMigrated || !needsPasswordChange) {
      logger.warn('auth', 'set_migrated_password_not_needed', `User ${email} does not need password setup`, {
        metadata: { email, isMigrated, needsPasswordChange }
      })
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'This account does not require password setup. Use forgot password if needed.' })
      }
    }

    // Set the new password and clear the migration flags
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: password,
      user_metadata: {
        ...user.user_metadata,
        needs_password_change: false
      }
    })

    if (updateError) {
      logger.error('auth', 'set_migrated_password_failed', `Failed to set password for ${email}`, new Error(updateError.message))
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: updateError.message })
      }
    }

    // Audit log
    await logger.audit('PASSWORD_RESET', 'auth_user', user.id, {
      actorId: user.id,
      actorEmail: email,
      targetUserEmail: email,
      description: `Migrated user ${email} set their password`
    })

    logger.info('auth', 'set_migrated_password_success', `Password set for migrated user ${email}`, {
      metadata: { email, userId: user.id }
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Password set successfully. You can now log in.'
      })
    }
  } catch (error: any) {
    logger.error('auth', 'set_migrated_password_error', 'Set password error', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
