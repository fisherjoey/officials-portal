import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('resources', event)

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
        const { featured } = event.queryStringParameters || {}
        
        let query = supabase.from('resources').select('*')
        
        if (featured === 'true') {
          query = query.eq('is_featured', true)
        }
        
        const { data, error } = await query.order('created_at', { ascending: false })
        
        if (error) throw error
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        }
      }

      case 'POST': {
        const body = JSON.parse(event.body || '{}')
        logger.info('crud', 'create_resource', `Creating resource: ${body.title || 'untitled'}`, {
          metadata: { title: body.title, category: body.category }
        })

        const { data, error } = await supabase
          .from('resources')
          .insert([body])
          .select()

        if (error) throw error

        await logger.audit('CREATE', 'resource', data[0].id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: { title: body.title, category: body.category },
          description: `Created resource: ${body.title}`
        })

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(data[0])
        }
      }

      case 'PUT': {
        const body = JSON.parse(event.body || '{}')
        const { id, ...updateData } = body

        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID is required for update' })
          }
        }

        logger.info('crud', 'update_resource', `Updating resource ${id}`, {
          metadata: { id, updates: Object.keys(updateData) }
        })

        const { data, error } = await supabase
          .from('resources')
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()

        if (error) throw error

        await logger.audit('UPDATE', 'resource', id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: updateData,
          description: `Updated resource ${id}`
        })

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data[0])
        }
      }

      case 'DELETE': {
        const { id } = event.queryStringParameters || {}

        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID is required for deletion' })
          }
        }

        logger.info('crud', 'delete_resource', `Deleting resource ${id}`, { metadata: { id } })

        const { error } = await supabase
          .from('resources')
          .delete()
          .eq('id', id)

        if (error) throw error

        await logger.audit('DELETE', 'resource', id, {
          actorId: 'system',
          actorEmail: 'system',
          description: `Deleted resource ${id}`
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
    logger.error('crud', 'resources_api_error', 'Resources API error', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}