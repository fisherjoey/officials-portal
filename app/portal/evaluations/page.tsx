'use client'

import { useState, useEffect, useCallback } from 'react'
import { evaluationsAPI, membersAPI, memberActivitiesAPI, type Evaluation } from '@/lib/api'
import { uploadFile } from '@/lib/fileUpload'
import { useRole } from '@/contexts/RoleContext'
import { useMember } from '@/contexts/MemberContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { parseAPIError, sanitize } from '@/lib/errorHandling'
import FileUpload from '@/components/FileUpload'
import Modal from '@/components/ui/Modal'
import {
  IconPlus,
  IconTrash,
  IconDownload,
  IconExternalLink,
  IconFile,
  IconDeviceFloppy,
  IconX,
  IconUser,
  IconCalendar,
  IconSearch,
  IconFileText,
  IconChevronDown,
  IconClipboardCheck
} from '@tabler/icons-react'
import { Accordion, AccordionButton, AccordionPanel } from '@/components/ui/Accordion'

interface Member {
  id: string
  name: string
  email: string
}

interface Activity {
  id: string
  member_id: string
  activity_type: string
  activity_date: string
  notes?: string
}

export default function EvaluationsPage() {
  const { user } = useRole()
  const { member } = useMember()
  const { getAccessToken } = useAuth()
  const { success, error } = useToast()

  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [myEvaluations, setMyEvaluations] = useState<Evaluation[]>([]) // Evaluations created by current user
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my') // For evaluator view

  // Create evaluation modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0])
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Activity linking
  const [memberActivities, setMemberActivities] = useState<Activity[]>([])
  const [selectedActivityId, setSelectedActivityId] = useState<string>('')
  const [loadingActivities, setLoadingActivities] = useState(false)

  // Check role permissions
  const canCreate = user.role === 'admin' || user.role === 'executive' || user.role === 'evaluator'
  const canViewAll = user.role === 'admin' || user.role === 'executive' || user.role === 'evaluator'
  const canDelete = user.role === 'admin' || user.role === 'executive' // Only admin/executive can delete
  const isEvaluator = user.role === 'evaluator' // Show two-section view for evaluators

  // Load evaluations
  const loadEvaluations = useCallback(async () => {
    try {
      setIsLoading(true)
      const token = await getAccessToken()

      if (canViewAll) {
        // Admins, executives, and evaluators see all evaluations
        const allData = await evaluationsAPI.getAll(token)
        setEvaluations(allData)

        // For evaluators, also load their own created evaluations separately
        if (isEvaluator && member?.id) {
          const myData = await evaluationsAPI.getByEvaluatorId(member.id, token)
          setMyEvaluations(myData)
        }
      } else if (member?.id) {
        // Regular officials only see their own evaluations
        const data = await evaluationsAPI.getByMemberId(member.id, token)
        setEvaluations(data)
      } else {
        setEvaluations([])
      }
    } catch (err) {
      error('Failed to load evaluations', parseAPIError(err))
    } finally {
      setIsLoading(false)
    }
  }, [canViewAll, isEvaluator, member?.id, error, getAccessToken])

  // Load members for the dropdown (only for those who can create)
  const loadMembers = useCallback(async () => {
    if (!canCreate) return
    try {
      const data = await membersAPI.getAll()
      setMembers(data)
    } catch (err) {
      console.error('Failed to load members:', err)
    }
  }, [canCreate])

  // Load activities for selected member
  const loadMemberActivities = useCallback(async (memberId: string) => {
    if (!memberId) {
      setMemberActivities([])
      return
    }
    try {
      setLoadingActivities(true)
      const activities = await memberActivitiesAPI.getAll(memberId)
      // Filter to only evaluation-related activities
      setMemberActivities(activities.filter((a: Activity) =>
        a.activity_type === 'evaluation' ||
        a.activity_type === 'game' ||
        a.activity_type === 'special_game'
      ))
    } catch (err) {
      console.error('Failed to load activities:', err)
    } finally {
      setLoadingActivities(false)
    }
  }, [])

  useEffect(() => {
    loadEvaluations()
    loadMembers()
  }, [loadEvaluations, loadMembers])

  // When member selection changes, load their activities
  useEffect(() => {
    if (selectedMemberId) {
      loadMemberActivities(selectedMemberId)
    } else {
      setMemberActivities([])
    }
    setSelectedActivityId('')
  }, [selectedMemberId, loadMemberActivities])

  // Handle creating a new evaluation
  const handleCreate = async () => {
    if (!selectedMemberId) {
      error('Please select a member')
      return
    }
    if (!uploadedFile) {
      error('Please upload a PDF file')
      return
    }

    try {
      setIsUploading(true)
      const token = await getAccessToken()

      // Upload the file
      const uploadResult = await uploadFile(uploadedFile, 'evaluation')

      let activityId = selectedActivityId

      // If no existing activity is selected, create a new evaluation activity
      if (!activityId) {
        const activityNotes = title
          ? `${title}${notes ? ' - ' + notes : ''}`
          : notes || 'Evaluation submitted'

        const newActivity = await memberActivitiesAPI.create({
          member_id: selectedMemberId,
          activity_type: 'evaluation',
          activity_date: evaluationDate,
          notes: activityNotes
        })
        activityId = newActivity.id
      }

      // Create the evaluation record linked to the activity
      const evaluationData: Partial<Evaluation> = {
        member_id: selectedMemberId,
        evaluator_id: member?.id,
        evaluation_date: evaluationDate,
        file_url: uploadResult.url,
        file_name: uploadResult.fileName,
        title: title ? sanitize.text(title) : undefined,
        notes: notes ? sanitize.text(notes) : undefined,
        activity_id: activityId || undefined
      }

      await evaluationsAPI.create(evaluationData, token)
      success('Evaluation created successfully')

      // Reset form and close modal
      setShowCreateModal(false)
      resetForm()
      loadEvaluations()
    } catch (err) {
      error('Failed to create evaluation', parseAPIError(err))
    } finally {
      setIsUploading(false)
    }
  }

  // Handle deleting an evaluation
  const handleDelete = async (evaluation: Evaluation) => {
    if (!confirm('Are you sure you want to delete this evaluation?')) return

    try {
      const token = await getAccessToken()
      await evaluationsAPI.delete(evaluation.id, token, evaluation.member_id, evaluation.evaluator_id)
      success('Evaluation deleted successfully')
      loadEvaluations()
    } catch (err) {
      error('Failed to delete evaluation', parseAPIError(err))
    }
  }

  const resetForm = () => {
    setSelectedMemberId('')
    setEvaluationDate(new Date().toISOString().split('T')[0])
    setTitle('')
    setNotes('')
    setUploadedFile(null)
    setSelectedActivityId('')
    setMemberActivities([])
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Edmonton'
      })
    } catch {
      return dateString
    }
  }

  // Filter evaluations by search term
  const filteredEvaluations = evaluations.filter(evaluation => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      evaluation.member?.name?.toLowerCase().includes(search) ||
      evaluation.member?.email?.toLowerCase().includes(search) ||
      evaluation.title?.toLowerCase().includes(search) ||
      evaluation.notes?.toLowerCase().includes(search) ||
      evaluation.evaluator?.name?.toLowerCase().includes(search)
    )
  })

  // Group evaluations by member (only for admin/evaluator view)
  const groupedEvaluations = canViewAll
    ? filteredEvaluations.reduce((acc, evaluation) => {
        const memberId = evaluation.member_id
        const memberName = evaluation.member?.name || 'Unknown Member'
        const memberEmail = evaluation.member?.email || ''

        if (!acc[memberId]) {
          acc[memberId] = {
            memberName,
            memberEmail,
            evaluations: []
          }
        }
        acc[memberId].evaluations.push(evaluation)
        return acc
      }, {} as Record<string, { memberName: string; memberEmail: string; evaluations: Evaluation[] }>)
    : null

  // Sort grouped members alphabetically
  const sortedMemberIds = groupedEvaluations
    ? Object.keys(groupedEvaluations).sort((a, b) =>
        groupedEvaluations[a].memberName.localeCompare(groupedEvaluations[b].memberName)
      )
    : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading evaluations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 sm:p-6 portal-animate">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-gray-900 dark:text-white">Evaluations</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
            {canViewAll ? 'View and manage official evaluations' : 'View your performance evaluations'}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-500 text-white px-3 py-2 sm:px-4 rounded-xl hover:bg-orange-600 flex items-center gap-2 text-sm sm:text-base"
          >
            <IconPlus className="h-5 w-5" />
            Add Evaluation
          </button>
        )}
      </div>

      {/* Tabs for evaluators */}
      {isEvaluator && (
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-portal-border">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('my')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'my'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <IconClipboardCheck className="h-5 w-5" />
                My Evaluations
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400">
                  {myEvaluations.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'all'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <IconUser className="h-5 w-5" />
                All Member Evaluations
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-900/40 text-blue-400">
                  {evaluations.length}
                </span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Search - only show for all evaluations view or non-evaluators */}
      {canViewAll && evaluations.length > 0 && (!isEvaluator || activeTab === 'all') && (
        <div className="mb-6 bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border p-4">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by member name, email, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-portal-border bg-white dark:bg-portal-surface text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      )}

      {/* Evaluations List */}
      {/* My Evaluations view for evaluators */}
      {isEvaluator && activeTab === 'my' ? (
        myEvaluations.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border">
            <IconClipboardCheck className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No evaluations created yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Click "Add Evaluation" to create your first evaluation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myEvaluations
              .sort((a, b) => new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime())
              .map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border hover:shadow-md transition-shadow p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                      <IconFile className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {evaluation.title || `Evaluation - ${formatDate(evaluation.evaluation_date)}`}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            For: {evaluation.member?.name || 'Unknown Member'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a
                            href={evaluation.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-400 hover:bg-blue-900/30 rounded"
                            title="View PDF"
                          >
                            <IconExternalLink className="h-5 w-5" />
                          </a>
                          <a
                            href={evaluation.file_url}
                            download
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                            title="Download"
                          >
                            <IconDownload className="h-5 w-5" />
                          </a>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-2">
                        <span className="flex items-center gap-1">
                          <IconCalendar className="h-4 w-4" />
                          {formatDate(evaluation.evaluation_date)}
                        </span>
                      </div>
                      {evaluation.notes && (
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          {evaluation.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )
      ) : filteredEvaluations.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border">
          <IconFileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No evaluations found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {canCreate
              ? 'Click "Add Evaluation" to create your first evaluation.'
              : 'Your evaluations will appear here once created by an evaluator.'}
          </p>
        </div>
      ) : canViewAll && groupedEvaluations ? (
        /* Grouped view for admins/evaluators - sorted by member with accordion */
        <div className="space-y-3">
          {sortedMemberIds.map((memberId) => {
            const group = groupedEvaluations[memberId]
            return (
              <Accordion key={memberId} defaultOpen={false}>
                <div className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border overflow-hidden">
                  {/* Member Header - Accordion Button */}
                  <AccordionButton className="w-full">
                    {({ open }) => (
                      <div className="w-full bg-gray-50 dark:bg-portal-hover px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <div className="flex items-center gap-3 w-full">
                          <IconChevronDown
                            className={`h-5 w-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
                          />
                          <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                            <IconUser className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{group.memberName}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{group.memberEmail}</p>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium bg-blue-900/40 text-blue-400 rounded-full flex-shrink-0">
                            {group.evaluations.length} evaluation{group.evaluations.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </AccordionButton>

                  {/* Member's Evaluations - Accordion Panel */}
                  <AccordionPanel unmount={false}>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {group.evaluations
                        .sort((a, b) => new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime())
                        .map((evaluation) => (
                          <div key={evaluation.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                                <IconFile className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {evaluation.title || `Evaluation - ${formatDate(evaluation.evaluation_date)}`}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                      <span className="flex items-center gap-1">
                                        <IconCalendar className="h-4 w-4" />
                                        {formatDate(evaluation.evaluation_date)}
                                      </span>
                                      {evaluation.evaluator && (
                                        <span>by {evaluation.evaluator.name}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <a
                                      href={evaluation.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 text-blue-400 hover:bg-blue-900/30 rounded"
                                      title="View PDF"
                                    >
                                      <IconExternalLink className="h-5 w-5" />
                                    </a>
                                    <a
                                      href={evaluation.file_url}
                                      download
                                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                                      title="Download"
                                    >
                                      <IconDownload className="h-5 w-5" />
                                    </a>
                                    {canDelete && (
                                      <button
                                        onClick={() => handleDelete(evaluation)}
                                        className="p-2 text-red-500 dark:text-red-400/70 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                        title="Delete"
                                      >
                                        <IconTrash className="h-5 w-5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {evaluation.notes && (
                                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{evaluation.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </AccordionPanel>
                </div>
              </Accordion>
            )
          })}
        </div>
      ) : (
        /* Flat list for regular officials viewing their own */
        <div className="space-y-4">
          {filteredEvaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border hover:shadow-md transition-shadow p-4"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                  <IconFile className="h-6 w-6 text-blue-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {evaluation.title || `Evaluation - ${formatDate(evaluation.evaluation_date)}`}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a
                        href={evaluation.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-400 hover:bg-blue-900/30 rounded"
                        title="View PDF"
                      >
                        <IconExternalLink className="h-5 w-5" />
                      </a>
                      <a
                        href={evaluation.file_url}
                        download
                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                        title="Download"
                      >
                        <IconDownload className="h-5 w-5" />
                      </a>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <IconCalendar className="h-4 w-4" />
                      {formatDate(evaluation.evaluation_date)}
                    </span>
                    {evaluation.evaluator && (
                      <span>
                        Evaluated by: {evaluation.evaluator.name}
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {evaluation.notes && (
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      {evaluation.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Evaluation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="Add New Evaluation"
        size="lg"
      >
        <div className="space-y-4">
          {/* Member Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Member *
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-portal-surface text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select a member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Season Evaluation 2024"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-portal-surface text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Evaluation Date *
            </label>
            <input
              type="date"
              value={evaluationDate}
              onChange={(e) => setEvaluationDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-portal-surface text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Link to Activity */}
          {selectedMemberId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Link to Activity (optional)
              </label>
              {loadingActivities ? (
                <p className="text-sm text-gray-500">Loading activities...</p>
              ) : memberActivities.length === 0 ? (
                <p className="text-sm text-gray-500">No activities found for this member</p>
              ) : (
                <select
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-portal-surface text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Don't link to activity</option>
                  {memberActivities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.activity_type} - {formatDate(activity.activity_date)}
                      {activity.notes && ` (${activity.notes.substring(0, 30)}...)`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* PDF Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Evaluation PDF *
            </label>
            <FileUpload
              onFileSelect={setUploadedFile}
              selectedFile={uploadedFile}
              accept=".pdf"
              maxSize={10}
              buttonText="Upload PDF"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any additional notes..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-portal-surface text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleCreate}
              disabled={isUploading || !selectedMemberId || !uploadedFile}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Uploading...
                </>
              ) : (
                <>
                  <IconDeviceFloppy className="h-5 w-5" />
                  Save Evaluation
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowCreateModal(false)
                resetForm()
              }}
              disabled={isUploading}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 flex items-center gap-2"
            >
              <IconX className="h-5 w-5" />
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
