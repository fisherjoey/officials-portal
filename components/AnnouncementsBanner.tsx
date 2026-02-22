'use client'

import { useState, useEffect } from 'react'
import { IconAlertCircle, IconInfoCircle, IconX } from '@tabler/icons-react'
import { announcementsAPI } from '@/lib/api'

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  priority: 'high' | 'normal' | 'low'
  date: string
  author: string
}

export default function AnnouncementsBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnnouncements()

    // Load dismissed announcements from localStorage
    const dismissed = localStorage.getItem('portal-dismissed-announcements')
    if (dismissed) {
      setDismissedIds(new Set(JSON.parse(dismissed)))
    }
  }, [])

  const loadAnnouncements = async () => {
    try {
      const data = await announcementsAPI.getAll()
      // Filter to only show high priority announcements from the last 7 days
      const recentHighPriority = data.filter((a: Announcement) => {
        const announcementDate = new Date(a.date)
        const daysOld = (Date.now() - announcementDate.getTime()) / (1000 * 60 * 60 * 24)
        return a.priority === 'high' && daysOld <= 7
      })
      setAnnouncements(recentHighPriority)
    } catch (error) {
      console.error('Failed to load announcements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = (id: string) => {
    const newDismissed = new Set(dismissedIds)
    newDismissed.add(id)
    setDismissedIds(newDismissed)
    localStorage.setItem('portal-dismissed-announcements', JSON.stringify(Array.from(newDismissed)))
  }

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id))

  if (isLoading || visibleAnnouncements.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className="bg-orange-50 border-l-4 border-orange-500 rounded-r-lg p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <IconAlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 text-sm">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-orange-800 mt-1 line-clamp-2">
                    {announcement.content.replace(/<[^>]*>/g, '').substring(0, 150)}
                    {announcement.content.replace(/<[^>]*>/g, '').length > 150 ? '...' : ''}
                  </p>
                  <p className="text-xs text-orange-600 mt-2">
                    {new Date(announcement.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleDismiss(announcement.id)}
                  className="text-orange-600 hover:text-orange-800 flex-shrink-0"
                  title="Dismiss"
                >
                  <IconX className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
