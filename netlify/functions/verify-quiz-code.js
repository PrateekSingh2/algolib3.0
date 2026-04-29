// netlify/functions/verify-quiz-code.js
const { supabase } = require('./utils/supabase');

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

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

        if (error) {
            console.error("Database error:", error);
            throw new Error("Failed to query database.");
        }

        if (!data) {
            // Send a 404 if the code doesn't match any active quiz
            return { statusCode: 404, body: JSON.stringify({ error: 'Assessment not found.' }) };
        }

        // Send back the ID
        return {
            statusCode: 200,
            body: JSON.stringify({ id: data.id })
        };

    } catch (error) {
        console.error("Verification Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};