# Microsoft Graph API Email Setup Guide

This guide provides step-by-step instructions for setting up Microsoft Graph API to enable email sending functionality in the Officials Portal.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Overview](#overview)
3. [Creating an Azure AD App Registration](#creating-an-azure-ad-app-registration)
4. [Configuring API Permissions](#configuring-api-permissions)
5. [Creating Client Secrets](#creating-client-secrets)
6. [Granting Admin Consent](#granting-admin-consent)
7. [Setting Up Sender Mailbox](#setting-up-sender-mailbox)
8. [Configuring Send As Permissions](#configuring-send-as-permissions)
9. [Environment Variables](#environment-variables)
10. [Testing Email Sending](#testing-email-sending)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Microsoft 365 Business** subscription (Basic, Standard, or Premium) OR Microsoft 365 Enterprise (E1, E3, E5)
- **Azure Active Directory (Entra ID)** access - included with Microsoft 365
- **Global Administrator** or **Application Administrator** role in your Microsoft 365 tenant
- Access to the **Azure Portal** (https://portal.azure.com)
- Access to the **Microsoft 365 Admin Center** (https://admin.microsoft.com)

> **Important:** Free Microsoft accounts (Outlook.com, Hotmail.com) do NOT support Microsoft Graph API application permissions. You must have a paid Microsoft 365 subscription.

---

## Overview

The Officials Portal uses Microsoft Graph API with **application permissions** (client credentials flow) to send emails. This approach:

- Does not require user sign-in for each email
- Uses a service account/shared mailbox to send emails
- Runs in the background (serverless functions)
- Supports bulk email sending to members

### Email Functions in This Project

The following Netlify functions use Microsoft Graph API for email:

| Function | Purpose |
|----------|---------|
| `send-email.ts` | Bulk email to member groups (announcements, newsletters) |
| `send-welcome-emails.ts` | Welcome/invite emails for new members |
| `contact-form.ts` | Contact form submissions routed to staff |
| `auth-password-reset.ts` | Password reset emails |
| `supabase-auth-admin.ts` | Admin-triggered invites and password resets |

### Microsoft Graph Endpoints Used

```
POST https://graph.microsoft.com/v1.0/users/{sender-email}/sendMail
```

This endpoint sends an email on behalf of the specified user/mailbox.

---

## Creating an Azure AD App Registration

### Step 1: Access Azure Portal

1. Open your browser and navigate to **https://portal.azure.com**
2. Sign in with your Microsoft 365 administrator account
3. In the search bar at the top, type **"Azure Active Directory"** (or "Microsoft Entra ID" - Microsoft's new name for Azure AD)
4. Click on **Azure Active Directory** in the search results

### Step 2: Navigate to App Registrations

1. In the left sidebar, click **App registrations**
2. If you don't see it, click **Manage** to expand the menu, then click **App registrations**

### Step 3: Create New Registration

1. Click the **+ New registration** button at the top
2. Fill in the registration form:

   | Field | Value |
   |-------|-------|
   | **Name** | `Officials Portal Email Service` (or your preferred name) |
   | **Supported account types** | Select **"Accounts in this organizational directory only (Single tenant)"** |
   | **Redirect URI** | Leave blank (not needed for client credentials flow) |

3. Click **Register**

### Step 4: Note Your Application Details

After registration, you'll be taken to the app's **Overview** page. **Copy and save these values** - you'll need them later:

| Value | Where to Find It |
|-------|------------------|
| **Application (client) ID** | Displayed on Overview page |
| **Directory (tenant) ID** | Displayed on Overview page |

> **Tip:** Click the copy icon next to each value to copy it to your clipboard.

---

## Configuring API Permissions

### Step 1: Navigate to API Permissions

1. In your app registration, click **API permissions** in the left sidebar
2. You'll see a default permission: `User.Read` (delegated)

### Step 2: Add Microsoft Graph Permissions

1. Click **+ Add a permission**
2. In the panel that opens, click **Microsoft Graph**
3. Click **Application permissions** (NOT Delegated permissions)

> **Important:** Application permissions allow the app to send email without a user being signed in. Delegated permissions require user sign-in and are NOT suitable for serverless functions.

### Step 3: Add Required Permissions

Search for and select the following permissions:

| Permission | Description |
|------------|-------------|
| **Mail.Send** | Send mail as any user (required for sending emails) |

Optional permissions (for future functionality):

| Permission | Description |
|------------|-------------|
| **User.Read.All** | Read all users' full profiles (for user lookup) |
| **Mail.ReadWrite** | Read and write mail in all mailboxes |

### Step 4: Add the Permissions

1. Check the box next to **Mail.Send**
2. Click **Add permissions** at the bottom

Your API permissions should now show:

```
Microsoft Graph (Application)
  - Mail.Send
```

> **Note:** You'll see a warning that admin consent is required. We'll handle that in the next section.

---

## Creating Client Secrets

### Step 1: Navigate to Certificates & Secrets

1. In your app registration, click **Certificates & secrets** in the left sidebar
2. Click the **Client secrets** tab

### Step 2: Create a New Secret

1. Click **+ New client secret**
2. Fill in the form:

   | Field | Value |
   |-------|-------|
   | **Description** | `Officials Portal Production` (or descriptive name) |
   | **Expires** | Choose an expiration period (recommended: 24 months) |

3. Click **Add**

### Step 3: Copy the Secret Value

> **CRITICAL:** Copy the secret **Value** immediately! It will only be shown once and cannot be retrieved later.

| Field | What to Copy |
|-------|--------------|
| **Value** | This is your `MICROSOFT_CLIENT_SECRET` - copy it NOW |
| **Secret ID** | Not needed for configuration |

If you miss copying the value, you'll need to delete this secret and create a new one.

### Step 4: Set a Calendar Reminder

Set a reminder to rotate your client secret before it expires. When the secret expires, email sending will stop working until you create a new secret and update your environment variables.

---

## Granting Admin Consent

Application permissions require admin consent before they can be used.

### Step 1: Navigate to API Permissions

1. In your app registration, go to **API permissions**
2. You should see your permissions listed with a warning icon

### Step 2: Grant Admin Consent

1. Click the **Grant admin consent for [Your Organization]** button
2. A confirmation dialog will appear
3. Click **Yes** to confirm

### Step 3: Verify Consent

After granting consent, you should see:

- A green checkmark next to each permission
- Status showing **"Granted for [Your Organization]"**

If you don't see the "Grant admin consent" button:
- You may not have Global Administrator or Application Administrator role
- Contact your IT administrator to grant consent

---

## Setting Up Sender Mailbox

You need a mailbox that the application will use to send emails. You have two options:

### Option A: Shared Mailbox (Recommended)

Shared mailboxes are free with Microsoft 365 and don't require a license.

#### Create a Shared Mailbox

1. Go to **Microsoft 365 Admin Center** (https://admin.microsoft.com)
2. Navigate to **Teams & groups** > **Shared mailboxes**
3. Click **+ Add a shared mailbox**
4. Fill in the form:

   | Field | Example Value |
   |-------|---------------|
   | **Name** | `Portal Announcements` |
   | **Email** | `announcements@yourdomain.com` |

5. Click **Save changes**

#### Additional Recommended Shared Mailboxes

Consider creating multiple shared mailboxes for different purposes:

| Email Address | Purpose |
|---------------|---------|
| `announcements@yourdomain.com` | Bulk announcements, newsletters |
| `no-reply@yourdomain.com` | Password resets, system notifications |

### Option B: User Mailbox

You can use a regular licensed user account, but this:
- Consumes a Microsoft 365 license
- Should be a dedicated service account, not a personal account
- Requires proper security practices (strong password, no interactive login)

---

## Configuring Send As Permissions

When using application permissions with Microsoft Graph, you need to configure which mailboxes the application can send from. This is done through **Application Access Policies**.

> **Note:** Without an Application Access Policy, the app will have permission to send as ANY user in your organization - which is a security risk.

### Option 1: PowerShell (Recommended)

This method restricts the application to only send from specific mailboxes.

#### Step 1: Install Exchange Online PowerShell Module

Open PowerShell as Administrator and run:

```powershell
Install-Module -Name ExchangeOnlineManagement
```

#### Step 2: Connect to Exchange Online

```powershell
Connect-ExchangeOnline -UserPrincipalName admin@yourdomain.com
```

#### Step 3: Create a Mail-Enabled Security Group

First, create a security group containing the mailboxes the app can send from:

```powershell
# Create the security group
New-DistributionGroup -Name "Portal Email Senders" -Type Security

# Add mailboxes to the group
Add-DistributionGroupMember -Identity "Portal Email Senders" -Member "announcements@yourdomain.com"
Add-DistributionGroupMember -Identity "Portal Email Senders" -Member "no-reply@yourdomain.com"
```

#### Step 4: Create the Application Access Policy

```powershell
New-ApplicationAccessPolicy -AppId "YOUR-APPLICATION-CLIENT-ID" `
    -PolicyScopeGroupId "Portal Email Senders" `
    -AccessRight RestrictAccess `
    -Description "Restrict Officials Portal to send only from approved mailboxes"
```

Replace `YOUR-APPLICATION-CLIENT-ID` with your app's Client ID from the Azure portal.

#### Step 5: Test the Policy

```powershell
Test-ApplicationAccessPolicy -Identity "announcements@yourdomain.com" -AppId "YOUR-APPLICATION-CLIENT-ID"
```

Expected output: `AccessCheckResult: Granted`

```powershell
Test-ApplicationAccessPolicy -Identity "someuser@yourdomain.com" -AppId "YOUR-APPLICATION-CLIENT-ID"
```

Expected output: `AccessCheckResult: Denied`

### Option 2: Microsoft 365 Admin Center

As of 2024, you can also manage Application Access Policies through the Admin Center:

1. Go to **Microsoft 365 Admin Center** > **Settings** > **Org settings**
2. Select **Services** tab
3. Click **Microsoft Graph Data Connect**
4. Follow the prompts to configure access policies

> **Note:** The admin center interface for this feature may vary based on your Microsoft 365 plan.

---

## Environment Variables

Add the following environment variables to your Netlify site (or `.env.local` for local development):

### Required Variables

```bash
# Microsoft Graph API Credentials
MICROSOFT_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=your-client-secret-value
```

### Optional Email Configuration

```bash
# Default sender email (must match a mailbox the app can send from)
EMAIL_SENDER=announcements@yourdomain.com

# Contact form email routing
EMAIL_GENERAL=secretary@yourdomain.com
EMAIL_SCHEDULING=scheduler@yourdomain.com
EMAIL_BILLING=treasurer@yourdomain.com
EMAIL_MEMBERSHIP=memberservices@yourdomain.com
EMAIL_EDUCATION=education@yourdomain.com
EMAIL_WEBSITE=webmaster@yourdomain.com
EMAIL_PERFORMANCE=performance@yourdomain.com
EMAIL_RECRUITING=recruiting@yourdomain.com
EMAIL_OTHER=secretary@yourdomain.com
```

### Setting Environment Variables in Netlify

1. Go to your Netlify site dashboard
2. Click **Site settings** > **Environment variables**
3. Click **Add a variable**
4. Add each variable with its value
5. Click **Save**

> **Security Note:** Never commit secrets to your Git repository. Always use environment variables for sensitive values.

---

## Testing Email Sending

### Local Testing

1. Create a `.env.local` file with your credentials
2. Run the development server: `npm run dev`
3. Use the admin panel to send a test email

### Testing via API

You can test the email function directly using curl or Postman:

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Email",
    "recipientGroups": [],
    "customEmails": ["your-email@example.com"],
    "htmlContent": "<h1>Test</h1><p>This is a test email.</p>"
  }'
```

### Verify in Sent Items

After sending a test email:

1. Go to **Outlook on the web** (https://outlook.office.com)
2. Sign in as the sender mailbox (e.g., announcements@yourdomain.com)
3. Check the **Sent Items** folder
4. Verify the email was sent successfully

---

## Troubleshooting

### Error: "Failed to get access token"

**Possible causes:**
- Invalid Tenant ID, Client ID, or Client Secret
- Client Secret has expired
- App registration was deleted

**Solutions:**
1. Verify your credentials in Azure Portal
2. Check if the client secret has expired (create a new one if needed)
3. Ensure the app registration still exists

### Error: "Failed to send email: 401 Unauthorized"

**Possible causes:**
- Access token is invalid or expired
- Admin consent not granted

**Solutions:**
1. Verify admin consent was granted in Azure Portal
2. Check the API permissions show "Granted"
3. Try re-granting admin consent

### Error: "Failed to send email: 403 Forbidden"

**Possible causes:**
- Application Access Policy blocking the request
- Trying to send from a mailbox not in the allowed group
- Mail.Send permission not granted

**Solutions:**
1. Verify the sender email is in your allowed security group
2. Test the Application Access Policy using PowerShell
3. Check that Mail.Send permission is granted with admin consent

### Error: "MailboxNotEnabledForRESTAPI"

**Possible causes:**
- The mailbox doesn't exist
- The mailbox is not a valid Exchange Online mailbox
- Shared mailbox was just created (needs time to provision)

**Solutions:**
1. Wait 15-30 minutes for new mailboxes to fully provision
2. Verify the email address is correct
3. Confirm the mailbox exists in Exchange Online

### Error: "ResourceNotFound" or "ErrorItemNotFound"

**Possible causes:**
- The user/mailbox specified in the Graph API endpoint doesn't exist
- Typo in the sender email address

**Solutions:**
1. Double-check the sender email address in your code and environment variables
2. Verify the mailbox exists in Microsoft 365 Admin Center

### Emails Not Being Received

**Possible causes:**
- Email going to spam/junk folder
- Recipient email address is invalid
- Rate limiting (Microsoft Graph has limits)

**Solutions:**
1. Check the recipient's spam/junk folder
2. Verify recipient email addresses are valid
3. Check the Sent Items folder in the sender mailbox
4. Review Microsoft Graph rate limits (10,000 emails per 10 minutes)

### Rate Limits

Microsoft Graph has the following rate limits for email:

| Limit | Value |
|-------|-------|
| Messages per mailbox per minute | 30 |
| Messages per mailbox per day | 10,000 |
| Recipients per message | 500 |

If you're sending bulk emails, the code already batches recipients in groups of 500.

---

## Security Best Practices

1. **Rotate Client Secrets Regularly**
   - Set calendar reminders before expiration
   - Create new secret before deleting old one

2. **Use Application Access Policies**
   - Restrict which mailboxes the app can send from
   - Never allow unrestricted access to all mailboxes

3. **Monitor Usage**
   - Review Azure AD sign-in logs periodically
   - Set up alerts for unusual activity

4. **Principle of Least Privilege**
   - Only grant permissions that are needed
   - Use Mail.Send instead of Mail.ReadWrite.All if you don't need read access

5. **Environment Variable Security**
   - Never commit secrets to Git
   - Use Netlify environment variables for production
   - Rotate secrets if they're ever exposed

---

## Additional Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/api/user-sendmail)
- [Azure AD App Registrations](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Application Access Policies](https://docs.microsoft.com/en-us/graph/auth-limit-mailbox-access)
- [Microsoft Graph Rate Limits](https://docs.microsoft.com/en-us/graph/throttling)
- [Exchange Online PowerShell](https://docs.microsoft.com/en-us/powershell/exchange/connect-to-exchange-online-powershell)

---

## Quick Reference

### Token Endpoint

```
POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
```

### Token Request Body

```
client_id={client-id}
&client_secret={client-secret}
&scope=https://graph.microsoft.com/.default
&grant_type=client_credentials
```

### Send Mail Endpoint

```
POST https://graph.microsoft.com/v1.0/users/{sender-email}/sendMail
```

### Send Mail Request Body

```json
{
  "message": {
    "subject": "Email Subject",
    "body": {
      "contentType": "HTML",
      "content": "<h1>Hello</h1><p>Email body here</p>"
    },
    "toRecipients": [
      {
        "emailAddress": {
          "address": "recipient@example.com"
        }
      }
    ]
  },
  "saveToSentItems": true
}
```

### Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `MICROSOFT_TENANT_ID` | Yes | Azure AD Directory (tenant) ID |
| `MICROSOFT_CLIENT_ID` | Yes | App Registration Application (client) ID |
| `MICROSOFT_CLIENT_SECRET` | Yes | App Registration client secret value |
| `EMAIL_SENDER` | No | Default sender email address |
| `EMAIL_GENERAL` | No | Contact form: general inquiries |
| `EMAIL_SCHEDULING` | No | Contact form: scheduling |
| `EMAIL_BILLING` | No | Contact form: billing |
| `EMAIL_MEMBERSHIP` | No | Contact form: membership |
| `EMAIL_EDUCATION` | No | Contact form: education |
| `EMAIL_WEBSITE` | No | Contact form: website/technical |
| `EMAIL_PERFORMANCE` | No | Contact form: performance |
| `EMAIL_RECRUITING` | No | Contact form: recruiting |
| `EMAIL_OTHER` | No | Contact form: other/fallback |
