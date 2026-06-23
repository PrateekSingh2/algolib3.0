const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');

const HIGH_AVAILABILITY_ENGINES = [
  "https://rajawatprateek-algolib-engine-1.hf.space",
  "https://rajawatprateek-algolib-engine-2.hf.space",
  "https://rajawatprateek-algolib-engine-3.hf.space"
];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const decodedToken = await verifyToken(event);
    const userId = decodedToken.uid;
    const displayName = decodedToken.name || decodedToken.email?.split('@')[0] || 'User';

    const payload = JSON.parse(event.body);
    const { problem_id, contest_id, language, code, time_taken_seconds } = payload;

    if (!problem_id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing problem_id' }) };

    // Fetch problem details for difficulty
    const { data: problem, error: pError } = await supabaseAdmin.from('problems').select('difficulty').eq('id', problem_id).single();
    if (pError) throw pError;

    // Fetch ALL test cases for evaluation (including hidden ones)
    const { data: testCases, error: tcError } = await supabaseAdmin.from('test_cases').select('*').eq('problem_id', problem_id);
    if (tcError) throw tcError;
    if (!testCases || testCases.length === 0) return { statusCode: 400, body: JSON.stringify({ error: 'No test cases found' }) };

    const mappedPayloadCases = testCases.map((tc, idx) => ({
      id: tc.id || `case_${idx}`,
      input: String(tc.raw_input || tc.rawInput || '').replace(/\\n/g, '\n')
    }));

    const selectedEngine = HIGH_AVAILABILITY_ENGINES[Math.floor(Math.random() * HIGH_AVAILABILITY_ENGINES.length)];
    
    const startTimeExecute = performance.now();
    const res = await fetch(`${selectedEngine}/execute/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, testCases: mappedPayloadCases })
    });
    if (!res.ok) throw new Error('Execution engine offline');
    
    const { jobId } = await res.json();
    let batchResults = null;
    let attempts = 0;
    while (attempts < 15) { // 12 seconds max polling
      await new Promise(resolve => setTimeout(resolve, 800));
      const statusRes = await fetch(`${selectedEngine}/status/${jobId}`);
      if (!statusRes.ok) continue;
      const statusData = await statusRes.json();
      if (statusData.status === 'success') {
        batchResults = statusData.results;
        break;
      }
      if (statusData.status === 'error') throw new Error(statusData.output || 'Execution failure');
      attempts++;
    }
    if (!batchResults) throw new Error('Execution timeout');
    const totalBatchDurationMs = Math.round(performance.now() - startTimeExecute);

    let passedCount = 0;
    let runtimeCapMaxMs = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const result = batchResults[i];
      const expOut = String(tc.expected_output || tc.expected || '').trim();
      const hasMultiple = tc.has_multiple_answers === true || tc.has_multiple_answers === 'true';

      let isCorrect = false;
      if (result && result.status === 'success') {
        const normalizedActual = (result.output || '').replace(/\s+/g, '');
        runtimeCapMaxMs = Math.max(runtimeCapMaxMs, (result.time || 0) * 1000);

        if (hasMultiple) {
          const expectedLines = expOut.split('\n').map(l => l.trim()).filter(Boolean);
          const actualLines = (result.output || '').split('\n').map(l => l.trim()).filter(Boolean);
          if (expectedLines.length === actualLines.length && actualLines.length > 0) {
              isCorrect = expectedLines.every((expLine, index) => {
                  const actLine = actualLines[index].replace(/\s+/g, ''); 
                  const possibleAnswers = expLine.split('|||').map(ans => ans.replace(/\s+/g, ''));
                  return possibleAnswers.includes(actLine);
              });
          }
        } else {
          const normalizedExpected = expOut.replace(/\s+/g, '');
          isCorrect = normalizedActual === normalizedExpected && normalizedExpected !== '';
        }
      }
      if (isCorrect) passedCount++;
    }

    const allPassed = passedCount === testCases.length;

    // Calculate Score securely
    const diffStr = (problem.difficulty || 'easy').toLowerCase();
    const defaultPts = diffStr === 'hard' ? 300 : diffStr === 'medium' ? 200 : 100;
    const defaultPenalty = diffStr === 'hard' ? 20 : diffStr === 'medium' ? 10 : 5;

    const { data: pastSubs } = await supabaseAdmin.from('submissions').select('passed, score_awarded').eq('user_uid', userId).eq('problem_id', problem_id);
    const previousWrongAttempts = pastSubs ? pastSubs.filter(s => !s.passed).length : 0;
    const hasAlreadySolved = pastSubs ? pastSubs.some(s => s.passed) : false;

    const pointsEarned = hasAlreadySolved ? 0 : Math.max(0, defaultPts - (previousWrongAttempts * defaultPenalty));
    const score_awarded = allPassed ? pointsEarned : -defaultPenalty;

    // 1. Insert into submissions
    const { error: subError } = await supabaseAdmin.from('submissions').insert([{
      user_uid: userId, problem_id, contest_id, language, code, passed: allPassed, score_awarded: score_awarded > 0 ? score_awarded : 0, time_taken_seconds
    }]);
    if (subError) throw subError;

    // 2. Update leaderboard if passed
    if (allPassed) {
      const { data: existingEntry, error: fetchError } = await supabaseAdmin.from('leaderboard').select('id, score, time_taken_seconds').eq('user_uid', userId).eq('problem_id', problem_id).maybeSingle();
      if (fetchError) throw fetchError;

      if (existingEntry) {
        if (score_awarded > existingEntry.score || (score_awarded === existingEntry.score && time_taken_seconds < existingEntry.time_taken_seconds)) {
          await supabaseAdmin.from('leaderboard').update({ score: score_awarded, time_taken_seconds, language_used: language }).eq('id', existingEntry.id);
        }
      } else {
        await supabaseAdmin.from('leaderboard').insert([{ user_uid: userId, display_name: displayName, problem_id, score: score_awarded, time_taken_seconds, language_used: language }]);
      }
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ success: true, allPassed, passedCount, totalCases: testCases.length, score_awarded, timeTakenMs: runtimeCapMaxMs > 0 ? Math.round(runtimeCapMaxMs) : totalBatchDurationMs }) 
    };
  } catch (error) {
    console.error("Submit Code Error:", error);
    return {
      statusCode: error.message.includes('Unauthorized') ? 401 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
