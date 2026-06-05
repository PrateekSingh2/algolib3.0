const { supabaseAdmin } = require('./utils/supabase');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  try {
    const body = JSON.parse(event.body || '{}');
    const { name, role, text, rating, image_url } = body;

    if (!name?.trim() || !role?.trim() || !text?.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'name, role and text are required' }) };
    }
    if (text.length > 600) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Review text too long (max 600 chars)' }) };
    }

    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .insert([{
        name: name.trim(),
        role: role.trim(),
        text: text.trim(),
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        image_url: image_url?.trim() || null,
        approved: false,        // admin must approve
        show_on_landing: false, // admin controls this
      }])
      .select()
      .single();

    if (error) throw error;
    return { statusCode: 201, headers, body: JSON.stringify({ success: true, id: data.id }) };
  } catch (err) {
    console.error('submit-testimonial error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
