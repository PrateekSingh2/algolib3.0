const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  try {
    await verifyToken(event);

    // GET  — list all
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data || []) };
    }

    // POST — create
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { name, role, text, rating, image_url, show_on_landing, approved } = body;
      if (!name || !role || !text) return { statusCode: 400, headers, body: JSON.stringify({ error: 'name, role and text are required' }) };
      const { data, error } = await supabaseAdmin
        .from('testimonials')
        .insert([{ name, role, text, rating: rating ?? 5, image_url: image_url || null, show_on_landing: !!show_on_landing, approved: !!approved }])
        .select()
        .single();
      if (error) throw error;
      return { statusCode: 201, headers, body: JSON.stringify(data) };
    }

    // PATCH — update
    if (event.httpMethod === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      const { id, ...updates } = body;
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id required' }) };
      const { data, error } = await supabaseAdmin
        .from('testimonials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // DELETE
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body || '{}');
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id required' }) };
      const { error } = await supabaseAdmin.from('testimonials').delete().eq('id', id);
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('manage-testimonials error:', err);
    return {
      statusCode: err.message?.includes('Unauthorized') ? 401 : 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
