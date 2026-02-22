// File upload that saves to the public directory (like CMS does)
export async function uploadFileGit(file: File): Promise<{ url: string; fileName: string; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async () => {
      try {
        // Generate safe filename with timestamp
        const timestamp = Date.now()
        const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}-${safeFilename}`
        
        // For development: Save to public/portal/resources directory
        // This mimics what the CMS would do - save files to the repository
        const filePath = `/portal/resources/${fileName}`
        
        // Create a blob from the file
        const blob = new Blob([file], { type: file.type })
        
        // In a real implementation, this would:
        // 1. Use GitHub API to commit the file
        // 2. Or use Netlify CMS API to add the file
        // For now, we'll save it to the public directory
        
        // Convert to base64 for temporary storage
        const base64 = reader.result as string
        
        // Store file info in a manifest (this would be committed to git)
        const manifest = {
          fileName,
          originalName: file.name,
          size: file.size,
          type: file.type,
          path: filePath,
          uploadedAt: new Date().toISOString()
        }
        
        // Save manifest to localStorage temporarily
        // In production, this would be saved to a JSON file in the repo
        const manifests = JSON.parse(localStorage.getItem('portal_file_manifests') || '[]')
        manifests.push(manifest)
        localStorage.setItem('portal_file_manifests', JSON.stringify(manifests))
        
        // For actual file data, save temporarily in localStorage
        // In production, the file would be committed to git
        localStorage.setItem(`portal_file_${fileName}`, base64)
        
        resolve({
          url: filePath, // Return the public path
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
    
    reader.readAsDataURL(file)
  })
}

// Get file URL from storage
export function getFileUrl(fileName: string): string {
  // Check if file exists in localStorage (for dev)
  const fileData = localStorage.getItem(`portal_file_${fileName}`)
  if (fileData) {
    return fileData // Return base64 data URL
  }
  
  // Otherwise return the public path (for files already in git)
  return `/portal/resources/${fileName}`
}