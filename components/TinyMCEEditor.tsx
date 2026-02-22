'use client'

import { Editor } from '@tinymce/tinymce-react'
import { useRef, useState, useEffect } from 'react'

interface TinyMCEEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number
  placeholder?: string
  readOnly?: boolean
}

export function TinyMCEEditor({
  value,
  onChange,
  height = 300,
  placeholder = 'Start typing here...',
  readOnly = false
}: TinyMCEEditorProps) {
  const editorRef = useRef<any>(null)
  const [isDark, setIsDark] = useState(false)
  const [editorKey, setEditorKey] = useState(0)

  // Detect dark mode by checking for .dark class anywhere in parent hierarchy
  useEffect(() => {
    const checkDarkMode = () => {
      // Check if any parent element has the 'dark' class (ThemeProvider uses a wrapper div)
      const isDarkMode = !!document.querySelector('.dark')
      return isDarkMode
    }

    const updateDarkMode = () => {
      const nowDark = checkDarkMode()
      setIsDark(prevDark => {
        if (prevDark !== nowDark) {
          // Force editor to re-render with new theme
          setEditorKey(prev => prev + 1)
          return nowDark
        }
        return prevDark
      })
    }

    // Initial check
    updateDarkMode()

    // Watch for theme changes on the entire document
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          updateDarkMode()
          break
        }
      }
    })

    // Observe the entire document body subtree for class changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    })

    return () => observer.disconnect()
  }, [])

  // Content styles for light and dark modes
  const lightContentStyle = `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #374151;
      background-color: #ffffff;
    }
    h1 { color: #60a5fa; font-size: 2.5rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 1rem; }
    h2 { color: #60a5fa; font-size: 1.875rem; font-weight: bold; margin-top: 1.25rem; margin-bottom: 0.875rem; }
    h3 { color: #60a5fa; font-size: 1.5rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.75rem; }
    h4 { color: #60a5fa; font-size: 1.25rem; font-weight: 600; margin-top: 0.875rem; margin-bottom: 0.625rem; }
    p { margin-bottom: 1rem; }
    a { color: #F97316; text-decoration: underline; }
    a:hover { color: #60a5fa; }
    strong { color: #60a5fa; font-weight: 600; }
    table { border-collapse: collapse; width: 100%; margin: 1.5rem 0; }
    th { background-color: #003DA5; color: white; font-weight: 600; padding: 0.75rem; text-align: left; }
    td { border: 1px solid #E5E7EB; padding: 0.75rem; }
    blockquote { border-left: 4px solid #F97316; background-color: #FFF7ED; padding: 1rem 1.5rem; margin: 1.5rem 0; font-style: italic; }
    ul, ol { margin: 1rem 0; padding-left: 2rem; }
    li { margin: 0.5rem 0; }
    img { max-width: 100%; height: auto; }
  `

  const darkContentStyle = `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #e5e7eb;
      background-color: #1f2937;
    }
    .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before {
      color: #9ca3af;
    }
    h1 { color: #60a5fa; font-size: 2.5rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 1rem; }
    h2 { color: #60a5fa; font-size: 1.875rem; font-weight: bold; margin-top: 1.25rem; margin-bottom: 0.875rem; }
    h3 { color: #60a5fa; font-size: 1.5rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.75rem; }
    h4 { color: #60a5fa; font-size: 1.25rem; font-weight: 600; margin-top: 0.875rem; margin-bottom: 0.625rem; }
    p { margin-bottom: 1rem; }
    a { color: #fb923c; text-decoration: underline; }
    a:hover { color: #60a5fa; }
    strong { color: #60a5fa; font-weight: 600; }
    table { border-collapse: collapse; width: 100%; margin: 1.5rem 0; }
    th { background-color: #1e40af; color: white; font-weight: 600; padding: 0.75rem; text-align: left; }
    td { border: 1px solid #4b5563; padding: 0.75rem; }
    blockquote { border-left: 4px solid #fb923c; background-color: #7c2d1233; padding: 1rem 1.5rem; margin: 1.5rem 0; font-style: italic; color: #d1d5db; }
    ul, ol { margin: 1rem 0; padding-left: 2rem; }
    li { margin: 0.5rem 0; }
    img { max-width: 100%; height: auto; }
  `

  return (
    <div className="tinymce-wrapper rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
      <Editor
        key={editorKey}
        apiKey="3qrvs2mrxhabanj8u4ub1lllalhogawo5kje2l6w6asoz3xu"
      onInit={(_evt, editor) => editorRef.current = editor}
      value={value}
      onEditorChange={onChange}
      disabled={readOnly}
      init={{
        menubar: true,
        skin: isDark ? 'oxide-dark' : 'oxide',
        content_css: isDark ? 'dark' : 'default',
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'autoresize'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | image link | table | code | help',
        // Mobile-specific configuration
        mobile: {
          menubar: false,
          plugins: ['autolink', 'lists', 'link', 'image', 'autoresize'],
          toolbar: 'undo redo | bold italic | bullist numlist | link image',
          toolbar_mode: 'scrolling',
        },
        content_style: isDark ? darkContentStyle : lightContentStyle,
        placeholder: placeholder,
        branding: false,
        promotion: false,
        toolbar_mode: 'sliding',
        statusbar: true,
        elementpath: false,
        resize: false,
        min_height: 200,
        max_height: 1500,
        autoresize_bottom_margin: 16,
        onboarding: false,
        // Image upload handling - upload to Supabase for email compatibility
        images_upload_handler: async (blobInfo, progress) => {
          const API_BASE = process.env.NODE_ENV === 'production'
            ? '/.netlify/functions'
            : 'http://localhost:9000/.netlify/functions'

          const formData = new FormData()
          formData.append('file', blobInfo.blob(), blobInfo.filename())
          formData.append('path', 'email-images')

          try {
            const response = await fetch(`${API_BASE}/upload-file`, {
              method: 'POST',
              body: formData
            })

            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.error || 'Upload failed')
            }

            const data = await response.json()
            return data.publicUrl || data.url
          } catch (error) {
            console.error('Image upload failed:', error)
            throw error
          }
        },
        // Enable automatic uploads so pasted/dropped images get uploaded
        automatic_uploads: true,
        // Cache images in browser
        images_reuse_filename: true,
        // Prevent image proxy
        images_file_types: 'jpg,jpeg,png,gif,svg,webp',
        // Image resizing - drag handles in editor
        image_advtab: true,
        image_caption: true,
        object_resizing: true,
        resize_img_proportional: true,
        // Color picker with brand colors
        color_map: [
          '#003DA5', 'Blue',
          '#F97316', 'Orange',
          '#000000', 'Black',
          '#374151', 'Gray',
          '#FFFFFF', 'White',
          '#EF4444', 'Red',
          '#10B981', 'Green',
          '#3B82F6', 'Blue',
        ],
        height: height,
        // URL handling - IMPORTANT: Keep URLs absolute for email compatibility
        relative_urls: false,
        remove_script_host: false,
        convert_urls: false,
      }}
      />
    </div>
  )
}

interface HTMLViewerProps {
  content: string
  className?: string
  compact?: boolean
}

export function HTMLViewer({ content, className = '', compact = false }: HTMLViewerProps) {
  return (
    <div
      className={`${compact ? 'tinymce-content-compact' : 'tinymce-content'} ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
