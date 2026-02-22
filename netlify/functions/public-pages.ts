import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TABLE_NAME = 'public_pages'

export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('public-pages', event)

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
        const { page_name } = event.queryStringParameters || {}

        if (page_name) {
          const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('page_name', page_name)
            .eq('active', true)
            .single()

          if (error) throw error

          if (!data) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Page not found' })
            }
          }

          return { statusCode: 200, headers, body: JSON.stringify(data) }
        }

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .order('page_name', { ascending: true })

        if (error) throw error
        return { statusCode: 200, headers, body: JSON.stringify(data) }
      }

      case 'POST': {
        const body = JSON.parse(event.body || '{}')
        logger.info('crud', 'create_public_page', `Creating page: ${body.page_name || 'unnamed'}`, {
          metadata: { page_name: body.page_name, title: body.title }
        })

        if (!body.page_name || !body.title || !body.content) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: 'Missing required fields: page_name, title, content'
            })
          }
        }

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert([body])
          .select()
          .single()

        if (error) throw error

        await logger.audit('CREATE', 'page', data.id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: { page_name: body.page_name, title: body.title },
          description: `Created page: ${body.page_name}`
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

        logger.info('crud', 'update_public_page', `Updating page ${id}`, {
          metadata: { id, updates: Object.keys(updates) }
        })

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        await logger.audit('UPDATE', 'page', id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: updates,
          description: `Updated page ${id}`
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

        logger.info('crud', 'delete_public_page', `Deleting page ${id}`, { metadata: { id } })

        const { error } = await supabase
          .from(TABLE_NAME)
          .delete()
          .eq('id', id)

        if (error) throw error

        await logger.audit('DELETE', 'page', id, {
          actorId: 'system',
          actorEmail: 'system',
          description: `Deleted page ${id}`
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
    logger.error('crud', 'public_pages_api_error', 'Public pages API error', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  }
}
