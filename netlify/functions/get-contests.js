const { supabaseAdmin } = require('./utils/supabase');
const { rateLimit } = require('./utils/rate-limit');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    rateLimit(event, 60, 60000);
    const { data, error } = await supabaseAdmin
      .from('contests')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    console.error("Get Contests Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
