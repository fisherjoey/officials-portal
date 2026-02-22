import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TABLE_NAME = 'public_resources'

export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('public-resources', event)

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
        const { slug, category } = event.queryStringParameters || {}

        if (slug) {
          const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('slug', slug)
            .single()

          if (error) throw error

          if (!data) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Resource not found' })
            }
          }

          return { statusCode: 200, headers, body: JSON.stringify(data) }
        }

        let query = supabase
          .from(TABLE_NAME)
          .select('*')
          .order('priority', { ascending: false })
          .order('last_updated', { ascending: false })

        if (category) {
          query = query.eq('category', category)
        }

        const { data, error } = await query

        if (error) throw error
        return { statusCode: 200, headers, body: JSON.stringify(data) }
      }

      case 'POST': {
        const body = JSON.parse(event.body || '{}')
        logger.info('crud', 'create_public_resource', `Creating resource: ${body.title || 'untitled'}`, {
          metadata: { title: body.title, category: body.category }
        })

        if (!body.title || !body.slug || !body.category || !body.description || !body.last_updated) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: 'Missing required fields: title, slug, category, description, last_updated'
            })
          }
        }

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert([body])
          .select()
          .single()

        if (error) throw error

        await logger.audit('CREATE', 'public_resource', data.id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: { title: body.title, category: body.category },
          description: `Created public resource: ${body.title}`
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

        logger.info('crud', 'update_public_resource', `Updating resource ${id}`, {
          metadata: { id, updates: Object.keys(updates) }
        })

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        await logger.audit('UPDATE', 'public_resource', id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: updates,
          description: `Updated public resource ${id}`
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

        logger.info('crud', 'delete_public_resource', `Deleting resource ${id}`, { metadata: { id } })

        const { error } = await supabase
          .from(TABLE_NAME)
          .delete()
          .eq('id', id)

        if (error) throw error

        await logger.audit('DELETE', 'public_resource', id, {
          actorId: 'system',
          actorEmail: 'system',
          description: `Deleted public resource ${id}`
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
    logger.error('crud', 'public_resources_api_error', 'Public resources API error', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  }
}
