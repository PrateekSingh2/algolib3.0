const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const decodedToken = await verifyToken(event);
    const userId = decodedToken.uid;
    const displayName = decodedToken.name || decodedToken.email?.split('@')[0] || 'User';

    const payload = JSON.parse(event.body);
    const { quiz_id, score, total_questions, time_taken_seconds, warnings_hit, answers_payload, email } = payload;

    if (!quiz_id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing quiz_id' }) };

    // Insert into quiz_submissions
    const { data, error } = await supabaseAdmin.from('quiz_submissions').insert([{
      quiz_id,
      user_uid: userId,
      display_name: displayName,
      email: email || decodedToken.email || 'No Email',
      score,
      total_questions,
      warnings_hit,
      time_taken_seconds,
      answers_payload
    }]).select();

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ success: true, data }) };
  } catch (error) {
    console.error("Submit Quiz Error:", error);
    return {
      statusCode: error.message.includes('Unauthorized') ? 401 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
