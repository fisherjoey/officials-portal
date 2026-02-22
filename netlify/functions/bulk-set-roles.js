/**
 * Bulk Set User Roles
 *
 * This Netlify Function uses admin privileges to bulk update user roles.
 * It reads from the approved users list and sets their role to "official".
 *
 * Invoke locally with:
 * npx netlify functions:invoke bulk-set-roles --port 8889
 */

const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const SITE_URL = process.env.URL || 'https://example.com';
  const GOTRUE_URL = `${SITE_URL}/.netlify/identity`;

  // Delay function
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  try {
    console.log('🚀 Starting bulk role assignment...');

    // Get JWT token from request body or Authorization header
    let token;

    // Try to get from request body first
    if (event.body) {
      try {
        const body = JSON.parse(event.body);
        token = body.token;
      } catch (e) {
        // Not JSON or no token in body
      }
    }

    // If not in body, try Authorization header
    if (!token && event.headers.authorization) {
      token = event.headers.authorization.replace(/^Bearer\s+/i, '');
    }

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized - JWT token required in body or Authorization header' })
      };
    }

    // Fetch all users using admin API
    console.log('📋 Fetching all users...');
    const usersResponse = await fetch(`${GOTRUE_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      throw new Error(`Failed to fetch users: ${usersResponse.status} ${errorText}`);
    }

    const data = await usersResponse.json();
    const usersToUpdate = data.users || data;
    console.log(`✅ Found ${usersToUpdate.length} total users`);

    if (usersToUpdate.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No matching users found',
          results: { success: [], failed: [], skipped: [] }
        })
      };
    }

    console.log('🔄 Updating user roles to "official"...');

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    // Process users
    for (let i = 0; i < usersToUpdate.length; i++) {
      const user = usersToUpdate[i];
      const email = user.email;
      const currentRole = user.app_metadata?.role;

      console.log(`[${i + 1}/${usersToUpdate.length}] Processing: ${email}`);

      if (currentRole === 'official') {
        console.log(`  ⏭️  Already official`);
        results.skipped.push({ email, currentRole });
      } else {
        try {
          const response = await fetch(`${GOTRUE_URL}/admin/users/${user.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              app_metadata: {
                role: 'official'
              }
            })
          });

          if (response.ok) {
            console.log(`  ✅ Updated: ${currentRole || 'none'} → official`);
            results.success.push({ email, oldRole: currentRole, newRole: 'official' });
          } else {
            const errorText = await response.text();
            console.log(`  ❌ Failed: ${errorText}`);
            results.failed.push({ email, error: errorText });
          }
        } catch (error) {
          console.log(`  ❌ Failed: ${error.message}`);
          results.failed.push({ email, error: error.message });
        }
      }

      // Rate limiting
      if (i < usersToUpdate.length - 1) {
        await delay(200);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully updated: ${results.success.length}`);
    console.log(`⏭️  Already had role: ${results.skipped.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log('='.repeat(50));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Bulk role assignment complete',
        summary: {
          total: usersToUpdate.length,
          success: results.success.length,
          skipped: results.skipped.length,
          failed: results.failed.length
        },
        results
      })
    };

  } catch (error) {
    console.error('Fatal error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
