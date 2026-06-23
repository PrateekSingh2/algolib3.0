const { admin } = require('./utils/firebase-admin');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const { rateLimit } = require('./utils/rate-limit');

exports.handler = async (event) => {
    try {
        rateLimit(event, 60, 60000);
        
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userUid = decodedToken.uid;

        if (event.httpMethod === 'DELETE') {
            const quizId = event.queryStringParameters.id;
            
            // SECURITY: Ensure the user actually created this quiz before deleting
            const { data: checkData, error: checkErr } = await supabase.from('quizzes').select('creator_uid').eq('id', quizId).single();
            if (checkErr || !checkData || checkData.creator_uid !== userUid) {
                return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: You do not own this quiz.' }) };
            }
            
            await supabase.from('quiz_submissions').delete().eq('quiz_id', quizId);
            await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
            const { error } = await supabase.from('quizzes').delete().eq('id', quizId).eq('creator_uid', userUid);
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify({ success: true }) };
        }

        if (event.httpMethod === 'POST') {
            // NEW: Destructure description, theme, and featured
            const { quizId, title, startTime, endTime, durationSeconds, maxWarnings, questions, description, theme, featured } = JSON.parse(event.body);
            
            let currentQuizId = quizId;
            let joinCode = "";

            if (currentQuizId) {
                // SECURITY: Ensure the user actually created this quiz before updating
                const { data: checkData, error: checkErr } = await supabase.from('quizzes').select('creator_uid').eq('id', currentQuizId).single();
                if (checkErr || !checkData || checkData.creator_uid !== userUid) {
                    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: You do not own this quiz.' }) };
                }

                const { error: updateErr } = await supabase.from('quizzes').update({ 
                    title, start_time: startTime, end_time: endTime, duration_seconds: durationSeconds, max_warnings: maxWarnings,
                    description: description || '', theme: theme || 'sky', featured: featured || false
                }).eq('id', currentQuizId).eq('creator_uid', userUid);
                if (updateErr) throw updateErr;

                const { data } = await supabase.from('quizzes').select('join_code').eq('id', currentQuizId).single();
                joinCode = data?.join_code || "XXXXXX";
            } else {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                for (let i = 0; i < 6; i++) joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
                
                const { data, error: insertErr } = await supabase.from('quizzes').insert([{ 
                    title, start_time: startTime, end_time: endTime, duration_seconds: durationSeconds, 
                    max_warnings: maxWarnings, creator_uid: userUid, join_code: joinCode,
                    description: description || '', theme: theme || 'sky', featured: featured || false
                }]).select();
                
                if (insertErr) throw insertErr;
                currentQuizId = data[0].id;
            }

            // SECURITY: Ensure quiz belongs to user before modifying questions
            const { data: qCheck } = await supabase.from('quizzes').select('creator_uid').eq('id', currentQuizId).single();
            if (!qCheck || qCheck.creator_uid !== userUid) {
                return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: You do not own this quiz.' }) };
            }

            await supabase.from('quiz_questions').delete().eq('quiz_id', currentQuizId);
            const questionsToInsert = questions.map(q => ({
                quiz_id: currentQuizId, text: q.text, is_multiple_choice: q.is_multiple_choice,
                options: q.options, correct_options: q.correct_options
            }));

            if (questionsToInsert.length > 0) {
                const { error: qErr } = await supabase.from('quiz_questions').insert(questionsToInsert);
                if (qErr) throw qErr;
            }

            return { statusCode: 200, body: JSON.stringify({ success: true, id: currentQuizId, join_code: joinCode }) };
        }
        return { statusCode: 405, body: 'Method Not Allowed' };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};