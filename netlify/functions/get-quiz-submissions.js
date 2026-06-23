const { supabaseAdmin } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const quizId = event.queryStringParameters?.quiz_id;
    const limit = event.queryStringParameters?.limit;
    const userUid = event.queryStringParameters?.user_uid;

    if (!quizId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing quiz_id' }) };

    let query = supabaseAdmin.from('quiz_submissions').select('id, user_uid, quiz_id, score, time_taken_seconds, created_at').eq('quiz_id', quizId);

    if (userUid) {
      query = query.eq('user_uid', userUid).maybeSingle();
    } else if (limit) {
      query = query.order('score', { ascending: false }).order('time_taken_seconds', { ascending: true }).limit(parseInt(limit, 10));
    } else {
      query = query.order('score', { ascending: false }).order('time_taken_seconds', { ascending: true });
    }

    const { data: submissions, error } = await query;
    if (error) throw error;

    let result = submissions || [];

    if (result.length > 0) {
      const userUids = Array.from(new Set(result.map(sub => sub.user_uid)));
      
      const { data: dbUsers, error: uError } = await supabaseAdmin
        .from('users')
        .select('firebase_uid, display_name, full_name, username, is_verified')
        .in('firebase_uid', userUids);
        
      if (!uError && dbUsers) {
        const userMap = {};
        dbUsers.forEach(u => userMap[u.firebase_uid] = u);
        
        result = result.map(sub => {
          const userMeta = userMap[sub.user_uid] || {};
          return {
            ...sub,
            display_name: userMeta.display_name || userMeta.full_name || 'Anonymous',
            username: userMeta.username || null,
            is_verified: !!userMeta.is_verified
          };
        });
      }
    }

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error("Get Quiz Submissions Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
