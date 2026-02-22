import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Valid roles for authorization
type UserRole = 'official' | 'executive' | 'admin' | 'evaluator' | 'mentor'

// Extract user role from Supabase user metadata
function getUserRole(user: any): UserRole {
  const appRole = user?.app_metadata?.role
  const userRole = user?.user_metadata?.role
  const appRoles = user?.app_metadata?.roles || []
  const userRoles = user?.user_metadata?.roles || []

  // Check direct role field first (app_metadata takes precedence)
  const directRole = appRole || userRole
  if (directRole) {
    const normalizedRole = directRole.toLowerCase()
    if (['admin', 'executive', 'evaluator', 'mentor', 'official'].includes(normalizedRole)) {
      return normalizedRole as UserRole
    }
  }

  // Check roles arrays
  const allRoles = [...appRoles, ...userRoles].map((r: string) => r.toLowerCase())
  if (allRoles.includes('admin')) return 'admin'
  if (allRoles.includes('executive')) return 'executive'
  if (allRoles.includes('evaluator')) return 'evaluator'
  if (allRoles.includes('mentor')) return 'mentor'

  return 'official'
}

// Check if user can view all evaluations
function canViewAllEvaluations(role: UserRole): boolean {
  return ['admin', 'executive', 'evaluator'].includes(role)
}

// Check if user can create evaluations
function canCreateEvaluations(role: UserRole): boolean {
  return ['admin', 'executive', 'evaluator'].includes(role)
}

// Check if user can modify (edit/delete) evaluations
function canModifyEvaluations(role: UserRole): boolean {
  return ['admin', 'executive'].includes(role)
}

export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('evaluations', event)

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  // Verify authorization
  const authHeader = event.headers.authorization || event.headers.Authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized - Missing or invalid token' })
    }
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !authUser) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized - Invalid token' })
    }
  }

  const userRole = getUserRole(authUser)
  const userEmail = authUser.email || 'unknown'

  try {
    switch (event.httpMethod) {
      case 'GET': {
        const { member_id, evaluator_id, id } = event.queryStringParameters || {}

        // Get single evaluation by ID
        if (id) {
          const { data, error } = await supabase
            .from('evaluations')
            .select(`
              *,
              member:members!member_id(id, name, email),
              evaluator:members!evaluator_id(id, name, email)
            `)
            .eq('id', id)
            .single()

          if (error) throw error

          // Officials can only view their own evaluations
          if (!canViewAllEvaluations(userRole)) {
            // Get the user's member record to check ownership
            const { data: memberData } = await supabase
              .from('members')
              .select('id')
              .eq('user_id', authUser.id)
              .single()

            if (!memberData || data.member_id !== memberData.id) {
              return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Forbidden - You can only view your own evaluations' })
              }
            }
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
          }
        }

        // Get evaluations for a specific member
        if (member_id) {
          // Officials can only view their own evaluations
          if (!canViewAllEvaluations(userRole)) {
            const { data: memberData } = await supabase
              .from('members')
              .select('id')
              .eq('user_id', authUser.id)
              .single()

            if (!memberData || member_id !== memberData.id) {
              return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Forbidden - You can only view your own evaluations' })
              }
            }
          }

          const { data, error } = await supabase
            .from('evaluations')
            .select(`
              *,
              member:members!member_id(id, name, email),
              evaluator:members!evaluator_id(id, name, email)
            `)
            .eq('member_id', member_id)
            .order('evaluation_date', { ascending: false })

          if (error) throw error

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
          }
        }

        // Get evaluations created by a specific evaluator
        if (evaluator_id) {
          // Only evaluators/admins/executives can view by evaluator_id
          if (!canViewAllEvaluations(userRole)) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ error: 'Forbidden - Insufficient permissions' })
            }
          }

          const { data, error } = await supabase
            .from('evaluations')
            .select(`
              *,
              member:members!member_id(id, name, email),
              evaluator:members!evaluator_id(id, name, email)
            `)
            .eq('evaluator_id', evaluator_id)
            .order('evaluation_date', { ascending: false })

          if (error) throw error

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
          }
        }

        // Get all evaluations - only for admin/executive/evaluator
        if (!canViewAllEvaluations(userRole)) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Forbidden - You can only view your own evaluations' })
          }
        }

        const { data, error } = await supabase
          .from('evaluations')
          .select(`
            *,
            member:members!member_id(id, name, email),
            evaluator:members!evaluator_id(id, name, email)
          `)
          .order('evaluation_date', { ascending: false })

        if (error) throw error

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        }
      }

      case 'POST': {
        // Only evaluators/admins/executives can create evaluations
        if (!canCreateEvaluations(userRole)) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Forbidden - You do not have permission to create evaluations' })
          }
        }

        const body = JSON.parse(event.body || '{}')
        logger.info('crud', 'create_evaluation', `Creating evaluation for member ${body.member_id} by ${userEmail} (${userRole})`, {
          metadata: { member_id: body.member_id, evaluator_id: body.evaluator_id, title: body.title, actor_role: userRole }
        })

        // Validate required fields
        if (!body.member_id || !body.file_url || !body.file_name) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'member_id, file_url, and file_name are required' })
          }
        }

        const { data, error } = await supabase
          .from('evaluations')
          .insert([{
            member_id: body.member_id,
            evaluator_id: body.evaluator_id,
            evaluation_date: body.evaluation_date || new Date().toISOString().split('T')[0],
            file_url: body.file_url,
            file_name: body.file_name,
            title: body.title,
            notes: body.notes,
            activity_id: body.activity_id
          }])
          .select(`
            *,
            member:members!member_id(id, name, email),
            evaluator:members!evaluator_id(id, name, email)
          `)
          .single()

        if (error) throw error

        await logger.audit('CREATE', 'evaluation', data.id, {
          actorId: body.evaluator_id || authUser.id,
          actorEmail: userEmail,
          targetUserId: body.member_id,
          newValues: { title: body.title, file_name: body.file_name },
          description: `Created evaluation for member ${body.member_id} by ${userEmail} (${userRole})`
        })

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(data)
        }
      }

      case 'PUT': {
        // Only admins/executives can edit evaluations
        if (!canModifyEvaluations(userRole)) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Forbidden - Only administrators and executives can edit evaluations' })
          }
        }

        const body = JSON.parse(event.body || '{}')
        const { id, ...updateData } = body

        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID is required for update' })
          }
        }

        logger.info('crud', 'update_evaluation', `Updating evaluation ${id} by ${userEmail} (${userRole})`, {
          metadata: { id, updates: Object.keys(updateData), actor_role: userRole }
        })

        const { data, error } = await supabase
          .from('evaluations')
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select(`
            *,
            member:members!member_id(id, name, email),
            evaluator:members!evaluator_id(id, name, email)
          `)
          .single()

        if (error) throw error

        await logger.audit('UPDATE', 'evaluation', id, {
          actorId: authUser.id,
          actorEmail: userEmail,
          newValues: updateData,
          description: `Updated evaluation ${id} by ${userEmail} (${userRole})`
        })

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        }
      }

      case 'DELETE': {
        // Only admins/executives can delete evaluations
        if (!canModifyEvaluations(userRole)) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Forbidden - Only administrators and executives can delete evaluations' })
          }
        }

        const { id } = event.queryStringParameters || {}

        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID is required for deletion' })
          }
        }

        logger.info('crud', 'delete_evaluation', `Deleting evaluation ${id} by ${userEmail} (${userRole})`, { metadata: { id, actor_role: userRole } })

        const { error } = await supabase
          .from('evaluations')
          .delete()
          .eq('id', id)

        if (error) throw error

        await logger.audit('DELETE', 'evaluation', id, {
          actorId: authUser.id,
          actorEmail: userEmail,
          description: `Deleted evaluation ${id} by ${userEmail} (${userRole})`
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
    logger.error('crud', 'evaluations_api_error', 'Evaluations API error', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  }
}
