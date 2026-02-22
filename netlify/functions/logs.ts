import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface LogsQueryParams {
  type?: 'app' | 'audit'
  level?: string
  source?: string
  category?: string
  action?: string
  search?: string
  startDate?: string
  endDate?: string
  page?: string
  pageSize?: string
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  // Verify admin authorization
  const authHeader = event.headers.authorization || event.headers.Authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      }
    }

    // Check admin role
    const role = user.app_metadata?.role || user.user_metadata?.role
    if (role !== 'admin' && role !== 'Admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin access required' })
      }
    }

    const params = event.queryStringParameters as LogsQueryParams || {}
    const {
      type = 'app',
      level,
      source,
      category,
      action,
      search,
      startDate,
      endDate,
      page = '1',
      pageSize = '50'
    } = params

    const pageNum = parseInt(page, 10)
    const pageSizeNum = Math.min(parseInt(pageSize, 10), 100) // Max 100 per page
    const offset = (pageNum - 1) * pageSizeNum

    const tableName = type === 'audit' ? 'audit_logs' : 'app_logs'

    // Build query
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' })

    // Apply filters
    if (type === 'app') {
      if (level) query = query.eq('level', level)
      if (source) query = query.eq('source', source)
      if (category) query = query.eq('category', category)
    } else {
      if (action) query = query.eq('action', action)
    }

    // Date range filter
    if (startDate) {
      query = query.gte('timestamp', startDate)
    }
    if (endDate) {
      query = query.lte('timestamp', endDate)
    }

    // Text search
    if (search) {
      if (type === 'app') {
        query = query.or(`message.ilike.%${search}%,function_name.ilike.%${search}%,user_email.ilike.%${search}%`)
      } else {
        query = query.or(`description.ilike.%${search}%,actor_email.ilike.%${search}%,target_user_email.ilike.%${search}%`)
      }
    }

    // Order and paginate
    query = query
      .order('timestamp', { ascending: false })
      .range(offset, offset + pageSizeNum - 1)

    const { data, error, count } = await query

    if (error) throw error

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        logs: data,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSizeNum)
        }
      })
    }
  } catch (error) {
    console.error('Logs API error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
