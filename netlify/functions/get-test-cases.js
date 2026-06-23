const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    await verifyToken(event);

    const problemId = event.queryStringParameters.problemId;
    if (!problemId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing problemId' }) };

    const { data, error } = await supabaseAdmin
      .from('test_cases')
      .select('*')
      .eq('problem_id', problemId);

    if (error) throw error;
    const filteredData = (data || []).filter(tc => tc.is_public === true || tc.is_public === 'true' || tc.isPublic === true || tc.isPublic === 'true');
    return { statusCode: 200, body: JSON.stringify(filteredData) };
  } catch (error) {
    console.error("Get Test Cases Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
