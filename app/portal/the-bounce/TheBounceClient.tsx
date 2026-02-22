'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { newslettersAPI } from '@/lib/api'
import { uploadFile } from '@/lib/fileUpload'
import { useRole } from '@/contexts/RoleContext'
import { useToast } from '@/hooks/useToast'
import { validateNewsletterForm, getFieldError, hasErrors, formatValidationErrors } from '@/lib/portalValidation'
import { parseAPIError, sanitize, ValidationError } from '@/lib/errorHandling'
import FileUpload from '@/components/FileUpload'
import PortalFilterBar from '@/components/portal/PortalFilterBar'
import { orgConfig } from '@/config/organization'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconDownload,
  IconEye,
  IconFile,
  IconNotebook,
  IconDeviceFloppy,
  IconX,
  IconSortAscending,
  IconSortDescending,
  IconLayoutList,
  IconLayoutGrid,
  IconCalendar
} from '@tabler/icons-react'

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => <div className="text-center py-8">Loading PDF viewer...</div>
})

interface Newsletter {
  id: string
  title: string
  date: string
  pdfFile: string
  description?: string
  uploadedAt: string
}

interface TheBounceClientProps {
  newsletters: any[]
}

export default function TheBounceClient({ newsletters: initialNewsletters }: TheBounceClientProps) {
  const { user } = useRole()
  const { success, error } = useToast()
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Partial<Newsletter> | null>(null)
  const [newNewsletter, setNewNewsletter] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [sortBy, setSortBy] = useState<'title' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const canEdit = user.role === 'admin' || user.role === 'executive'

  // Load newsletters from API
  useEffect(() => {
    loadNewsletters()
  }, [])

  const loadNewsletters = async () => {
    try {
      const data = await newslettersAPI.getAll()
      const mapped = data.map((n: any) => ({
        id: n.id,
        title: n.title,
        date: n.date,
        description: n.description || '',
        pdfFile: n.file_url,
        uploadedAt: n.created_at
      }))
      setNewsletters(mapped)
    } catch (err) {
      error(parseAPIError(err))
    } finally {
      setIsLoading(false)
    }
  }

  // Get the latest newsletter by date
  const latestNewsletter = newsletters.length > 0
    ? newsletters.reduce((latest, current) =>
        new Date(current.date) > new Date(latest.date) ? current : latest
      )
    : null

  // Filter and sort newsletters
  const filteredNewsletters = newsletters
    .filter(newsletter =>
      searchTerm === '' ||
      newsletter.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      newsletter.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleView = (newsletter: Newsletter) => {
    setSelectedNewsletter(newsletter)
  }

  const handleDownload = (newsletter: Newsletter) => {
    if (newsletter.pdfFile) {
      const link = document.createElement('a')
      link.href = newsletter.pdfFile
      link.download = `${newsletter.title}.pdf`
      link.click()
    }
  }

  const handleCreate = async () => {
    if (!selectedFile) {
      error('Please select a PDF file')
      return
    }

    if (selectedFile.type !== 'application/pdf') {
      error('Please select a PDF file')
      return
    }

    const sanitizedTitle = sanitize.text(newNewsletter.title)
    const sanitizedDescription = sanitize.text(newNewsletter.description)

    const dateObj = new Date(newNewsletter.date)
    const month = dateObj.toLocaleDateString('en-CA', { month: 'long' })
    const year = dateObj.getFullYear()

    const formData = {
      title: sanitizedTitle || `${orgConfig.labels.newsletter} - ${month} ${year}`,
      month: month,
      year: year,
      description: sanitizedDescription,
      file: selectedFile
    }

    const errors = validateNewsletterForm(formData)
    if (hasErrors(errors)) {
      setValidationErrors(errors)
      error(formatValidationErrors(errors))
      return
    }

    setValidationErrors([])

    try {
      setIsUploading(true)
      const uploadResult = await uploadFile(selectedFile, '/newsletter/')

      const apiData = {
        title: formData.title,
        date: newNewsletter.date,
        description: formData.description,
        file_name: selectedFile.name,
        file_url: uploadResult.url,
        file_size: uploadResult.size,
        is_featured: false
      }

      const created = await newslettersAPI.create(apiData)

      const newItem: Newsletter = {
        id: created.id,
        title: created.title,
        date: created.date,
        description: created.description || '',
        pdfFile: created.file_url,
        uploadedAt: created.created_at
      }

      setNewsletters([newItem, ...newsletters])
      setNewNewsletter({
        title: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      })
      setSelectedFile(null)
      setValidationErrors([])
      setIsCreating(false)
      success('Newsletter uploaded successfully!')
    } catch (err) {
      error(`Failed to upload newsletter: ${parseAPIError(err)}`)
    } finally {
      setIsUploading(false)
    }
  }

  const startEditing = (newsletter: Newsletter) => {
    setEditingId(newsletter.id)
    setEditingData({
      title: newsletter.title,
      date: newsletter.date,
      description: newsletter.description || ''
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingData(null)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editingData) return

    try {
      const sanitizedUpdates = {
        id: editingId,
        title: sanitize.text(editingData.title || ''),
        date: editingData.date,
        description: sanitize.text(editingData.description || '')
      }

      const updated = await newslettersAPI.update(sanitizedUpdates)
      const updatedNewsletters = newsletters.map(n =>
        n.id === editingId ? { ...n, ...editingData } : n
      )
      setNewsletters(updatedNewsletters)
      success('Newsletter updated successfully.')
      cancelEditing()
    } catch (err) {
      error(parseAPIError(err))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return

    try {
      await newslettersAPI.delete(id)
      setNewsletters(newsletters.filter(n => n.id !== id))
      success('Newsletter deleted successfully!')
    } catch (err) {
      error(`Failed to delete newsletter: ${parseAPIError(err)}`)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Edmonton'
      })
    } catch {
      return dateString
    }
  }

  // Render a single newsletter (list or grid view)
  const renderNewsletter = (newsletter: Newsletter) => {
    // Check if editing this newsletter
    if (editingId === newsletter.id && editingData) {
      return (
        <div key={newsletter.id} className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border p-4 col-span-full">
          <div className="space-y-3">
            <input
              type="text"
              value={editingData.title || ''}
              onChange={(e) => setEditingData({ ...editingData, title: e.target.value })}
              className="w-full font-semibold px-3 py-2 border border-gray-200 dark:border-portal-border bg-white dark:bg-portal-surface text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Newsletter title..."
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={editingData.date || ''}
                onChange={(e) => setEditingData({ ...editingData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-portal-border bg-white dark:bg-portal-surface text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={editingData.description || ''}
                onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-portal-border bg-white dark:bg-portal-surface text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={2}
                placeholder="Newsletter description..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
              >
                <IconDeviceFloppy className="h-4 w-4" />
                Save Changes
              </button>
              <button
                onClick={cancelEditing}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500 flex items-center gap-1"
              >
                <IconX className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Grid view card
    if (viewMode === 'grid') {
      return (
        <div
          key={newsletter.id}
          className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border hover:shadow-md transition-shadow p-4 flex flex-col cursor-pointer"
          onClick={() => handleView(newsletter)}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange-100 dark:bg-orange-900/30">
              <IconNotebook className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{newsletter.title}</h3>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatDate(newsletter.date)}
              </div>
            </div>
          </div>
          <div className="mt-auto flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-portal-border" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleView(newsletter)}
              className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
              title="View"
            >
              <IconEye className="h-4 w-4" />
            </button>
            <a
              href={newsletter.pdfFile}
              download
              className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
              title="Download"
            >
              <IconDownload className="h-4 w-4" />
            </a>
            {canEdit && (
              <>
                <button
                  onClick={() => startEditing(newsletter)}
                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-portal-hover rounded ml-auto transition-colors"
                  title="Edit"
                >
                  <IconEdit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(newsletter.id)}
                  className="p-1.5 text-red-500 dark:text-red-400/70 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Delete"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )
    }

    // List view row
    return (
      <div key={newsletter.id} className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleView(newsletter)}>
        {/* Mobile card layout */}
        <div className="sm:hidden p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange-100 dark:bg-orange-900/30">
              <IconNotebook className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{newsletter.title}</h3>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(newsletter.date)}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-portal-border" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleView(newsletter)}
              className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
              title="View"
            >
              <IconEye className="h-4 w-4" />
            </button>
            <a
              href={newsletter.pdfFile}
              download
              className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
              title="Download"
            >
              <IconDownload className="h-4 w-4" />
            </a>
            {canEdit && (
              <>
                <button
                  onClick={() => startEditing(newsletter)}
                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-portal-hover rounded ml-auto transition-colors"
                  title="Edit"
                >
                  <IconEdit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(newsletter.id)}
                  className="p-1.5 text-red-500 dark:text-red-400/70 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Delete"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Desktop row layout */}
        <div className="hidden sm:block">
          <div className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange-100 dark:bg-orange-900/30">
              <IconNotebook className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white break-words">{newsletter.title}</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{formatDate(newsletter.date)}</span>
                {newsletter.description && (
                  <span className="text-gray-400 dark:text-gray-500">•</span>
                )}
                {newsletter.description && (
                  <span className="line-clamp-1">{newsletter.description}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleView(newsletter)}
                className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                title="View"
              >
                <IconEye className="h-5 w-5" />
              </button>
              <a
                href={newsletter.pdfFile}
                download
                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                title="Download"
              >
                <IconDownload className="h-5 w-5" />
              </a>
              {canEdit && (
                <>
                  <button
                    onClick={() => startEditing(newsletter)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-portal-hover rounded transition-colors"
                    title="Edit"
                  >
                    <IconEdit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(newsletter.id)}
                    className="p-2 text-red-500 dark:text-red-400/70 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Delete"
                  >
                    <IconTrash className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 sm:p-6 portal-animate">
      {/* Header */}
      {/* TODO: Customize newsletter name in config/organization.ts under labels.newsletter */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-gray-900 dark:text-white">{orgConfig.labels.newsletter}</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Your monthly source for news and updates
          </p>
        </div>
        {canEdit && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-orange-500 text-white px-3 py-2 sm:px-4 rounded-xl hover:bg-orange-600 flex items-center gap-2 text-sm sm:text-base"
          >
            <IconPlus className="h-5 w-5" />
            Upload Newsletter
          </button>
        )}
      </div>

      {/* Create New Newsletter Form */}
      {isCreating && (
        <div className="mb-6 bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">Upload New Newsletter</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={newNewsletter.title}
                onChange={(e) => setNewNewsletter({ ...newNewsletter, title: e.target.value })}
                placeholder={`e.g., ${orgConfig.labels.newsletter} - January 2025`}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-portal-hover text-gray-900 dark:text-white ${
                  getFieldError(validationErrors, 'title')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-portal-border focus:ring-orange-500'
                }`}
              />
              {getFieldError(validationErrors, 'title') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError(validationErrors, 'title')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={newNewsletter.date}
                onChange={(e) => setNewNewsletter({ ...newNewsletter, date: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-portal-hover text-gray-900 dark:text-white ${
                  getFieldError(validationErrors, 'date')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-portal-border focus:ring-orange-500'
                }`}
              />
              {getFieldError(validationErrors, 'date') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError(validationErrors, 'date')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
              <textarea
                value={newNewsletter.description}
                onChange={(e) => setNewNewsletter({ ...newNewsletter, description: e.target.value })}
                placeholder="Brief description of this issue's content"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-portal-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-portal-hover text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PDF File *</label>
              <FileUpload
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
                accept=".pdf"
                maxSize={10}
                buttonText="Choose PDF File"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCreate}
                disabled={!selectedFile || isUploading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <IconDeviceFloppy className="h-5 w-5" />
                    Save Newsletter
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setSelectedFile(null)
                  setValidationErrors([])
                  setNewNewsletter({
                    title: '',
                    date: new Date().toISOString().split('T')[0],
                    description: ''
                  })
                }}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 flex items-center justify-center gap-2"
              >
                <IconX className="h-5 w-5" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <PortalFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search newsletters..."
        sortOptions={[
          { value: 'date', label: 'Date' },
          { value: 'title', label: 'Title' },
        ]}
        sortValue={sortBy}
        onSortChange={(val) => setSortBy(val as 'title' | 'date')}
        sortDirection={sortOrder}
        onSortDirectionChange={setSortOrder}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Latest Newsletter */}
      {latestNewsletter && (
        <div className="mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">Latest Newsletter</h2>
          <div
            className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            onClick={() => handleView(latestNewsletter)}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange-100 dark:bg-orange-900/40">
                <IconNotebook className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white">{latestNewsletter.title}</h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(latestNewsletter.date)}
                  {latestNewsletter.description && (
                    <span className="hidden sm:inline"> • {latestNewsletter.description}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleView(latestNewsletter)}
                  className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded transition-colors"
                  title="View"
                >
                  <IconEye className="h-5 w-5" />
                </button>
                <a
                  href={latestNewsletter.pdfFile}
                  download
                  className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded transition-colors"
                  title="Download"
                >
                  <IconDownload className="h-5 w-5" />
                </a>
                {canEdit && (
                  <>
                    <button
                      onClick={() => startEditing(latestNewsletter)}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-portal-hover rounded transition-colors"
                      title="Edit"
                    >
                      <IconEdit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(latestNewsletter.id)}
                      className="p-2 text-red-500 dark:text-red-400/70 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Delete"
                    >
                      <IconTrash className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Newsletter List */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          All Newsletters
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
            ({filteredNewsletters.length})
          </span>
        </h2>
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'grid grid-cols-1 gap-3 sm:block sm:space-y-3'
        }>
          {filteredNewsletters.map(newsletter => renderNewsletter(newsletter))}
        </div>
      </div>

      {filteredNewsletters.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-portal-surface rounded-lg">
          <IconNotebook className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No newsletters found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {canEdit
              ? 'Click "Upload Newsletter" to add your first newsletter.'
              : 'Newsletters will appear here once uploaded by administrators.'}
          </p>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {selectedNewsletter && (
        <PDFViewer
          pdfUrl={selectedNewsletter.pdfFile || ''}
          title={selectedNewsletter.title || ''}
          onClose={() => setSelectedNewsletter(null)}
        />
      )}
    </div>
  )
}
