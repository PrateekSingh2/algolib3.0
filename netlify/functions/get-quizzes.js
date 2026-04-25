const { supabaseAdmin } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const creatorUid = event.queryStringParameters?.creator_uid;
    const joinCode = event.queryStringParameters?.join_code;
    let query = supabaseAdmin.from('quizzes').select('*');
    
    if (creatorUid) {
      query = query.eq('creator_uid', creatorUid).order('created_at', { ascending: false });
    } else if (joinCode) {
      query = query.eq('join_code', joinCode).maybeSingle();
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify(data || []) };
  } catch (error) {
    console.error("Get Quizzes Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
