// Adjust the paths if your utils folder is structured differently
const { admin } = require('./utils/firebase-admin');
const { supabase } = require('./utils/supabase');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 1. Verify the Firebase Admin Token
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userEmail = decodedToken.email;

        // 2. Query Supabase securely on the backend
        const { data, error } = await supabase
            .from('users')
            .select('full_name')
            .eq('email', userEmail)
            .single();

        // 3. Return the name (or null if they don't have one set up yet)
        return {
            statusCode: 200,
            body: JSON.stringify({ full_name: data?.full_name || null })
        };

    } catch (error) {
        console.error("Profile Fetch Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};