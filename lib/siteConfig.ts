/**
 * Site Configuration - Centralized configuration for server-side code
 *
 * This file contains all configurable organization-specific values for
 * Netlify functions and server-side code. These can be overridden via
 * environment variables.
 *
 * For client-side configuration, see config/organization.ts
 */

// Organization Information
export const ORG_NAME = process.env.ORG_NAME || 'Your Officials Association'
export const ORG_SHORT_NAME = process.env.ORG_SHORT_NAME || 'YOA'
export const ORG_TAGLINE = process.env.ORG_TAGLINE || 'Excellence in Officiating'
export const ORG_LOCATION = process.env.ORG_LOCATION || 'City, State, Country'
export const ORG_SPORT = process.env.ORG_SPORT || 'Sports'

// Website URLs
export const SITE_URL = process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.SITE_URL || 'https://example.com'
export const PORTAL_PATH = '/portal'
export const CONTACT_PATH = '/contact'

// Logo (hosted externally or in public folder)
export const ORG_LOGO_URL = process.env.ORG_LOGO_URL || '/images/logos/logo.png'

// Email Configuration
export const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || 'example.com'
export const EMAIL_NO_REPLY = process.env.EMAIL_NO_REPLY || `no-reply@${EMAIL_DOMAIN}`
export const EMAIL_ANNOUNCEMENTS = process.env.EMAIL_ANNOUNCEMENTS || `announcements@${EMAIL_DOMAIN}`
export const EMAIL_SCHEDULER = process.env.EMAIL_SCHEDULER || `scheduler@${EMAIL_DOMAIN}`
export const EMAIL_TREASURER = process.env.EMAIL_TREASURER || `treasurer@${EMAIL_DOMAIN}`
export const EMAIL_SECRETARY = process.env.EMAIL_SECRETARY || `secretary@${EMAIL_DOMAIN}`
export const EMAIL_MEMBER_SERVICES = process.env.EMAIL_MEMBER_SERVICES || `memberservices@${EMAIL_DOMAIN}`
export const EMAIL_EDUCATION = process.env.EMAIL_EDUCATION || `education@${EMAIL_DOMAIN}`
export const EMAIL_WEBMASTER = process.env.EMAIL_WEBMASTER || `webmaster@${EMAIL_DOMAIN}`
export const EMAIL_PERFORMANCE = process.env.EMAIL_PERFORMANCE || `performance@${EMAIL_DOMAIN}`
export const EMAIL_RECRUITING = process.env.EMAIL_RECRUITING || `recruiting@${EMAIL_DOMAIN}`

// Contact Form Category Mapping
export const CONTACT_CATEGORY_EMAILS: Record<string, string> = {
  general: EMAIL_SECRETARY,
  scheduling: EMAIL_SCHEDULER,
  billing: EMAIL_TREASURER,
  membership: EMAIL_MEMBER_SERVICES,
  education: EMAIL_EDUCATION,
  website: EMAIL_WEBMASTER,
  performance: EMAIL_PERFORMANCE,
  recruiting: EMAIL_RECRUITING,
  other: EMAIL_SECRETARY,
}

// Contact Form Category Labels
export const CONTACT_CATEGORY_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  scheduling: 'Officiating Services / Booking',
  billing: 'Billing / Payments',
  membership: 'Membership',
  education: 'Education / Training',
  website: 'Website / Technical',
  performance: 'Performance / Evaluation',
  recruiting: 'Recruitment',
  other: 'Other',
}

// Get copyright year
export const getCopyrightYear = (): number => new Date().getFullYear()

// Member Portal Feature Names (can be customized)
export const PORTAL_FEATURES = {
  resources: 'Resources',
  resourcesDescription: 'Training materials, rulebooks, and guides',
  newsletter: 'Newsletter',
  newsletterDescription: 'Our official newsletter',
  calendar: 'Calendar',
  calendarDescription: 'Upcoming events and training sessions',
  ruleModifications: 'Rule Modifications',
  ruleModificationsDescription: 'League-specific rule changes',
}

// Email Subject Templates
export const EMAIL_SUBJECTS = {
  invite: `You're Invited to Join ${ORG_SHORT_NAME}!`,
  passwordReset: `Reset Your ${ORG_SHORT_NAME} Portal Password`,
  migrationPasswordReset: `${ORG_SHORT_NAME} Portal Update - Set Your New Password`,
  contactFormPrefix: '[Contact Form]',
}

// Generate full URLs
export const getPortalUrl = (): string => `${SITE_URL}${PORTAL_PATH}`
export const getContactUrl = (category?: string): string =>
  category ? `${SITE_URL}${CONTACT_PATH}?category=${category}` : `${SITE_URL}${CONTACT_PATH}`
export const getAuthCallbackUrl = (): string => `${SITE_URL}/auth/callback`

// Configuration object for easy import
export const siteConfig = {
  org: {
    name: ORG_NAME,
    shortName: ORG_SHORT_NAME,
    tagline: ORG_TAGLINE,
    location: ORG_LOCATION,
    sport: ORG_SPORT,
    logoUrl: ORG_LOGO_URL,
  },
  urls: {
    site: SITE_URL,
    portal: getPortalUrl(),
    contact: getContactUrl,
    authCallback: getAuthCallbackUrl(),
  },
  email: {
    domain: EMAIL_DOMAIN,
    noReply: EMAIL_NO_REPLY,
    announcements: EMAIL_ANNOUNCEMENTS,
    scheduler: EMAIL_SCHEDULER,
    treasurer: EMAIL_TREASURER,
    secretary: EMAIL_SECRETARY,
    memberServices: EMAIL_MEMBER_SERVICES,
    education: EMAIL_EDUCATION,
    webmaster: EMAIL_WEBMASTER,
    performance: EMAIL_PERFORMANCE,
    recruiting: EMAIL_RECRUITING,
    categoryMap: CONTACT_CATEGORY_EMAILS,
    categoryLabels: CONTACT_CATEGORY_LABELS,
    subjects: EMAIL_SUBJECTS,
  },
  features: PORTAL_FEATURES,
  getCopyrightYear,
}

export default siteConfig
