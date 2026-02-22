# Decap CMS Setup Guide

This comprehensive guide covers setting up and configuring Decap CMS (formerly Netlify CMS) for the officials-portal project. Decap CMS provides a git-based content management system that allows non-technical users to update website content through an intuitive admin interface.

## Table of Contents

1. [Understanding Decap CMS](#understanding-decap-cms)
2. [Prerequisites](#prerequisites)
3. [Enabling Netlify Identity](#enabling-netlify-identity)
4. [Configuring Git Gateway](#configuring-git-gateway)
5. [Setting Up Admin Users](#setting-up-admin-users)
6. [CMS Configuration File](#cms-configuration-file)
7. [Content Collections](#content-collections)
8. [Media and Image Uploads](#media-and-image-uploads)
9. [Local Development](#local-development)
10. [Customizing the CMS](#customizing-the-cms)
11. [Troubleshooting](#troubleshooting)

---

## Understanding Decap CMS

### What is Decap CMS?

Decap CMS (formerly Netlify CMS) is an open-source, git-based content management system. Unlike traditional CMS platforms that store content in a database, Decap CMS stores all content as files in your Git repository. This approach offers several advantages:

- **Version Control**: Every change is tracked in Git history
- **No Database Required**: Content is stored as Markdown/YAML files
- **Works with Static Site Generators**: Perfect for Next.js, Gatsby, Hugo, etc.
- **Collaborative Editing**: Multiple editors can work through pull requests
- **No Lock-in**: Your content remains portable Markdown files

### How It Works with officials-portal

The officials-portal uses Decap CMS to manage:

- **News Articles**: Public-facing news and announcements
- **Training Events**: Upcoming clinics, workshops, and certification sessions
- **Rule Modifications**: League and tournament-specific rule changes
- **Portal Announcements**: Member-only announcements
- **Site Settings**: Organization name, contact info, statistics
- **Static Pages**: Home page content, About page, etc.

Content is stored in the `content/` directory as Markdown files with YAML frontmatter:

```
content/
├── news/                    # Public news articles
├── training/                # Training events
├── portal/
│   ├── announcements/       # Member announcements
│   └── rule-modifications/  # Rule modifications
├── pages/                   # Static page content
│   ├── home.md
│   └── about.md
├── resources/               # Resource links
└── settings/                # Site configuration
    ├── general.yml
    └── site.json
```

---

## Prerequisites

Before setting up Decap CMS, ensure you have:

1. **Deployed Site on Netlify**: Your officials-portal must be deployed to Netlify
2. **GitHub Repository**: The project should be hosted on GitHub (or GitLab/Bitbucket)
3. **Admin Access**: You need admin access to both the Netlify site and Git repository
4. **Node.js 18+**: For local development

### Verify Dependencies

The officials-portal already includes the necessary packages. Verify in `package.json`:

```json
{
  "dependencies": {
    "decap-cms-app": "^3.8.3"
  },
  "devDependencies": {
    "decap-server": "^3.4.0"
  }
}
```

---

## Enabling Netlify Identity

Netlify Identity provides user authentication for the CMS. Follow these exact steps to enable it:

### Step 1: Access Netlify Site Settings

1. Log in to [Netlify](https://app.netlify.com)
2. Select your officials-portal site from the dashboard
3. Click **Site settings** in the top navigation

### Step 2: Enable Netlify Identity

1. In the left sidebar, click **Identity**
2. Click the **Enable Identity** button
3. Wait for the confirmation message

### Step 3: Configure Registration Settings

After enabling Identity, configure registration preferences:

1. Still in **Identity** settings, scroll to **Registration preferences**
2. Choose your registration type:
   - **Open**: Anyone can register (not recommended for most use cases)
   - **Invite only**: Only invited users can access (recommended)
3. Click **Save**

**Recommended**: Select **Invite only** to control who can access the CMS.

### Step 4: Configure External Providers (Optional)

You can allow sign-in via external providers:

1. Scroll to **External providers**
2. Click **Add provider**
3. Select a provider (Google, GitHub, GitLab, Bitbucket)
4. Follow the provider-specific setup instructions
5. Click **Enable**

**Note**: For most officials associations, email/password authentication is sufficient.

### Step 5: Set Up Email Templates (Optional but Recommended)

Customize the emails sent to users:

1. Scroll to **Email templates**
2. Click **Edit** for each template type:
   - **Invitation template**: Sent when inviting new users
   - **Confirmation template**: Sent to verify email addresses
   - **Password recovery template**: Sent when users reset passwords
3. Customize the subject and body as needed
4. Include `{{ .SiteURL }}` and `{{ .Token }}` variables appropriately

Example invitation template:

```
Subject: You're invited to manage {{ .SiteURL }}

You have been invited to manage content on the Officials Portal.

Click the link below to accept the invitation:
{{ .SiteURL }}/admin/#invite_token={{ .Token }}

This link will expire in 24 hours.
```

---

## Configuring Git Gateway

Git Gateway allows the CMS to make commits to your repository on behalf of authenticated users, without requiring each user to have direct repository access.

### Step 1: Enable Git Gateway

1. In your Netlify site settings, go to **Identity** in the sidebar
2. Scroll down to **Services**
3. Click **Enable Git Gateway**

### Step 2: Connect Your Repository

If not already connected:

1. Netlify will prompt you to authorize access to your Git provider
2. Click **Authorize** and follow the OAuth flow
3. Select the repository containing your officials-portal code
4. Confirm the connection

### Step 3: Configure Git Gateway Roles (Optional)

You can restrict Git Gateway access to specific roles:

1. In the Git Gateway settings, find **Roles**
2. Add roles that should have CMS access (e.g., `admin`, `editor`)
3. Click **Save**

**Note**: If you leave roles empty, all authenticated users can access the CMS.

### Step 4: Verify Configuration

Your Git Gateway is properly configured when you see:

- Status: **Enabled**
- Repository: **your-username/officials-portal**
- Branch: **main** (or your default branch)

---

## Setting Up Admin Users

### Inviting Users via Netlify Dashboard

1. Go to your Netlify site dashboard
2. Click **Identity** in the top navigation
3. Click the **Invite users** button
4. Enter email addresses (one per line)
5. Click **Send**

Invited users will receive an email with a link to set their password.

### Assigning Roles to Users

Roles control what users can do in the CMS:

1. In the **Identity** tab, find the user
2. Click on the user's email to open their profile
3. Click **Edit settings**
4. In the **Role** field, enter role(s):
   - `admin` - Full CMS access
   - `editor` - Can edit content but not settings
5. Click **Save**

### Managing Users Programmatically

The officials-portal includes an identity signup function (`netlify/functions/identity-signup.js`) that can automatically assign roles based on email addresses or other criteria.

### Recommended Role Structure

| Role | Description | CMS Access |
|------|-------------|------------|
| `admin` | Full administrative access | All collections |
| `editor` | Content editors | News, Training, Announcements |
| `contributor` | Limited content creation | Submit drafts only |

---

## CMS Configuration File

The CMS is configured via `public/admin/config.yml`. This file defines the backend, collections, and field types.

### Create the Admin Directory

Create the following file structure:

```
public/
└── admin/
    ├── index.html
    └── config.yml
```

### index.html

Create `public/admin/index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <title>Content Manager | Officials Portal</title>
</head>
<body>
  <!-- Include the script that builds the page and powers Decap CMS -->
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
</body>
</html>
```

### config.yml

Create `public/admin/config.yml`:

```yaml
# Decap CMS Configuration for Officials Portal
# Documentation: https://decapcms.org/docs/

# =============================================================================
# BACKEND CONFIGURATION
# =============================================================================

backend:
  name: git-gateway
  branch: main
  commit_messages:
    create: 'Create {{collection}} "{{slug}}"'
    update: 'Update {{collection}} "{{slug}}"'
    delete: 'Delete {{collection}} "{{slug}}"'
    uploadMedia: 'Upload "{{path}}"'
    deleteMedia: 'Delete "{{path}}"'

# Local backend for development (use with npx decap-server)
local_backend: true

# =============================================================================
# MEDIA CONFIGURATION
# =============================================================================

media_folder: "public/images/uploads"
public_folder: "/images/uploads"

# =============================================================================
# SITE SETTINGS
# =============================================================================

site_url: https://your-domain.netlify.app
display_url: https://your-domain.netlify.app
logo_url: /images/logos/logo.png

# =============================================================================
# EDITORIAL WORKFLOW (Optional)
# =============================================================================

# Enable editorial workflow for draft/review/publish stages
# publish_mode: editorial_workflow

# =============================================================================
# COLLECTIONS
# =============================================================================

collections:
  # ---------------------------------------------------------------------------
  # NEWS ARTICLES
  # ---------------------------------------------------------------------------
  - name: "news"
    label: "News"
    label_singular: "News Article"
    folder: "content/news"
    create: true
    slug: "{{slug}}"
    preview_path: "news/{{slug}}"
    summary: "{{title}} - {{date}}"
    sortable_fields: ["date", "title"]
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Publish Date", name: "date", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false }
      - { label: "Author", name: "author", widget: "string", default: "Executive Board" }
      - { label: "Featured Image", name: "image", widget: "image", required: false, allow_multiple: false }
      - { label: "Excerpt", name: "excerpt", widget: "text", hint: "Brief summary for previews (1-2 sentences)" }
      - { label: "Featured", name: "featured", widget: "boolean", default: false, hint: "Show on homepage" }
      - label: "Tags"
        name: "tags"
        widget: "list"
        allow_add: true
        default: ["news"]
      - { label: "Body", name: "body", widget: "markdown" }

  # ---------------------------------------------------------------------------
  # TRAINING EVENTS
  # ---------------------------------------------------------------------------
  - name: "training"
    label: "Training Events"
    label_singular: "Training Event"
    folder: "content/training"
    create: true
    slug: "{{slug}}"
    preview_path: "training/{{slug}}"
    summary: "{{title}} - {{date}}"
    sortable_fields: ["date", "title", "level"]
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Date", name: "date", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false }
      - { label: "Time", name: "time", widget: "string", hint: "e.g., 9:00 AM - 4:00 PM" }
      - { label: "Location", name: "location", widget: "string" }
      - { label: "Instructor", name: "instructor", widget: "string", default: "Education Committee" }
      - label: "Level"
        name: "level"
        widget: "select"
        options:
          - { label: "Beginner", value: "Beginner" }
          - { label: "Intermediate", value: "Intermediate" }
          - { label: "Advanced", value: "Advanced" }
          - { label: "All Levels", value: "All Levels" }
      - { label: "Cost", name: "cost", widget: "string", hint: "e.g., $75 or Free" }
      - { label: "Max Participants", name: "maxParticipants", widget: "number", required: false }
      - { label: "Registration URL", name: "registrationUrl", widget: "string", required: false }
      - { label: "Excerpt", name: "excerpt", widget: "text", hint: "Brief description for event listings" }
      - label: "Tags"
        name: "tags"
        widget: "list"
        allow_add: true
        default: ["training"]
      - { label: "Body", name: "body", widget: "markdown" }

  # ---------------------------------------------------------------------------
  # PORTAL ANNOUNCEMENTS
  # ---------------------------------------------------------------------------
  - name: "announcements"
    label: "Portal Announcements"
    label_singular: "Announcement"
    folder: "content/portal/announcements"
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    summary: "{{title}} - {{date}}"
    sortable_fields: ["date", "title", "urgent"]
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Date", name: "date", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false }
      - { label: "Author", name: "author", widget: "string", default: "Executive" }
      - { label: "Urgent", name: "urgent", widget: "boolean", default: false, hint: "Highlight as urgent" }
      - label: "Category"
        name: "category"
        widget: "select"
        options:
          - { label: "General", value: "general" }
          - { label: "Schedule", value: "schedule" }
          - { label: "Rules", value: "rules" }
          - { label: "Training", value: "training" }
          - { label: "Administrative", value: "admin" }
      - label: "Audience"
        name: "audience"
        widget: "select"
        multiple: true
        options:
          - { label: "All Members", value: "all" }
          - { label: "New Officials", value: "new" }
          - { label: "Certified Officials", value: "certified" }
          - { label: "Supervisors", value: "supervisors" }
        default: ["all"]
      - { label: "Body", name: "body", widget: "markdown" }

  # ---------------------------------------------------------------------------
  # RULE MODIFICATIONS
  # ---------------------------------------------------------------------------
  - name: "rule-modifications"
    label: "Rule Modifications"
    label_singular: "Rule Modification"
    folder: "content/portal/rule-modifications"
    create: true
    slug: "{{slug}}"
    summary: "{{title}} - {{category}} - {{season}}"
    sortable_fields: ["title", "category", "season"]
    fields:
      - { label: "Title", name: "title", widget: "string", hint: "e.g., Youth Basketball League" }
      - label: "Category"
        name: "category"
        widget: "select"
        options:
          - { label: "Youth", value: "Youth" }
          - { label: "High School", value: "High School" }
          - { label: "Adult", value: "Adult" }
          - { label: "Tournament", value: "Tournament" }
          - { label: "Special Event", value: "Special Event" }
      - { label: "Season", name: "season", widget: "string", hint: "e.g., 2024-25" }
      - { label: "Last Updated", name: "lastUpdated", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false }
      - { label: "Body", name: "body", widget: "markdown" }

  # ---------------------------------------------------------------------------
  # PUBLIC RESOURCES
  # ---------------------------------------------------------------------------
  - name: "resources"
    label: "Resources"
    label_singular: "Resource"
    folder: "content/resources"
    create: true
    slug: "{{slug}}"
    summary: "{{title}} - {{category}}"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - label: "Category"
        name: "category"
        widget: "select"
        options:
          - { label: "Rules", value: "rules" }
          - { label: "Training", value: "training" }
          - { label: "Forms", value: "forms" }
          - { label: "Guidelines", value: "guidelines" }
      - { label: "Description", name: "description", widget: "text" }
      - { label: "External Link", name: "externalLink", widget: "string", required: false, hint: "URL for external resources" }
      - { label: "Body", name: "body", widget: "markdown", required: false }

  # ---------------------------------------------------------------------------
  # PAGES
  # ---------------------------------------------------------------------------
  - name: "pages"
    label: "Pages"
    label_singular: "Page"
    folder: "content/pages"
    create: true
    slug: "{{slug}}"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Body", name: "body", widget: "markdown" }

  # ---------------------------------------------------------------------------
  # HOME PAGE
  # ---------------------------------------------------------------------------
  - name: "home"
    label: "Home Page"
    files:
      - name: "home"
        label: "Home Page Content"
        file: "content/pages/home.md"
        fields:
          - { label: "Hero Title", name: "heroTitle", widget: "string" }
          - { label: "Hero Subtitle", name: "heroSubtitle", widget: "string" }
          - { label: "Hero Image", name: "heroImage", widget: "image", required: false }
          - label: "Statistics"
            name: "stats"
            widget: "list"
            allow_add: true
            fields:
              - { label: "Label", name: "label", widget: "string" }
              - { label: "Value", name: "value", widget: "string" }
          - { label: "About Section", name: "aboutSection", widget: "markdown" }

  # ---------------------------------------------------------------------------
  # SITE SETTINGS
  # ---------------------------------------------------------------------------
  - name: "settings"
    label: "Settings"
    files:
      - name: "general"
        label: "General Settings"
        file: "content/settings/general.yml"
        fields:
          - { label: "Site Title", name: "siteTitle", widget: "string" }
          - { label: "Site Description", name: "siteDescription", widget: "text" }
          - label: "Statistics"
            name: "statistics"
            widget: "object"
            fields:
              - { label: "Active Officials", name: "activeOfficials", widget: "string" }
              - { label: "Games Per Season", name: "gamesPerSeason", widget: "string" }
              - { label: "Years of Service", name: "yearsOfService", widget: "string" }
          - label: "Executive Team"
            name: "executiveTeam"
            widget: "list"
            allow_add: true
            fields:
              - { label: "Name", name: "name", widget: "string" }
              - { label: "Position", name: "position", widget: "string" }
              - { label: "Email", name: "email", widget: "string" }
              - { label: "Image", name: "image", widget: "image", required: false }
          - label: "Social Media"
            name: "socialMedia"
            widget: "object"
            fields:
              - { label: "Facebook", name: "facebook", widget: "string", required: false }
              - { label: "Twitter", name: "twitter", widget: "string", required: false }
              - { label: "Instagram", name: "instagram", widget: "string", required: false }
              - { label: "YouTube", name: "youtube", widget: "string", required: false }
          - label: "Contact"
            name: "contact"
            widget: "object"
            fields:
              - { label: "Email", name: "email", widget: "string" }
              - { label: "Address", name: "address", widget: "string" }

      - name: "site"
        label: "Site Information"
        file: "content/settings/site.json"
        fields:
          - { label: "Title", name: "title", widget: "string" }
          - { label: "Description", name: "description", widget: "text" }
          - label: "Contact"
            name: "contact"
            widget: "object"
            fields:
              - { label: "Email", name: "email", widget: "string" }
              - { label: "Address", name: "address", widget: "string" }
          - label: "Social Media"
            name: "social"
            widget: "object"
            fields:
              - { label: "Facebook", name: "facebook", widget: "string", required: false }
              - { label: "Twitter", name: "twitter", widget: "string", required: false }
              - { label: "Instagram", name: "instagram", widget: "string", required: false }
```

---

## Content Collections

### Understanding Collections

Collections define the content types available in the CMS. Each collection maps to a folder in the `content/` directory.

### Collection Types

#### Folder Collections

Most collections are "folder" collections - they create individual files for each entry:

```yaml
- name: "news"
  folder: "content/news"   # Stores files in content/news/
  create: true             # Allow creating new entries
  slug: "{{slug}}"         # Filename pattern
```

#### File Collections

Settings and single-page content use "file" collections:

```yaml
- name: "settings"
  files:
    - name: "general"
      file: "content/settings/general.yml"  # Single file
```

### Content Structure in officials-portal

| Collection | Path | File Type | Purpose |
|------------|------|-----------|---------|
| news | `content/news/` | Markdown | Public news articles |
| training | `content/training/` | Markdown | Training events |
| announcements | `content/portal/announcements/` | Markdown | Member announcements |
| rule-modifications | `content/portal/rule-modifications/` | Markdown | Rule modifications |
| resources | `content/resources/` | Markdown | Resource links |
| pages | `content/pages/` | Markdown | Static page content |
| settings | `content/settings/` | YAML/JSON | Site configuration |

### Frontmatter Fields

Each Markdown file has YAML frontmatter defining metadata:

```markdown
---
title: "Season Opening Announcement"
date: "2025-01-15"
author: "Executive Board"
featured: true
tags: ["announcement", "season"]
---

Article body content goes here...
```

The CMS handles frontmatter automatically based on field definitions.

---

## Media and Image Uploads

### Default Media Configuration

The configuration stores uploaded media in:

```yaml
media_folder: "public/images/uploads"   # Physical file location
public_folder: "/images/uploads"        # URL path
```

### Uploading Images

1. In the CMS, click an image field
2. Choose "Upload" or "Choose existing"
3. Select your image file
4. The image is committed to the repository

### Image Field Options

```yaml
- label: "Featured Image"
  name: "image"
  widget: "image"
  required: false
  allow_multiple: false
  media_folder: "/public/images/news"   # Override default
  public_folder: "/images/news"
```

### External Media Libraries (Optional)

For larger sites, consider external media storage:

```yaml
media_library:
  name: cloudinary
  config:
    cloud_name: your-cloud-name
    api_key: your-api-key
```

### Image Optimization Tips

- Resize images before upload (max 1920px width)
- Use WebP or optimized JPEG/PNG
- Consider a build-time image optimization pipeline
- Add lazy loading for better performance

---

## Local Development

### Setting Up Local CMS Development

Local development allows you to test CMS changes without affecting production.

### Step 1: Configure Local Backend

Ensure `config.yml` includes:

```yaml
local_backend: true
```

### Step 2: Run the Decap Server

In a terminal, run:

```bash
npm run dev:cms
# or
npx decap-server
```

This starts a local proxy server on port 8081.

### Step 3: Run the Development Server

In another terminal:

```bash
npm run dev
```

### Step 4: Access the Local CMS

1. Open `http://localhost:3000/admin/`
2. The local backend bypasses authentication
3. Changes are saved directly to your local files

### Local Development Environment Variables

In `.env.local`:

```env
# Use test-repo for isolated local development
# Use git-gateway for production
NEXT_PUBLIC_CMS_BACKEND=test-repo
```

### Switching Between Local and Production

| Environment | Backend | Command |
|-------------|---------|---------|
| Local (Git commits) | `local_backend: true` | `npm run dev:cms && npm run dev` |
| Local (No commits) | `name: test-repo` | `npm run dev` |
| Production | `name: git-gateway` | Automatic on Netlify |

---

## Customizing the CMS

### Custom Previews

Create custom preview components for your content:

```html
<!-- In public/admin/index.html -->
<script>
  var PostPreview = createClass({
    render: function() {
      var entry = this.props.entry;
      return h('div', {},
        h('h1', {}, entry.getIn(['data', 'title'])),
        h('div', {"className": "content"},
          this.props.widgetFor('body')
        )
      );
    }
  });

  CMS.registerPreviewTemplate('news', PostPreview);
</script>
```

### Custom Widgets

Register custom field widgets:

```html
<script>
  CMS.registerWidget(
    'colorpicker',
    ColorPickerControl,
    ColorPickerPreview
  );
</script>
```

### Custom Styling

Add custom CSS to the CMS:

```html
<script>
  CMS.registerPreviewStyle('/admin/preview.css');
</script>
```

### Editor Components

Add custom editor components for Markdown:

```javascript
CMS.registerEditorComponent({
  id: "youtube",
  label: "YouTube",
  fields: [{ name: "id", label: "Video ID", widget: "string" }],
  pattern: /^youtube (\S+)$/,
  fromBlock: function(match) {
    return { id: match[1] };
  },
  toBlock: function(obj) {
    return 'youtube ' + obj.id;
  },
  toPreview: function(obj) {
    return '<img src="https://i.ytimg.com/vi/' + obj.id + '/maxresdefault.jpg" />';
  }
});
```

---

## Troubleshooting

### Authentication Issues

#### "Unable to access identity service"

**Cause**: Netlify Identity is not enabled or configured correctly.

**Solution**:
1. Go to Netlify site settings > Identity
2. Ensure Identity is enabled
3. Check that Git Gateway is also enabled
4. Clear browser cache and try again

#### "Git Gateway Error: Please ask your administrator to enable it"

**Cause**: Git Gateway is not enabled or has lost connection to repository.

**Solution**:
1. Go to Netlify site settings > Identity > Services
2. Click on Git Gateway
3. If it shows disconnected, click "Re-authorize"
4. Reconnect to your GitHub repository

#### "Invalid token" or "Token expired"

**Cause**: Authentication token has expired.

**Solution**:
1. Sign out of the CMS
2. Clear browser localStorage
3. Sign in again with your credentials

#### Users cannot access the CMS

**Cause**: User roles may not be configured.

**Solution**:
1. Go to Netlify Identity tab
2. Click on the user
3. Add appropriate role (e.g., `admin`)
4. User may need to re-authenticate

### Content Issues

#### Changes not appearing on the site

**Cause**: Build not triggered or caching issues.

**Solution**:
1. Check Netlify deploy logs
2. Manually trigger a new deploy
3. Clear CDN cache in Netlify settings
4. Clear browser cache

#### Markdown not rendering correctly

**Cause**: Syntax errors in Markdown or frontmatter.

**Solution**:
1. Validate YAML frontmatter (proper indentation, quotes)
2. Check for unclosed HTML tags in Markdown
3. Use the CMS preview to test rendering

### Local Development Issues

#### "Cannot connect to local backend"

**Cause**: Decap server not running.

**Solution**:
```bash
# Ensure decap-server is running
npx decap-server

# Should show: Decap CMS proxy server listening on port 8081
```

#### Port conflicts

**Cause**: Another process using port 8081.

**Solution**:
```bash
# Find process using port 8081
lsof -i :8081

# Kill the process or use different port
npx decap-server --port 8082
```

### Configuration Issues

#### Collections not appearing

**Cause**: YAML syntax errors in `config.yml`.

**Solution**:
1. Validate YAML at [yamllint.com](http://www.yamllint.com/)
2. Check indentation (use spaces, not tabs)
3. Ensure required fields are present

#### Media uploads failing

**Cause**: Media folder configuration or permissions.

**Solution**:
1. Verify `media_folder` path exists
2. Check Git repository permissions
3. Ensure the folder is not in `.gitignore`

### Recovery Procedures

#### Recovering from bad commit

If CMS makes a problematic commit:

```bash
# View recent commits
git log --oneline -10

# Revert specific commit
git revert <commit-hash>
git push
```

#### Resetting user passwords

1. Go to Netlify Identity
2. Find the user
3. Click "Send recovery email"
4. User will receive password reset link

---

## Additional Resources

- [Decap CMS Documentation](https://decapcms.org/docs/)
- [Netlify Identity Documentation](https://docs.netlify.com/visitor-access/identity/)
- [Git Gateway Documentation](https://docs.netlify.com/visitor-access/git-gateway/)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)

---

## Quick Reference

### Important URLs

| Environment | CMS URL |
|-------------|---------|
| Production | `https://your-domain.netlify.app/admin/` |
| Local | `http://localhost:3000/admin/` |

### Common Commands

```bash
# Start local development
npm run dev

# Start CMS proxy server (for local backend)
npm run dev:cms

# Build for production
npm run build
```

### Environment Variables

```env
# Production
NEXT_PUBLIC_CMS_BACKEND=git-gateway

# Local development
NEXT_PUBLIC_CMS_BACKEND=test-repo
```

### File Locations

| File | Purpose |
|------|---------|
| `public/admin/index.html` | CMS entry point |
| `public/admin/config.yml` | CMS configuration |
| `content/` | Content files |
| `netlify/functions/identity-signup.js` | User signup handling |
| `netlify.toml` | Netlify configuration |
