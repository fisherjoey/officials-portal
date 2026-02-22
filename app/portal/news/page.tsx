import { getAllContent, sortByDate } from '@/lib/content'
import NewsClient from './NewsClient'

export default function NewsAnnouncementsPage() {
  // Load announcements from CMS files
  const announcements = sortByDate(getAllContent('portal/announcements'))
    .map(item => ({
      id: item.slug,
      title: item.title,
      content: item.body || item.content || '',
      category: item.category || 'general',
      priority: item.urgent ? 'high' : 'normal',
      date: item.date,
      author: item.author || 'Executive',
      audience: item.audience || ['all'],
      expires: item.expires
    }))
    .filter(item => {
      // Filter out expired announcements
      if (item.expires && new Date(item.expires) < new Date()) {
        return false
      }
      return true
    })

  return <NewsClient initialAnnouncements={announcements} />
}