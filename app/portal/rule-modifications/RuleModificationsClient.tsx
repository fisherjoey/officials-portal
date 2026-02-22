'use client'

import { useState, useEffect } from 'react'
import { IconGavel, IconCalendar, IconFilter, IconSearch, IconPlus, IconEdit, IconTrash, IconDeviceFloppy, IconX, IconSortAscending, IconSortDescending } from '@tabler/icons-react'
import PortalFilterBar from '@/components/portal/PortalFilterBar'
import { Accordion, AccordionButton, AccordionPanel, AccordionChevron } from '@/components/ui/Accordion'
import Card from '@/components/ui/Card'
import { ContentItem } from '@/lib/content'
import { useRole } from '@/contexts/RoleContext'
import { TinyMCEEditor, HTMLViewer } from '@/components/TinyMCEEditor'
import { ruleModificationsAPI } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { parseAPIError, sanitize, ValidationError } from '@/lib/errorHandling'
import { getFieldError } from '@/lib/portalValidation'

interface RuleModificationsClientProps {
  modifications: ContentItem[]
  categories: string[]
}

export default function RuleModificationsClient({ modifications: initialModifications, categories: initialCategories }: RuleModificationsClientProps) {
  const { user } = useRole()
  const { success, error, warning, info } = useToast()
  const [modifications, setModifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Derive categories from loaded modifications (API data takes precedence)
  const categories = modifications.length > 0
    ? Array.from(new Set(modifications.map(mod => mod.category))).filter(Boolean).sort() as string[]
    : initialCategories
  const [sortField, setSortField] = useState<'title' | 'date' | 'category'>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<any>(null)
  const [newModification, setNewModification] = useState({
    title: '',
    category: 'Club Tournament',
    summary: '',
    content: ''
  })
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  const canEdit = user.role === 'admin' || user.role === 'executive'

  // Load rule modifications from API
  useEffect(() => {
    loadModifications()
  }, [])

  const loadModifications = async () => {
    try {
      const data = await ruleModificationsAPI.getAll()
      setModifications(data)
    } catch (err) {
      const errorMessage = parseAPIError(err)
      error(`Failed to load rule modifications: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter modifications based on category and search term
  const filteredModifications = modifications.filter(mod => {
    const matchesCategory = selectedCategory === 'all' || mod.category === selectedCategory
    const matchesSearch = searchTerm === '' ||
      mod.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.body?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch && mod.active !== false
  }).sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'title':
        comparison = (a.title || '').localeCompare(b.title || '')
        break
      case 'category': {
        const catCompare = (a.category || '').localeCompare(b.category || '')
        comparison = catCompare !== 0 ? catCompare : (a.title || '').localeCompare(b.title || '')
        break
      }
      case 'date':
        comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        break
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      // Original categories
      'School League': 'bg-blue-100 text-blue-800',
      'School Tournament': 'bg-purple-100 text-purple-800',
      'Club League': 'bg-green-100 text-green-800',
      'Club Tournament': 'bg-orange-100 text-orange-800',
      'Adult': 'bg-yellow-100 text-yellow-800',
      // New categories
      'General': 'bg-gray-100 text-gray-800',
      'High School': 'bg-blue-100 text-blue-800',
      'Junior High': 'bg-indigo-100 text-indigo-800',
      'Elementary': 'bg-cyan-100 text-cyan-800',
      'League': 'bg-green-100 text-green-800',
      'Tournament': 'bg-orange-100 text-orange-800',
      '3x3': 'bg-pink-100 text-pink-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const handleCreate = async () => {
    if (!newModification.title || !newModification.content) {
      error('Please fill in all required fields (title and content)')
      return
    }

    // Sanitize text inputs
    const sanitizedTitle = sanitize.text(newModification.title)
    const sanitizedSummary = sanitize.text(newModification.summary)
    const sanitizedContent = sanitize.html(newModification.content) // HTML from TinyMCE

    try {
      const created = await ruleModificationsAPI.create({
        title: sanitizedTitle,
        category: newModification.category,
        summary: sanitizedSummary,
        content: sanitizedContent,
        active: true
      })
      setModifications([created, ...modifications])
      setNewModification({
        title: '',
        category: categories[0] || 'Club Tournament',
        summary: '',
        content: ''
      })
      setIsCreating(false)
      success('Rule modification created successfully!')
    } catch (err) {
      const errorMessage = parseAPIError(err)
      error(`Failed to create rule modification: ${errorMessage}`)
    }
  }

  const startEditing = (modification: any) => {
    setEditingId(modification.id)
    setEditingData({
      title: modification.title || '',
      category: modification.category || categories[0] || 'Club Tournament',
      summary: modification.summary || '',
      content: modification.content || modification.body || ''
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingData(null)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editingData) return

    // Sanitize text inputs
    const sanitizedUpdates = {
      title: sanitize.text(editingData.title),
      category: editingData.category,
      summary: sanitize.text(editingData.summary),
      content: sanitize.html(editingData.content)
    }

    try {
      const updated = await ruleModificationsAPI.update({ id: editingId, ...sanitizedUpdates })
      setModifications(prev => prev.map(mod =>
        mod.id === editingId ? updated : mod
      ))
      success('Rule modification updated successfully!')
      cancelEditing()
    } catch (err) {
      const errorMessage = parseAPIError(err)
      error(`Failed to update rule modification: ${errorMessage}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this rule modification?')) {
      try {
        await ruleModificationsAPI.delete(id)
        setModifications(prev => prev.filter(mod => mod.id !== id))
        success('Rule modification deleted successfully!')
      } catch (err) {
        const errorMessage = parseAPIError(err)
        error(`Failed to delete rule modification: ${errorMessage}`)
      }
    }
  }

  return (
    <div className="py-5 sm:py-6 portal-animate">

      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-gray-900 dark:text-white">Rule Modifications</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Official rule modifications and clarifications for officials
          </p>
        </div>
        {canEdit && !isCreating && (
          <button
            onClick={() => {
              setIsCreating(true)
              // Pre-select the category based on the current tab
              const category = selectedCategory === 'all' ? (categories[0] || 'Club Tournament') : selectedCategory
              setNewModification({
                title: '',
                category: category,
                summary: '',
                content: ''
              })
            }}
            className="bg-orange-500 text-white px-3 py-2 sm:px-4 rounded-xl hover:bg-orange-600 flex items-center gap-2 text-sm sm:text-base"
          >
            <IconPlus className="h-5 w-5" />
            Add Rule Modification
          </button>
        )}
      </div>

      {/* Search and Category Filter */}
      <PortalFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search rule modifications..."
        sortOptions={[
          { value: 'title', label: 'Title' },
          { value: 'category', label: 'Category' },
          { value: 'date', label: 'Date Added' },
        ]}
        sortValue={sortField}
        onSortChange={(val) => setSortField(val as 'title' | 'date' | 'category')}
        sortDirection={sortDirection}
        onSortDirectionChange={setSortDirection}
        categories={[
          { value: 'all', label: 'All Categories', icon: IconGavel },
          ...categories.map(cat => ({ value: cat, label: cat }))
        ]}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Create New Rule Form */}
      {isCreating && (
        <div className="mb-6 bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">Add New Rule Modification</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={newModification.title}
                  onChange={(e) => setNewModification({...newModification, title: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-portal-surface text-gray-900 dark:text-white ${
                    getFieldError(validationErrors, 'title')
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-portal-border focus:ring-orange-500'
                  }`}
                  placeholder="Rule title..."
                />
                {getFieldError(validationErrors, 'title') && (
                  <p className="mt-1 text-sm text-red-600">
                    {getFieldError(validationErrors, 'title')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                <select
                  value={newModification.category}
                  onChange={(e) => setNewModification({...newModification, category: e.target.value})}
                  className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-portal-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-portal-surface text-gray-900 dark:text-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Summary</label>
              <input
                type="text"
                value={newModification.summary}
                onChange={(e) => setNewModification({...newModification, summary: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-portal-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-portal-surface text-gray-900 dark:text-white"
                placeholder="Brief summary..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content *</label>
              <TinyMCEEditor
                value={newModification.content}
                onChange={(value) => setNewModification({...newModification, content: value || ''})}
              />
              {getFieldError(validationErrors, 'content') && (
                <p className="mt-1 text-sm text-red-600">
                  {getFieldError(validationErrors, 'content')}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCreate}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <IconDeviceFloppy className="h-5 w-5" />
                Save Rule Modification
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewModification({
                    title: '',
                    category: categories[0] || 'Club Tournament',
                    summary: '',
                    content: ''
                  })
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 flex items-center justify-center gap-2"
              >
                <IconX className="h-5 w-5" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Modifications List */}
      {filteredModifications.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedCategory === 'all' ? 'All Rule Modifications' : `${selectedCategory} Rules`}
          </h2>

          {filteredModifications.map((modification) => {
            const isEditing = editingId === modification.id
            const effectiveDate = modification.effectiveDate
              ? new Date(modification.effectiveDate).toLocaleDateString('en-CA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              : null

            if (isEditing && editingData) {
              return (
                <div key={modification.id} className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">Edit Rule Modification</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                          type="text"
                          value={editingData.title}
                          onChange={(e) => setEditingData({ ...editingData, title: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-portal-surface text-gray-900 dark:text-white ${
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <select
                          value={editingData.category}
                          onChange={(e) => setEditingData({ ...editingData, category: e.target.value })}
                          className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-portal-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-portal-surface text-gray-900 dark:text-white"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Summary</label>
                      <input
                        type="text"
                        value={editingData.summary}
                        onChange={(e) => setEditingData({ ...editingData, summary: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-portal-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-portal-surface text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                      <TinyMCEEditor
                        value={editingData.content}
                        onChange={(value) => setEditingData({ ...editingData, content: value || '' })}
                      />
                      {getFieldError(validationErrors, 'content') && (
                        <p className="mt-1 text-sm text-red-600">{getFieldError(validationErrors, 'content')}</p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <IconDeviceFloppy className="h-5 w-5" />
                        Save Changes
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 flex items-center justify-center gap-2"
                      >
                        <IconX className="h-5 w-5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <Accordion key={modification.id}>
                <div className="bg-white dark:bg-portal-surface border border-gray-200 dark:border-portal-border rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                  {/* Accordion Header */}
                  <div className="flex items-center gap-3 py-3 pr-4">
                    <AccordionButton className="flex items-center gap-3 flex-1 min-w-0 pl-3">
                      {({ open }) => (
                        <>
                          <AccordionChevron open={open} className="flex-shrink-0" />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(modification.category)}`}>
                                {modification.category}
                              </span>
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                                {modification.title}
                              </h3>
                              {modification.updated_at && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  Updated: {new Date(modification.updated_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                            {modification.summary && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">
                                {modification.summary}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </AccordionButton>

                    {/* Action buttons */}
                    {canEdit && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEditing(modification)}
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-portal-hover rounded transition-colors"
                          title="Edit"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(modification.id)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded Content */}
                  <AccordionPanel className="border-t border-gray-200 dark:border-portal-border bg-gray-50 dark:bg-portal-surface/50">
                    <div className="py-4 px-5">
                      <HTMLViewer content={modification.content || modification.body || ''} compact />

                      {modification.references && modification.references.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-portal-border">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">References:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {modification.references.map((ref: any, index: number) => (
                              <li key={index} className="text-sm text-gray-600 dark:text-gray-300">
                                {typeof ref === 'string' ? ref : ref.reference}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AccordionPanel>
                </div>
              </Accordion>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border">
          <IconGavel className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No rule modifications found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm
              ? `No rule modifications match "${searchTerm}"`
              : selectedCategory === 'all'
                ? canEdit ? 'Click "Add Rule Modification" to add your first rule.' : 'Rule modifications will appear here once added by administrators.'
                : `No rule modifications found for "${selectedCategory}".`}
          </p>
        </div>
      )}
    </div>
  )
}