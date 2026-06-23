const { supabaseAdmin } = require('./utils/supabase');
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
    // 30 requests per minute to prevent heavy scraping
    rateLimit(event, 30, 60000);
    
    const username = event.queryStringParameters.username;
    if (!username) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing username parameter' }) };
    }

    // Convert username to lowercase for case-insensitive check
    const normalizedUsername = username.toLowerCase().trim();

    // Industry-standard fast existence check: use head and count to avoid returning data
    const { count, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('username', normalizedUsername);

    if (error) throw error;

    // If count is 0, the username is available
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        available: count === 0,
        username: normalizedUsername
      })
    };
  } catch (error) {
    console.error("Check Username API Error:", error);
    const isRateLimit = error.message.includes('Too many requests');
    return { 
      statusCode: isRateLimit ? 429 : 500, 
      headers: CORS_HEADERS, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};
