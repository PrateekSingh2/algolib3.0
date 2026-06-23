const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');
const { rateLimit } = require('./utils/rate-limit');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    rateLimit(event, 20, 60000); // Strict rate limit for submissions
    const decodedToken = await verifyToken(event);
    const userId = decodedToken.uid;
    const displayName = decodedToken.name || decodedToken.email?.split('@')[0] || 'User';

    const payload = JSON.parse(event.body);
    const { quiz_id, total_questions, time_taken_seconds, warnings_hit, answers_payload, email } = payload;

    if (!quiz_id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing quiz_id' }) };

    // SECURITY: Calculate score on the backend to prevent BOLA/tampering
    const { data: quizQuestions, error: qErr } = await supabaseAdmin.from('quiz_questions').select('*').eq('quiz_id', quiz_id);
    if (qErr) throw qErr;

    let calculatedScore = 0;
    if (quizQuestions && quizQuestions.length > 0) {
        quizQuestions.forEach(q => {
           const userAns = answers_payload[q.id] || []; 
           const correctAns = q.correct_options || [];
           
           const isNumerical = !q.options || q.options.length === 0;
           
           if (isNumerical) {
               if (userAns[0] && correctAns[0] && userAns[0].trim() === correctAns[0].trim()) calculatedScore += 1;
           } else {
               if (userAns.length > 0 && userAns.length === correctAns.length && userAns.every(val => correctAns.includes(val))) {
                   calculatedScore += 1;
               }
           }
        });
    }

    // Insert into quiz_submissions
    const { data, error } = await supabaseAdmin.from('quiz_submissions').insert([{
      quiz_id,
      user_uid: userId,
      display_name: displayName,
      email: email || decodedToken.email || 'No Email',
      score: calculatedScore,
      total_questions: quizQuestions?.length || total_questions,
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
