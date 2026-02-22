# DNS and Domain Configuration Guide

This guide provides step-by-step instructions for configuring DNS and domain settings for the Officials Portal application. It covers everything from purchasing a domain to configuring email authentication records.

---

## Table of Contents

1. [Understanding DNS Basics](#understanding-dns-basics)
2. [Purchasing a Domain](#purchasing-a-domain)
3. [DNS Record Types Explained](#dns-record-types-explained)
4. [Configuring DNS for Netlify Hosting](#configuring-dns-for-netlify-hosting)
5. [SSL/TLS Certificate Setup](#ssltls-certificate-setup)
6. [Subdomain Configuration](#subdomain-configuration)
7. [Email DNS Records for Microsoft 365](#email-dns-records-for-microsoft-365)
8. [Verifying DNS Propagation](#verifying-dns-propagation)
9. [Troubleshooting Common DNS Issues](#troubleshooting-common-dns-issues)

---

## Understanding DNS Basics

### What is DNS?

DNS (Domain Name System) is often called the "phonebook of the internet." It translates human-readable domain names (like `officials-portal.com`) into IP addresses (like `104.198.14.52`) that computers use to identify each other on the network.

When someone types your domain into their browser:

1. Their computer asks a DNS resolver "What's the IP address for this domain?"
2. The resolver checks its cache or queries DNS servers
3. The authoritative DNS server for your domain responds with the IP address
4. The browser connects to that IP address to load your website

### Key Terminology

| Term | Definition |
|------|------------|
| **Domain** | The human-readable address (e.g., `example.com`) |
| **Subdomain** | A prefix to your domain (e.g., `api.example.com`, `www.example.com`) |
| **DNS Zone** | The collection of all DNS records for a domain |
| **Nameserver** | A server that holds DNS records and responds to queries |
| **TTL (Time to Live)** | How long DNS resolvers should cache a record (in seconds) |
| **Registrar** | The company where you purchase and manage your domain |
| **DNS Provider** | The service hosting your DNS records (often the same as registrar) |

---

## Purchasing a Domain

### Choosing a Domain Name

Before purchasing, consider:

- **Keep it short and memorable** - Easier for users to type and remember
- **Avoid hyphens and numbers** - They're harder to communicate verbally
- **Choose the right TLD** - `.com` is most recognized, but `.org`, `.io`, `.app` are also popular
- **Check trademark availability** - Avoid legal issues by searching trademark databases

### Recommended Domain Registrars

| Registrar | Pros | Cons | Approximate Cost (.com) |
|-----------|------|------|------------------------|
| **Cloudflare Registrar** | At-cost pricing, free WHOIS privacy, excellent DNS | Limited TLD selection | $9-10/year |
| **Namecheap** | Affordable, free WHOIS privacy, good UI | Occasional upselling | $10-13/year |
| **Google Domains** (now Squarespace) | Clean interface, Google integration | Higher pricing | $12-14/year |
| **Porkbun** | Very affordable, free WHOIS privacy | Smaller company | $9-10/year |
| **GoDaddy** | Large selection, 24/7 support | Aggressive upselling, higher renewal prices | $12-20/year |

### Step-by-Step: Purchasing a Domain (Using Namecheap as Example)

1. **Go to the registrar's website**
   - Navigate to [namecheap.com](https://www.namecheap.com)

2. **Search for your desired domain**
   - Enter your domain name in the search box
   - The system will show availability and pricing for various TLDs

3. **Add to cart and checkout**
   - Select your desired domain
   - Choose registration period (1 year minimum, up to 10 years)
   - Enable "WhoisGuard" or WHOIS privacy (usually free) to hide personal information

4. **Complete registration**
   - Create an account or log in
   - Enter contact information (this becomes your WHOIS data if privacy isn't enabled)
   - Complete payment

5. **Verify your email**
   - ICANN requires email verification within 15 days
   - Check your email and click the verification link
   - **Important**: Failure to verify will result in domain suspension

### What You'll Receive

After purchase, you'll have access to:
- Domain management dashboard
- DNS management panel
- Nameserver configuration
- WHOIS contact management

---

## DNS Record Types Explained

### A Record (Address Record)

Maps a domain name to an IPv4 address.

```
Type:  A
Name:  @              (or leave blank, means root domain)
Value: 75.2.60.5
TTL:   3600           (1 hour)
```

**Use case**: Pointing your root domain (`example.com`) to a web server.

### AAAA Record (IPv6 Address Record)

Maps a domain name to an IPv6 address.

```
Type:  AAAA
Name:  @
Value: 2606:4700:3030::6815:5678
TTL:   3600
```

**Use case**: Supporting IPv6 connections to your server.

### CNAME Record (Canonical Name)

Creates an alias from one domain name to another. Cannot be used on the root domain with most providers.

```
Type:  CNAME
Name:  www
Value: example.netlify.app
TTL:   3600
```

**Use case**: Pointing `www.example.com` to your Netlify site.

**Important limitations**:
- CNAME records cannot coexist with other record types for the same name
- Most DNS providers don't allow CNAME on the root domain (`@`)
- Some providers offer "CNAME flattening" or "ALIAS" records to work around this

### MX Record (Mail Exchange)

Specifies mail servers responsible for receiving email for your domain.

```
Type:     MX
Name:     @
Value:    mail.example.com
Priority: 10
TTL:      3600
```

**Use case**: Directing email to Microsoft 365, Google Workspace, or other email providers.

**Priority explained**: Lower numbers = higher priority. If you have multiple MX records, email servers try the lowest number first.

### TXT Record (Text Record)

Stores arbitrary text data, commonly used for verification and email authentication.

```
Type:  TXT
Name:  @
Value: "v=spf1 include:spf.protection.outlook.com -all"
TTL:   3600
```

**Use case**: SPF records, DKIM keys, domain verification, site ownership proof.

### NS Record (Nameserver)

Specifies which nameservers are authoritative for your domain.

```
Type:  NS
Name:  @
Value: dns1.registrar-servers.com
TTL:   86400
```

**Use case**: Delegating DNS management to a specific provider.

### CAA Record (Certificate Authority Authorization)

Specifies which Certificate Authorities can issue SSL certificates for your domain.

```
Type:  CAA
Name:  @
Value: 0 issue "letsencrypt.org"
TTL:   3600
```

**Use case**: Enhancing security by restricting certificate issuance.

---

## Configuring DNS for Netlify Hosting

Netlify provides two methods for DNS configuration:

1. **Using Netlify DNS** (recommended) - Netlify manages your DNS records
2. **External DNS** - Your registrar or another provider manages DNS

### Option 1: Using Netlify DNS (Recommended)

This gives you the best performance with automatic CDN optimization.

#### Step 1: Add Your Domain in Netlify

1. Log into [Netlify](https://app.netlify.com)
2. Select your site (officials-portal)
3. Go to **Site settings** > **Domain management**
4. Click **Add custom domain**
5. Enter your domain: `example.com`
6. Click **Verify** > **Add domain**

#### Step 2: Configure Netlify DNS

1. In Domain management, click **Set up Netlify DNS**
2. Netlify will provide nameservers (typically):
   ```
   dns1.p01.nsone.net
   dns2.p01.nsone.net
   dns3.p01.nsone.net
   dns4.p01.nsone.net
   ```

#### Step 3: Update Nameservers at Your Registrar

1. Log into your domain registrar (e.g., Namecheap)
2. Find your domain and go to **DNS settings** or **Nameservers**
3. Change from default nameservers to **Custom DNS**
4. Enter all four Netlify nameservers
5. Save changes

**Example in Namecheap:**
```
Nameserver 1: dns1.p01.nsone.net
Nameserver 2: dns2.p01.nsone.net
Nameserver 3: dns3.p01.nsone.net
Nameserver 4: dns4.p01.nsone.net
```

#### Step 4: Wait for Propagation

- Nameserver changes can take **24-48 hours** to fully propagate
- Netlify will show "Awaiting DNS propagation" during this time
- You can check progress using tools described in [Verifying DNS Propagation](#verifying-dns-propagation)

### Option 2: External DNS Configuration

If you prefer to keep DNS at your registrar or use another DNS provider (like Cloudflare):

#### For the Root Domain (example.com)

**If your DNS provider supports ALIAS/ANAME records:**
```
Type:  ALIAS (or ANAME)
Name:  @
Value: apex-loadbalancer.netlify.com
TTL:   3600
```

**If your DNS provider only supports A records:**

Use Netlify's load balancer IP address:
```
Type:  A
Name:  @
Value: 75.2.60.5
TTL:   3600
```

**Note**: The A record method doesn't benefit from Netlify's full CDN. Check Netlify's documentation for current IP addresses as they may change.

#### For www Subdomain

```
Type:  CNAME
Name:  www
Value: [your-site-name].netlify.app
TTL:   3600
```

**Example:**
```
Type:  CNAME
Name:  www
Value: officials-portal.netlify.app
TTL:   3600
```

### Complete DNS Configuration Example

Here's a complete example for `officials-portal.com` using external DNS:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 75.2.60.5 | 3600 |
| CNAME | www | officials-portal.netlify.app | 3600 |
| TXT | @ | "v=spf1 include:spf.protection.outlook.com -all" | 3600 |

---

## SSL/TLS Certificate Setup

### Understanding SSL/TLS

SSL (Secure Sockets Layer) and its successor TLS (Transport Layer Security) encrypt data between the user's browser and your server. This is indicated by:
- `https://` in the URL
- A padlock icon in the browser
- "Connection is secure" message when clicking the padlock

### Netlify's Automatic SSL

Netlify provides **free automatic SSL certificates** through Let's Encrypt. Here's how it works:

#### Automatic Certificate Provisioning

1. Once your DNS is properly configured and propagated, Netlify automatically:
   - Detects the domain is pointing to Netlify
   - Requests a certificate from Let's Encrypt
   - Installs and configures the certificate
   - Handles automatic renewal (certificates renew every 90 days)

2. This process typically takes **5-15 minutes** after DNS propagation completes

#### Verifying SSL Status

1. Go to Netlify dashboard > **Site settings** > **Domain management**
2. Look for the SSL/TLS certificate section
3. You should see: "Your site has HTTPS enabled"

#### Forcing HTTPS

To ensure all traffic uses HTTPS:

1. In Netlify, go to **Site settings** > **Domain management**
2. Scroll to **HTTPS**
3. Enable **Force HTTPS**

This automatically redirects all HTTP requests to HTTPS.

### Troubleshooting SSL Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Waiting for DNS propagation" | DNS not yet resolved | Wait 24-48 hours, verify DNS records |
| Certificate provisioning failed | DNS misconfiguration | Check A/CNAME records point to Netlify |
| Mixed content warnings | HTTP resources on HTTPS page | Update all resource URLs to HTTPS |
| Certificate expired | Auto-renewal failed | Contact Netlify support |

### Custom SSL Certificates (Advanced)

If you need to use your own certificate (rare):

1. Purchase a certificate from a Certificate Authority
2. In Netlify, go to **Domain management** > **HTTPS**
3. Click **Provide your own certificate**
4. Upload your certificate, private key, and CA chain

---

## Subdomain Configuration

### Common Subdomain Patterns

| Subdomain | Purpose | Example |
|-----------|---------|---------|
| www | Main website | www.example.com |
| api | API endpoints | api.example.com |
| app | Application interface | app.example.com |
| staging | Staging environment | staging.example.com |
| dev | Development environment | dev.example.com |
| admin | Admin panel | admin.example.com |

### Configuring Subdomains in Netlify

#### Method 1: Branch Deploys (Same Codebase)

For staging/preview environments:

1. Go to **Site settings** > **Build & deploy** > **Continuous deployment**
2. Configure branch deploys
3. Netlify automatically creates: `branch-name--your-site.netlify.app`

To add custom subdomain:
1. Go to **Domain management** > **Add domain alias**
2. Enter `staging.example.com`
3. Add CNAME record at your DNS provider

#### Method 2: Separate Netlify Sites

For completely separate applications:

1. Create a new Netlify site for the subdomain
2. Add the subdomain as a custom domain
3. Configure DNS:

```
Type:  CNAME
Name:  api
Value: officials-portal-api.netlify.app
TTL:   3600
```

### Example: Complete Subdomain Setup

For `officials-portal.com` with multiple environments:

| Subdomain | Purpose | DNS Record |
|-----------|---------|------------|
| www.officials-portal.com | Production | CNAME -> officials-portal.netlify.app |
| staging.officials-portal.com | Staging | CNAME -> staging--officials-portal.netlify.app |
| api.officials-portal.com | API Server | CNAME -> officials-portal-api.netlify.app |

### Wildcard Subdomains

To handle any subdomain:

1. This requires Netlify DNS
2. Netlify automatically handles wildcard routing
3. Configure in your application to handle dynamic subdomains

---

## Email DNS Records for Microsoft 365

When using Microsoft 365 for email sending (e.g., transactional emails, notifications), you need to configure several DNS records to ensure email deliverability and prevent spoofing.

### Overview of Email Authentication

| Record Type | Purpose |
|-------------|---------|
| **MX** | Routes incoming email to Microsoft 365 |
| **SPF** | Specifies authorized email sending servers |
| **DKIM** | Provides cryptographic email authentication |
| **DMARC** | Specifies policy for handling authentication failures |

### MX Records for Microsoft 365

MX records tell other mail servers where to deliver email for your domain.

```
Type:     MX
Name:     @
Value:    officials-portal-com.mail.protection.outlook.com
Priority: 0
TTL:      3600
```

**Note**: Replace `officials-portal-com` with your domain (hyphens replace dots).

### SPF Record (Sender Policy Framework)

SPF specifies which servers are authorized to send email on behalf of your domain.

#### Basic SPF for Microsoft 365 Only

```
Type:  TXT
Name:  @
Value: "v=spf1 include:spf.protection.outlook.com -all"
TTL:   3600
```

#### SPF with Additional Senders

If you also send email from other services (e.g., SendGrid, Mailchimp):

```
Type:  TXT
Name:  @
Value: "v=spf1 include:spf.protection.outlook.com include:sendgrid.net include:servers.mcsv.net -all"
TTL:   3600
```

#### SPF Syntax Explained

| Component | Meaning |
|-----------|---------|
| `v=spf1` | SPF version 1 |
| `include:domain` | Allow servers authorized by that domain |
| `a` | Allow the domain's A record IP |
| `mx` | Allow the domain's MX servers |
| `-all` | Reject (hard fail) unauthorized senders |
| `~all` | Soft fail unauthorized senders (for testing) |
| `?all` | Neutral (no policy) |

**Important**: Only one SPF record per domain. Combine all `include` statements into one record.

### DKIM Records (DomainKeys Identified Mail)

DKIM adds a cryptographic signature to outgoing emails.

#### Step 1: Get DKIM Values from Microsoft 365

1. Log into [Microsoft 365 Admin Center](https://admin.microsoft.com)
2. Go to **Settings** > **Domains**
3. Select your domain
4. Click **DNS records** tab
5. Find the DKIM CNAME records

#### Step 2: Add DKIM CNAME Records

Microsoft 365 requires two CNAME records:

**Record 1:**
```
Type:  CNAME
Name:  selector1._domainkey
Value: selector1-officials-portal-com._domainkey.officialsportal.onmicrosoft.com
TTL:   3600
```

**Record 2:**
```
Type:  CNAME
Name:  selector2._domainkey
Value: selector2-officials-portal-com._domainkey.officialsportal.onmicrosoft.com
TTL:   3600
```

**Note**: The actual values will be provided by Microsoft 365 and will be specific to your tenant.

#### Step 3: Enable DKIM Signing

1. In Microsoft 365 Admin Center, go to **Security** > **Email authentication** > **DKIM**
2. Select your domain
3. Toggle **Sign messages for this domain with DKIM signatures** to **Enabled**

### DMARC Record (Domain-based Message Authentication)

DMARC tells receiving servers what to do when SPF/DKIM checks fail.

#### Starting DMARC Policy (Monitoring Mode)

Start with monitoring to collect data without affecting delivery:

```
Type:  TXT
Name:  _dmarc
Value: "v=DMARC1; p=none; rua=mailto:dmarc-reports@example.com; ruf=mailto:dmarc-forensics@example.com; pct=100"
TTL:   3600
```

#### Progressive DMARC Policies

**Phase 1 - Monitoring (2-4 weeks):**
```
v=DMARC1; p=none; rua=mailto:dmarc@example.com
```

**Phase 2 - Quarantine (2-4 weeks):**
```
v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc@example.com
```

**Phase 3 - Reject:**
```
v=DMARC1; p=reject; rua=mailto:dmarc@example.com
```

#### DMARC Syntax Explained

| Tag | Meaning | Values |
|-----|---------|--------|
| `v=DMARC1` | DMARC version | Required |
| `p=` | Policy for your domain | `none`, `quarantine`, `reject` |
| `sp=` | Policy for subdomains | `none`, `quarantine`, `reject` |
| `pct=` | Percentage of messages to apply policy | 1-100 |
| `rua=` | Aggregate report destination | Email address |
| `ruf=` | Forensic report destination | Email address |
| `adkim=` | DKIM alignment mode | `r` (relaxed), `s` (strict) |
| `aspf=` | SPF alignment mode | `r` (relaxed), `s` (strict) |

### Complete Email DNS Configuration Example

Here's a complete example for `officials-portal.com` with Microsoft 365:

| Type | Name | Value | Priority | TTL |
|------|------|-------|----------|-----|
| MX | @ | officials-portal-com.mail.protection.outlook.com | 0 | 3600 |
| TXT | @ | "v=spf1 include:spf.protection.outlook.com -all" | - | 3600 |
| CNAME | selector1._domainkey | selector1-officials-portal-com._domainkey.officialsportal.onmicrosoft.com | - | 3600 |
| CNAME | selector2._domainkey | selector2-officials-portal-com._domainkey.officialsportal.onmicrosoft.com | - | 3600 |
| TXT | _dmarc | "v=DMARC1; p=quarantine; rua=mailto:dmarc@officials-portal.com" | - | 3600 |

### Additional Microsoft 365 DNS Records

Microsoft 365 may require additional records for full functionality:

**Autodiscover (for Outlook client configuration):**
```
Type:  CNAME
Name:  autodiscover
Value: autodiscover.outlook.com
TTL:   3600
```

**SIP/Lync (for Teams/Skype):**
```
Type:  CNAME
Name:  sip
Value: sipdir.online.lync.com
TTL:   3600

Type:  CNAME
Name:  lyncdiscover
Value: webdir.online.lync.com
TTL:   3600

Type:  SRV
Name:  _sip._tls
Value: sipdir.online.lync.com
Priority: 100
Weight: 1
Port: 443
TTL:   3600

Type:  SRV
Name:  _sipfederationtls._tcp
Value: sipfed.online.lync.com
Priority: 100
Weight: 1
Port: 5061
TTL:   3600
```

---

## Verifying DNS Propagation

### Understanding Propagation

When you make DNS changes, they don't take effect instantly. The changes must propagate through the global DNS system:

- **Nameserver changes**: 24-48 hours
- **A/AAAA records**: 1-24 hours (depends on previous TTL)
- **CNAME records**: 1-24 hours
- **MX records**: 1-24 hours
- **TXT records**: 1-24 hours

The actual time depends on:
- The previous record's TTL (resolvers cache until TTL expires)
- Your DNS provider's propagation speed
- Geographic location (some regions update faster)

### Online DNS Checking Tools

#### whatsmydns.net

Best for checking propagation across multiple locations.

1. Go to [whatsmydns.net](https://www.whatsmydns.net)
2. Enter your domain
3. Select record type (A, CNAME, MX, TXT, etc.)
4. Click **Search**
5. View results from DNS servers worldwide

Green checkmarks indicate the record has propagated to that location.

#### dnschecker.org

Similar to whatsmydns.net with additional features.

1. Go to [dnschecker.org](https://dnschecker.org)
2. Enter domain and select record type
3. View propagation status globally

#### MXToolbox

Best for email-related records and comprehensive diagnostics.

1. Go to [mxtoolbox.com](https://mxtoolbox.com)
2. Use specific tools:
   - **MX Lookup**: Check MX records
   - **SPF Record Lookup**: Verify SPF configuration
   - **DKIM Lookup**: Test DKIM records
   - **DMARC Lookup**: Verify DMARC policy
   - **DNS Health**: Overall DNS assessment

### Command Line Tools

#### Using nslookup (Windows/Mac/Linux)

**Check A record:**
```bash
nslookup example.com
```

**Check specific record type:**
```bash
nslookup -type=MX example.com
nslookup -type=TXT example.com
nslookup -type=CNAME www.example.com
```

**Query specific DNS server:**
```bash
nslookup example.com 8.8.8.8
```

#### Using dig (Mac/Linux)

**Check A record:**
```bash
dig example.com
```

**Check specific record type:**
```bash
dig MX example.com
dig TXT example.com
dig CNAME www.example.com
```

**Short output:**
```bash
dig +short A example.com
dig +short MX example.com
```

**Query specific DNS server:**
```bash
dig @8.8.8.8 example.com
```

#### Using host (Mac/Linux)

```bash
host example.com
host -t MX example.com
host -t TXT example.com
```

### Verifying Specific Records

#### Verify A Record Points to Netlify

```bash
nslookup example.com
```

Expected result:
```
Name:    example.com
Address: 75.2.60.5
```

#### Verify CNAME Record

```bash
nslookup -type=CNAME www.example.com
```

Expected result:
```
www.example.com    canonical name = officials-portal.netlify.app.
```

#### Verify MX Record for Microsoft 365

```bash
nslookup -type=MX example.com
```

Expected result:
```
example.com    MX preference = 0, mail exchanger = example-com.mail.protection.outlook.com
```

#### Verify SPF Record

```bash
nslookup -type=TXT example.com
```

Look for a record containing `v=spf1`.

#### Verify DMARC Record

```bash
nslookup -type=TXT _dmarc.example.com
```

Expected result:
```
_dmarc.example.com    text = "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"
```

### Testing Email Authentication

#### Send a Test Email

1. Send an email from your domain to a Gmail account
2. Open the email in Gmail
3. Click the three dots menu > **Show original**
4. Look for:
   - `SPF: PASS`
   - `DKIM: PASS`
   - `DMARC: PASS`

#### Use mail-tester.com

1. Go to [mail-tester.com](https://www.mail-tester.com)
2. Copy the unique email address shown
3. Send a test email from your system to that address
4. Click **Check your score**
5. Review detailed results for SPF, DKIM, DMARC, and deliverability

---

## Troubleshooting Common DNS Issues

### Issue: Website Shows "DNS_PROBE_FINISHED_NXDOMAIN"

**Meaning**: The domain doesn't exist in DNS.

**Causes and Solutions**:

| Cause | Solution |
|-------|----------|
| Domain not registered | Verify domain is active at registrar |
| Nameservers not configured | Set nameservers at registrar |
| DNS propagation incomplete | Wait 24-48 hours for nameserver changes |
| Typo in domain name | Check spelling |

### Issue: Website Shows Registrar Parking Page

**Meaning**: DNS is resolving but pointing to wrong location.

**Solutions**:
1. Check A/CNAME records point to Netlify
2. Ensure you're editing the correct DNS zone
3. Clear browser cache and try again
4. Wait for propagation if recently changed

### Issue: SSL Certificate Not Provisioning

**Meaning**: Netlify can't verify domain ownership to issue certificate.

**Solutions**:

1. **Verify DNS is correct**:
   ```bash
   nslookup your-domain.com
   ```
   Should return Netlify's IP or CNAME

2. **Check for conflicting records**:
   - Remove any CAA records that don't include `letsencrypt.org`
   - Ensure no conflicting A records

3. **Wait for propagation**:
   - SSL provisioning requires fully propagated DNS
   - Can take up to 24 hours

4. **Contact Netlify Support**:
   - If DNS is correct but certificate won't provision
   - They can manually trigger certificate issuance

### Issue: Email Going to Spam

**Common Causes**:

| Cause | Diagnostic | Solution |
|-------|-----------|----------|
| Missing SPF | Check TXT record | Add SPF record |
| Missing DKIM | Check CNAME records | Add DKIM CNAMEs, enable in M365 |
| Missing DMARC | Check _dmarc TXT | Add DMARC record |
| New domain | Check domain age | Warm up sending gradually |
| Poor reputation | Check blacklists at mxtoolbox.com | Request delisting |

### Issue: "SPF PermError" or "Too Many DNS Lookups"

**Meaning**: SPF record exceeds 10 DNS lookup limit.

**Solution**:

1. **Audit your SPF record**:
   - Each `include:` counts as a lookup
   - Each `a:` and `mx:` counts as a lookup
   - Maximum 10 lookups allowed

2. **Consolidate includes**:
   - Use SPF flattening services
   - Remove unused `include:` statements

3. **Use IP addresses directly**:
   ```
   v=spf1 ip4:192.0.2.0/24 include:spf.protection.outlook.com -all
   ```

### Issue: DKIM Signature Failing

**Diagnostic Steps**:

1. **Verify CNAME records exist**:
   ```bash
   nslookup -type=CNAME selector1._domainkey.example.com
   ```

2. **Check DKIM is enabled in M365**:
   - Admin Center > Security > DKIM
   - Ensure toggle is ON

3. **Verify CNAME values**:
   - Must exactly match what M365 provides
   - Watch for typos

### Issue: DNS Changes Not Taking Effect

**Solutions**:

1. **Clear local DNS cache**:

   **Windows**:
   ```bash
   ipconfig /flushdns
   ```

   **Mac**:
   ```bash
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```

   **Linux**:
   ```bash
   sudo systemd-resolve --flush-caches
   ```

2. **Check from different network**:
   - Use mobile data instead of WiFi
   - Use a VPN to different location

3. **Query authoritative nameserver directly**:
   ```bash
   nslookup example.com ns1.your-dns-provider.com
   ```

4. **Reduce TTL before changes**:
   - Set TTL to 300 (5 minutes) hours before making changes
   - Make changes
   - Restore TTL after propagation confirmed

### Issue: Subdomain Not Working

**Diagnostic Steps**:

1. **Verify record exists**:
   ```bash
   nslookup subdomain.example.com
   ```

2. **Check record type**:
   - Subdomains typically use CNAME
   - Ensure pointing to correct target

3. **Verify in Netlify**:
   - Domain must be added as domain alias
   - Check Domain management settings

### Issue: "Conflicting DNS Records"

**Meaning**: Incompatible record types for same hostname.

**Rules**:
- CNAME cannot coexist with any other record type for same name
- Multiple A records ARE allowed (round-robin)
- Multiple MX records ARE allowed (priority-based)

**Solution**:
- Remove conflicting records
- Use ALIAS/ANAME instead of CNAME for root domain if available

---

## Quick Reference

### Recommended TTL Values

| Scenario | TTL | Notes |
|----------|-----|-------|
| Before making changes | 300 (5 min) | Reduce TTL 24-48 hours before |
| During testing | 300 (5 min) | Quick updates |
| Stable production | 3600 (1 hour) | Good balance |
| Rarely changing | 86400 (24 hours) | Maximum caching |

### DNS Record Priority

For MX records, lower numbers = higher priority:

| Priority | Meaning |
|----------|---------|
| 0 or 1 | Primary (tried first) |
| 5 or 10 | Secondary |
| 20+ | Backup |

### Common DNS Providers' Propagation Times

| Provider | Typical Propagation |
|----------|-------------------|
| Cloudflare | 5 minutes |
| Netlify DNS | 5-15 minutes |
| Namecheap | 30 minutes - 2 hours |
| GoDaddy | 30 minutes - 2 hours |
| Route 53 (AWS) | 60 seconds |
| Google Cloud DNS | 5 minutes |

### Essential Commands Cheat Sheet

```bash
# Check A record
nslookup example.com

# Check MX record
nslookup -type=MX example.com

# Check TXT record (SPF, DMARC)
nslookup -type=TXT example.com
nslookup -type=TXT _dmarc.example.com

# Check CNAME record
nslookup -type=CNAME www.example.com

# Check nameservers
nslookup -type=NS example.com

# Query specific DNS server
nslookup example.com 8.8.8.8

# Flush local DNS cache (Windows)
ipconfig /flushdns
```

---

## Additional Resources

- [Netlify Custom Domains Documentation](https://docs.netlify.com/domains-https/custom-domains/)
- [Microsoft 365 DNS Records Reference](https://docs.microsoft.com/en-us/microsoft-365/admin/get-help-with-domains/create-dns-records-at-any-dns-hosting-provider)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [SPF Record Syntax](http://www.open-spf.org/SPF_Record_Syntax/)
- [DMARC.org](https://dmarc.org/)
- [MXToolbox](https://mxtoolbox.com/) - Free DNS diagnostic tools

---

*Last updated: February 2026*
