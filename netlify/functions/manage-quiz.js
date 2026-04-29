const { admin } = require('./utils/firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase directly to prevent import undefined crashes
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
    try {
        // 1. Verify Authentication Clearance
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userUid = decodedToken.uid;

        // 2. HANDLE PURGE / DELETE
        if (event.httpMethod === 'DELETE') {
            const quizId = event.queryStringParameters.id;
            if (!quizId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing quiz ID' }) };
            
            await supabase.from('quiz_submissions').delete().eq('quiz_id', quizId);
            await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
            const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
            
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify({ success: true }) };
        }

        // 3. HANDLE DEPLOY / POST
        if (event.httpMethod === 'POST') {
            const { quizId, title, startTime, endTime, durationSeconds, maxWarnings, questions } = JSON.parse(event.body);
            
            let currentQuizId = quizId;
            let joinCode = "";

            if (currentQuizId) {
                // Update Existing Deployment
                const { error: updateErr } = await supabase.from('quizzes').update({ 
                    title, start_time: startTime, end_time: endTime, duration_seconds: durationSeconds, max_warnings: maxWarnings 
                }).eq('id', currentQuizId);
                if (updateErr) throw updateErr;

                // Retrieve existing teamcode
                const { data } = await supabase.from('quizzes').select('join_code').eq('id', currentQuizId).single();
                joinCode = data?.join_code || "XXXXXX";
            } else {
                // Generate a secure 6-digit alphanumeric Teamcode
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                for (let i = 0; i < 6; i++) joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
                
                const { data, error: insertErr } = await supabase.from('quizzes').insert([{ 
                    title, start_time: startTime, end_time: endTime, duration_seconds: durationSeconds, 
                    max_warnings: maxWarnings, creator_uid: userUid, join_code: joinCode
                }]).select();
                if (insertErr) throw insertErr;
                currentQuizId = data[0].id;
            }

            // Sync matrix questions (Wipe old, insert new)
            await supabase.from('quiz_questions').delete().eq('quiz_id', currentQuizId);
            
            const questionsToInsert = questions.map(q => ({
                quiz_id: currentQuizId,
                text: q.text,
                is_multiple_choice: q.is_multiple_choice,
                options: q.options,
                correct_options: q.correct_options
            }));

            if (questionsToInsert.length > 0) {
                const { error: qErr } = await supabase.from('quiz_questions').insert(questionsToInsert);
                if (qErr) throw qErr;
            }

            return { statusCode: 200, body: JSON.stringify({ success: true, id: currentQuizId, join_code: joinCode }) };
        }

        return { statusCode: 405, body: 'Method Not Allowed' };
    } catch (err) {
        console.error(err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};