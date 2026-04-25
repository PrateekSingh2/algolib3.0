const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const decodedToken = await verifyToken(event);
    const userId = decodedToken.uid;
    const displayName = decodedToken.name || decodedToken.email?.split('@')[0] || 'User';

    const payload = JSON.parse(event.body);
    const { problem_id, contest_id, language, code, passed, score_awarded, time_taken_seconds } = payload;

    if (!problem_id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing problem_id' }) };

    // 1. Insert into submissions
    const { error: subError } = await supabaseAdmin.from('submissions').insert([{
      user_uid: userId,
      problem_id,
      contest_id,
      language,
      code,
      passed,
      score_awarded: passed ? score_awarded : 0,
      time_taken_seconds
    }]);

    if (subError) throw subError;

    // 2. Update leaderboard if passed
    if (passed) {
      const { data: existingEntry, error: fetchError } = await supabaseAdmin
        .from('leaderboard')
        .select('id, score, time_taken_seconds')
        .eq('user_uid', userId)
        .eq('problem_id', problem_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // Ignore "row not found" error
        throw fetchError;
      }

      if (existingEntry) {
        if (score_awarded > existingEntry.score || 
           (score_awarded === existingEntry.score && time_taken_seconds < existingEntry.time_taken_seconds)) {
          
          const { error: updateError } = await supabaseAdmin
            .from('leaderboard')
            .update({ score: score_awarded, time_taken_seconds, language_used: language })
            .eq('id', existingEntry.id);
            
          if (updateError) throw updateError;
        }
      } else {
        const { error: insertError } = await supabaseAdmin.from('leaderboard').insert([{ 
          user_uid: userId, 
          display_name: displayName, 
          problem_id, 
          score: score_awarded, 
          time_taken_seconds, 
          language_used: language
        }]);

        if (insertError) throw insertError;
      }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error("Submit Code Error:", error);
    return {
      statusCode: error.message.includes('Unauthorized') ? 401 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
