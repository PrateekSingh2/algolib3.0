const { supabaseAdmin } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const contestId = event.queryStringParameters?.id;
    if (!contestId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing contest id' }) };

    const { data: contestData, error: cError } = await supabaseAdmin
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (cError) throw cError;

    const { data: problemsData, error: pError } = await supabaseAdmin
      .from('problems')
      .select('*')
      .eq('contest_id', contestId)
      .order('id', { ascending: true });

    if (pError) throw pError;

    // Fetch test cases for all problems in this contest
    let testCasesData = [];
    if (problemsData && problemsData.length > 0) {
      const problemIds = problemsData.map(p => p.id);
      const { data: tcData, error: tcError } = await supabaseAdmin
        .from('test_cases')
        .select('*')
        .in('problem_id', problemIds);

      if (tcError) throw tcError;
      testCasesData = (tcData || []).filter(tc => tc.is_public === true || tc.is_public === 'true' || tc.isPublic === true || tc.isPublic === 'true');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        contest: contestData,
        problems: problemsData || [],
        testCases: testCasesData
      })
    };
  } catch (error) {
    console.error("Get Contest Details Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
