const { supabaseAdmin } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const quizId = event.queryStringParameters?.quiz_id;
    const limit = event.queryStringParameters?.limit;
    const userUid = event.queryStringParameters?.user_uid;

    if (!quizId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing quiz_id' }) };

    let query = supabaseAdmin.from('quiz_submissions').select('*').eq('quiz_id', quizId);

    if (userUid) {
      query = query.eq('user_uid', userUid).maybeSingle();
    } else if (limit) {
      query = query.order('score', { ascending: false }).order('time_taken_seconds', { ascending: true }).limit(parseInt(limit, 10));
    } else {
      query = query.order('score', { ascending: false }).order('time_taken_seconds', { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify(data || null) };
  } catch (error) {
    console.error("Get Quiz Submissions Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
