const { supabaseAdmin } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { uids } = JSON.parse(event.body);
    if (!uids || !Array.isArray(uids)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing or invalid uids array' }) };
    }

    if (uids.length === 0) {
      return { statusCode: 200, body: JSON.stringify({}) };
    }

    // Limit to 100 uids per request to prevent abuse
    const limitedUids = uids.slice(0, 100);

    const { data: dbUsers, error } = await supabaseAdmin
      .from('users')
      .select('firebase_uid, username, is_verified, display_name, full_name, avatar_url')
      .in('firebase_uid', limitedUids);

    if (error) throw error;

    const userMap = {};
    if (dbUsers) {
      dbUsers.forEach(u => {
        userMap[u.firebase_uid] = {
          username: u.username,
          is_verified: !!u.is_verified,
          display_name: u.display_name || u.full_name,
          avatar_url: u.avatar_url
        };
      });
    }

    return { statusCode: 200, body: JSON.stringify(userMap) };
  } catch (error) {
    console.error("Get Users Meta Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
