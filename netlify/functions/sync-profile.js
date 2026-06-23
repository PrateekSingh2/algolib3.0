const { supabaseAdmin } = require('./utils/supabase');
const { verifyToken } = require('./utils/auth');
const { rateLimit } = require('./utils/rate-limit');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    rateLimit(event, 20, 60000); // Strict limit for sync
    const decodedToken = await verifyToken(event);
    const firebaseUser = JSON.parse(event.body);

    const email = firebaseUser.email?.trim();
    const uid = decodedToken.uid;

    let profile = null;

    if (email) {
      const { data } = await supabaseAdmin.from('users').select('*').eq('email', email).limit(1).maybeSingle();
      if (data) profile = data;
    }

    if (!profile) {
      const { data } = await supabaseAdmin.from('users').select('*').eq('firebase_uid', uid).limit(1).maybeSingle();
      if (data) profile = data;
    }

    if (profile) {
      if (!profile.firebase_uid) {
        await supabaseAdmin.from('users').update({ firebase_uid: uid }).eq('id', profile.id);
        profile.firebase_uid = uid;
      }
      return { statusCode: 200, body: JSON.stringify(profile) };
    }

    const fullPayload = {
      firebase_uid: uid,
      email: firebaseUser.email,
      full_name: firebaseUser.displayName,
      display_name: firebaseUser.displayName,
      avatar_url: firebaseUser.photoURL,
      has_seen_welcome: false, 
      is_profile_complete: false,
    };

    const { data: newProfile, error } = await supabaseAdmin.from('users').insert([fullPayload]).select().maybeSingle();

    if (error) {
       console.error("Insert error, trying fallback:", error);
       const fallbackPayload = {
          full_name: firebaseUser.displayName,
          display_name: firebaseUser.displayName,
          avatar_url: firebaseUser.photoURL,
          has_seen_welcome: false,
          is_profile_complete: false
       };
       const { data: fallbackProfile, error: fallbackErr } = await supabaseAdmin.from('users').insert([fallbackPayload]).select().maybeSingle();
       if (fallbackErr) throw fallbackErr;
       return { statusCode: 200, body: JSON.stringify(fallbackProfile) };
    }

    return { statusCode: 200, body: JSON.stringify(newProfile) };

  } catch (error) {
    console.error("Sync Profile Error:", error);
    return {
      statusCode: error.message.includes('Unauthorized') ? 401 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
