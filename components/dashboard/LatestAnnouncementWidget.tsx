'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { IconBell, IconChevronRight, IconAlertCircle } from '@tabler/icons-react'
import { announcementsAPI } from '@/lib/api'
import { HTMLViewer } from '@/components/TinyMCEEditor'

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  priority: 'high' | 'normal' | 'low'
  date: string
  author: string
}

const MAX_ANNOUNCEMENTS = 3

export default function LatestAnnouncementWidget() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    try {
      const data = await announcementsAPI.getAll()
      if (data.length > 0) {
        const sorted = data.sort((a: Announcement, b: Announcement) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setAnnouncements(sorted.slice(0, MAX_ANNOUNCEMENTS))
      }
    } catch (error) {
      console.error('Failed to load announcements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'bg-blue-50 dark:bg-blue-500/[0.06] text-blue-700/80 dark:text-blue-300/60'
      case 'rules': return 'bg-purple-50 dark:bg-purple-500/[0.06] text-purple-700/80 dark:text-purple-300/60'
      case 'schedule': return 'bg-green-50 dark:bg-green-500/[0.06] text-green-700/80 dark:text-green-300/60'
      case 'training': return 'bg-orange-50 dark:bg-orange-500/[0.06] text-orange-700/80 dark:text-orange-300/60'
      case 'administrative': return 'bg-red-50 dark:bg-red-500/[0.06] text-red-700/80 dark:text-red-300/60'
      default: return 'bg-zinc-100 dark:bg-zinc-500/[0.06] text-zinc-600 dark:text-zinc-400'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border p-6">
        <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <IconBell className="h-5 w-5 text-orange-500" />
          Announcements
        </h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-portal-hover rounded w-3/4 mb-2"></div>
          <div className="h-16 bg-gray-200 dark:bg-portal-hover rounded"></div>
          <div className="h-16 bg-gray-200 dark:bg-portal-hover rounded"></div>
        </div>
      </div>
    )
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border p-4 sm:p-6">
        <h2 className="font-heading text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <IconBell className="h-5 w-5 text-orange-500" />
          Announcements
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <IconBell className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-sm">No announcements yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconBell className="h-5 w-5 text-orange-500" />
          Announcements
        </h2>
        <Link
          href="/portal/news"
          className="text-sm text-orange-600 dark:text-portal-accent hover:text-orange-700 dark:hover:text-portal-accent font-semibold flex items-center gap-1"
        >
          View All
          <IconChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {announcements.map((announcement, index) => (
          <Link key={announcement.id} href="/portal/news" className="block group">
            <div className={`border-l-4 pl-4 ${
              announcement.priority === 'high'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-orange-500 bg-slate-50 dark:bg-portal-hover/50'
            } p-3 rounded-lg group-hover:shadow-md transition-shadow`}>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${getCategoryColor(announcement.category)}`}>
                  {announcement.category}
                </span>
                {announcement.priority === 'high' && (
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                    <IconAlertCircle className="h-3 w-3" />
                    High Priority
                  </span>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(announcement.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors text-sm sm:text-base">
                {announcement.title}
              </h3>

              {index === 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                  <HTMLViewer content={announcement.content} className="prose-sm dark:prose-invert" />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
