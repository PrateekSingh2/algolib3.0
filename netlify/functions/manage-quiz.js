const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');

exports.handler = async (event) => {
  try {
    const decodedToken = await verifyToken(event);
    const userId = decodedToken.uid;

    if (event.httpMethod === 'DELETE') {
      const quizId = event.queryStringParameters?.id;
      if (!quizId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing quiz id' }) };

      // Verify authorship
      const { data: qData, error: qFetchErr } = await supabaseAdmin.from('quizzes').select('creator_uid').eq('id', quizId).single();
      if (qFetchErr || !qData || qData.creator_uid !== userId) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
      }

      await supabaseAdmin.from('quiz_submissions').delete().eq('quiz_id', quizId);
      await supabaseAdmin.from('quiz_questions').delete().eq('quiz_id', quizId);
      const { error } = await supabaseAdmin.from('quizzes').delete().eq('id', quizId);

      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      const payload = JSON.parse(event.body);
      const { id, title, start_time, end_time, max_warnings, join_code, questions } = payload;
      
      let quizId = id;

      if (quizId) {
        // Update existing
        const { data: qData, error: qFetchErr } = await supabaseAdmin.from('quizzes').select('creator_uid, join_code').eq('id', quizId).single();
        if (qFetchErr || !qData || qData.creator_uid !== userId) {
          return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
        }

        const { error: updateErr } = await supabaseAdmin.from('quizzes').update({ 
          title, start_time, end_time, max_warnings 
        }).eq('id', quizId);
        
        if (updateErr) throw updateErr;

        // Replace questions
        await supabaseAdmin.from('quiz_questions').delete().eq('quiz_id', quizId);
      } else {
        // Create new
        const { data: insData, error: insErr } = await supabaseAdmin.from('quizzes').insert([{ 
          title, start_time, end_time, max_warnings, join_code, creator_uid: userId 
        }]).select();

        if (insErr) throw insErr;
        quizId = insData[0].id;
      }

      // Insert questions
      if (questions && questions.length > 0) {
        const questionsToInsert = questions.map(q => ({
          quiz_id: quizId,
          text: q.text,
          is_multiple_choice: q.is_multiple_choice,
          options: q.options,
          correct_options: q.correct_options || []
        }));
        const { error: qInsErr } = await supabaseAdmin.from('quiz_questions').insert(questionsToInsert);
        if (qInsErr) throw qInsErr;
      }

      return { statusCode: 200, body: JSON.stringify({ success: true, id: quizId }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    console.error("Manage Quiz Error:", error);
    return {
      statusCode: error.message.includes('Unauthorized') ? 401 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
