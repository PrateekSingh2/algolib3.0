const { supabaseAdmin } = require('./utils/supabase');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  try {
    const landingOnly = event.queryStringParameters?.landing === 'true';
    let query = supabaseAdmin
      .from('testimonials')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (landingOnly) {
      query = query.eq('show_on_landing', true).limit(10);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { statusCode: 200, headers, body: JSON.stringify(data || []) };
  } catch (err) {
    console.error('get-testimonials error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
