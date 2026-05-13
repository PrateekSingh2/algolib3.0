const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'PATCH') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    await verifyToken(event);
    
    const body = JSON.parse(event.body);
    const { id, action, data } = body;

    if (!id) throw new Error("ID is required");

    let result;

    if (event.httpMethod === 'POST') {
        if (action === 'approve') {
            const { error } = await supabaseAdmin
              .from('discover_content')
              .update({ status: 'published' })
              .eq('id', id);
            if (error) throw error;
            result = { success: true, message: "Published successfully" };
        } else if (action === 'reject') {
            const { error } = await supabaseAdmin
              .from('discover_content')
              .update({ status: 'rejected' })
              .eq('id', id);
            if (error) throw error;
            result = { success: true, message: "Rejected successfully" };
        } else {
            throw new Error("Invalid action for POST");
        }
    } else if (event.httpMethod === 'PATCH') {
        if (!data) throw new Error("Update data is required");
        const { error } = await supabaseAdmin
            .from('discover_content')
            .update({
                title: data.title,
                content_markdown: data.content_markdown,
                image_url: data.image_url,
                seo_desc: data.seo_desc
            })
            .eq('id', id);
        
        if (error) throw error;
        result = { success: true, message: "Updated successfully" };
    }

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error("Manage Pending Content Error:", error);
    return {
      statusCode: error.message.includes('Unauthorized') ? 401 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
