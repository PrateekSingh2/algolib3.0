const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');
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
    const decodedToken = await verifyToken(event);
    const userId = decodedToken.uid;

    const { data: problems, error: problemsError } = await supabaseAdmin
      .from('cp_problems')
      .select('id, title, topic, difficulty, url, platform, order_index')
      .order('order_index', { ascending: true });

    if (problemsError) throw problemsError;

    const { data: progress, error: progressError } = await supabaseAdmin
      .from('cp_user_progress')
      .select('problem_id, is_completed, needs_revision, updated_at')
      .eq('user_uid', userId);

    if (progressError) throw progressError;

    const progressMap = {};
    (progress || []).forEach((row) => {
      progressMap[row.problem_id] = {
        is_completed: row.is_completed,
        needs_revision: row.needs_revision,
      };
    });

    const merged = (problems || []).map((p) => ({
      ...p,
      is_completed: progressMap[p.id]?.is_completed ?? false,
      needs_revision: progressMap[p.id]?.needs_revision ?? false,
    }));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ problems: merged }),
    };
  } catch (error) {
    console.error('Get CP Progress Error:', error);
    const isUnauth = error.message?.includes('Unauthorized');
    return {
      statusCode: isUnauth ? 401 : 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
