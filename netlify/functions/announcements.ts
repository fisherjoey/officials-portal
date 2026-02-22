import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('announcements', event)

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
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('date', { ascending: false })

        if (error) throw error

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        }
      }

      case 'POST': {
        const body = JSON.parse(event.body || '{}')

        logger.info('crud', 'create_announcement', `Creating announcement: ${body.title || 'untitled'}`, {
          metadata: { title: body.title, type: body.type }
        })

        const { data, error } = await supabase
          .from('announcements')
          .insert([{
            ...body,
            date: body.date || new Date().toISOString()
          }])
          .select()

        if (error) throw error

        await logger.audit('CREATE', 'announcement', data[0].id, {
          actorId: 'system',
          actorEmail: body.author || 'system',
          newValues: { title: body.title, type: body.type },
          description: `Created announcement: ${body.title}`
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

        logger.info('crud', 'update_announcement', `Updating announcement ${id}`, {
          metadata: { id, updates: Object.keys(updateData) }
        })

        const { data, error } = await supabase
          .from('announcements')
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()

        if (error) throw error

        await logger.audit('UPDATE', 'announcement', id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: updateData,
          description: `Updated announcement ${id}`
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

        logger.info('crud', 'delete_announcement', `Deleting announcement ${id}`, {
          metadata: { id }
        })

        const { error } = await supabase
          .from('announcements')
          .delete()
          .eq('id', id)

        if (error) throw error

        await logger.audit('DELETE', 'announcement', id, {
          actorId: 'system',
          actorEmail: 'system',
          description: `Deleted announcement ${id}`
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
    logger.error('crud', 'announcements_api_error', 'Announcements API error', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}