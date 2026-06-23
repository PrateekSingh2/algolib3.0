const { admin } = require('./utils/firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase using the SERVICE ROLE KEY
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const { rateLimit } = require('./utils/rate-limit');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
    
    try {
        rateLimit(event, 60, 60000);
        // 1. Verify Authentication Clearance
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }
        
        // 2. Decode the token to find out exactly who is asking
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userUid = decodedToken.uid;

        // 3. Fetch ONLY quizzes created by this specific user
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('creator_uid', userUid) // <-- This is the magic filter!
            .order('created_at', { ascending: false });
            
        if (error) throw error;

        return { statusCode: 200, body: JSON.stringify(data || []) };
    } catch (err) {
        console.error("Get Quizzes Error:", err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};