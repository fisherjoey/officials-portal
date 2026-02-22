import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('member-activities', event)

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
        const { member_id } = event.queryStringParameters || {}

        let query = supabase
          .from('member_activities')
          .select('*')
          .order('activity_date', { ascending: false })

        // Filter by member if specified
        if (member_id) {
          query = query.eq('member_id', member_id)
        }

        const { data, error } = await query

        if (error) throw error

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        }
      }

      case 'POST': {
        const body = JSON.parse(event.body || '{}')
        logger.info('crud', 'create_member_activity', `Creating member activity for member ${body.member_id}`, {
          metadata: { member_id: body.member_id, activity_type: body.activity_type }
        })

        const { data, error } = await supabase
          .from('member_activities')
          .insert([body])
          .select()
          .single()

        if (error) throw error

        await logger.audit('CREATE', 'member_activity', data.id, {
          actorId: 'system',
          actorEmail: 'system',
          targetUserId: body.member_id,
          newValues: { activity_type: body.activity_type, activity_date: body.activity_date },
          description: `Created activity for member ${body.member_id}`
        })

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(data)
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

        logger.info('crud', 'update_member_activity', `Updating member activity ${id}`, {
          metadata: { id, updates: Object.keys(updates) }
        })

        const { data, error } = await supabase
          .from('member_activities')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        await logger.audit('UPDATE', 'member_activity', id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: updates,
          description: `Updated member activity ${id}`
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

        logger.info('crud', 'delete_member_activity', `Deleting member activity ${id}`, { metadata: { id } })

        // First check if the activity exists
        const { data: existing, error: findError } = await supabase
          .from('member_activities')
          .select('id')
          .eq('id', id)
          .single()

        if (findError || !existing) {
          logger.warn('crud', 'delete_member_activity_not_found', `Member activity ${id} not found`, { metadata: { id } })
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Activity not found' })
          }
        }

        const { error } = await supabase
          .from('member_activities')
          .delete()
          .eq('id', id)

        if (error) throw error

        await logger.audit('DELETE', 'member_activity', id, {
          actorId: 'system',
          actorEmail: 'system',
          description: `Deleted member activity ${id}`
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
    logger.error('crud', 'member_activities_api_error', 'Member activities API error', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  }
}
