const { supabaseAdmin } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const contestId = event.queryStringParameters.id;
    if (!contestId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing contest id' }) };

    // 1. Get problems for contest
    const { data: pData, error: pError } = await supabaseAdmin
      .from('problems')
      .select('id')
      .eq('contest_id', contestId);

    if (pError) throw pError;
    if (!pData || pData.length === 0) return { statusCode: 200, body: JSON.stringify({ leaderboard: [], users: [] }) };

    const pIds = pData.map(p => p.id);

    // 2. Get leaderboard entries for these problems
    const { data: lData, error: lError } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .in('problem_id', pIds)
      .order('created_at', { ascending: true });

    if (lError) throw lError;

    let users = [];
    if (lData && lData.length > 0) {
      const userUids = Array.from(new Set(lData.map(entry => entry.user_uid)));
      
      // 3. Get user details
      const { data: dbUsers, error: uError } = await supabaseAdmin
        .from('users')
        .select('firebase_uid, display_name, full_name')
        .in('firebase_uid', userUids);
        
      if (uError) throw uError;
      users = dbUsers || [];
    }

    return { statusCode: 200, body: JSON.stringify({ leaderboard: lData || [], users }) };
  } catch (error) {
    console.error("Get Contest Leaderboard Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
