// SharePoint/Excel Online Integration using Microsoft Graph API
// This requires setting up an Azure AD app registration

export interface SharePointConfig {
  clientId: string
  clientSecret: string
  tenantId: string
  siteId: string
  driveId: string
  workbookId: string
}

export class SharePointClient {
  private accessToken: string | null = null

  constructor(private config: SharePointConfig) {}

  // Get access token using client credentials flow
  private async getAccessToken(): Promise<string> {
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

    const data = await response.json()
    this.accessToken = data.access_token
    return data.access_token
  }

  // Add a row to Excel workbook
  async addRowToExcel(worksheetName: string, rowData: any[]): Promise<void> {
    const token = await this.getAccessToken()

    const url = `https://graph.microsoft.com/v1.0/sites/${this.config.siteId}/drive/items/${this.config.workbookId}/workbook/worksheets/${worksheetName}/tables/Table1/rows`

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
      throw new Error(`Failed to add row: ${response.statusText}`)
    }
  }

  // Get all rows from Excel workbook
  async getRows(worksheetName: string): Promise<any[][]> {
    const token = await this.getAccessToken()

    const url = `https://graph.microsoft.com/v1.0/sites/${this.config.siteId}/drive/items/${this.config.workbookId}/workbook/worksheets/${worksheetName}/usedRange`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })

    const data = await response.json()
    return data.values
  }
}