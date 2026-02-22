/**
 * Netlify Identity Signup Function
 *
 * This function is automatically triggered when a new user signs up.
 * It assigns roles based on the user's email address.
 *
 * Users in the approved list get "official" role
 * All others get no role (or could be set to a default)
 */

const fs = require('fs');
const path = require('path');

// Read the approved users list
function getApprovedEmails() {
  try {
    // In production, this would read from a file or environment variable
    // For now, we'll use the list of users
    const listPath = path.join(__dirname, '..', '..', '.claude', 'list of users.txt');

    if (fs.existsSync(listPath)) {
      const content = fs.readFileSync(listPath, 'utf8');
      const emails = content
        .split('\n')
        .map(line => line.trim().toLowerCase())
        .filter(line => line && line.includes('@'));

      return new Set(emails);
    }

    // Fallback to empty set if file doesn't exist
    return new Set();
  } catch (error) {
    console.error('Error reading approved users list:', error);
    return new Set();
  }
}

// Determine role based on email
function assignRole(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const approvedEmails = getApprovedEmails();

  // Check if user is in approved list
  if (approvedEmails.has(normalizedEmail)) {
    return 'official';
  }

  // Default: no role (user needs to be approved)
  // Note: Admin and executive roles should be set manually via Netlify Identity UI
  return null;
}

exports.handler = async (event, context) => {
  // Only run on identity-signup event
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { user } = data;

    if (!user || !user.email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid user data' })
      };
    }

    // Assign role based on email
    const role = assignRole(user.email);

    console.log(`Assigning role to ${user.email}: ${role || 'none'}`);

    // Construct response body in the format Netlify Identity expects
    const responseBody = {
      app_metadata: {
        role: role,  // Single role (not array for our use case)
        roles: role ? [role] : [],  // Also include as array for compatibility
        assigned_at: new Date().toISOString()
      },
      user_metadata: {
        ...user.user_metadata,
        signup_method: 'identity'
      }
    };

    return {
      statusCode: 200,
      body: JSON.stringify(responseBody)
    };
  } catch (error) {
    console.error('Error in identity-signup function:', error);

    // Return success anyway to not block user signup
    return {
      statusCode: 200,
      body: JSON.stringify({
        app_metadata: {},
        user_metadata: {}
      })
    };
  }
};
