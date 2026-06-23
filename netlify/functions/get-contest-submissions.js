const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const decodedToken = await verifyToken(event);
    const userUid = decodedToken.uid;

    const contestId = event.queryStringParameters?.contest_id;
    if (!contestId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing contest_id' }) };

    const { data: subs, error: subsErr } = await supabaseAdmin
      .from('submissions')
      .select('id, user_uid, problem_id, contest_id, language, passed, score_awarded, time_taken_seconds, created_at')
      .eq('contest_id', contestId)
      .eq('user_uid', userUid)
      .order('created_at', { ascending: false });

    if (subsErr) throw subsErr;

    const { data: probs } = await supabaseAdmin
      .from('problems')
      .select('id, title')
      .eq('contest_id', contestId);

    const probMap = new Map();
    if (probs) probs.forEach(p => probMap.set(p.id, p.title));

    const mappedSubs = (subs || []).map(s => ({
      ...s,
      problemTitle: probMap.get(s.problem_id) || 'Unknown Problem'
    }));

    return { statusCode: 200, body: JSON.stringify(mappedSubs) };
  } catch (error) {
    console.error("Get Contest Submissions Error:", error);
    return {
      statusCode: error.message.includes('Unauthorized') ? 401 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
