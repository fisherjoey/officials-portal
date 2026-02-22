/**
 * Organization Configuration
 *
 * This is the single source of truth for all organization-specific settings.
 * Customize these values for your officials association.
 */

export const orgConfig = {
  // Organization Identity
  name: "Your Officials Association",
  shortName: "YOA",
  description: "Official website for your sports officials organization",
  tagline: "Excellence in Officiating", // Used in email headers, footers, etc.
  domain: "example.com",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",

  // Sport Configuration
  // Customize these for your specific sport (e.g., Basketball, Soccer, Hockey, Volleyball)
  sport: {
    name: "Basketball",           // e.g., "Basketball", "Soccer", "Hockey", "Volleyball"
    namePlural: "basketball",     // Lowercase for inline text, e.g., "basketball games"
    eventName: "Game",            // e.g., "Game", "Match", "Event"
    eventNamePlural: "Games",     // e.g., "Games", "Matches", "Events"
    officialTitle: "Referee",     // e.g., "Referee", "Umpire", "Official", "Judge"
    officialTitlePlural: "Referees", // e.g., "Referees", "Umpires", "Officials", "Judges"
    // Certification/skill levels for your sport (ordered from entry to advanced)
    certificationLevels: [
      "Level 1 - Community",
      "Level 2 - Regional",
      "Level 3 - Provincial",
      "Level 4 - National",
      "Level 5 - International"
    ],
    // Governing bodies and rule sources for your sport
    governingBodies: [
      // { name: "FIBA", description: "International Basketball Federation" },
      // { name: "Canada Basketball", description: "National governing body" },
    ],
  },

  // Contact Information
  contact: {
    email: "info@example.com",
    address: "City, State, Country",
  },

  // Role-based Email Addresses
  // These are used for contact form routing and organization communication
  emails: {
    general: "secretary@example.com",
    president: "president@example.com",
    vicePresident: "vicepresident@example.com",
    secretary: "secretary@example.com",
    treasurer: "treasurer@example.com",
    scheduler: "scheduler@example.com",
    education: "education@example.com",
    performance: "performance@example.com",
    membership: "memberservices@example.com",
    webmaster: "webmaster@example.com",
    recruiting: "recruiting@example.com",
    announcements: "announcements@example.com",
  },

  // Social Media Links (leave empty string if not used)
  social: {
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    discord: "", // Discord invite URL for member community
  },

  // External Tools URLs (leave empty if not used)
  // These are third-party tools that officials may need to access
  externalTools: {
    arbiter: "", // e.g., "https://app.arbitersports.com/login"
    gamePlan: "", // e.g., "https://gameplanbasketball.ca/"
    legacyResourceCenter: "", // URL to legacy resource center if applicable
  },

  // Brand Colors
  // These map to Tailwind CSS color classes: brand-primary, brand-secondary, etc.
  colors: {
    primary: "#ff6b35",    // Main brand color (buttons, links, accents)
    secondary: "#2c3e50",  // Secondary color (navigation, headers)
    dark: "#1a1a1a",       // Dark backgrounds
    accent: "#3498db",     // Accent color for highlights
  },

  // Organization Statistics (displayed on homepage/about)
  statistics: {
    activeOfficials: "100+",
    gamesPerSeason: "1,000+",
    yearsOfService: "10+",
  },

  // External Links (affiliations, partners, etc.)
  affiliations: [
    // { name: "State Basketball Association", url: "https://example.com" },
    // { name: "National Officials Organization", url: "https://example.com" },
  ],

  // Feature Flags
  features: {
    // Enable/disable specific features
    memberPortal: true,
    publicNews: true,
    publicTraining: true,
    publicResources: true,
    ruleModifications: true,
    evaluations: true,
    newsletter: true,
    campaigns: false, // Special campaign banners (e.g., Pink Whistle)
    newOfficialProgram: true, // New official mentorship/support program
    charityProgram: false, // Charity campaign (e.g., Pink Whistle for breast cancer)
  },

  // Season/Calendar Information
  season: {
    registrationDeadline: "August 31",
    seasonStart: "September",
    midSeasonEvaluations: "January",
    championshipsMonth: "March",
  },

  // New Official Program (if features.newOfficialProgram is enabled)
  // This is a mentorship/support program for new officials
  newOfficialProgram: {
    name: "New Official Program",
    tagline: "Supporting new officials in their journey",
    description: "A program designed to help new officials get started with mentorship and training support.",
    // Partners in the program (leave empty array if none)
    partners: [
      // { name: "Regional Association", url: "https://example.com" },
    ],
  },

  // Charity Campaign Program (if features.charityProgram is enabled)
  charityProgram: {
    name: "Charity Campaign",
    tagline: "Support our cause",
    description: "Officials come together to support important causes in our community.",
    donationUrl: "",
    campaignMonth: "February",
  },

  // Certification Program Information
  certification: {
    programName: "National Officials Certification Program",
    programAcronym: "NOCP",
    localBody: "Local Officials Association", // e.g., "ABOA"
    localBodyAcronym: "LOA",
    nationalBody: "National Officials Commission", // e.g., "CBOC"
    nationalBodyAcronym: "NOC",
  },

  // Content Labels (customize terminology for your sport/region)
  // These are convenience aliases that reference sport config above
  labels: {
    official: "Official",
    officials: "Officials",
    referee: "Referee",        // Alias for sport.officialTitle
    referees: "Referees",      // Alias for sport.officialTitlePlural
    game: "Game",              // Alias for sport.eventName
    games: "Games",            // Alias for sport.eventNamePlural
    newOfficialProgram: "New Official Program", // e.g., "Blue Whistle Program"
    memberPortal: "Member Portal",
    newsletter: "Newsletter", // e.g., "The Bounce"
    playingArea: "court", // e.g., "court", "field", "rink", "pitch"
  },

  // Region/Location Information
  region: {
    name: "Your Region", // e.g., "Calgary", "Greater Toronto Area"
    province: "Your Province", // e.g., "Alberta", "Ontario"
    country: "Your Country", // e.g., "Canada", "USA"
  },

  // Booking/OSA Form Configuration
  booking: {
    // Discipline policy options for events
    disciplinePolicies: [
      "Standard Association Policy",
      "Own Policy (will provide copy)"
    ],
  },
} as const

// Type export for TypeScript support
export type OrgConfig = typeof orgConfig
