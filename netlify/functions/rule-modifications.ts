import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('rule-modifications', event)

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
          .from('rule_modifications')
          .select('*')
          .eq('active', true)
          .order('priority', { ascending: false })

        if (error) throw error

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        }
      }

      case 'POST': {
        const body = JSON.parse(event.body || '{}')
        logger.info('crud', 'create_rule_modification', `Creating rule modification: ${body.title || 'untitled'}`, {
          metadata: { title: body.title, league: body.league }
        })

        const { data, error} = await supabase
          .from('rule_modifications')
          .insert([body])
          .select()
          .single()

        if (error) throw error

        await logger.audit('CREATE', 'rule_modification', data.id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: { title: body.title, league: body.league },
          description: `Created rule modification: ${body.title}`
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

        logger.info('crud', 'update_rule_modification', `Updating rule modification ${id}`, {
          metadata: { id, updates: Object.keys(updates) }
        })

        const { data, error } = await supabase
          .from('rule_modifications')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        await logger.audit('UPDATE', 'rule_modification', id, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: updates,
          description: `Updated rule modification ${id}`
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

        logger.info('crud', 'delete_rule_modification', `Deleting rule modification ${id}`, { metadata: { id } })

        const { error } = await supabase
          .from('rule_modifications')
          .delete()
          .eq('id', id)

        if (error) throw error

        await logger.audit('DELETE', 'rule_modification', id, {
          actorId: 'system',
          actorEmail: 'system',
          description: `Deleted rule modification ${id}`
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
    logger.error('crud', 'rule_modifications_api_error', 'Rule modifications API error', error instanceof Error ? error : new Error(String(error)))
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  }
}
