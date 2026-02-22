'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import Fuse from 'fuse.js'
import { orgConfig } from '@/config/organization'

interface SearchItem {
  title: string
  description: string
  url: string
  category: string
  content: string
}

// TODO: Customize this searchable content for your organization
// This content is used for client-side search functionality
// Update the descriptions and content to match your organization's pages
const searchableContent: SearchItem[] = [
  // === Accessible pages (linked via navigation buttons) ===
  {
    title: 'Home',
    description: `Welcome to ${orgConfig.name}`,
    url: '/',
    category: 'Main',
    content: `${orgConfig.name}. Join your community's premier ${orgConfig.sport.namePlural} officiating organization. Become a ${orgConfig.labels.referee}. View Training. Stay up to date with the latest from your organization.`
  },
  {
    title: 'About Us',
    description: `Learn about ${orgConfig.name}, our mission, leadership, values, and history`,
    url: '/about',
    category: 'About',
    content: `Your community's premier ${orgConfig.sport.namePlural} officiating organization. Our Mission: To develop and maintain a strong community of ${orgConfig.labels.officials.toLowerCase()} who demonstrate excellence, integrity, and professionalism in every ${orgConfig.labels.game.toLowerCase()} they officiate. We are committed to providing the highest quality officiating services. Our Values: Excellence, Integrity, Development, Community, Respect, Leadership. What We Do: Comprehensive training programs for new ${orgConfig.labels.officials.toLowerCase()}. Ongoing professional development workshops. Mentorship programs. Annual rules clinics and certification courses. ${orgConfig.labels.game} assignments. Support for ${orgConfig.sport.namePlural} programs.`
  },
  {
    title: `Become a ${orgConfig.labels.referee}`,
    description: `Join our organization as a ${orgConfig.sport.namePlural} ${orgConfig.labels.referee.toLowerCase()}. Learn about requirements, training, benefits, and how to apply`,
    url: '/become-a-referee',
    category: 'Membership',
    content: `Join ${orgConfig.name}. Thank you for your interest in becoming a certified ${orgConfig.labels.official.toLowerCase()}. Becoming an Active ${orgConfig.labels.official}: Sign the Membership Agreement. Pay the annual dues. Attend a clinic for your level of experience. Purchase the correct ${orgConfig.labels.referee.toLowerCase()} uniform. Write the rules exam on an annual basis. Training Timeline: ${orgConfig.season.seasonStart} - New ${orgConfig.labels.officials} Course begins. Benefits: Competitive Pay. Flexible Schedule. Stay Active. Career Advancement. Community Impact. Training and Support.`
  },
  {
    title: `Book ${orgConfig.labels.referees}`,
    description: `Request certified ${orgConfig.sport.namePlural} ${orgConfig.labels.officials.toLowerCase()} for your ${orgConfig.labels.games.toLowerCase()}, leagues, and tournaments`,
    url: '/get-officials',
    category: 'Services',
    content: `Our Officiating Services. Request certified ${orgConfig.sport.namePlural} ${orgConfig.labels.officials.toLowerCase()} for your ${orgConfig.labels.games.toLowerCase()}, leagues and tournaments. Why Choose Our ${orgConfig.labels.officials}: Nationally certified and trained ${orgConfig.labels.officials.toLowerCase()}. Comprehensive insurance coverage. Professional ${orgConfig.labels.game.toLowerCase()} management. Consistent rule interpretation and application. Ongoing performance evaluation and development. Our Services: Exhibition ${orgConfig.labels.games}. League Coverage. Tournament Services.`
  },
  {
    title: orgConfig.labels.newOfficialProgram,
    description: `Initiative encouraging respectful treatment of new ${orgConfig.sport.namePlural} ${orgConfig.labels.officials.toLowerCase()}`,
    url: '/new-officials',
    category: 'Membership',
    content: `${orgConfig.newOfficialProgram?.description || ''} Program Objectives: Create a safe, supportive, and respectful environment for new ${orgConfig.labels.referees.toLowerCase()}. Eliminate aggressive behavior from players, coaches, and spectators. Promote professionalism, fair play, and adherence to the rules. Why This Program Matters: Retention - a supportive environment helps retain valuable new ${orgConfig.labels.referees.toLowerCase()}. Development - when ${orgConfig.labels.officials.toLowerCase()} feel supported, they can focus on learning and improving. Community - building a culture of respect benefits everyone.`
  },
  {
    title: 'Contact Us',
    description: `Get in touch with ${orgConfig.name}. Send us a message and we will route it to the right team`,
    url: '/contact',
    category: 'Contact',
    content: `Have a question or need assistance? We're here to help. Get In Touch - use the form below and we'll route your message to the right team. Response Time: we typically respond within 1-2 business days. Location: ${orgConfig.contact.address}. Send Us a Message - select a category and we'll make sure your message reaches the right team.`
  },
  {
    title: 'Training & Certification',
    description: `${orgConfig.certification.programName}. Your pathway to becoming a certified ${orgConfig.sport.namePlural} ${orgConfig.labels.official.toLowerCase()}`,
    url: '/training',
    category: 'Training',
    content: `Training and Certification Program. Your pathway to becoming a certified ${orgConfig.sport.namePlural} ${orgConfig.labels.official.toLowerCase()}. ${orgConfig.certification.programName} (${orgConfig.certification.programAcronym}). This program aims to standardize ${orgConfig.labels.official.toLowerCase()} development, ensuring consistent quality and professionalism. Program Highlights: Multiple certification levels from entry to advanced. Comprehensive training combining online and practical components. Standardized evaluation and progression criteria. Mentorship and continuous development opportunities. Registration Deadline: ${orgConfig.season.registrationDeadline}. Season Start: ${orgConfig.season.seasonStart}. Mid-Season Evaluations: ${orgConfig.season.midSeasonEvaluations}. Championships: ${orgConfig.season.championshipsMonth}.`
  },

  // === Routes not currently accessible via navigation buttons ===
  // Uncomment and customize these as needed for your organization
  // {
  //   title: 'Training Schedule',
  //   description: 'View upcoming training sessions, clinics, and workshops schedule',
  //   url: '/training/schedule',
  //   category: 'Training',
  //   content: ''
  // },
  // {
  //   title: 'Resources',
  //   description: `Official rules, forms, documents, and ${orgConfig.labels.referee.toLowerCase()} resources`,
  //   url: '/resources',
  //   category: 'Resources',
  //   content: ''
  // },
  // {
  //   title: 'News & Updates',
  //   description: 'Latest news, announcements, and updates from your organization',
  //   url: '/news',
  //   category: 'News',
  //   content: ''
  // },
]

const fuseOptions: Fuse.IFuseOptions<SearchItem> = {
  keys: [
    { name: 'title', weight: 3 },
    { name: 'description', weight: 2 },
    { name: 'category', weight: 1 },
    { name: 'content', weight: 1 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
}

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [isLoading, setIsLoading] = useState(true)

  const fuse = useMemo(() => new Fuse(searchableContent, fuseOptions), [])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const fuseResults = fuse.search(query.trim())
    // Deduplicate by URL — keep the highest-ranked result per page
    const seen = new Set<string>()
    return fuseResults
      .filter(r => {
        if (seen.has(r.item.url)) return false
        seen.add(r.item.url)
        return true
      })
      .map(r => r.item)
  }, [query, fuse])

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 200)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-brand-dark mb-6">
            Search Results
          </h1>

          {query && (
            <div className="mb-8">
              <p className="text-gray-600">
                Showing results for: <span className="font-semibold text-brand-dark">&ldquo;{query}&rdquo;</span>
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-6">
              {results.map((result, index) => (
                <Link
                  key={index}
                  href={result.url}
                  className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-semibold text-brand-dark hover:text-brand-secondary transition-colors">
                      {result.title}
                    </h2>
                    <span className="text-xs bg-brand-primary text-white px-2 py-1 rounded-full whitespace-nowrap ml-3">
                      {result.category}
                    </span>
                  </div>
                  <p className="text-gray-600 line-clamp-2">
                    {result.description}
                  </p>
                  <p className="text-sm text-brand-secondary mt-2">
                    {result.url}
                  </p>
                </Link>
              ))}
            </div>
          ) : query ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No results found</h2>
              <p className="text-gray-500">
                We couldn&apos;t find any results for &ldquo;{query}&rdquo;. Try searching with different keywords.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Start searching</h2>
              <p className="text-gray-500">
                Use the search bar above to find information about training, resources, and more.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-brand-dark mb-6">
              Search Results
            </h1>
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
