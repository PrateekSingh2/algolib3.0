const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    await verifyToken(event); // Ensure user is authenticated

    const { data, error } = await supabaseAdmin.from('admins').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify(data || []) };
  } catch (error) {
    console.error("Get Admins Error:", error);
    return {
      statusCode: error.message.includes('Unauthorized') ? 401 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
