const { createClient } = require('@supabase/supabase-js');

// 1. Initialize Supabase using the SERVICE ROLE KEY to bypass RLS securely
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseServiceKey) {
    console.error("FATAL ERROR: SUPABASE_SERVICE_ROLE_KEY is missing.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
    try {
        const quizId = event.queryStringParameters.id;
        if (!quizId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing quiz ID' }) };
        
        // 2. Fetch Core Meta (Using the master key, this will no longer be blocked)
        const { data: quizData, error: quizErr } = await supabase.from('quizzes').select('*').eq('id', quizId).maybeSingle();
        
        if (quizErr) throw quizErr;
        if (!quizData) return { statusCode: 404, body: JSON.stringify({ error: 'Quiz not found' }) };
        
        // 3. Fetch Questions
        const { data: questions, error: qErr } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId);
        if (qErr) throw qErr;

        return { statusCode: 200, body: JSON.stringify({ quiz: quizData, questions: questions || [] }) };
    } catch (err) {
        console.error("Get Quiz Details Error:", err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};