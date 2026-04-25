const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');

exports.handler = async (event) => {
  try {
    await verifyToken(event);

    if (event.httpMethod === 'DELETE') {
      const contestId = event.queryStringParameters?.id;
      if (!contestId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing contest id' }) };

      // Delete cascade handled sequentially or relying on DB constraints
      const { data: pData } = await supabaseAdmin.from('problems').select('id').eq('contest_id', contestId);
      
      if (pData && pData.length > 0) {
        const problemIds = pData.map(p => p.id);
        await supabaseAdmin.from('leaderboard').delete().in('problem_id', problemIds);
        await supabaseAdmin.from('test_cases').delete().in('problem_id', problemIds);
        await supabaseAdmin.from('problems').delete().eq('contest_id', contestId);
      }
      
      const { error: cErr } = await supabaseAdmin.from('contests').delete().eq('id', contestId);
      if (cErr) throw cErr;

      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      const payload = JSON.parse(event.body);
      const { cId, cTitle, cStart, cEnd, problems } = payload;
      
      let currentContestId = cId;
      
      if (currentContestId) {
        await supabaseAdmin.from('contests').update({ 
          title: cTitle, start_time: cStart, end_time: cEnd 
        }).eq('id', currentContestId);
      } else {
        const { data, error } = await supabaseAdmin.from('contests').insert([{ 
          title: cTitle, start_time: cStart, end_time: cEnd 
        }]).select();
        if (error) throw error;
        currentContestId = data[0].id;
      }

      // Sync Problems
      const { data: existingProbs } = await supabaseAdmin.from('problems').select('id').eq('contest_id', currentContestId);
      const currentProbIds = problems.map(p => p.dbId).filter(Boolean);
      
      if (existingProbs) {
        for (const ep of existingProbs) {
          if (!currentProbIds.includes(ep.id)) {
            await supabaseAdmin.from('leaderboard').delete().eq('problem_id', ep.id);
            await supabaseAdmin.from('test_cases').delete().eq('problem_id', ep.id);
            await supabaseAdmin.from('problems').delete().eq('id', ep.id);
          }
        }
      }

      for (let p of problems) {
        let probId = p.dbId;
        const combinedDesc = JSON.stringify({ description: p.description, inputFormat: p.inputFormat, outputFormat: p.outputFormat, constraints: p.constraints });
        
        if (probId) {
          await supabaseAdmin.from('problems').update({ title: p.title, description: combinedDesc, difficulty: p.difficulty }).eq('id', probId);
        } else {
          const { data } = await supabaseAdmin.from('problems').insert([{ contest_id: currentContestId, title: p.title, description: combinedDesc, difficulty: p.difficulty }]).select();
          probId = data[0].id;
        }

        await supabaseAdmin.from('test_cases').delete().eq('problem_id', probId);
        const tcsToInsert = p.testCases.map(tc => ({
          problem_id: probId, display_input: tc.displayInput, raw_input: tc.rawInput, expected_output: tc.expected, explanation: tc.explanation, is_public: tc.isPublic, has_multiple_answers: tc.hasMultipleAnswers || false, image_url: tc.imageUrl || null
        }));
        if(tcsToInsert.length > 0) {
          await supabaseAdmin.from('test_cases').insert(tcsToInsert);
        }
      }

      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    console.error("Manage Contest Error:", error);
    return {
      statusCode: error.message.includes('Unauthorized') ? 401 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
