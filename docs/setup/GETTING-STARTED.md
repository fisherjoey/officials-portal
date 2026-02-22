# Officials Portal - Getting Started Guide

Welcome to the Officials Portal setup guide! This comprehensive document will walk you through deploying your own instance of the Officials Portal, from initial requirements to going live.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Setup Order](#setup-order)
4. [Configuration](#configuration)
5. [Testing Your Setup](#testing-your-setup)
6. [Going Live Checklist](#going-live-checklist)

---

## Prerequisites

Before you begin, ensure you have the following technical requirements, accounts, and knowledge.

### Technical Requirements

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 18.x or higher | Runtime for development and build |
| **npm** | 9.x or higher | Package management (comes with Node.js) |
| **Git** | 2.x or higher | Version control and deployment |

**Verify your installations:**

```bash
node --version    # Should output v18.x.x or higher
npm --version     # Should output 9.x.x or higher
git --version     # Should output git version 2.x.x or higher
```

**Installing Node.js:**
- Download from [nodejs.org](https://nodejs.org/) (LTS version recommended)
- Or use a version manager like [nvm](https://github.com/nvm-sh/nvm) (Mac/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows)

### Required Accounts

You will need accounts with the following services:

| Service | Purpose | Free Tier Available |
|---------|---------|---------------------|
| **GitHub** | Code repository hosting | Yes |
| **Supabase** | Database, authentication, storage | Yes (generous limits) |
| **Netlify** | Web hosting and serverless functions | Yes (100GB bandwidth/month) |
| **Microsoft 365** | Email sending (optional but recommended) | No (requires subscription) |

#### Account Setup Links

1. **GitHub**: [github.com/signup](https://github.com/signup)
2. **Supabase**: [supabase.com](https://supabase.com) - Click "Start your project"
3. **Netlify**: [netlify.com](https://app.netlify.com/signup) - Sign up with GitHub recommended
4. **Microsoft 365**: [microsoft.com/microsoft-365](https://www.microsoft.com/microsoft-365/business) - Business Basic or higher required for Graph API

### Optional Accounts

| Service | Purpose | When Needed |
|---------|---------|-------------|
| **Domain Registrar** | Custom domain (e.g., Namecheap, Cloudflare) | For production deployment |
| **SharePoint** | Excel file synchronization | For form submissions to spreadsheets |
| **Google Analytics** | Website analytics | For traffic monitoring |

### Helpful Skills/Knowledge

While this guide aims to be comprehensive, having familiarity with these areas will help:

- **Basic command line usage** - Navigating directories, running commands
- **Git fundamentals** - Clone, commit, push, branches
- **React/Next.js basics** - For customizing components (optional)
- **Environment variables** - Understanding `.env` files
- **DNS concepts** - For custom domain setup (covered in DNS.md)

---

## Architecture Overview

The Officials Portal uses a modern JAMstack architecture with the following components:

### System Architecture Diagram

```
                                    +------------------+
                                    |   Your Domain    |
                                    |  (example.com)   |
                                    +--------+---------+
                                             |
                                             v
+------------------+              +----------+---------+
|   DNS Provider   |              |      Netlify       |
| (Namecheap, etc) +------------->|                    |
+------------------+              |  - Static Hosting  |
                                  |  - CDN Edge        |
                                  |  - Functions       |
                                  |  - SSL Certs       |
                                  +----------+---------+
                                             |
                         +-------------------+-------------------+
                         |                                       |
                         v                                       v
              +----------+---------+                  +----------+---------+
              |     Supabase       |                  |   Microsoft 365    |
              |                    |                  |                    |
              |  - PostgreSQL DB   |                  |  - Email Sending   |
              |  - Authentication  |                  |  - Graph API       |
              |  - File Storage    |                  |                    |
              |  - Row Level Sec.  |                  |                    |
              +--------------------+                  +--------------------+
```

### Component Responsibilities

#### Netlify (Web Hosting & Functions)

- **Static Site Hosting**: Serves the Next.js static export globally via CDN
- **Serverless Functions**: Handles API endpoints (email, database operations, auth)
- **SSL/TLS**: Automatic HTTPS certificate provisioning via Let's Encrypt
- **Build Pipeline**: Automatically builds and deploys on git push
- **Branch Previews**: Creates preview URLs for pull requests

#### Supabase (Backend Services)

- **PostgreSQL Database**: Stores all application data
  - Members and profiles
  - News articles, resources, training events
  - Evaluations and activity logs
  - Email history
- **Authentication**: Handles user signup, login, password reset
- **Row Level Security (RLS)**: Enforces data access policies at database level
- **File Storage**: Stores uploaded files (newsletters, resources, images)
- **Realtime**: (Future) Live updates for notifications

#### Microsoft 365 / Graph API (Email)

- **Transactional Email**: Sends email notifications through your organization's email
- **Contact Form Routing**: Routes contact submissions to appropriate staff
- **Announcements**: Bulk email to members
- **Authentication Emails**: Welcome emails, password resets (via Supabase templates)

#### GitHub (Source Control)

- **Repository Hosting**: Stores your codebase
- **Netlify Integration**: Triggers deployments on push
- **Version Control**: Track changes and collaborate

### Data Flow Examples

**User Login Flow:**
```
Browser -> Netlify -> Supabase Auth -> JWT Token -> Browser
```

**Sending Announcement:**
```
Admin Portal -> Netlify Function -> Microsoft Graph API -> Email Recipients
```

**Uploading Resource:**
```
Admin Portal -> Netlify Function -> Supabase Storage -> CDN URL returned
```

---

## Setup Order

Follow these steps in order. Each step depends on the previous ones being completed.

### Step 1: Fork/Clone the Repository

1. **Fork the repository** (recommended for receiving updates):
   - Go to [github.com/fisherjoey/officials-portal](https://github.com/fisherjoey/officials-portal)
   - Click "Fork" button in the top right
   - Select your GitHub account as the destination

2. **Clone to your local machine**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/officials-portal.git
   cd officials-portal
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Create environment file**:
   ```bash
   cp .env.example .env.local
   ```

5. **Verify local development works**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) - you should see the homepage (with placeholder content).

### Step 2: Supabase Setup

Supabase provides the database, authentication, and file storage.

**See: [SUPABASE.md](./SUPABASE.md)** for detailed instructions.

Quick overview:
1. Create a new Supabase project
2. Run the database migrations (SQL scripts)
3. Configure authentication settings
4. Set up storage buckets
5. Copy API keys to `.env.local`

**Environment variables from this step:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Netlify Deployment

Netlify hosts your site and runs serverless functions.

**See: [NETLIFY.md](./NETLIFY.md)** for detailed instructions.

Quick overview:
1. Connect your GitHub repository to Netlify
2. Configure build settings
3. Add environment variables
4. Enable Netlify Functions
5. Deploy and verify

**Build settings:**
- Build command: `npm install && npm run build`
- Publish directory: `.next`
- Functions directory: `netlify/functions`

### Step 4: DNS Configuration (Custom Domain)

Point your custom domain to Netlify.

**See: [DNS.md](./DNS.md)** for detailed instructions.

Quick overview:
1. Purchase a domain (if you don't have one)
2. Add custom domain in Netlify
3. Configure DNS records at your registrar
4. Wait for SSL certificate provisioning

### Step 5: Email Setup (Microsoft 365)

Configure email sending through Microsoft Graph API.

**See: [EMAIL.md](./EMAIL.md)** for detailed instructions.

Quick overview:
1. Create Azure AD app registration
2. Configure API permissions for Mail.Send
3. Set up email addresses in Microsoft 365
4. Add credentials to Netlify environment variables
5. Configure DNS records for email authentication (SPF, DKIM, DMARC)

**Environment variables from this step:**
```env
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
EMAIL_SENDER=announcements@your-domain.com
EMAIL_GENERAL=secretary@your-domain.com
# ... additional email addresses
```

### Step 6: CMS Setup (Decap CMS)

Configure the content management system for non-technical editors.

**See: [CMS.md](./CMS.md)** for detailed instructions.

Quick overview:
1. Enable Netlify Identity
2. Configure Git Gateway
3. Invite CMS users
4. Customize CMS collections if needed

---

## Configuration

After completing the setup steps, customize the portal for your organization.

### Organization Settings

Edit `config/organization.ts` with your organization's details:

```typescript
export const orgConfig = {
  // Organization Identity
  name: "Your Officials Association",        // Full organization name
  shortName: "YOA",                          // Abbreviation/acronym
  description: "Official website for...",    // Meta description for SEO
  domain: "yoursite.com",                    // Your domain (without https://)
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://yoursite.com",

  // Contact Information
  contact: {
    email: "info@yoursite.com",              // Primary contact email
    address: "City, State, Country",         // Physical location
  },

  // Role-based Email Addresses
  emails: {
    general: "secretary@yoursite.com",
    president: "president@yoursite.com",
    scheduler: "scheduler@yoursite.com",
    education: "education@yoursite.com",
    // ... add all relevant positions
  },

  // Social Media Links (leave empty string if not used)
  social: {
    facebook: "https://facebook.com/yourorg",
    instagram: "https://instagram.com/yourorg",
    twitter: "",  // Empty if not used
    youtube: "",
  },

  // Feature Flags
  features: {
    memberPortal: true,          // Enable member-only portal
    publicNews: true,            // Show news on public site
    publicTraining: true,        // Show training events publicly
    ruleModifications: true,     // Enable rule modifications section
    evaluations: true,           // Enable official evaluations
    newsletter: true,            // Enable newsletter archive
    campaigns: false,            // Special campaign banners
  },

  // Customize terminology
  labels: {
    official: "Official",        // Or "Referee", "Umpire", etc.
    officials: "Officials",
    game: "Game",                // Or "Match", "Contest"
    newOfficialProgram: "New Official Training",  // Your program name
  },
}
```

### Brand Colors

Edit colors in `tailwind.config.ts`:

```typescript
colors: {
  'brand-primary': '#ff6b35',    // Main accent (buttons, links)
  'brand-secondary': '#2c3e50',  // Secondary (nav, headers)
  'brand-dark': '#1a1a1a',       // Dark backgrounds
  'brand-accent': '#3498db',     // Additional accent highlights
}
```

**Color usage in the application:**
- `brand-primary`: Primary buttons, active links, focus states
- `brand-secondary`: Navigation bar, section headers, cards
- `brand-dark`: Footer, dark mode backgrounds
- `brand-accent`: Secondary buttons, info badges, highlights

**Finding your colors:**
- Use your organization's official brand colors
- Ensure sufficient contrast for accessibility (4.5:1 ratio minimum)
- Tools: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Logo and Favicon

Replace these files in the `public/` directory:

| File | Purpose | Recommended Size |
|------|---------|------------------|
| `favicon.ico` | Browser tab icon | 32x32 px |
| `favicon.svg` | Modern browsers | 32x32 px (vector) |
| `app/icon.png` | App icon | 512x512 px |
| `app/apple-icon.png` | iOS home screen | 180x180 px |
| `public/logo-inverted.png` | Header logo (dark bg) | 200px wide |

### Content Customization

#### Static Pages (Markdown)

Edit content files in `content/` directory:

- `content/pages/home.md` - Homepage content
- `content/pages/about.md` - About page content

#### Portal Content

Content in the portal is managed through:
- **Supabase database** - Dynamic content (news, events, members)
- **Admin panel** - `/portal/admin` for authorized users

#### Email Templates

Customize email templates in `public/emails/`:
- `confirmation.html` - Email confirmation
- `recovery.html` - Password reset
- `invitation.html` - New member invitation

---

## Testing Your Setup

Before going live, verify everything works correctly.

### Pre-Launch Checklist

#### Core Functionality

- [ ] **Homepage loads** - Visit your Netlify URL or custom domain
- [ ] **All pages accessible** - Click through navigation, no 404 errors
- [ ] **SSL certificate active** - Padlock icon in browser, `https://` URL
- [ ] **Mobile responsive** - Test on phone or browser dev tools

#### Authentication

- [ ] **Registration works** - Create a test account
- [ ] **Login/logout works** - Log in and out successfully
- [ ] **Password reset works** - Trigger and complete password reset
- [ ] **Confirmation emails arrive** - Check inbox (and spam folder)

#### Portal Features

- [ ] **Portal accessible after login** - Navigate to `/portal`
- [ ] **Member profile loads** - `/portal/profile` shows user data
- [ ] **Resources page works** - Files display and download correctly
- [ ] **Newsletter archive works** - PDFs display correctly

#### Admin Features

- [ ] **Admin panel accessible** - `/portal/admin` (requires admin role)
- [ ] **Can create content** - Add a test news article
- [ ] **Can manage members** - View and edit member list
- [ ] **Email sending works** - Send a test announcement

#### Contact & Forms

- [ ] **Contact form submits** - Test with your email
- [ ] **Contact form routes correctly** - Check appropriate inbox
- [ ] **Get Officials form works** - Submit and verify receipt

### Common Issues and Solutions

#### Issue: "Site not found" or blank page

**Causes:**
- Build failed on Netlify
- Incorrect publish directory

**Solutions:**
1. Check Netlify deploy logs for errors
2. Verify publish directory is `.next` (not `out` or `build`)
3. Ensure all environment variables are set in Netlify

#### Issue: Login/signup not working

**Causes:**
- Supabase URL or keys incorrect
- Authentication not configured in Supabase

**Solutions:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check Supabase Auth settings
3. Ensure email provider is enabled in Supabase

#### Issue: API functions return 500 errors

**Causes:**
- Missing environment variables
- Service role key incorrect

**Solutions:**
1. Check all environment variables in Netlify
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is the service role (not anon) key
3. Check Netlify function logs for specific errors

#### Issue: Emails not sending

**Causes:**
- Microsoft credentials incorrect
- Email not configured in Microsoft 365
- DNS records not propagated

**Solutions:**
1. Verify Azure AD app credentials
2. Ensure sender email exists in Microsoft 365
3. Check SPF/DKIM/DMARC records with [MXToolbox](https://mxtoolbox.com)

#### Issue: Images/files not loading

**Causes:**
- Supabase storage not configured
- Bucket permissions incorrect

**Solutions:**
1. Verify storage buckets exist in Supabase
2. Check bucket RLS policies
3. Ensure `NEXT_PUBLIC_SUPABASE_URL` is correct

#### Issue: SSL certificate not provisioning

**Causes:**
- DNS not pointing to Netlify
- Propagation not complete

**Solutions:**
1. Verify DNS records with [whatsmydns.net](https://whatsmydns.net)
2. Wait up to 48 hours for propagation
3. Contact Netlify support if DNS is correct but certificate fails

---

## Going Live Checklist

Complete these final steps before announcing your site.

### Security Review

- [ ] **Remove test accounts** - Delete any test users created during setup
- [ ] **Review admin users** - Ensure only authorized people have admin access
- [ ] **Check environment variables** - No secrets committed to git
- [ ] **Enable force HTTPS** - Netlify Site settings > Domain management > HTTPS
- [ ] **Review RLS policies** - Verify Supabase row-level security is enabled
- [ ] **Test unauthorized access** - Try accessing portal without login

### Performance Checks

- [ ] **Page load speed** - Test with [PageSpeed Insights](https://pagespeed.web.dev/)
- [ ] **Mobile performance** - Score 80+ on mobile
- [ ] **Images optimized** - Use WebP format, appropriate sizes
- [ ] **CDN working** - Assets served from edge locations

### Content Review

- [ ] **Organization details correct** - Name, contact info, addresses
- [ ] **No placeholder content** - Replace all "Lorem ipsum" text
- [ ] **Links working** - No broken internal or external links
- [ ] **Social links correct** - Verify all social media URLs

### DNS Verification

- [ ] **Domain resolves** - Site loads at your custom domain
- [ ] **WWW redirect works** - Both www and non-www work
- [ ] **Email DNS records** - Verify with MXToolbox:
  - SPF record valid
  - DKIM signing enabled
  - DMARC policy set

### Legal & Compliance

- [ ] **Privacy policy** - If collecting personal data
- [ ] **Terms of service** - If required for your jurisdiction
- [ ] **Cookie notice** - If using analytics/tracking
- [ ] **Accessibility** - Basic WCAG compliance (alt text, contrast)

### Backup & Recovery

- [ ] **Database backup enabled** - Supabase automatic backups
- [ ] **Know recovery process** - Document how to restore if needed
- [ ] **Code in version control** - All changes committed to git

### Documentation

- [ ] **Admin documentation** - Train staff on using the portal
- [ ] **Password recovery process** - Document for member support
- [ ] **Contact for technical issues** - Who to contact if site is down

### Launch Day

- [ ] **Monitor deployment** - Watch for errors in first 24 hours
- [ ] **Check email deliverability** - Send test emails
- [ ] **Monitor error logs** - Netlify functions, Supabase logs
- [ ] **Have rollback plan** - Know how to revert if critical issues

---

## Next Steps

After your site is live:

1. **Add content** - News articles, resources, training events
2. **Invite members** - Use the admin panel to invite users
3. **Configure CMS** - If using Decap CMS for content editing
4. **Monitor analytics** - Set up Google Analytics if desired
5. **Plan updates** - Subscribe to repository for updates

### Getting Help

- **Documentation**: Review the individual setup guides
- **GitHub Issues**: [Report bugs or request features](https://github.com/fisherjoey/officials-portal/issues)
- **Discussions**: [Ask questions](https://github.com/fisherjoey/officials-portal/discussions)

### Keeping Updated

To receive updates from the main repository:

```bash
# Add upstream remote (one-time)
git remote add upstream https://github.com/fisherjoey/officials-portal.git

# Fetch and merge updates
git fetch upstream
git merge upstream/main
```

Review changes before merging to ensure compatibility with your customizations.

---

## Related Documentation

- [DNS.md](./DNS.md) - Domain and DNS configuration
- [SUPABASE.md](./SUPABASE.md) - Database and authentication setup
- [NETLIFY.md](./NETLIFY.md) - Hosting and deployment
- [EMAIL.md](./EMAIL.md) - Microsoft 365 email integration
- [CMS.md](./CMS.md) - Content management system setup

---

*Last updated: February 2026*
