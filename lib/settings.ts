import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { orgConfig } from '@/config/organization'

export interface ExecutiveMember {
  name: string
  position: string
  email: string
  image?: string
}

export interface SiteSettings {
  siteTitle: string
  siteDescription: string
  logo?: string
  favicon?: string
  statistics: {
    activeOfficials: string
    gamesPerSeason: string
    yearsOfService: string
  }
  executiveTeam?: ExecutiveMember[]
  socialMedia: {
    facebook?: string
    twitter?: string
    instagram?: string
    youtube?: string
  }
  contact: {
    email: string
    address: string
  }
}

// Default settings derived from orgConfig
function getDefaultSettings(): SiteSettings {
  return {
    siteTitle: orgConfig.name,
    siteDescription: orgConfig.description,
    statistics: {
      activeOfficials: orgConfig.statistics.activeOfficials,
      gamesPerSeason: orgConfig.statistics.gamesPerSeason,
      yearsOfService: orgConfig.statistics.yearsOfService
    },
    socialMedia: {
      facebook: orgConfig.social.facebook || undefined,
      twitter: orgConfig.social.twitter || undefined,
      instagram: orgConfig.social.instagram || undefined,
      youtube: orgConfig.social.youtube || undefined
    },
    contact: {
      email: orgConfig.contact.email,
      address: orgConfig.contact.address
    }
  }
}

export function getSiteSettings(): SiteSettings {
  try {
    const settingsPath = path.join(process.cwd(), 'content', 'settings', 'general.yml')

    if (!fs.existsSync(settingsPath)) {
      // Return default settings from orgConfig if file doesn't exist
      return getDefaultSettings()
    }

    const fileContents = fs.readFileSync(settingsPath, 'utf8')
    const settings = yaml.load(fileContents) as SiteSettings

    return settings
  } catch (error) {
    console.error('Error loading site settings:', error)
    // Return default settings on error
    return getDefaultSettings()
  }
}
