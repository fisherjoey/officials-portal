# Officials Portal

An open-source, modern web application for sports officials associations. Built with Next.js, TypeScript, and Tailwind CSS.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

## Documentation

For comprehensive setup instructions, see our **[Setup Guides](docs/setup/)**:

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/setup/GETTING-STARTED.md) | Complete setup walkthrough from start to finish |
| [Supabase Setup](docs/setup/SUPABASE.md) | Database and authentication configuration |
| [Netlify Deployment](docs/setup/NETLIFY.md) | Hosting and serverless functions |
| [DNS Configuration](docs/setup/DNS.md) | Domain and SSL certificate setup |
| [Email Setup](docs/setup/EMAIL.md) | Microsoft 365 email integration |
| [CMS Setup](docs/setup/CMS.md) | Content management with Decap CMS |

## Features

- **Member Portal**: Secure area for members to access resources, training materials, and manage their profile
- **Public Website**: Professional public-facing site with information about your organization
- **Content Management**: Easy content updates via Decap CMS (formerly Netlify CMS)
- **Contact System**: Smart contact form with category-based routing
- **Training Management**: Publish and manage training events and clinics
- **News & Announcements**: Keep members and the public informed
- **Rule Modifications**: Document league-specific rule variations
- **Responsive Design**: Looks great on all devices
- **Email Integration**: Microsoft Graph API integration for email notifications

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for authentication and database)
- Netlify account (for deployment and functions)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/fisherjoey/officials-portal.git
   cd officials-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration (see [Environment Variables](#environment-variables))

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

### Organization Settings

Edit `config/organization.ts` to customize your organization:

```typescript
export const orgConfig = {
  name: "Your Officials Association",
  shortName: "YOA",
  description: "Official website for your sports officials organization",
  domain: "example.com",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",

  contact: {
    email: "info@example.com",
    address: "City, State, Country",
  },

  // ... more options
}
```

### Brand Colors

Colors are defined in `tailwind.config.ts`:

```typescript
colors: {
  'brand-primary': '#ff6b35',    // Main accent color
  'brand-secondary': '#2c3e50',  // Secondary color
  'brand-dark': '#1a1a1a',       // Dark backgrounds
  'brand-accent': '#3498db',     // Additional accent
}
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Site URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Microsoft Graph API (for email)
MICROSOFT_TENANT_ID=your_tenant_id
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret

# Email Configuration
EMAIL_SENDER=announcements@your-domain.com
EMAIL_GENERAL=secretary@your-domain.com
EMAIL_SCHEDULING=scheduler@your-domain.com
# ... additional email addresses
```

See `.env.example` for a complete list.

## Supabase Setup

### Required Tables

1. **members** - Member profiles and information
2. **news** - News articles (portal-specific)
3. **resources** - Downloadable resources
4. **training_events** - Training events and clinics
5. **evaluations** - Official evaluations
6. **email_logs** - Email history

### Row Level Security (RLS)

Enable RLS on all tables and configure policies:

- Public read access for published content
- Authenticated access for member-only content
- Admin-only access for sensitive data

### Authentication

The portal uses Supabase Auth. Configure:

1. Enable Email/Password authentication
2. Set up email templates
3. Configure redirect URLs

## Deployment

### Netlify (Recommended)

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Add environment variables in Netlify dashboard
5. Enable Netlify Functions for API routes

### Environment Variables in Netlify

Add all variables from `.env.example` in:
Site settings > Build & deploy > Environment

## Project Structure

```
officials-portal/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── portal/            # Member portal pages
│   └── [pages]/           # Public pages
├── components/            # React components
│   ├── content/           # Content display
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── ui/                # UI components
├── config/                # Configuration
│   └── organization.ts    # Organization settings
├── content/               # CMS content (markdown/yaml)
├── lib/                   # Utilities and helpers
├── netlify/
│   └── functions/         # Netlify serverless functions
└── public/                # Static assets
```

## Customization

### Adding New Pages

1. Create a new file in `app/` directory
2. Use existing components from `components/`
3. Follow the established patterns

### Modifying Components

Components are organized by function:
- `components/ui/` - Reusable UI elements
- `components/content/` - Content display components
- `components/forms/` - Form components
- `components/layout/` - Header, Footer, etc.

### Styling

- Uses Tailwind CSS for styling
- Brand colors: `brand-primary`, `brand-secondary`, `brand-dark`, `brand-accent`
- Responsive breakpoints follow Tailwind defaults

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **CMS**: Decap CMS
- **Deployment**: Netlify
- **Email**: Microsoft Graph API

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Support

- [Setup Documentation](docs/setup/GETTING-STARTED.md) - Complete deployment guide
- [Issues](https://github.com/fisherjoey/officials-portal/issues) - Report bugs or request features
- [Discussions](https://github.com/fisherjoey/officials-portal/discussions) - Ask questions and share ideas

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with love by [SyncedSport](https://syncedsport.com) for the sports officiating community.
