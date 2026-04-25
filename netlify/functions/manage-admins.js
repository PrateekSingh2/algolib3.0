const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const decodedToken = await verifyToken(event);
    const userEmail = decodedToken.email;

    const payload = JSON.parse(event.body);
    const { action, passcode, email_to_add, email_to_remove } = payload;

    if (!passcode) return { statusCode: 400, body: JSON.stringify({ error: 'Passcode required' }) };

    if (action === 'add') {
      const { data: verified, error: verifyErr } = await supabaseAdmin.rpc('verify_admin_passcode', { provided_passcode: passcode });
      if (verifyErr || !verified) throw new Error('Unauthorized Passcode');

      const { error: insertErr } = await supabaseAdmin.from('admins').insert([{ email: email_to_add.toLowerCase(), added_by: userEmail }]);
      if (insertErr) throw insertErr;

    } else if (action === 'remove') {
      const { error } = await supabaseAdmin.rpc('remove_admin_with_passcode', { email_to_remove, provided_passcode: passcode });
      if (error) throw error;
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error("Manage Admins Error:", error);
    return {
      statusCode: error.message.includes('Unauthorized') ? 401 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
