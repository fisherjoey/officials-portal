// Local file storage using localStorage with size management
export async function uploadFileLocal(file: File): Promise<{ url: string; fileName: string; size: number }> {
  // Check file size limit (2MB for localStorage safety)
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is 2MB, your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      try {
        const base64 = reader.result as string
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        
        // Store in localStorage with metadata
        const fileData = {
          fileName,
          originalName: file.name,
          size: file.size,
          type: file.type,
          data: base64,
          uploadedAt: new Date().toISOString()
        }
        
        // Get existing files
        let existingFiles = []
        try {
          existingFiles = JSON.parse(localStorage.getItem('portal_uploaded_files') || '[]')
        } catch {
          existingFiles = []
        }
        
        // Check total storage before adding
        const totalSize = existingFiles.reduce((sum: number, f: any) => 
          sum + (f.data ? f.data.length : 0), 0) + base64.length
        
        // If exceeding 4MB total, remove oldest files
        const MAX_TOTAL_SIZE = 4 * 1024 * 1024 // 4MB total
        while (totalSize > MAX_TOTAL_SIZE && existingFiles.length > 0) {
          existingFiles.shift() // Remove oldest
        }
        
        existingFiles.push(fileData)
        
        // Try to store, if fails, clear and retry
        try {
          localStorage.setItem('portal_uploaded_files', JSON.stringify(existingFiles))
        } catch (e) {
          // Clear old files and try again with just this file
          console.warn('Storage full, clearing old uploads...')
          localStorage.removeItem('portal_uploaded_files')
          localStorage.setItem('portal_uploaded_files', JSON.stringify([fileData]))
        }
        
        resolve({
          url: base64, // Return the base64 data URL directly
          fileName,
          size: file.size
        })
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    // Read file as data URL (base64)
    reader.readAsDataURL(file)
  })
}

// Clear all uploaded files from localStorage
export function clearUploadedFiles() {
  localStorage.removeItem('portal_uploaded_files')
}

// Get storage info
export function getStorageInfo() {
  try {
    const files = JSON.parse(localStorage.getItem('portal_uploaded_files') || '[]')
    const totalSize = files.reduce((sum: number, f: any) => 
      sum + (f.data ? f.data.length : 0), 0)
    return {
      fileCount: files.length,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    }
  } catch {
    return { fileCount: 0, totalSize: 0, totalSizeMB: '0' }
  }
}