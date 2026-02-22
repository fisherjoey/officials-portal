import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TABLE_NAME = 'officials'

export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('officials', event)

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
        const { level } = event.queryStringParameters || {}

        let query = supabase
          .from(TABLE_NAME)
          .select('*')
          .order('priority', { ascending: false })
          .order('name', { ascending: true })

        if (level) {
          query = query.eq('level', parseInt(level))
        }

        const { data, error } = await query

        if (error) throw error
        return { statusCode: 200, headers, body: JSON.stringify(data) }
      }

      case 'POST': {
        const body = JSON.parse(event.body || '{}')
        logger.info('crud', 'create_official', `Creating official: ${body.name || 'unnamed'}`, {
          metadata: { name: body.name, level: body.level }
        })

        if (!body.name) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: 'Missing required field: name'
            })
          }
        }

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert([body])
          .select()
          .single()

        if (error) throw error

        await logger.audit('CREATE', 'official', data.id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: { name: body.name, level: body.level },
          description: `Created official: ${body.name}`
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

        logger.info('crud', 'update_official', `Updating official ${id}`, {
          metadata: { id, updates: Object.keys(updates) }
        })

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        await logger.audit('UPDATE', 'official', id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: updates,
          description: `Updated official ${id}`
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

        logger.info('crud', 'delete_official', `Deleting official ${id}`, { metadata: { id } })

        const { error } = await supabase
          .from(TABLE_NAME)
          .delete()
          .eq('id', id)

        if (error) throw error

        await logger.audit('DELETE', 'official', id, {
          actorId: 'system',
          actorEmail: 'system',
          description: `Deleted official ${id}`
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
    logger.error('crud', 'officials_api_error', 'Officials API error', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  }
}
