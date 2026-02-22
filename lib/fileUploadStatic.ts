// Simple file storage - saves file references for static files
// In production with CMS, files would be uploaded through Netlify CMS or GitHub

export async function uploadFileStatic(file: File): Promise<{ url: string; fileName: string; size: number }> {
  // Generate safe filename
  const timestamp = Date.now()
  const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `${timestamp}-${safeFilename}`
  
  // The file path where it would be stored in the repository
  const filePath = `/portal/resources/${fileName}`
  
  // For demo purposes, we'll store a reference to the file
  // In production, this would be handled by:
  // 1. Netlify CMS uploading to the media folder
  // 2. GitHub API committing the file
  // 3. Or a proper file upload service
  
  // Store file metadata (this simulates what would be in the CMS)
  const fileMetadata = {
    fileName,
    originalName: file.name,
    size: file.size,
    type: file.type,
    path: filePath,
    uploadedAt: new Date().toISOString()
  }
  
  // Get existing resources from localStorage (simulating CMS data)
  const resources = JSON.parse(localStorage.getItem('portal_resources') || '[]')
  
  // For demo: Convert file to base64 and store temporarily
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      // In production, the file would be saved to: public/portal/resources/
      // For now, we'll store the base64 data with the resource
      fileMetadata['tempData'] = reader.result as string
      
      // Add to resources
      resources.push(fileMetadata)
      localStorage.setItem('portal_resources', JSON.stringify(resources))
      
      resolve({
        url: reader.result as string, // For demo, return base64
        // In production: url: filePath
        fileName,
        size: file.size
      })
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

// Note: In production with Netlify CMS:
// 1. Files would be uploaded to: public/portal/resources/
// 2. The CMS would handle the Git commit
// 3. Files would be served statically from the public folder
// 4. No localStorage would be needed