import { Handler } from '@netlify/functions'

/**
 * Netlify Identity Admin API
 *
 * Provides admin operations for managing Netlify Identity users:
 * - GET: List all users or get a specific user by email
 * - POST: Invite a new user
 * - DELETE: Delete a user
 *
 * Requires admin role to execute.
 */

const SITE_URL = process.env.URL || 'https://example.com'

interface IdentityUser {
  id: string
  email: string
  confirmed_at?: string
  invited_at?: string
  created_at?: string
  app_metadata?: {
    roles?: string[]
    role?: string
  }
  user_metadata?: {
    full_name?: string
  }
}

interface IdentityListResponse {
  users: IdentityUser[]
}

// Check if user has admin or executive role
function hasAdminAccess(user: any): boolean {
  const roles = user?.app_metadata?.roles || []
  return roles.includes('admin') || roles.includes('executive')
}

// Fetch all users from Identity (paginated)
async function fetchAllIdentityUsers(adminToken: string): Promise<IdentityUser[]> {
  const users: IdentityUser[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const url = `${SITE_URL}/.netlify/identity/admin/users?page=${page}&per_page=${perPage}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`)
    }

    const data: IdentityListResponse = await response.json()

    if (!data.users || data.users.length === 0) {
      break
    }

    users.push(...data.users)

    if (data.users.length < perPage) {
      break
    }

    page++
  }

  return users
}

// Get a single user by email
async function getUserByEmail(email: string, adminToken: string): Promise<IdentityUser | null> {
  const users = await fetchAllIdentityUsers(adminToken)
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
}

// Invite a new user
async function inviteUser(
  email: string,
  adminToken: string,
  userData?: { full_name?: string }
): Promise<{ success: boolean; user?: IdentityUser; error?: string }> {
  const response = await fetch(`${SITE_URL}/.netlify/identity/admin/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      confirm: false, // Send invitation email instead of auto-confirming
      user_metadata: userData || {}
    })
  })

  if (response.ok) {
    const user = await response.json()
    return { success: true, user }
  } else {
    const errorText = await response.text()
    // Check if user already exists
    if (response.status === 422 && errorText.includes('already')) {
      return { success: false, error: 'User with this email already exists in Identity' }
    }
    return { success: false, error: errorText }
  }
}

// Delete a user by ID
async function deleteUser(userId: string, adminToken: string): Promise<boolean> {
  const response = await fetch(`${SITE_URL}/.netlify/identity/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    }
  })
  return response.ok
}

// Resend invite (delete and re-invite)
async function resendInvite(
  email: string,
  adminToken: string,
  userData?: { full_name?: string }
): Promise<{ success: boolean; error?: string }> {
  // Find the user first
  const existingUser = await getUserByEmail(email, adminToken)

  if (!existingUser) {
    return { success: false, error: 'User not found in Identity' }
  }

  // Check if already confirmed
  if (existingUser.confirmed_at) {
    return { success: false, error: 'User has already accepted their invite' }
  }

  // Delete the old invite
  const deleted = await deleteUser(existingUser.id, adminToken)
  if (!deleted) {
    return { success: false, error: 'Failed to delete old invite' }
  }

  // Wait a moment before re-inviting
  await new Promise(resolve => setTimeout(resolve, 200))

  // Re-invite
  const result = await inviteUser(email, adminToken, userData)
  return { success: result.success, error: result.error }
}

// Decode JWT payload without verification (we trust Netlify's token)
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], 'base64').toString('utf8')
    return JSON.parse(payload)
  } catch {
    return null
  }
}

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  // Get admin token from environment variable
  const adminToken = process.env.NETLIFY_IDENTITY_TOKEN

  if (!adminToken) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error - Identity token not set' })
    }
  }

  // Get user token from Authorization header to verify they're logged in with admin role
  const authHeader = event.headers['authorization'] || event.headers['Authorization']
  const userToken = authHeader?.replace('Bearer ', '')

  if (!userToken) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized - must be logged in' })
    }
  }

  // Decode the user's JWT to check their role
  let user = context.clientContext?.user

  if (!user) {
    const decoded = decodeJwtPayload(userToken)
    if (!decoded) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized - invalid token' })
      }
    }

    // Check token expiration
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized - token expired' })
      }
    }

    user = {
      email: decoded.email,
      app_metadata: decoded.app_metadata || {},
      user_metadata: decoded.user_metadata || {}
    }
  }

  // Check admin/executive role
  if (!hasAdminAccess(user)) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Forbidden - admin or executive role required' })
    }
  }

  // Now use the admin token from env var for Identity API calls
  if (!adminToken) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Authorization token required' })
    }
  }

  try {
    switch (event.httpMethod) {
      case 'GET': {
        const { email, action } = event.queryStringParameters || {}

        // List all users
        if (action === 'list' || !email) {
          const users = await fetchAllIdentityUsers(adminToken)
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              users: users.map(u => ({
                id: u.id,
                email: u.email,
                name: u.user_metadata?.full_name,
                confirmed: !!u.confirmed_at,
                confirmed_at: u.confirmed_at,
                invited_at: u.invited_at,
                created_at: u.created_at,
                roles: u.app_metadata?.roles || []
              }))
            })
          }
        }

        // Get specific user by email
        const user = await getUserByEmail(email, adminToken)
        if (!user) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'User not found', exists: false })
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            exists: true,
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name,
            confirmed: !!user.confirmed_at,
            confirmed_at: user.confirmed_at,
            invited_at: user.invited_at,
            created_at: user.created_at,
            roles: user.app_metadata?.roles || []
          })
        }
      }

      case 'POST': {
        const body = JSON.parse(event.body || '{}')
        const { email, name, action } = body

        if (!email) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Email is required' })
          }
        }

        // Resend invite
        if (action === 'resend') {
          const result = await resendInvite(email, adminToken, { full_name: name })
          if (!result.success) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: result.error })
            }
          }
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Invite resent successfully' })
          }
        }

        // Send new invite
        const result = await inviteUser(email, adminToken, { full_name: name })
        if (!result.success) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: result.error })
          }
        }

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Invite sent successfully',
            user: result.user ? {
              id: result.user.id,
              email: result.user.email
            } : undefined
          })
        }
      }

      case 'DELETE': {
        const { email } = event.queryStringParameters || {}

        if (!email) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Email is required' })
          }
        }

        const userToDelete = await getUserByEmail(email, adminToken)
        if (!userToDelete) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'User not found' })
          }
        }

        const deleted = await deleteUser(userToDelete.id, adminToken)
        if (!deleted) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to delete user' })
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'User deleted successfully' })
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
    console.error('Identity admin error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  }
}
