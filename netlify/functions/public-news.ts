import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TABLE_NAME = 'public_news'

export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('public-news', event)

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
        const { slug } = event.queryStringParameters || {}

        // Get single item by slug
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
              body: JSON.stringify({ error: 'News article not found' })
            }
          }

          return { statusCode: 200, headers, body: JSON.stringify(data) }
        }

        // Get all items
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .order('priority', { ascending: false })
          .order('published_date', { ascending: false })

        if (error) throw error
        return { statusCode: 200, headers, body: JSON.stringify(data) }
      }

      case 'POST': {
        const body = JSON.parse(event.body || '{}')
        logger.info('crud', 'create_public_news', `Creating news article: ${body.title || 'untitled'}`, {
          metadata: { title: body.title, slug: body.slug, author: body.author }
        })

        // Validate required fields
        if (!body.title || !body.slug || !body.published_date || !body.author || !body.excerpt || !body.body) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: 'Missing required fields: title, slug, published_date, author, excerpt, body'
            })
          }
        }

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert([body])
          .select()
          .single()

        if (error) throw error

        await logger.audit('CREATE', 'news', data.id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: { title: body.title, slug: body.slug },
          description: `Created news article: ${body.title}`
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

        logger.info('crud', 'update_public_news', `Updating news article ${id}`, {
          metadata: { id, updates: Object.keys(updates) }
        })

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        await logger.audit('UPDATE', 'news', id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: updates,
          description: `Updated news article ${id}`
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

        logger.info('crud', 'delete_public_news', `Deleting news article ${id}`, { metadata: { id } })

        const { error } = await supabase
          .from(TABLE_NAME)
          .delete()
          .eq('id', id)

        if (error) throw error

        await logger.audit('DELETE', 'news', id, {
          actorId: 'system',
          actorEmail: 'system',
          description: `Deleted news article ${id}`
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
    logger.error('crud', 'public_news_api_error', 'Public news API error', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  }
}
