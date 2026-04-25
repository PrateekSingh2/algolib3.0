const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const decodedToken = await verifyToken(event);
    const updates = JSON.parse(event.body);

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('firebase_uid', decodedToken.uid)
      .select();

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    };
  } catch (error) {
    console.error("Update Profile Error:", error);
    return {
      statusCode: error.message.includes('Unauthorized') ? 401 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
