import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TABLE_NAME = 'executive_team'

export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('executive-team', event)

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    switch (event.httpMethod) {
      case 'GET': {
        const { active } = event.queryStringParameters || {}

        let query = supabase
          .from(TABLE_NAME)
          .select('*')
          .order('priority', { ascending: false })
          .order('name', { ascending: true })

        // By default, only return active members for public display
        if (active !== 'false') {
          query = query.eq('active', true)
        }

        const { data, error } = await query

        if (error) throw error
        return { statusCode: 200, headers, body: JSON.stringify(data) }
      }

      case 'POST': {
        const body = JSON.parse(event.body || '{}')
        logger.info('crud', 'create_executive', `Creating executive member: ${body.name || 'unnamed'}`, {
          metadata: { name: body.name, position: body.position }
        })

        if (!body.name || !body.position || !body.email) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: 'Missing required fields: name, position, and email are required'
            })
          }
        }

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert([{
            name: body.name,
            position: body.position,
            email: body.email,
            image_url: body.image_url || null,
            bio: body.bio || null,
            active: body.active ?? true,
            priority: body.priority || 0
          }])
          .select()
          .single()

        if (error) throw error

        await logger.audit('CREATE', 'executive_team', data.id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: { name: body.name, position: body.position },
          description: `Created executive member: ${body.name}`
        })

        return { statusCode: 201, headers, body: JSON.stringify(data) }
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

        logger.info('crud', 'update_executive', `Updating executive member ${id}`, {
          metadata: { id, updates: Object.keys(updates) }
        })

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        await logger.audit('UPDATE', 'executive_team', id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: updates,
          description: `Updated executive member ${id}`
        })

        return { statusCode: 200, headers, body: JSON.stringify(data) }
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

        logger.info('crud', 'delete_executive', `Deleting executive member ${id}`, { metadata: { id } })

        const { error } = await supabase
          .from(TABLE_NAME)
          .delete()
          .eq('id', id)

        if (error) throw error

        await logger.audit('DELETE', 'executive_team', id, {
          actorId: 'system',
          actorEmail: 'system',
          description: `Deleted executive member ${id}`
        })

        return { statusCode: 204, headers, body: '' }
      }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        }
    }
  } catch (error) {
    logger.error('crud', 'executive_team_api_error', 'Executive team API error', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  }
}
