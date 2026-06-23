const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const { rateLimit } = require('./utils/rate-limit');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
    
    try {
        rateLimit(event, 60, 60000);
        // Fetch quizzes where featured is true, bypassing RLS securely
        const { data, error } = await supabase
            .from('quizzes')
            .select('id, title, description, theme, featured, duration_seconds')
            .eq('featured', true)
            .order('created_at', { ascending: false });
            
        if (error) throw error;

        return { statusCode: 200, body: JSON.stringify(data || []) };
    } catch (err) {
        console.error("Fetch Public Tours Error:", err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};