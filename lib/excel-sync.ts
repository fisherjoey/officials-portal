/**
 * Excel Sync for OSA Submissions
 *
 * Syncs OSA form submissions to an Excel workbook in SharePoint/OneDrive
 * using Microsoft Graph API.
 *
 * Required Environment Variables:
 * - MICROSOFT_TENANT_ID
 * - MICROSOFT_CLIENT_ID
 * - MICROSOFT_CLIENT_SECRET
 * - OSA_EXCEL_SITE_ID (SharePoint site ID)
 * - OSA_EXCEL_DRIVE_ID (Drive ID where workbook is stored)
 * - OSA_EXCEL_WORKBOOK_ID (The workbook file ID)
 * - OSA_EXCEL_WORKSHEET_NAME (default: 'OSA Submissions')
 * - OSA_EXCEL_TABLE_NAME (default: 'OSATable')
 */

export interface OSASubmissionData {
  id: string
  created_at: string
  organization_name: string
  event_type: string

  // Multi-event tracking
  submission_group_id?: string
  event_index?: number

  // Event details (varies by type)
  event_name?: string
  start_date?: string
  end_date?: string
  number_of_games?: number
  days_of_week?: string
  player_gender?: string
  level_of_play?: string
  game_location?: string
  start_time?: string

  // Event contact
  event_contact_name: string
  event_contact_email: string
  event_contact_phone?: string

  // Billing
  billing_contact_name: string
  billing_email: string
  billing_phone?: string
  billing_address?: string
  billing_city?: string
  billing_province?: string
  billing_postal_code?: string

  // Other
  discipline_policy: string
  status: string
  notes?: string
}

// Excel column order - Clean combined format for all event types
const EXCEL_COLUMNS = [
  'ID',                    // A - Submission UUID from database
  'Submitted',             // B - Submission timestamp
  'Group ID',              // C - Links events from same submission
  'Event #',               // D - Event index within group (1, 2, 3...)
  'Organization',          // E - Organization name
  'Event Type',            // F - League / Tournament / Exhibition Game(s)
  'Event Name',            // G - League name, Tournament name, or Game Location
  'Start Date',            // H - Event start date
  'End Date',              // I - Event end date (League/Tournament only)
  'Number of Games',       // J - Game count (Exhibition/Tournament)
  'Days of Week',          // K - League only (e.g., "Monday, Wednesday")
  'Start Time',            // L - Exhibition only
  'Player Gender',         // M - Male, Female, or both
  'Level of Play',         // N - U11, U13, HS-SV, Adult, etc.
  'Event Contact Name',    // O
  'Event Contact Email',   // P
  'Event Contact Phone',   // Q
  'Billing Contact',       // R
  'Billing Email',         // S
  'Billing Phone',         // T
  'Billing Address',       // U
  'Billing City',          // V
  'Billing Province',      // W
  'Billing Postal Code',   // X
  'Discipline Policy',     // Y
  'Status',                // Z - new / contacted / scheduled / completed / cancelled
  'Notes',                 // AA - Internal notes
  'Last Synced'            // AB - Timestamp of last sync
]

export class OSAExcelSync {
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  private get config() {
    return {
      tenantId: process.env.MICROSOFT_TENANT_ID!,
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      siteId: process.env.OSA_EXCEL_SITE_ID!,
      driveId: process.env.OSA_EXCEL_DRIVE_ID!,
      workbookId: process.env.OSA_EXCEL_WORKBOOK_ID!,
      worksheetName: process.env.OSA_EXCEL_WORKSHEET_NAME || 'OSA Submissions',
      tableName: process.env.OSA_EXCEL_TABLE_NAME || 'OSATable'
    }
  }

  /**
   * Check if Excel sync is configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.OSA_EXCEL_SITE_ID &&
      process.env.OSA_EXCEL_DRIVE_ID &&
      process.env.OSA_EXCEL_WORKBOOK_ID
    )
  }

  /**
   * Get access token using client credentials flow
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken
    }

    const tokenEndpoint = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get access token: ${error}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in * 1000)
    return data.access_token
  }

  /**
   * Get the base URL for Excel workbook operations
   */
  private get workbookUrl(): string {
    return `https://graph.microsoft.com/v1.0/sites/${this.config.siteId}/drives/${this.config.driveId}/items/${this.config.workbookId}/workbook`
  }

  /**
   * Convert OSA submission to Excel row array (28 columns, A-AB)
   */
  private submissionToRow(submission: OSASubmissionData): (string | number | null)[] {
    return [
      submission.id,                                                          // A - ID
      submission.created_at ? new Date(submission.created_at).toLocaleString() : '', // B - Submitted
      submission.submission_group_id || '',                                   // C - Group ID
      submission.event_index || 1,                                            // D - Event #
      submission.organization_name,                                           // E - Organization
      submission.event_type,                                                  // F - Event Type
      submission.event_name || '',                                            // G - Event Name (combined)
      submission.start_date || '',                                            // H - Start Date
      submission.end_date || '',                                              // I - End Date
      submission.number_of_games || '',                                       // J - Number of Games
      submission.days_of_week || '',                                          // K - Days of Week
      submission.start_time || '',                                            // L - Start Time
      submission.player_gender || '',                                         // M - Player Gender
      submission.level_of_play || '',                                         // N - Level of Play
      submission.event_contact_name,                                          // O - Event Contact Name
      submission.event_contact_email,                                         // P - Event Contact Email
      submission.event_contact_phone || '',                                   // Q - Event Contact Phone
      submission.billing_contact_name,                                        // R - Billing Contact
      submission.billing_email,                                               // S - Billing Email
      submission.billing_phone || '',                                         // T - Billing Phone
      submission.billing_address || '',                                       // U - Billing Address
      submission.billing_city || '',                                          // V - Billing City
      submission.billing_province || '',                                      // W - Billing Province
      submission.billing_postal_code || '',                                   // X - Billing Postal Code
      submission.discipline_policy,                                           // Y - Discipline Policy
      submission.status,                                                      // Z - Status
      submission.notes || '',                                                 // AA - Notes
      new Date().toISOString()                                                // AB - Last Synced
    ]
  }

  /**
   * Add a new submission to Excel
   */
  async addSubmission(submission: OSASubmissionData): Promise<void> {
    if (!this.isConfigured()) {
      console.log('Excel sync not configured, skipping...')
      return
    }

    const token = await this.getAccessToken()
    const rowData = this.submissionToRow(submission)

    // Add row to the table
    const url = `${this.workbookUrl}/tables/${this.config.tableName}/rows`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowData]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to add row to Excel: ${error}`)
    }

    console.log(`Added OSA submission ${submission.id} to Excel`)
  }

  /**
   * Update an existing submission in Excel
   */
  async updateSubmission(submission: OSASubmissionData): Promise<void> {
    if (!this.isConfigured()) {
      console.log('Excel sync not configured, skipping...')
      return
    }

    const token = await this.getAccessToken()

    // First, find the row with this ID
    const rowIndex = await this.findRowBySubmissionId(submission.id)

    if (rowIndex === null) {
      // Row not found, add it instead
      console.log(`Submission ${submission.id} not found in Excel, adding new row...`)
      await this.addSubmission(submission)
      return
    }

    const rowData = this.submissionToRow(submission)

    // Update the row (Excel rows are 1-indexed, +1 for header)
    const url = `${this.workbookUrl}/worksheets/${encodeURIComponent(this.config.worksheetName)}/range(address='A${rowIndex + 2}:${this.getColumnLetter(EXCEL_COLUMNS.length)}${rowIndex + 2}')`

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowData]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to update row in Excel: ${error}`)
    }

    console.log(`Updated OSA submission ${submission.id} in Excel`)
  }

  /**
   * Find a row by submission ID
   * Returns the 0-based row index (excluding header), or null if not found
   */
  private async findRowBySubmissionId(submissionId: string): Promise<number | null> {
    const token = await this.getAccessToken()

    // Get the ID column (column A)
    const url = `${this.workbookUrl}/worksheets/${encodeURIComponent(this.config.worksheetName)}/range(address='A:A')/usedRange`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to read Excel: ${error}`)
    }

    const data = await response.json()
    const values = data.values as string[][]

    // Find the row with matching ID (skip header row)
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === submissionId) {
        return i - 1 // Return 0-based index excluding header
      }
    }

    return null
  }

  /**
   * Get all submissions from Excel
   */
  async getAllSubmissions(): Promise<any[][]> {
    if (!this.isConfigured()) {
      console.log('Excel sync not configured')
      return []
    }

    const token = await this.getAccessToken()

    const url = `${this.workbookUrl}/worksheets/${encodeURIComponent(this.config.worksheetName)}/usedRange`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to read Excel: ${error}`)
    }

    const data = await response.json()
    return data.values || []
  }

  /**
   * Convert column number to Excel letter (1=A, 2=B, etc.)
   */
  private getColumnLetter(colNum: number): string {
    let letter = ''
    while (colNum > 0) {
      const mod = (colNum - 1) % 26
      letter = String.fromCharCode(65 + mod) + letter
      colNum = Math.floor((colNum - 1) / 26)
    }
    return letter
  }

  /**
   * Create the Excel table if it doesn't exist
   * Call this once during setup
   */
  async initializeWorksheet(): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Excel sync not configured')
    }

    const token = await this.getAccessToken()

    // First, add headers to the worksheet
    const headersUrl = `${this.workbookUrl}/worksheets/${encodeURIComponent(this.config.worksheetName)}/range(address='A1:${this.getColumnLetter(EXCEL_COLUMNS.length)}1')`

    const headersResponse = await fetch(headersUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [EXCEL_COLUMNS]
      })
    })

    if (!headersResponse.ok) {
      const error = await headersResponse.text()
      throw new Error(`Failed to set headers: ${error}`)
    }

    // Create a table from the headers
    const tableUrl = `${this.workbookUrl}/worksheets/${encodeURIComponent(this.config.worksheetName)}/tables/add`

    const tableResponse = await fetch(tableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: `A1:${this.getColumnLetter(EXCEL_COLUMNS.length)}1`,
        hasHeaders: true
      })
    })

    if (!tableResponse.ok) {
      const error = await tableResponse.text()
      // Table might already exist, which is fine
      console.log(`Table creation response: ${error}`)
    }

    console.log('Excel worksheet initialized with headers')
  }
}

// Export singleton instance
export const osaExcelSync = new OSAExcelSync()

// Export column headers for reference
export { EXCEL_COLUMNS }
