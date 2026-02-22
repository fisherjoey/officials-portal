import { Handler } from '@netlify/functions';

/**
 * Netlify Function to resend invites to pending Identity users
 *
 * This function runs with admin context and can access the Identity API.
 *
 * Usage:
 * GET  /.netlify/functions/resend-invites?dry-run=true  - List pending users
 * POST /.netlify/functions/resend-invites               - Resend all invites
 *
 * Requires admin role to execute.
 */

const SITE_URL = process.env.URL || 'https://example.com';

interface IdentityUser {
  id: string;
  email: string;
  confirmed_at?: string;
  invited_at?: string;
  created_at?: string;
  app_metadata?: {
    roles?: string[];
  };
}

// Check if user has admin role
function isAdmin(user: any): boolean {
  const roles = user?.app_metadata?.roles || [];
  return roles.includes('admin');
}

// Fetch all users from Identity
async function fetchAllUsers(adminToken: string): Promise<IdentityUser[]> {
  const users: IdentityUser[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `${SITE_URL}/.netlify/identity/admin/users?page=${page}&per_page=${perPage}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`);
    }

    const data = await response.json();

    if (!data.users || data.users.length === 0) {
      break;
    }

    users.push(...data.users);

    if (data.users.length < perPage) {
      break;
    }

    page++;
  }

  return users;
}

// Filter for pending/unconfirmed users
function filterPendingUsers(users: IdentityUser[]): IdentityUser[] {
  return users.filter(user => !user.confirmed_at);
}

// Delete a user
async function deleteUser(userId: string, adminToken: string): Promise<boolean> {
  const response = await fetch(`${SITE_URL}/.netlify/identity/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    }
  });
  return response.ok;
}

// Invite a user (creates new invite)
async function inviteUser(email: string, adminToken: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${SITE_URL}/.netlify/identity/admin/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      confirm: false, // Send invitation email
    })
  });

  if (response.ok) {
    return { success: true };
  } else {
    const error = await response.text();
    return { success: false, error };
  }
}

// Delay helper
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const handler: Handler = async (event, context) => {
  // Check authentication
  const { identity, user } = context.clientContext || {};

  if (!identity || !user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized - must be logged in' })
    };
  }

  // Check admin role
  if (!isAdmin(user)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden - admin role required' })
    };
  }

  const isDryRun = event.queryStringParameters?.['dry-run'] === 'true' || event.httpMethod === 'GET';

  // Get admin token - needs to be passed from client or use identity.token
  // The identity.token is the user's token, we need admin token
  // For admin operations, we need to use the identity URL with admin credentials
  const adminToken = event.headers['x-admin-token'] || (identity as any).token;

  if (!adminToken) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Admin token required in x-admin-token header' })
    };
  }

  try {
    // Fetch all users
    const allUsers = await fetchAllUsers(adminToken);
    const pendingUsers = filterPendingUsers(allUsers);

    if (isDryRun) {
      // Just return the list of pending users
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'dry-run',
          totalUsers: allUsers.length,
          pendingCount: pendingUsers.length,
          pendingUsers: pendingUsers.map(u => ({
            email: u.email,
            invited_at: u.invited_at,
            created_at: u.created_at,
          }))
        }, null, 2)
      };
    }

    // Actually resend invites
    const results = {
      success: [] as string[],
      failed: [] as { email: string; error: string }[]
    };

    for (const user of pendingUsers) {
      // Delete the user first
      await deleteUser(user.id, adminToken);
      await delay(200);

      // Re-invite
      const result = await inviteUser(user.email, adminToken);

      if (result.success) {
        results.success.push(user.email);
      } else {
        results.failed.push({ email: user.email, error: result.error || 'Unknown error' });
      }

      await delay(300);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'live',
        totalPending: pendingUsers.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
        results
      }, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
    };
  }
};
