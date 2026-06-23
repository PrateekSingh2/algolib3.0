const { supabaseAdmin } = require('./utils/supabase');
const { admin } = require('./utils/firebase-admin');
const { rateLimit } = require('./utils/rate-limit');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    rateLimit(event, 60, 60000);
    
    const username = event.queryStringParameters.username;
    if (!username) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing username parameter' }) };
    }

    const normalizedUsername = username.toLowerCase().trim();

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('firebase_uid, username, full_name, display_name, bio, college, github_url, linkedin_url, created_at, avatar_url, banner_url, email, age, gender, city, state, country, email_public, age_public, location_public, gender_public, is_verified')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (error) throw error;
    
    if (!data) {
      return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: 'User not found' }) };
    }

    let isOwner = false;
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (decodedToken.uid === data.firebase_uid) {
          isOwner = true;
        }
      } catch (err) {
        // invalid token, ignore
      }
    }

    // Backend Privacy Enforcement
    // We strictly nullify the data on the server side if the user hasn't explicitly set it to public
    // unless the requester is the owner of the profile.
    const publicProfile = {
      firebase_uid: data.firebase_uid,
      username: data.username,
      full_name: data.full_name,
      display_name: data.display_name,
      bio: data.bio,
      college: data.college,
      github_url: data.github_url,
      linkedin_url: data.linkedin_url,
      created_at: data.created_at,
      avatar_url: data.avatar_url,
      banner_url: data.banner_url,
      is_verified: !!data.is_verified,
      
      // Enforced Fields
      email: (isOwner || data.email_public) ? data.email : null,
      age: (isOwner || data.age_public) ? data.age : null,
      gender: (isOwner || data.gender_public) ? data.gender : null,
      location: (isOwner || data.location_public) ? {
        city: data.city,
        state: data.state,
        country: data.country
      } : null,
      country: data.location_public ? data.country : null,

      // Pass the toggles to the frontend so it knows it was intentionally hidden
      email_public: !!data.email_public,
      age_public: !!data.age_public,
      location_public: !!data.location_public,
      gender_public: !!data.gender_public
    };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(publicProfile)
    };
  } catch (error) {
    console.error("Public Profile Fetch Error:", error);
    const isRateLimit = error.message.includes('Too many requests');
    return { 
      statusCode: isRateLimit ? 429 : 500, 
      headers: CORS_HEADERS, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};
