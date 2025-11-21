import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { cors } from 'hono/cors'
import * as fs from 'fs/promises'
import * as path from 'path'
import { createWriteStream, existsSync } from 'fs'
import { Readable } from 'stream'

const app = new Hono()

const UPLOAD_DIR = './uploads'
const CHUNK_DIR = './uploads/.chunks'

// Helper function to sanitize guest names for folder names
function sanitizeGuestName(name: string): string {
  // Remove special characters and replace spaces with underscores
  return name.trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
}

// Helper function to get or create guest folder
async function getGuestFolder(guestName: string, sessionId: string): Promise<string> {
  const sanitized = sanitizeGuestName(guestName)
  const folderName = `${sanitized}_${sessionId}`
  
  const folderPath = path.join(UPLOAD_DIR, folderName)
  
  if (!existsSync(folderPath)) {
    await fs.mkdir(folderPath, { recursive: true })
  }
  
  return folderName
}

// Helper function to get unique filename within a folder
async function getUniqueFilename(folderPath: string, filename: string): Promise<string> {
  const ext = path.extname(filename)
  const baseName = path.basename(filename, ext)
  let uniqueName = filename
  let counter = 2
  
  while (existsSync(path.join(folderPath, uniqueName))) {
    uniqueName = `${baseName}_${counter}${ext}`
    counter++
  }
  
  return uniqueName
}

// Ensure upload directories exist
await fs.mkdir(UPLOAD_DIR, { recursive: true })
await fs.mkdir(CHUNK_DIR, { recursive: true })

// Enable CORS for Tus protocol
app.use('/files/*', cors({
  origin: '*',
  allowMethods: ['POST', 'HEAD', 'PATCH', 'OPTIONS', 'DELETE'],
  allowHeaders: ['Upload-Offset', 'Upload-Length', 'Tus-Resumable', 'Upload-Metadata', 'Content-Type'],
  exposeHeaders: ['Upload-Offset', 'Location', 'Upload-Length', 'Tus-Resumable'],
}))

app.use('/files', cors({
  origin: '*',
  allowMethods: ['POST', 'HEAD', 'PATCH', 'OPTIONS', 'DELETE'],
  allowHeaders: ['Upload-Offset', 'Upload-Length', 'Tus-Resumable', 'Upload-Metadata', 'Content-Type'],
  exposeHeaders: ['Upload-Offset', 'Location', 'Upload-Length', 'Tus-Resumable'],
}))

// Tus protocol version
const TUS_RESUMABLE = '1.0.0'

// POST /files - Create a new upload
app.post('/files', async (c) => {
  const uploadLength = c.req.header('Upload-Length')
  const uploadMetadata = c.req.header('Upload-Metadata') || ''
  
  if (!uploadLength) {
    return c.json({ error: 'Upload-Length header required' }, 400)
  }

  // Generate unique file ID
  const fileId = crypto.randomUUID()
  const chunkPath = path.join(CHUNK_DIR, fileId)
  
  // Parse metadata
  const metadata: Record<string, string> = {}
  if (uploadMetadata) {
    uploadMetadata.split(',').forEach(pair => {
      const [key, value] = pair.trim().split(' ')
      if (key && value) {
        metadata[key] = Buffer.from(value, 'base64').toString('utf-8')
      }
    })
  }
  
  // Extract guest name and session ID from metadata
  const guestName = metadata.guestName || metadata.name || 'Unknown_Guest'
  const sessionId = metadata.sessionId || 'default'
  
  // Create metadata file
  await fs.writeFile(`${chunkPath}.json`, JSON.stringify({
    uploadLength: parseInt(uploadLength),
    currentOffset: 0,
    metadata,
    guestName,
    sessionId,
    createdAt: new Date().toISOString()
  }))
  
  // Create empty chunk file
  await fs.writeFile(chunkPath, '')

  return c.body(null, 201, {
    'Location': `/files/${fileId}`,
    'Tus-Resumable': TUS_RESUMABLE,
    'Upload-Offset': '0',
  })
})

// HEAD /files/:id - Get upload offset
app.on('HEAD', '/files/:id', async (c) => {
  const fileId = c.req.param('id')
  const chunkPath = path.join(CHUNK_DIR, fileId)
  const metadataPath = `${chunkPath}.json`

  try {
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'))
    const stats = await fs.stat(chunkPath)

    return c.body(null, 200, {
      'Upload-Offset': stats.size.toString(),
      'Upload-Length': metadata.uploadLength.toString(),
      'Tus-Resumable': TUS_RESUMABLE,
      'Cache-Control': 'no-store',
    })
  } catch (error) {
    return c.json({ error: 'Upload not found' }, 404)
  }
})

// PATCH /files/:id - Upload chunk
app.patch('/files/:id', async (c) => {
  const fileId = c.req.param('id')
  const uploadOffset = parseInt(c.req.header('Upload-Offset') || '0')
  const contentType = c.req.header('Content-Type')
  
  const chunkPath = path.join(CHUNK_DIR, fileId)
  const metadataPath = `${chunkPath}.json`

  try {
    // Load metadata
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'))
    const stats = await fs.stat(chunkPath)

    // Verify offset matches current file size
    if (uploadOffset !== stats.size) {
      return c.json({ error: 'Upload-Offset mismatch' }, 409)
    }

    // Get the request body as array buffer
    const body = await c.req.arrayBuffer()
    const chunk = new Uint8Array(body)
    
    // Append chunk to file
    const file = await fs.open(chunkPath, 'a')
    await file.write(chunk)
    await file.close()

    const newOffset = uploadOffset + chunk.length

    // Check if upload is complete
    if (newOffset === metadata.uploadLength) {
      // Get guest folder (creates if doesn't exist, reuses if exists)
      const guestFolder = await getGuestFolder(metadata.guestName || 'Unknown_Guest', metadata.sessionId || 'default')
      const guestFolderPath = path.join(UPLOAD_DIR, guestFolder)
      
      // Get unique filename within guest folder
      const originalFilename = metadata.metadata.filename || `file-${fileId}`
      const uniqueFilename = await getUniqueFilename(guestFolderPath, originalFilename)
      
      // Move to final location in guest's folder
      const finalPath = path.join(guestFolderPath, uniqueFilename)
      await fs.rename(chunkPath, finalPath)
      await fs.unlink(metadataPath)
      
      console.log(`✅ Upload complete: ${guestFolder}/${uniqueFilename} (${metadata.uploadLength} bytes)`)
    }

    return c.body(null, 204, {
      'Upload-Offset': newOffset.toString(),
      'Tus-Resumable': TUS_RESUMABLE,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ error: 'Upload failed' }, 500)
  }
})

// DELETE /files/:id - Cancel upload
app.delete('/files/:id', async (c) => {
  const fileId = c.req.param('id')
  const chunkPath = path.join(CHUNK_DIR, fileId)
  const metadataPath = `${chunkPath}.json`

  try {
    await fs.unlink(chunkPath)
    await fs.unlink(metadataPath)
    return c.body(null, 204, {
      'Tus-Resumable': TUS_RESUMABLE,
    })
  } catch (error) {
    return c.json({ error: 'Upload not found' }, 404)
  }
})

// Serve static files from public directory
app.use('/*', serveStatic({ root: './public' }))

export default app
