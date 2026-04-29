const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase directly
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
    try {
        const quizId = event.queryStringParameters.id;
        
        // 1. Fetch Core Meta
        const { data: quizData, error: quizErr } = await supabase.from('quizzes').select('*').eq('id', quizId).maybeSingle();
        if (quizErr || !quizData) return { statusCode: 404, body: JSON.stringify({ error: 'Quiz not found' }) };
        
        // 2. Fetch Questions
        const { data: questions, error: qErr } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId);
        if (qErr) throw qErr;

        return { statusCode: 200, body: JSON.stringify({ quiz: quizData, questions: questions || [] }) };
    } catch (err) {
        console.error("Get Quiz Details Error:", err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};