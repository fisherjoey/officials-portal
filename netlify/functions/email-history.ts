import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface EmailHistoryQueryParams {
  email_type?: string
  status?: string
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

    const params = event.queryStringParameters as EmailHistoryQueryParams || {}
    const {
      email_type,
      status,
      search,
      startDate,
      endDate,
      page = '1',
      pageSize = '50'
    } = params

    const pageNum = parseInt(page, 10)
    const pageSizeNum = Math.min(parseInt(pageSize, 10), 100) // Max 100 per page
    const offset = (pageNum - 1) * pageSizeNum

    // Build query
    let query = supabase
      .from('email_history')
      .select('*', { count: 'exact' })

    // Apply filters
    if (email_type) {
      query = query.eq('email_type', email_type)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Date range filter
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Text search
    if (search) {
      query = query.or(`subject.ilike.%${search}%,sent_by_email.ilike.%${search}%,recipient_email.ilike.%${search}%`)
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSizeNum - 1)

    const { data, error, count } = await query

    if (error) throw error

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        emails: data,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSizeNum)
        }
      })
    }
  } catch (error) {
    console.error('Email History API error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
