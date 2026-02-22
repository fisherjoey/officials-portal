'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { orgConfig } from '@/config/organization'

interface SearchResult {
  title: string
  description: string
  url: string
  category: string
}

interface SearchContextType {
  searchTerm: string
  setSearchTerm: (term: string) => void
  searchResults: SearchResult[]
  isSearching: boolean
  performSearch: (term: string) => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

// Generate searchable content dynamically from orgConfig
const getSearchableContent = (): SearchResult[] => {
  const { name, sport, labels } = orgConfig
  const officialTitle = sport.officialTitle
  const officialTitlePlural = sport.officialTitlePlural
  const sportName = sport.namePlural
  const eventName = sport.eventName
  const eventNamePlural = sport.eventNamePlural

  return [
    {
      title: 'Home',
      description: `Welcome to ${name}`,
      url: '/',
      category: 'Main'
    },
    {
      title: 'About Us',
      description: `Learn about ${name}, our mission, and leadership`,
      url: '/about',
      category: 'About'
    },
    {
      title: `Become a ${officialTitle}`,
      description: `Join as a ${sportName} ${officialTitle.toLowerCase()}. Learn about requirements, training, and how to apply`,
      url: '/become-a-referee',
      category: 'Membership'
    },
    {
      title: 'Training & Development',
      description: `${officialTitle} training programs, clinics, workshops, and certification courses`,
      url: '/training',
      category: 'Training'
    },
    {
      title: 'Training Schedule',
      description: 'View upcoming training sessions, clinics, and workshops schedule',
      url: '/training/schedule',
      category: 'Training'
    },
    {
      title: 'Resources',
      description: `Official rules, forms, documents, and ${officialTitle.toLowerCase()} resources`,
      url: '/resources',
      category: 'Resources'
    },
    {
      title: 'News & Updates',
      description: 'Latest news, announcements, and updates from your organization',
      url: '/news',
      category: 'News'
    },
    {
      title: `Get ${labels.officials}`,
      description: `Request certified ${sportName} ${officialTitlePlural.toLowerCase()} for your ${eventNamePlural.toLowerCase()} and tournaments`,
      url: '/get-officials',
      category: 'Services'
    },
    {
      title: 'Contact Us',
      description: `Get in touch with ${name}`,
      url: '/about#contact',
      category: 'Contact'
    },
    {
      title: 'Official Rules',
      description: `Official ${sportName} rules and regulations`,
      url: '/resources',
      category: 'Resources'
    },
    {
      title: `${officialTitle} Evaluation Forms`,
      description: `Performance evaluation forms for ${sportName} ${officialTitlePlural.toLowerCase()}`,
      url: '/resources',
      category: 'Resources'
    },
    {
      title: 'Mission Statement',
      description: `Our mission to provide quality officiating for ${sportName} in your community`,
      url: '/about',
      category: 'About'
    },
    {
      title: 'Board of Directors',
      description: 'Meet the leadership team and board members',
      url: '/about',
      category: 'About'
    },
    {
      title: 'Membership Benefits',
      description: `Benefits of becoming a certified ${officialTitle.toLowerCase()}`,
      url: '/become-a-referee',
      category: 'Membership'
    },
    {
      title: 'Training Requirements',
      description: `Mandatory training and certification requirements for ${officialTitlePlural.toLowerCase()}`,
      url: '/training',
      category: 'Training'
    },
    {
      title: `${eventName} Assignments`,
      description: `How ${eventName.toLowerCase()} assignments work for ${officialTitlePlural.toLowerCase()}`,
      url: '/resources',
      category: 'Resources'
    },
    {
      title: 'Code of Conduct',
      description: `Professional standards and code of conduct for ${officialTitlePlural.toLowerCase()}`,
      url: '/resources',
      category: 'Resources'
    }
  ]
}

// Memoize searchable content (computed once when module loads)
const searchableContent = getSearchableContent()

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const performSearch = (term: string) => {
    setSearchTerm(term)
    setIsSearching(true)

    if (!term.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    const lowercaseTerm = term.toLowerCase()
    const results = searchableContent.filter(item => 
      item.title.toLowerCase().includes(lowercaseTerm) ||
      item.description.toLowerCase().includes(lowercaseTerm) ||
      item.category.toLowerCase().includes(lowercaseTerm)
    )

    setTimeout(() => {
      setSearchResults(results)
      setIsSearching(false)
    }, 100)
  }

  return (
    <SearchContext.Provider value={{
      searchTerm,
      setSearchTerm,
      searchResults,
      isSearching,
      performSearch
    }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}