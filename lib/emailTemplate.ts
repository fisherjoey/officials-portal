// Organization Email Template
// Creates a professional, branded HTML email wrapper
// Configure your organization details in config/organization.ts

import { orgConfig } from '@/config/organization'

export interface EmailTemplateOptions {
  subject: string
  content: string
  previewText?: string
  previewMode?: boolean // When true, uses dark outer background for preview display
  external?: boolean // When true, hides Member Portal link and member-specific footer text
}

export function generateEmailTemplate(options: EmailTemplateOptions): string {
  const { subject, content, previewText, previewMode, external } = options
  const outerBgColor = previewMode ? '#1f2937' : '#f5f5f5'
  const siteUrl = orgConfig.siteUrl

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <!--[if mso | IE]>
  <style>
    /* Force Outlook to respect background colors */
    .email-container { background-color: #ffffff !important; }
  </style>
  <![endif]-->
  <style>
    /* Prevent dark mode color inversion in Outlook/Windows Mail */
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }
    /* Dark mode meta override */
    [data-ogsc] body,
    [data-ogsb] body {
      background-color: ${outerBgColor} !important;
    }
    /* Force light mode on content area */
    [data-ogsc] .email-content,
    [data-ogsb] .email-content {
      background-color: #ffffff !important;
      color: #333333 !important;
    }
    /* Outlook.com dark mode overrides */
    [data-ogsc] h1, [data-ogsc] h2, [data-ogsc] h3,
    [data-ogsb] h1, [data-ogsb] h2, [data-ogsb] h3 {
      color: ${orgConfig.colors.secondary} !important;
    }
    [data-ogsc] p, [data-ogsc] li, [data-ogsc] td,
    [data-ogsb] p, [data-ogsb] li, [data-ogsb] td {
      color: #333333 !important;
    }
    [data-ogsc] a, [data-ogsb] a {
      color: ${orgConfig.colors.primary} !important;
    }
    /* Base styles - these serve as fallbacks for email clients that support <style> */
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${outerBgColor};
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    /* Content typography */
    h1 {
      color: ${orgConfig.colors.secondary};
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 16px;
      font-weight: 700;
      line-height: 1.3;
    }
    h2 {
      color: ${orgConfig.colors.secondary};
      font-size: 20px;
      margin-top: 24px;
      margin-bottom: 12px;
      font-weight: 600;
      border-bottom: 2px solid ${orgConfig.colors.primary};
      padding-bottom: 8px;
    }
    h3 {
      color: #1f2937;
      font-size: 18px;
      margin-top: 20px;
      margin-bottom: 10px;
      font-weight: 600;
    }
    p {
      margin: 0 0 16px 0;
      font-size: 16px;
      line-height: 1.6;
    }
    ul, ol {
      margin: 0 0 16px 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
      font-size: 16px;
      line-height: 1.5;
    }
    a {
      color: ${orgConfig.colors.primary};
      text-decoration: underline;
    }
    strong {
      color: ${orgConfig.colors.secondary};
      font-weight: 600;
    }
    /* Tables in content */
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: ${orgConfig.colors.secondary};
      color: #ffffff;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
    }
    td {
      padding: 10px 12px;
      border: 1px solid #E5E7EB;
      font-size: 14px;
    }
    blockquote {
      border-left: 4px solid ${orgConfig.colors.primary};
      background-color: #FFF7ED;
      padding: 12px 16px;
      margin: 16px 0;
      font-style: italic;
    }
    /* Button - mobile-friendly with larger tap target */
    .button {
      display: inline-block;
      padding: 14px 28px;
      min-height: 44px;
      background-color: ${orgConfig.colors.primary};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
      text-align: center;
    }
    /* Responsive adjustments for clients that support media queries */
    @media only screen and (max-width: 480px) {
      h1 {
        font-size: 22px !important;
      }
      h2 {
        font-size: 18px !important;
      }
      .button {
        display: block !important;
        width: 100% !important;
        padding: 16px 20px !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ''}

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${outerBgColor};">
    <tr>
      <td style="padding: 20px 10px;">
        <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff;" align="center">

          <!-- Header -->
          <tr>
            <td style="background-color: ${orgConfig.colors.dark}; padding: 24px 20px; border-bottom: 3px solid ${orgConfig.colors.primary}; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 4px 0; font-size: 18px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.3;">${orgConfig.name}</h1>
              <p style="color: #ffffff; margin: 0; font-size: 14px; font-weight: 500; opacity: 0.95;">${orgConfig.tagline}</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="email-content" style="padding: 30px 20px; color: #333333; background-color: #ffffff; font-size: 16px; line-height: 1.6;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${orgConfig.colors.dark}; color: #D1D5DB; padding: 30px 20px; text-align: center; font-size: 14px; line-height: 1.7; border-top: 3px solid ${orgConfig.colors.primary};">
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #ffffff;">${orgConfig.name}</p>
              <p style="margin: 0 0 15px 0;">${orgConfig.contact.address}</p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 20px auto;">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="${siteUrl}" style="color: ${orgConfig.colors.primary}; text-decoration: none; font-size: 14px;">Website</a>
                  </td>
                  ${external ? `
                  <td style="padding: 0 8px;">
                    <a href="${siteUrl}/contact" style="color: ${orgConfig.colors.primary}; text-decoration: none; font-size: 14px;">Contact Us</a>
                  </td>
                  ` : `
                  <td style="padding: 0 8px;">
                    <a href="${siteUrl}/portal" style="color: ${orgConfig.colors.primary}; text-decoration: none; font-size: 14px;">${orgConfig.labels.memberPortal}</a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="${siteUrl}/contact?category=general" style="color: ${orgConfig.colors.primary}; text-decoration: none; font-size: 14px;">Contact Us</a>
                  </td>
                  `}
                </tr>
              </table>

              ${external ? `
              <p style="margin: 20px 0 10px 0; font-size: 13px; color: #9ca3af;">
                You are receiving this email because you submitted a request through our website.
              </p>
              ` : `
              <p style="margin: 20px 0 10px 0; font-size: 13px; color: #9ca3af;">
                You are receiving this email because you are a member of ${orgConfig.name}.
              </p>
              `}

              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                &copy; ${new Date().getFullYear()} ${orgConfig.name}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// Legacy alias for backwards compatibility
export const generateCBOAEmailTemplate = generateEmailTemplate

// Sample usage examples
export const sampleEmails = {
  announcement: generateEmailTemplate({
    subject: 'Important Update: New Training Session',
    previewText: 'Join us for an upcoming certification clinic...',
    content: `
      <h1>New Training Session Announced</h1>

      <p>Dear Members,</p>

      <p>We're excited to announce a new <strong>Certification Clinic</strong> scheduled for next month.</p>

      <h2>Event Details</h2>
      <ul>
        <li><strong>Date:</strong> Saturday, December 14, 2025</li>
        <li><strong>Time:</strong> 9:00 AM - 4:00 PM</li>
        <li><strong>Location:</strong> Community Center</li>
        <li><strong>Cost:</strong> $75 (includes materials and lunch)</li>
      </ul>

      <h2>What You'll Learn</h2>
      <p>This comprehensive clinic will cover:</p>
      <ul>
        <li>Advanced positioning and mechanics</li>
        <li>Multi-person officiating systems</li>
        <li>Game management and communication</li>
        <li>Rule interpretations and case plays</li>
      </ul>

      <p style="text-align: center;">
        <a href="#" class="button">Register Now</a>
      </p>

      <p>Space is limited, so please register early to secure your spot.</p>

      <p>If you have any questions, please don't hesitate to reach out.</p>

      <p>Best regards,<br>
      <strong>Executive Board</strong></p>
    `
  }),

  newsletter: generateEmailTemplate({
    subject: 'Monthly Newsletter',
    previewText: 'Your monthly update...',
    content: `
      <h1>Monthly Newsletter</h1>

      <p>Welcome to this month's edition of our newsletter!</p>

      <h2>What's New</h2>
      <ul>
        <li><strong>New Officials:</strong> Welcome to our new members who joined this month!</li>
        <li><strong>Season Kickoff:</strong> Winter league starts next month</li>
        <li><strong>Rule Changes:</strong> Review the latest rule modifications in the portal</li>
      </ul>

      <h2>Upcoming Events</h2>
      <p><strong>Rules Refresher Workshop</strong><br>
      Next Week | 7:00 PM | Virtual</p>

      <h2>Resources</h2>
      <p>Don't forget to check out the updated resources in the member portal:</p>
      <ul>
        <li>Official Rulebook</li>
        <li>Pre-game checklist</li>
        <li>Mechanics manual</li>
      </ul>

      <p style="text-align: center;">
        <a href="#" class="button">Visit Portal</a>
      </p>

      <p>See you at the next ${orgConfig.sport.eventName.toLowerCase()}!</p>

      <p>Best regards,<br>
      <strong>Communications Team</strong></p>
    `
  }),

  reminder: generateEmailTemplate({
    subject: `Reminder: ${orgConfig.sport.eventName} Assignment Tomorrow`,
    previewText: `You have a ${orgConfig.sport.eventName.toLowerCase()} assignment tomorrow...`,
    content: `
      <h1>${orgConfig.sport.eventName} Assignment Reminder</h1>

      <p>Hi there,</p>

      <p>This is a friendly reminder about your upcoming ${orgConfig.sport.eventName.toLowerCase()} assignment:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f9fafb; border: 2px solid #e5e7eb;">
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Date:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Saturday, November 16, 2025</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Time:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">7:00 PM</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Venue:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Community Sports Center</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Teams:</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Team A vs. Team B</td>
        </tr>
        <tr>
          <td style="padding: 12px; font-weight: 600;">Level:</td>
          <td style="padding: 12px;">Varsity</td>
        </tr>
      </table>

      <p><strong>Please arrive 30 minutes early for pre-game preparation.</strong></p>

      <p>If you have any conflicts or questions, please contact the assignor immediately.</p>

      <p style="text-align: center;">
        <a href="#" class="button">View Full Schedule</a>
      </p>

      <p>Good luck!</p>

      <p>Best regards,<br>
      <strong>Scheduling Team</strong></p>
    `
  })
}
