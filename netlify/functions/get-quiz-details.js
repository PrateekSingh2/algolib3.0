const { supabaseAdmin } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const quizId = event.queryStringParameters?.id;
    if (!quizId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing quiz id' }) };

    const { data: quizData, error: qError } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .maybeSingle();

    if (qError) throw qError;
    if (!quizData) return { statusCode: 404, body: JSON.stringify({ error: 'Quiz not found' }) };

    const { data: questionsData, error: qmError } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId);

    if (qmError) throw qmError;

    return { statusCode: 200, body: JSON.stringify({ quiz: quizData, questions: questionsData || [] }) };
  } catch (error) {
    console.error("Get Quiz Details Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
