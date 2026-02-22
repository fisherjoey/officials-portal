/**
 * Bulk set user roles in Netlify Identity
 *
 * This script updates the app_metadata.role for all users in Netlify Identity
 *
 * Prerequisites:
 * - NETLIFY_SITE_ID environment variable or passed as first argument
 * - NETLIFY_ACCESS_TOKEN (your personal access token)
 *
 * Usage:
 * node scripts/set-user-roles.js <site-id> <access-token> <role>
 *
 * Example:
 * node scripts/set-user-roles.js abc123 nfp_xxx official
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SITE_ID = process.argv[2] || process.env.NETLIFY_SITE_ID;
const ACCESS_TOKEN = process.argv[3] || process.env.NETLIFY_ACCESS_TOKEN;
const ROLE = process.argv[4] || 'official'; // Default role

if (!SITE_ID || !ACCESS_TOKEN) {
  console.error('❌ Error: Site ID and Access Token required');
  console.error('Usage: node scripts/set-user-roles.js <site-id> <access-token> <role>');
  console.error('Example: node scripts/set-user-roles.js abc123 nfp_xxx official');
  process.exit(1);
}

// Netlify API endpoints
const NETLIFY_API = 'https://api.netlify.com/api/v1';

// Get all Identity users
async function getAllUsers(siteId, token) {
  try {
    const response = await fetch(`${NETLIFY_API}/sites/${siteId}/identity/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch users: ${error}`);
    }

    const users = await response.json();
    return users;
  } catch (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }
}

// Update user metadata
async function updateUserRole(siteId, token, userId, role) {
  try {
    const response = await fetch(`${NETLIFY_API}/sites/${siteId}/identity/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_metadata: {
          role: role
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Delay function to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function
async function main() {
  console.log('🚀 Starting bulk role assignment...\n');
  console.log(`Site ID: ${SITE_ID}`);
  console.log(`Role to assign: ${ROLE}\n`);

  // Fetch all users
  console.log('📋 Fetching all users from Netlify Identity...');
  let users;
  try {
    users = await getAllUsers(SITE_ID, ACCESS_TOKEN);
    console.log(`✅ Found ${users.length} users\n`);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }

  if (users.length === 0) {
    console.log('No users found. Exiting.');
    return;
  }

  console.log('🔄 Updating user roles...\n');

  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  // Process users with rate limiting
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const email = user.email;
    const currentRole = user.app_metadata?.role;

    console.log(`[${i + 1}/${users.length}] Processing: ${email}`);

    // Skip if already has the role
    if (currentRole === ROLE) {
      console.log(`  ⏭️  Already has role: ${ROLE}`);
      results.skipped.push({ email, currentRole });
    } else {
      const result = await updateUserRole(SITE_ID, ACCESS_TOKEN, user.id, ROLE);

      if (result.success) {
        console.log(`  ✅ Updated: ${currentRole || 'none'} → ${ROLE}`);
        results.success.push({ email, oldRole: currentRole, newRole: ROLE });
      } else {
        console.log(`  ❌ Failed: ${result.error}`);
        results.failed.push({ email, error: result.error });
      }
    }

    // Rate limiting: wait 200ms between requests
    if (i < users.length - 1) {
      await delay(200);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successfully updated: ${results.success.length}`);
  console.log(`⏭️  Already had role: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`👥 Total processed: ${users.length}`);
  console.log('='.repeat(50));

  if (results.failed.length > 0) {
    console.log('\n❌ Failed updates:');
    results.failed.forEach(({ email, error }) => {
      console.log(`  - ${email}: ${error}`);
    });
  }

  // Save results to file
  const resultsFile = path.join(__dirname, 'role-update-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n📝 Detailed results saved to: ${resultsFile}`);
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
