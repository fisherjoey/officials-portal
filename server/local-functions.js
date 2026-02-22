// Local development server for Netlify Functions
// Run this instead of Netlify Dev when it's not working
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const busboy = require('busboy')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const app = express()
const PORT = 9000

// Middleware
app.use(cors())
app.use(express.json())

// Start server
async function loadFunctions() {
  // Register ts-node to handle TypeScript imports
  require('ts-node').register({
    transpileOnly: true,
    compilerOptions: {
      module: 'commonjs',
      moduleResolution: 'node'
    }
  })

  const { handler: resourcesHandler } = require('../netlify/functions/resources.ts')
  const { handler: calendarEventsHandler } = require('../netlify/functions/calendar-events.ts')
  const { handler: announcementsHandler } = require('../netlify/functions/announcements.ts')
  const { handler: newslettersHandler } = require('../netlify/functions/newsletters.ts')
  const { handler: ruleModificationsHandler } = require('../netlify/functions/rule-modifications.ts')
  const { handler: uploadFileHandler } = require('../netlify/functions/upload-file.ts')
  const { handler: listResourceFilesHandler } = require('../netlify/functions/list-resource-files.ts')
  const { handler: membersHandler } = require('../netlify/functions/members.ts')
  const { handler: memberActivitiesHandler } = require('../netlify/functions/member-activities.ts')

  // Helper to convert Express req to Netlify event
  const createEvent = (req) => ({
    httpMethod: req.method,
    headers: req.headers,
    body: req.body ? JSON.stringify(req.body) : null,
    queryStringParameters: req.query,
    path: req.path,
    isBase64Encoded: false
  })

  const mockContext = {
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'local-function',
    functionVersion: '1',
    invokedFunctionArn: '',
    memoryLimitInMB: '1024',
    awsRequestId: 'local-request',
    logGroupName: '',
    logStreamName: '',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {}
  }

  // Helper to send response
  const sendResponse = (res, response) => {
    if (!response) {
      res.status(500).json({ error: 'No response from handler' })
      return
    }
    res.status(response.statusCode).set(response.headers).send(response.body)
  }

  // Resources endpoint
  app.all('/.netlify/functions/resources', async (req, res) => {
    try {
      const event = createEvent(req)
      const response = await resourcesHandler(event, mockContext)
      sendResponse(res, response)
    } catch (error) {
      console.error('Resources error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Calendar events endpoint
  app.all('/.netlify/functions/calendar-events', async (req, res) => {
    try {
      const event = createEvent(req)
      const response = await calendarEventsHandler(event, mockContext)
      sendResponse(res, response)
    } catch (error) {
      console.error('Calendar events error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Announcements endpoint
  app.all('/.netlify/functions/announcements', async (req, res) => {
    try {
      const event = createEvent(req)
      const response = await announcementsHandler(event, mockContext)
      sendResponse(res, response)
    } catch (error) {
      console.error('Announcements error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Newsletters endpoint
  app.all('/.netlify/functions/newsletters', async (req, res) => {
    try {
      const event = createEvent(req)
      const response = await newslettersHandler(event, mockContext)
      sendResponse(res, response)
    } catch (error) {
      console.error('Newsletters error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Rule Modifications endpoint
  app.all('/.netlify/functions/rule-modifications', async (req, res) => {
    try {
      const event = createEvent(req)
      const response = await ruleModificationsHandler(event, mockContext)
      sendResponse(res, response)
    } catch (error) {
      console.error('Rule Modifications error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Upload file endpoint (special handling for multipart/form-data)
  app.post('/.netlify/functions/upload-file', (req, res) => {
    const { createClient } = require('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const bb = busboy({ headers: req.headers })
    let fileBuffer
    let fileName
    let originalFileName
    let filePath
    let fileSize = 0

    bb.on('file', (name, file, info) => {
      originalFileName = info.filename
      const chunks = []
      file.on('data', (data) => {
        chunks.push(data)
        fileSize += data.length
      })
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks)
        // Generate safe filename with timestamp
        const timestamp = Date.now()
        const safeFilename = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_')
        fileName = `${timestamp}-${safeFilename}`
      })
    })

    bb.on('field', (name, val) => {
      if (name === 'path') filePath = val
    })

    bb.on('finish', async () => {
      try {
        if (!fileBuffer) {
          res.status(400).json({ error: 'No file received' })
          return
        }

        // Determine bucket
        const bucket = filePath && filePath.includes('newsletter')
          ? 'newsletters'
          : filePath && filePath.includes('training')
          ? 'training-materials'
          : 'portal-resources'

        // Determine content type from file extension
        const getContentType = (filename) => {
          const ext = filename.split('.').pop().toLowerCase()
          const types = {
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
          return types[ext] || 'application/octet-stream'
        }

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, fileBuffer, {
            contentType: getContentType(originalFileName),
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error('Supabase upload error:', error)
          res.status(500).json({ error: `Upload failed: ${error.message}` })
          return
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path)

        res.status(200).json({
          success: true,
          fileName,
          url: publicUrl,
          publicUrl,
          size: fileSize,
          bucket,
          path: data.path
        })
      } catch (error) {
        console.error('Upload error:', error)
        res.status(500).json({ error: 'Upload failed' })
      }
    })

    bb.on('error', (error) => {
      console.error('Busboy error:', error)
      res.status(500).json({ error: 'File upload failed' })
    })

    req.pipe(bb)
  })

  // List resource files endpoint
  app.get('/.netlify/functions/list-resource-files', async (req, res) => {
    try {
      const event = createEvent(req)
      const response = await listResourceFilesHandler(event, mockContext)
      sendResponse(res, response)
    } catch (error) {
      console.error('List files error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Members endpoint
  app.all('/.netlify/functions/members', async (req, res) => {
    try {
      const event = createEvent(req)
      const response = await membersHandler(event, mockContext)
      sendResponse(res, response)
    } catch (error) {
      console.error('Members error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Member Activities endpoint
  app.all('/.netlify/functions/member-activities', async (req, res) => {
    try {
      const event = createEvent(req)
      const response = await memberActivitiesHandler(event, mockContext)
      sendResponse(res, response)
    } catch (error) {
      console.error('Member Activities error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Local functions server running' })
  })

  app.listen(PORT, () => {
    console.log(`\n🚀 Local Functions Server running on http://localhost:${PORT}`)
    console.log(`📝 Available endpoints:`)
    console.log(`   - http://localhost:${PORT}/.netlify/functions/resources`)
    console.log(`   - http://localhost:${PORT}/.netlify/functions/calendar-events`)
    console.log(`   - http://localhost:${PORT}/.netlify/functions/announcements`)
    console.log(`   - http://localhost:${PORT}/.netlify/functions/newsletters`)
    console.log(`   - http://localhost:${PORT}/.netlify/functions/rule-modifications`)
    console.log(`   - http://localhost:${PORT}/.netlify/functions/upload-file`)
    console.log(`   - http://localhost:${PORT}/.netlify/functions/list-resource-files`)
    console.log(`   - http://localhost:${PORT}/.netlify/functions/members`)
    console.log(`   - http://localhost:${PORT}/.netlify/functions/member-activities`)
    console.log(`\n✨ Ready for testing!\n`)
  })
}

loadFunctions().catch(console.error)
