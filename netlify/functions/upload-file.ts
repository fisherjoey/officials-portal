import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import busboy from 'busboy'
import { Logger } from '../../lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const handler: Handler = async (event) => {
  const logger = Logger.fromEvent('upload-file', event)

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  return new Promise((resolve) => {
    const bb = busboy({
      headers: {
        'content-type': event.headers['content-type'] || ''
      }
    })

    let fileName = ''
    let filePath = ''
    let fileBuffer: Buffer[] = []
    let fileSize = 0

    let originalFileName = ''
    let detectedMimeType = ''

    bb.on('file', (name, file, info) => {
      const { filename, mimeType } = info
      originalFileName = filename
      detectedMimeType = mimeType
      logger.info('file', 'file_receiving', `Receiving file: ${filename}`, {
        metadata: { filename, mimeType }
      })

      // Generate safe filename with timestamp
      const timestamp = Date.now()
      const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
      fileName = `${timestamp}-${safeFilename}`
      
      file.on('data', (data) => {
        fileBuffer.push(data)
        fileSize += data.length
        
        // Limit file size to 10MB
        if (fileSize > 10 * 1024 * 1024) {
          file.destroy()
          logger.warn('file', 'file_too_large', `File too large: ${originalFileName}`, {
            metadata: { filename: originalFileName, size: fileSize }
          })
          resolve({
            statusCode: 413,
            headers,
            body: JSON.stringify({ error: 'File too large (max 10MB)' })
          })
        }
      })

      file.on('end', () => {
        logger.info('file', 'file_received', `File received: ${fileName}`, {
          metadata: { filename: fileName, size: fileSize }
        })
      })
    })
    
    bb.on('field', (name, val) => {
      if (name === 'path') {
        filePath = val
      }
    })
    
    bb.on('finish', async () => {
      if (!fileBuffer.length) {
        resolve({
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No file received' })
        })
        return
      }

      try {
        // Combine buffer chunks
        const fullBuffer = Buffer.concat(fileBuffer)

        // Determine bucket based on path or default to portal-resources
        const bucket = filePath && filePath.includes('email-images')
          ? 'email-images'
          : filePath && filePath.includes('newsletter')
          ? 'newsletters'
          : filePath && filePath.includes('training')
          ? 'training-materials'
          : 'portal-resources'

        // Determine content type from file extension
        const getContentType = (filename: string) => {
          const ext = filename.split('.').pop()?.toLowerCase()
          const types: Record<string, string> = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          }
          return types[ext || ''] || 'application/octet-stream'
        }

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, fullBuffer, {
            contentType: getContentType(originalFileName),
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          logger.error('file', 'upload_failed', `Upload failed: ${originalFileName}`, new Error(error.message), {
            metadata: { filename: originalFileName, bucket }
          })
          resolve({
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: `Upload failed: ${error.message}` })
          })
          return
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path)

        // Audit log for file upload
        await logger.audit('CREATE', 'file', data.path, {
          actorId: 'system',
          actorEmail: 'system',
          newValues: { filename: fileName, bucket, size: fileSize, path: data.path },
          description: `Uploaded file: ${fileName} to ${bucket}`
        })

        logger.info('file', 'upload_success', `File uploaded: ${fileName}`, {
          metadata: { filename: fileName, bucket, size: fileSize, path: data.path }
        })

        resolve({
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            fileName,
            url: publicUrl,
            publicUrl,
            size: fileSize,
            bucket,
            path: data.path
          })
        })
      } catch (error) {
        logger.error('file', 'upload_error', 'Error uploading file', error instanceof Error ? error : new Error(String(error)), {
          metadata: { filename: originalFileName }
        })
        resolve({
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to upload file' })
        })
      }
    })

    bb.on('error', (error) => {
      logger.error('file', 'busboy_error', 'File parsing error', error instanceof Error ? error : new Error(String(error)))
      resolve({
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'File upload failed' })
      })
    })
    
    // Parse the request
    if (event.body) {
      // If body is base64 encoded (from API Gateway)
      const buffer = event.isBase64Encoded 
        ? Buffer.from(event.body, 'base64')
        : Buffer.from(event.body)
      
      bb.end(buffer)
    } else {
      resolve({
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No body received' })
      })
    }
  })
}