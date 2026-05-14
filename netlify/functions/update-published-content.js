const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'PATCH' && event.httpMethod !== 'PUT') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    await verifyToken(event);
    
    const body = JSON.parse(event.body);
    const { id, data } = body;

    if (!id) throw new Error("ID is required");
    if (!data) throw new Error("Update data is required");

    const { error } = await supabaseAdmin
        .from('discover_content')
        .update({
            title: data.title,
            slug: data.slug,
            content_markdown: data.content_markdown,
            image_url: data.image_url,
            seo_desc: data.seo_desc
        })
        .eq('id', id);
    
    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ success: true, message: "Updated successfully" }) };
  } catch (error) {
    console.error("Update Published Content Error:", error);
    return {
      statusCode: error.message.includes('Unauthorized') ? 401 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
