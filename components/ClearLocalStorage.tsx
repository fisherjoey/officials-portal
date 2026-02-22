'use client'

import { useEffect } from 'react'

export default function ClearLocalStorage() {
  useEffect(() => {
    // Clear all localStorage data
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('portal_'))
      keys.forEach(key => localStorage.removeItem(key))
    }
  }, [])

  return null
}