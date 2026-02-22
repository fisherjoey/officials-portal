'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { IconNotebook, IconChevronRight, IconEye, IconDownload } from '@tabler/icons-react'
import { newslettersAPI } from '@/lib/api'

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('@/app/portal/the-bounce/PDFViewer'), {
  ssr: false,
  loading: () => <div className="text-center py-8">Loading PDF viewer...</div>
})

interface Newsletter {
  id: string
  title: string
  date: string
  description?: string
  file_url: string
}

export default function LatestNewsletterWidget() {
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showViewer, setShowViewer] = useState(false)

  useEffect(() => {
    loadLatestNewsletter()
  }, [])

  const loadLatestNewsletter = async () => {
    try {
      const data = await newslettersAPI.getAll()
      if (data.length > 0) {
        // Sort by date and get the latest
        const sorted = data.sort((a: Newsletter, b: Newsletter) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setNewsletter(sorted[0])
      }
    } catch (error) {
      console.error('Failed to load newsletters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-portal-surface dark:to-portal-surface/80 rounded-xl border border-gray-200 dark:border-portal-border p-6 border-l-4 border-l-orange-500">
        <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <IconNotebook className="h-5 w-5 text-orange-600 dark:text-portal-accent" />
          Latest Newsletter
        </h2>
        <div className="animate-pulse">
          <div className="h-4 bg-orange-200 dark:bg-portal-hover rounded w-3/4 mb-2"></div>
          <div className="h-16 bg-orange-200 dark:bg-portal-hover rounded"></div>
        </div>
      </div>
    )
  }

  if (!newsletter) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-portal-surface dark:to-portal-surface/80 rounded-xl border border-gray-200 dark:border-portal-border p-4 sm:p-6 border-l-4 border-l-orange-500">
        <h2 className="font-heading text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <IconNotebook className="h-5 w-5 text-orange-600 dark:text-portal-accent" />
          Latest Newsletter
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <IconNotebook className="h-12 w-12 mx-auto mb-2 text-orange-300 dark:text-orange-600" />
          <p className="text-sm">No newsletters yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-portal-surface dark:to-portal-surface/80 rounded-xl border border-gray-200 dark:border-portal-border p-4 sm:p-6 border-l-4 border-l-orange-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconNotebook className="h-5 w-5 text-orange-600 dark:text-portal-accent" />
          The Bounce Newsletter
        </h2>
        <Link
          href="/portal/the-bounce"
          className="text-sm text-orange-600 dark:text-portal-accent hover:text-orange-700 dark:hover:text-portal-accent font-medium flex items-center gap-1"
        >
          View All
          <IconChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div>
        <div className="mb-2">
          <span className="text-xs text-orange-600 dark:text-portal-accent font-medium">Latest Issue</span>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-base sm:text-lg">
          {newsletter.title}
        </h3>
        {newsletter.description && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
            {newsletter.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
          <span>
            Published: {new Date(newsletter.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowViewer(true)}
            className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <IconEye className="h-4 w-4" />
            Read Now
          </button>
          {newsletter.file_url && (
            <a
              href={newsletter.file_url}
              download
              className="flex-1 border-2 border-orange-600 text-orange-600 dark:text-portal-accent px-4 py-2 rounded-lg hover:bg-orange-600 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <IconDownload className="h-4 w-4" />
              Download PDF
            </a>
          )}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {showViewer && newsletter && (
        <PDFViewer
          pdfUrl={newsletter.file_url}
          title={newsletter.title}
          onClose={() => setShowViewer(false)}
        />
      )}
    </div>
  )
}
