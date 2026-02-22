# Netlify Setup Guide for Officials Portal

This comprehensive guide walks you through deploying the Officials Portal on Netlify. It covers account creation, repository connection, build configuration, environment variables, serverless functions, custom domains, and deployment verification.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Creating a Netlify Account](#creating-a-netlify-account)
3. [Creating a Team](#creating-a-team)
4. [Connecting to GitHub Repository](#connecting-to-github-repository)
5. [Build Settings Configuration](#build-settings-configuration)
6. [Environment Variables Setup](#environment-variables-setup)
7. [Netlify Functions Configuration](#netlify-functions-configuration)
8. [Deploy Previews and Branch Deploys](#deploy-previews-and-branch-deploys)
9. [Custom Domain Setup](#custom-domain-setup)
10. [Testing the Deployment](#testing-the-deployment)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- A GitHub account with access to the officials-portal repository
- A Supabase project set up with the required database schema
- Microsoft Azure AD app registration (for email functionality)
- Node.js 18 or higher installed locally (for testing)

---

## Creating a Netlify Account

### Step 1: Sign Up

1. Navigate to [https://www.netlify.com](https://www.netlify.com)
2. Click **Sign up** in the top-right corner
3. Choose your signup method:
   - **GitHub** (recommended - enables seamless repository access)
   - Email
   - GitLab
   - Bitbucket

### Step 2: Authorize GitHub (if using GitHub signup)

1. Click **Sign up with GitHub**
2. Review the permissions Netlify is requesting
3. Click **Authorize netlify**
4. You will be redirected to the Netlify dashboard

### Step 3: Verify Your Email

1. Check your email for a verification link from Netlify
2. Click the link to verify your account
3. Complete any onboarding prompts

---

## Creating a Team

Teams help organize projects and manage access for multiple collaborators.

### Step 1: Create a New Team

1. From your Netlify dashboard, click your profile icon (top-right)
2. Select **Team settings** or click **Create new team**
3. Enter a team name (e.g., "Officials Portal" or your organization name)
4. Choose a team slug (URL-friendly identifier)
5. Click **Create team**

### Step 2: Invite Team Members (Optional)

1. Go to **Team settings** > **Members**
2. Click **Invite members**
3. Enter email addresses of collaborators
4. Select their role:
   - **Owner** - Full access including billing
   - **Collaborator** - Can manage sites but not billing
   - **Viewer** - Read-only access
5. Click **Send invites**

---

## Connecting to GitHub Repository

### Step 1: Import an Existing Project

1. From your team dashboard, click **Add new site**
2. Select **Import an existing project**

### Step 2: Connect to GitHub

1. Click **GitHub** under "Connect to Git provider"
2. If prompted, authorize Netlify to access your GitHub account
3. You may need to configure repository access:
   - Click **Configure the Netlify app on GitHub**
   - Choose **All repositories** or **Only select repositories**
   - If selecting specific repos, find and check **officials-portal**
   - Click **Save**

### Step 3: Select the Repository

1. Use the search box to find **officials-portal**
2. Click on the repository name to select it
3. You will be taken to the site configuration page

### Step 4: Choose the Branch to Deploy

1. Under **Branch to deploy**, select your main branch (typically `main` or `master`)
2. This branch will be used for production deployments

---

## Build Settings Configuration

The repository includes a `netlify.toml` file that configures most build settings automatically. However, you should verify and understand these settings.

### Pre-configured Settings (from netlify.toml)

The `netlify.toml` file at the repository root contains:

```toml
[build]
  command = "npm install && npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NEXT_TELEMETRY_DISABLED = "1"
  SECRETS_SCAN_OMIT_PATHS = ".next/**,.netlify/**,out/**,content/**,public/content/**,netlify/functions/**"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Verify Build Settings in Netlify UI

1. After importing the repository, go to **Site configuration** > **Build & deploy** > **Build settings**
2. Verify the following settings match:

| Setting | Value |
|---------|-------|
| **Base directory** | (leave blank) |
| **Build command** | `npm install && npm run build` |
| **Publish directory** | `.next` |
| **Functions directory** | `netlify/functions` |

### Step-by-Step to Update Build Settings

1. Go to **Site configuration** (left sidebar)
2. Click **Build & deploy**
3. Under **Build settings**, click **Edit settings**
4. Configure the fields as shown in the table above
5. Click **Save**

---

## Environment Variables Setup

Environment variables are critical for the application to function correctly. You must configure all required variables in Netlify.

### Accessing Environment Variables

1. Go to **Site configuration** > **Environment variables**
2. Click **Add a variable** to add each variable individually
3. Alternatively, click **Import from a .env file** if you have a configured `.env` file

### Required Environment Variables

Below is the complete list of environment variables required for the Officials Portal:

#### Site Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | Your production site URL (no trailing slash) | `https://portal.yourorg.com` |
| `URL` | Automatically set by Netlify to the primary site URL | (auto-configured) |
| `DEPLOY_PRIME_URL` | Automatically set by Netlify for deploy previews | (auto-configured) |

#### Supabase Configuration (Required)

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard > Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key | Supabase Dashboard > Project Settings > API > anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (keep secret!) | Supabase Dashboard > Project Settings > API > service_role key |

**Important:** The `SUPABASE_SERVICE_ROLE_KEY` is a sensitive credential. Never expose it in client-side code or public repositories.

#### Microsoft Graph API (Required for Email)

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `MICROSOFT_TENANT_ID` | Azure AD tenant ID | Azure Portal > Azure Active Directory > Overview |
| `MICROSOFT_CLIENT_ID` | App registration client ID | Azure Portal > App registrations > Your app > Overview |
| `MICROSOFT_CLIENT_SECRET` | App registration client secret | Azure Portal > App registrations > Your app > Certificates & secrets |

**Note:** The Microsoft Graph integration is used for:
- Sending bulk emails to members
- Contact form email routing
- Password reset emails
- Member invite emails

#### Email Routing Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_SENDER` | The "from" address for outgoing emails | `announcements@yourorg.com` |
| `EMAIL_GENERAL` | General inquiries recipient | `secretary@yourorg.com` |
| `EMAIL_SCHEDULING` | Scheduling requests recipient | `scheduler@yourorg.com` |
| `EMAIL_BILLING` | Billing inquiries recipient | `treasurer@yourorg.com` |
| `EMAIL_MEMBERSHIP` | Membership inquiries recipient | `memberservices@yourorg.com` |
| `EMAIL_EDUCATION` | Education inquiries recipient | `education@yourorg.com` |
| `EMAIL_WEBSITE` | Website/technical inquiries recipient | `webmaster@yourorg.com` |
| `EMAIL_PERFORMANCE` | Performance inquiries recipient | `performance@yourorg.com` |
| `EMAIL_RECRUITING` | Recruiting inquiries recipient | `recruiting@yourorg.com` |
| `EMAIL_OTHER` | Other inquiries recipient | `secretary@yourorg.com` |

#### SharePoint Integration (Optional)

If you want to sync form submissions to an Excel file in SharePoint:

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `SHAREPOINT_CLIENT_ID` | Azure AD app client ID for SharePoint | Same as `MICROSOFT_CLIENT_ID` or separate app |
| `SHAREPOINT_TENANT_ID` | Azure AD tenant ID | Same as `MICROSOFT_TENANT_ID` |
| `SHAREPOINT_CLIENT_SECRET` | Azure AD app client secret | Azure Portal > App registrations > Certificates & secrets |
| `SHAREPOINT_SITE_ID` | SharePoint site ID | Microsoft Graph Explorer or SharePoint API |
| `SHAREPOINT_DRIVE_ID` | OneDrive/SharePoint drive ID | Microsoft Graph Explorer |
| `SHAREPOINT_WORKBOOK_ID` | Excel workbook item ID | Microsoft Graph Explorer |

#### CMS Configuration

| Variable | Description | Values |
|----------|-------------|--------|
| `NEXT_PUBLIC_CMS_BACKEND` | CMS backend type | `git-gateway` (production) or `test-repo` (local dev) |

#### Development/Debug Options

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_USE_SUPABASE` | Enable Supabase storage | `true` |
| `NEXT_PUBLIC_DISABLE_AUTH_DEV` | Disable auth in development | `false` |

#### Optional Analytics

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_GA_ID` | Google Analytics measurement ID | `G-XXXXXXXXXX` |

### Step-by-Step: Adding Environment Variables

1. Navigate to **Site configuration** > **Environment variables**
2. Click **Add a variable**
3. Select **Add a single variable**
4. Enter the variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
5. Enter the value
6. Under **Scopes**, select where this variable should be available:
   - **All** - Available in all contexts
   - **Builds** - Only during build process
   - **Functions** - Only in serverless functions
   - **Post processing** - Only in post-processing
7. For sensitive variables like `SUPABASE_SERVICE_ROLE_KEY`, keep the default (all scopes) but consider using **Sensitive variable** option to mask the value in logs
8. Click **Create variable**
9. Repeat for all required variables

### Bulk Import

For faster setup, create a `.env` file locally with all variables and use the import feature:

1. Navigate to **Site configuration** > **Environment variables**
2. Click **Import from a .env file**
3. Paste your `.env` file contents or upload the file
4. Review the imported variables
5. Click **Import variables**

---

## Netlify Functions Configuration

The Officials Portal uses Netlify Functions (serverless functions) extensively. These are configured in the `netlify.toml` file and located in the `netlify/functions/` directory.

### Available Functions

| Function | Purpose | HTTP Methods |
|----------|---------|--------------|
| `accept-invite` | Handle member invite acceptance | POST |
| `announcements` | Manage announcements CRUD | GET, POST, PUT, DELETE |
| `auth-password-reset` | Handle password reset requests | POST |
| `bulk-set-roles` | Bulk update member roles | POST |
| `calendar-events` | Manage calendar events | GET, POST, PUT, DELETE |
| `check-migrated-user` | Check user migration status | GET |
| `client-logs` | Handle client-side logging | POST |
| `contact-form` | Process contact form submissions | POST |
| `email-history` | View email send history | GET |
| `evaluations` | Manage official evaluations | GET, POST, PUT, DELETE |
| `executive-team` | Manage executive team info | GET, POST, PUT, DELETE |
| `identity-admin` | Admin identity management | GET, POST, PUT, DELETE |
| `identity-signup` | Handle signup events | POST |
| `list-resource-files` | List uploaded resources | GET |
| `logs` | Retrieve application logs | GET |
| `member-activities` | Track member activities | GET, POST |
| `members` | Manage member records | GET, POST, PUT, DELETE |
| `migrate-netlify-users` | Migrate from Netlify Identity | POST |
| `newsletters` | Manage newsletter content | GET, POST, PUT, DELETE |
| `officials` | Manage officials data | GET, POST, PUT, DELETE |
| `osa-submissions` | Handle OSA form submissions | GET, POST |
| `osa-webhook` | OSA integration webhook | POST |
| `public-news` | Public news API | GET |
| `public-pages` | Public pages content | GET |
| `public-resources` | Public resources API | GET |
| `public-training` | Public training info | GET |
| `resend-invites` | Resend member invites | POST |
| `resources` | Manage portal resources | GET, POST, PUT, DELETE |
| `rule-modifications` | Manage rule modifications | GET, POST, PUT, DELETE |
| `scheduled-log-cleanup` | Scheduled cleanup task | (scheduled) |
| `send-email` | Send bulk emails | POST |
| `send-welcome-emails` | Send welcome emails | POST |
| `set-migrated-user-password` | Set password for migrated users | POST |
| `supabase-auth-admin` | Supabase auth admin operations | GET, POST, PUT, DELETE |
| `sync-members-auth` | Sync members with auth | POST |
| `upload-file` | Handle file uploads | POST |

### Function Configuration

Functions are automatically deployed from the `netlify/functions/` directory. The redirect rule in `netlify.toml` routes `/api/*` requests to functions:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

This means:
- `https://yoursite.com/api/members` routes to the `members` function
- `https://yoursite.com/api/send-email` routes to the `send-email` function

### Scheduled Function

The `scheduled-log-cleanup` function runs automatically every Sunday at 3 AM UTC to clean up old logs:

```typescript
export const handler = schedule('0 3 * * 0', async () => {
  // Cleanup logic
})
```

### Verifying Functions Deployment

1. Go to **Functions** in the left sidebar
2. You should see all deployed functions listed
3. Click on any function to view:
   - Invocation logs
   - Error logs
   - Function details

---

## Deploy Previews and Branch Deploys

Netlify can automatically create preview deployments for pull requests and specific branches.

### Enable Deploy Previews

1. Go to **Site configuration** > **Build & deploy** > **Continuous deployment**
2. Under **Deploy previews**, click **Configure**
3. Select **Automatically build deploy previews for all pull requests**
4. Click **Save**

### How Deploy Previews Work

- When a pull request is opened, Netlify automatically builds and deploys the branch
- A unique URL is generated (e.g., `deploy-preview-42--your-site.netlify.app`)
- A comment is added to the pull request with the preview URL
- Team members can review changes before merging

### Branch Deploys

To automatically deploy specific branches:

1. Go to **Site configuration** > **Build & deploy** > **Continuous deployment**
2. Under **Branch deploys**, click **Configure**
3. Choose one of:
   - **All** - Deploy all branches
   - **None** - Only deploy the production branch
   - **Let me add individual branches** - Specify branches manually
4. If adding manually, enter branch names (e.g., `staging`, `develop`)
5. Click **Save**

### Production Branch

1. Under **Production branch**, verify your main branch is selected
2. This is the branch that deploys to your primary site URL

### Deploy Contexts

You can set different environment variables for different contexts:

1. Go to **Site configuration** > **Environment variables**
2. Click on any variable
3. Under **Values**, you can set different values for:
   - **Production** - The production deployment
   - **Deploy previews** - Preview deployments
   - **Branch deploys** - Non-production branch deployments
   - **Local development** - For Netlify CLI

---

## Custom Domain Setup

### Step 1: Add Your Custom Domain

1. Go to **Domain management** in the left sidebar
2. Click **Add a domain**
3. Enter your custom domain (e.g., `portal.yourorg.com`)
4. Click **Verify**

### Step 2: Configure DNS

Netlify will provide DNS configuration instructions. You have two options:

#### Option A: Use Netlify DNS (Recommended)

1. Click **Set up Netlify DNS**
2. Follow the prompts to transfer DNS to Netlify
3. Update your domain registrar's nameservers to Netlify's nameservers:
   - `dns1.p01.nsone.net`
   - `dns2.p01.nsone.net`
   - `dns3.p01.nsone.net`
   - `dns4.p01.nsone.net`

#### Option B: External DNS

1. Click **Awaiting External DNS**
2. Add the following DNS records at your domain registrar:

For apex domain (e.g., `yourorg.com`):
```
Type: A
Name: @
Value: 75.2.60.5
```

For subdomain (e.g., `portal.yourorg.com`):
```
Type: CNAME
Name: portal
Value: your-site-name.netlify.app
```

### Step 3: Enable HTTPS

1. After DNS propagation (can take up to 48 hours), go to **Domain management**
2. Under **HTTPS**, click **Verify DNS configuration**
3. Once verified, click **Provision certificate**
4. Netlify will automatically provision a Let's Encrypt SSL certificate

### Step 4: Force HTTPS

1. Under **HTTPS**, enable **Force HTTPS**
2. This redirects all HTTP traffic to HTTPS

### Step 5: Update Environment Variables

After setting up your custom domain, update the `NEXT_PUBLIC_SITE_URL` environment variable:

1. Go to **Site configuration** > **Environment variables**
2. Find `NEXT_PUBLIC_SITE_URL`
3. Update the value to your custom domain (e.g., `https://portal.yourorg.com`)
4. Click **Save**
5. Trigger a new deploy for the change to take effect

---

## Testing the Deployment

### Step 1: Trigger a Deploy

If you haven't deployed yet:

1. Go to **Deploys** in the left sidebar
2. Click **Trigger deploy** > **Deploy site**
3. Wait for the build to complete (typically 2-5 minutes)

### Step 2: Check Build Logs

1. Click on the latest deploy in the **Deploys** list
2. Review the build log for any errors
3. Common issues to look for:
   - Missing environment variables
   - Build command failures
   - Dependency installation issues

### Step 3: Verify the Site

1. Click **Open production deploy** or visit your site URL
2. Test the following:

#### Public Pages
- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] Public resources page displays
- [ ] Training information displays
- [ ] Contact form appears (don't submit yet)

#### Authentication
- [ ] Login page loads
- [ ] "Forgot Password" link works
- [ ] Registration/invite flow works (if applicable)

#### Member Portal (after logging in)
- [ ] Dashboard loads
- [ ] Resources page displays files
- [ ] Calendar shows events
- [ ] Member directory loads
- [ ] Announcements display

#### Admin Functions (with admin account)
- [ ] Admin panel accessible
- [ ] Member management works
- [ ] Email sending works
- [ ] File upload works

### Step 4: Test Netlify Functions

1. Go to **Functions** in the left sidebar
2. Click on a function (e.g., `members`)
3. Check for recent invocations and any errors

Test a function directly:

```bash
curl -X GET "https://your-site.netlify.app/.netlify/functions/members"
```

### Step 5: Test Email Functionality

1. Use the contact form to send a test message
2. Verify the email is received at the configured address
3. Check function logs for any errors

### Step 6: Verify Scheduled Functions

1. Go to **Functions** > `scheduled-log-cleanup`
2. Verify the schedule is registered
3. Check for any scheduled execution logs

---

## Troubleshooting

### Build Failures

**Issue:** Build fails with "command not found: npm"
- **Solution:** Verify NODE_VERSION is set to "18" in environment variables

**Issue:** Build fails with missing dependencies
- **Solution:** Delete `node_modules` and `package-lock.json`, then redeploy

**Issue:** "Cannot find module" errors
- **Solution:** Ensure all dependencies are in `package.json` and run a fresh build

### Function Errors

**Issue:** Functions return 500 errors
- **Solution:** Check function logs in the Netlify dashboard; verify environment variables are set

**Issue:** CORS errors
- **Solution:** Functions include CORS headers; verify your frontend is calling the correct endpoint

**Issue:** "Supabase credentials not configured"
- **Solution:** Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### Email Not Sending

**Issue:** Contact form submits but no email received
- **Solution:** Check Microsoft Graph credentials:
  1. Verify `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` are correct
  2. Ensure the Azure AD app has `Mail.Send` permission
  3. Check the sender email has a mailbox in Microsoft 365

**Issue:** "Failed to get access token"
- **Solution:** Regenerate the client secret in Azure AD and update the environment variable

### Domain Issues

**Issue:** SSL certificate not provisioning
- **Solution:** Verify DNS records are correctly configured; wait for DNS propagation

**Issue:** Site shows Netlify 404
- **Solution:** Check that the publish directory is set to `.next`

### Performance Issues

**Issue:** Slow cold starts on functions
- **Solution:** This is normal for serverless functions; consider using Background Functions for long-running tasks

**Issue:** Large bundle size warnings
- **Solution:** Review imports; ensure you're using tree-shaking compatible imports

### Getting Help

- **Netlify Documentation:** [https://docs.netlify.com](https://docs.netlify.com)
- **Netlify Support:** [https://www.netlify.com/support](https://www.netlify.com/support)
- **Netlify Community:** [https://answers.netlify.com](https://answers.netlify.com)
- **Project Issues:** [https://github.com/fisherjoey/officials-portal/issues](https://github.com/fisherjoey/officials-portal/issues)

---

## Quick Reference

### Netlify Dashboard URLs

| Section | Path |
|---------|------|
| Site overview | `/sites/your-site-name` |
| Deploys | `/sites/your-site-name/deploys` |
| Functions | `/sites/your-site-name/functions` |
| Domain management | `/sites/your-site-name/settings/domain` |
| Build settings | `/sites/your-site-name/settings/deploys` |
| Environment variables | `/sites/your-site-name/settings/env` |

### Essential Commands

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Link to your site
netlify link

# Run locally with functions
netlify dev

# Deploy manually
netlify deploy --prod

# View function logs
netlify functions:log
```

### Environment Variable Checklist

Use this checklist to ensure all variables are configured:

- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `MICROSOFT_TENANT_ID`
- [ ] `MICROSOFT_CLIENT_ID`
- [ ] `MICROSOFT_CLIENT_SECRET`
- [ ] `EMAIL_SENDER`
- [ ] `EMAIL_GENERAL`
- [ ] `EMAIL_SCHEDULING`
- [ ] `EMAIL_BILLING`
- [ ] `EMAIL_MEMBERSHIP`
- [ ] `EMAIL_EDUCATION`
- [ ] `EMAIL_WEBSITE`
- [ ] `EMAIL_PERFORMANCE`
- [ ] `EMAIL_RECRUITING`
- [ ] `EMAIL_OTHER`
- [ ] `NEXT_PUBLIC_CMS_BACKEND` (set to `git-gateway`)
- [ ] `NEXT_PUBLIC_USE_SUPABASE` (set to `true`)

---

*Last updated: February 2026*
