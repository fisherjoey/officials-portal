'use client'

import { useState, useEffect } from 'react'
import NewsCard from '@/components/content/NewsCard'
import TrainingCard from '@/components/content/TrainingCard'
import Button from '@/components/ui/Button'
import { publicNewsTable, publicTrainingTable } from '@/lib/supabase'

export default function HomeContent() {
  const [latestNews, setLatestNews] = useState<any[]>([])
  const [upcomingTraining, setUpcomingTraining] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch latest news
        const { data: allNews, error: newsError } = await publicNewsTable()
          .select('*')
          .eq('active', true)
          .order('priority', { ascending: false })
          .order('published_date', { ascending: false })

        if (newsError) throw newsError

        const news = (allNews || [])
          .sort((a, b) => {
            if (a.priority !== b.priority) return b.priority - a.priority
            return new Date(b.published_date).getTime() - new Date(a.published_date).getTime()
          })
          .slice(0, 3)
          .map(news => ({
            title: news.title,
            date: news.published_date,
            excerpt: news.excerpt,
            author: news.author,
            slug: news.slug,
            image: news.image_url
          }))

        // Fetch upcoming training
        const now = new Date().toISOString().split('T')[0]
        const { data: events, error: trainingError } = await publicTrainingTable()
          .select('*')
          .eq('active', true)
          .gte('event_date', now)
          .order('event_date', { ascending: true })
          .limit(2)

        if (trainingError) throw trainingError

        const training = (events || [])
          .map(training => ({
            title: training.title,
            date: training.event_date,
            time: training.event_time ? `${training.event_time} - ${
              new Date(new Date(`2000-01-01 ${training.event_time}`).getTime() + 2 * 60 * 60 * 1000)
                .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            }` : 'TBD',
            location: training.location || 'TBD',
            type: 'workshop' as const,
            description: training.description,
            registrationLink: training.registration_url || '/training',
            spotsAvailable: training.capacity || undefined
          }))

        setLatestNews(news)
        setUpcomingTraining(training)
      } catch (error) {
        console.error('Failed to load home page content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-lg">Loading content...</p>
      </div>
    )
  }

  return (
    <>
      {/* Instagram Feed */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary mb-2">Follow Us on Instagram</h2>
            <p className="text-gray-600">Stay up to date with the latest from your organization</p>
          </div>
          <div className="max-w-4xl mx-auto">
            {/* TODO: Replace with your organization's Instagram embed URL */}
            <div className="bg-gray-200 rounded-lg h-[450px] sm:h-[500px] lg:h-[600px] flex items-center justify-center">
              <p className="text-gray-500 text-center px-4">
                Configure your Instagram embed in config/organization.ts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News - Commented out for public site
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary">Latest News</h2>
            <Button href="/news" variant="primary" size="sm">
              <span className="hidden sm:inline">View All News</span>
              <span className="sm:hidden">View All</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {latestNews.map((news) => (
              <NewsCard key={news.slug} {...news} />
            ))}
          </div>
        </div>
      </section>
      */}

      {/* Upcoming Training - Commented out for public site
      <section className="py-8 sm:py-12 lg:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary">Upcoming Training</h2>
            <Button href="/training" variant="primary" size="sm">
              <span className="hidden sm:inline">View All Training</span>
              <span className="sm:hidden">View All</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {upcomingTraining.map((training, index) => (
              <TrainingCard key={index} {...training} />
            ))}
          </div>
        </div>
      </section>
      */}
    </>
  )
}
