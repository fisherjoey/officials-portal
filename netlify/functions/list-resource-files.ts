import { Handler } from '@netlify/functions'
import * as fs from 'fs'
import * as path from 'path'

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  // Handle CORS preflight
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

  try {
    const resourcesPath = path.join(process.cwd(), 'public', 'portal', 'resources')
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(resourcesPath)) {
      fs.mkdirSync(resourcesPath, { recursive: true })
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(resourcesPath)
    
    // Get file details
    const fileDetails = files
      .filter(file => {
        // Filter out non-document files
        const ext = path.extname(file).toLowerCase()
        return ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'].includes(ext)
      })
      .map(file => {
        const filePath = path.join(resourcesPath, file)
        const stats = fs.statSync(filePath)
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
        
        return {
          name: file,
          url: `/portal/resources/${file}`,
          size: `${sizeInMB} MB`,
          sizeBytes: stats.size,
          modified: stats.mtime,
          created: stats.ctime
        }
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime()) // Sort by most recent
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        files: fileDetails,
        total: fileDetails.length
      })
    }
  } catch (error) {
    console.error('Error listing files:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to list files' })
    }
  }
}