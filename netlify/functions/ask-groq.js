const { admin, db } = require('./utils/firebase-admin');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized: Missing token' }) };
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized: Invalid token' }) };
    }

    const uid = decodedToken.uid;
    
    let bodyData = {};
    try { bodyData = JSON.parse(event.body || '{}'); } 
    catch (e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Malformed JSON payload' }) }; }

    // NEW: Accept action type and target language
    const { code, action = 'analyze', targetLanguage = '' } = bodyData;
    if (!code) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Code snippet required' }) };

    // NEW: Optimization is free. Translation and Analysis cost 1 credit.
    const isFreeAction = action === 'optimize';
    
    const userRef = db.collection('user_credits').doc(uid);
    const now = Date.now();
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

    await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(userRef);
      let currentCredits = 0;
      let lastReset = 0;

      if (docSnap.exists) {
        const data = docSnap.data();
        currentCredits = data.credits || 0;
        lastReset = data.last_reset_time || 0;
      }

      if (!docSnap.exists || (now - lastReset >= THREE_HOURS_MS)) {
        // Reset to 6 if 3 hours have passed
        const newCredits = isFreeAction ? 6 : 5; 
        transaction.set(userRef, { credits: newCredits, last_reset_time: now }, { merge: true });
      } else {
        if (!isFreeAction) {
          if (currentCredits <= 0) throw new Error("INSUFFICIENT_CREDITS");
          transaction.update(userRef, { credits: currentCredits - 1 });
        }
      }
    });

    // Determine the specific System Prompt based on the action
    let systemMessage = "";
    if (action === 'analyze') {
      systemMessage = `You are an expert algorithm analyzer. Respond ONLY with a valid JSON object. 
      If the input is not code or pseudo-code, return: {"error": "Please provide valid code."}
      If valid, return exactly: {"type": "analysis", "timeComplexity": "...", "spaceComplexity": "...", "explanation": "..."}
      Use specific Big-O notation. Explain concisely in 2 sentences.`;
    } 
    else if (action === 'optimize') {
      systemMessage = `You are a code optimizer. Respond ONLY with a valid JSON object.
      If the input is not code, return: {"error": "Please provide valid code."}
      If valid, rewrite the code to be more efficient (time/space). Return exactly: 
      {"type": "optimization", "code": "...", "explanation": "..."}`;
    }
    else if (action === 'translate') {
      systemMessage = `You are a code translator. Respond ONLY with a valid JSON object.
      Translate the provided code to ${targetLanguage}. Keep logic identical. Return exactly: 
      {"type": "translation", "code": "...", "explanation": "..."}`;
    }

    const apiKey = process.env.GROQ_API_KEY;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", 
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: code }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: Groq API Failed.`);
    const data = await response.json();
    
    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (error) {
    if (error.message === "INSUFFICIENT_CREDITS") {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'You have exhausted your credits. Please wait up to 3 hours.' }) };
    }
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || 'Internal Server Error' }) };
  }
};