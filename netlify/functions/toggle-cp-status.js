const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');
const { rateLimit } = require('./utils/rate-limit');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const ALLOWED_FIELDS = ['is_completed', 'needs_revision'];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    rateLimit(event, 60, 60000);
    const decodedToken = await verifyToken(event);
    const userId = decodedToken.uid;

    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const { problem_id, field, value } = payload;

    if (!problem_id) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing problem_id' }) };
    }
    if (!ALLOWED_FIELDS.includes(field)) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: `Invalid field. Must be one of: ${ALLOWED_FIELDS.join(', ')}` }) };
    }
    if (typeof value !== 'boolean') {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'value must be a boolean' }) };
    }

    const { data, error } = await supabaseAdmin
      .from('cp_user_progress')
      .upsert(
        {
          user_uid: userId,
          problem_id,
          [field]: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_uid,problem_id', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error) {
    console.error('Toggle CP Status Error:', error);
    const isUnauth = error.message?.includes('Unauthorized');
    return {
      statusCode: isUnauth ? 401 : 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
