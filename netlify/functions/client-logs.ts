import { Handler } from '@netlify/functions'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface ClientLogEntry {
  level: 'ERROR' | 'WARN' | 'INFO'
  category: string
  action: string
  message: string
  metadata?: Record<string, unknown>
  errorStack?: string
  userId?: string
  userEmail?: string
  url?: string
  timestamp?: string
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    // Parse the request body
    const body = JSON.parse(event.body || '{}')
    const logs: ClientLogEntry[] = body.logs

    // Validate input
    if (!Array.isArray(logs) || logs.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No logs provided' }),
      }
    }

    // Limit batch size to prevent abuse
    if (logs.length > 100) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Too many logs in batch (max 100)' }),
      }
    }

    // Extract request context
    const ipAddress = event.headers['x-forwarded-for']?.split(',')[0]?.trim()
    const userAgent = event.headers['user-agent']

    // Transform logs for database insertion
    const rows = logs.map((log) => ({
      level: log.level,
      source: 'client',
      category: log.category,
      function_name: null,
      action: log.action,
      message: log.message,
      user_id: log.userId || null,
      user_email: log.userEmail || null,
      metadata: {
        ...(log.metadata || {}),
        url: log.url,
        client_timestamp: log.timestamp,
      },
      error_name: log.errorStack ? 'ClientError' : null,
      error_message: log.level === 'ERROR' ? log.message : null,
      error_stack: log.errorStack || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    }))

    // Insert logs into Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/app_logs`, {
      method: 'POST',
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(rows),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to insert client logs:', errorText)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to store logs' }),
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: logs.length }),
    }
  } catch (error) {
    console.error('Client logs error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}
