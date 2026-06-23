const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');
const { rateLimit } = require('./utils/rate-limit');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    rateLimit(event, 60, 60000);
    let targetUid = event.queryStringParameters.uid;

    if (!targetUid) {
      // Only require auth if no uid is explicitly requested
      const decodedToken = await verifyToken(event);
      targetUid = decodedToken.uid;
    }

    if (!targetUid) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing uid parameter' }) };
    }

    const { data: lbData, error: lbError } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .eq('user_uid', targetUid);

    if (lbError) throw lbError;

    if (!lbData || lbData.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ leaderboard: [], problems: [], contests: [] }) };
    }

    const uniqueProblems = new Set(lbData.map(entry => entry.problem_id));
    const problemIds = Array.from(uniqueProblems);

    const { data: pData, error: pError } = await supabaseAdmin
      .from('problems')
      .select('id, contest_id')
      .in('id', problemIds);

    if (pError) throw pError;

    let contests = [];
    if (pData && pData.length > 0) {
      const contestIds = Array.from(new Set(pData.map(p => p.contest_id).filter(Boolean)));
      if (contestIds.length > 0) {
        const { data: cData, error: cError } = await supabaseAdmin
          .from('contests')
          .select('id, title, start_time')
          .in('id', contestIds);
        if (cError) throw cError;
        contests = cData || [];
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        leaderboard: lbData,
        problems: pData || [],
        contests: contests
      })
    };
  } catch (error) {
    console.error("Get Profile Stats Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
