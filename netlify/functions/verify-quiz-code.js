const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase directly with the Service Role Key to bypass RLS securely
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error("FATAL ERROR: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { joinCode } = JSON.parse(event.body);

        if (!joinCode) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing access code.' }) };
        }

        // Query the database securely from the backend
        const { data, error } = await supabase
            .from('quizzes')
            .select('id')
            .eq('join_code', joinCode.toUpperCase())
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            // Send a 404 if the code doesn't match any active quiz
            return { statusCode: 404, body: JSON.stringify({ error: 'Assessment not found.' }) };
        }

        // Send back the ID to the frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ id: data.id })
        };

    } catch (error) {
        console.error("Verification Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};