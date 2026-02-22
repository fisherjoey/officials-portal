'use client'

import { useState, useEffect } from 'react'
import { publicPagesAPI } from '@/lib/api'
import { orgConfig } from '@/config/organization'

export default function AboutContent() {
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true)
        const aboutPage = await publicPagesAPI.getByName('about')
        // Ensure content is a string, not an object
        const content = aboutPage?.content
        if (typeof content === 'string') {
          setHtmlContent(content)
        } else {
          setHtmlContent(null)
        }
      } catch (error) {
        console.error('Failed to load about page content:', error)
        setHtmlContent(null)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-500 text-lg">Loading content...</p>
          </div>
        </div>
      </section>
    )
  }

  // CMS Content Section
  if (htmlContent) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="tinymce-content">
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          </div>
        </div>
      </section>
    )
  }

  // History Section - Fallback if no CMS content
  // TODO: Add your organization's history content via the CMS admin panel
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-brand-secondary mb-8 text-center">Our History</h2>
          <div className="prose prose-lg mx-auto">
            <p className="text-gray-700 mb-4">
              {orgConfig.name} was founded by a group of dedicated {orgConfig.sport.namePlural} enthusiasts
              who recognized the need for organized, professional officiating in our community.
            </p>
            <p className="text-gray-700 mb-4">
              Our organization has grown to include {orgConfig.statistics.activeOfficials} active {orgConfig.labels.officials.toLowerCase()},
              covering {orgConfig.statistics.gamesPerSeason} {orgConfig.labels.games.toLowerCase()} per season.
              Our {orgConfig.labels.officials.toLowerCase()} work {orgConfig.labels.games.toLowerCase()} ranging from
              youth recreational leagues to high-level championships.
            </p>
            <p className="text-gray-700">
              Over {orgConfig.statistics.yearsOfService} years of service, we have been instrumental in developing officiating
              standards, training programs, and mentorship initiatives that have produced some
              of our region's finest {orgConfig.sport.namePlural} {orgConfig.labels.officials.toLowerCase()}.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
