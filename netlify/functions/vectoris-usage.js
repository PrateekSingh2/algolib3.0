const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');

exports.handler = async (event) => {
  try {
    const decodedToken = await verifyToken(event);
    const uid = decodedToken.uid;
    
    // Fetch the user's current profile safely
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('vectoris_daily_count, vectoris_monthly_count, vectoris_last_active_day, vectoris_last_active_month')
      .eq('firebase_uid', uid)
      .limit(1)
      .maybeSingle();
      
    if (fetchError) throw fetchError;
    if (!user) return { statusCode: 404, body: 'User not found' };

    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    // Compute exact usage based on current date
    const dailyCount = user.vectoris_last_active_day?.startsWith(today) ? (user.vectoris_daily_count || 0) : 0;
    const monthlyCount = user.vectoris_last_active_month?.startsWith(thisMonth) ? (user.vectoris_monthly_count || 0) : 0;

    // GET Request: Just return the usage
    if (event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        body: JSON.stringify({ dailyCount, monthlyCount })
      };
    }

    // POST Request: Increment usage securely
    if (event.httpMethod === 'POST') {
      const updates = {
        vectoris_daily_count: dailyCount + 1,
        vectoris_last_active_day: today,
        vectoris_monthly_count: monthlyCount + 1,
        vectoris_last_active_month: thisMonth,
        updated_at: new Date().toISOString()
      };

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('firebase_uid', uid)
        .select();

      if (updateError) throw updateError;

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, dailyCount: updates.vectoris_daily_count, monthlyCount: updates.vectoris_monthly_count })
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };

  } catch (error) {
    console.error("Vectoris Usage API Error:", error);
    return {
      statusCode: error.message.includes('Unauthorized') ? 401 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
