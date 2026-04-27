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

    const { code, action = 'analyze', targetLanguage = 'another language' } = bodyData;
    if (!code) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Code snippet required' }) };

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
        const newCredits = isFreeAction ? 6 : 5; 
        transaction.set(userRef, { credits: newCredits, last_reset_time: now }, { merge: true });
      } else {
        if (!isFreeAction) {
          if (currentCredits <= 0) throw new Error("INSUFFICIENT_CREDITS");
          transaction.update(userRef, { credits: currentCredits - 1 });
        }
      }
    });

    let systemMessage = "";
    
    // THE SMART INTENT ROUTER (NLP Engine)
    if (action === 'analyze') {
      systemMessage = `You are a highly intelligent polyglot programming assistant. 
      Read the user's input, which may contain natural language instructions alongside code. 
      Identify their primary intent: Analysis, Optimization, or Translation.
      Respond ONLY with a valid JSON object matching the detected intent.

      INTENT 1: ANALYSIS (Default if user pastes code, asks for explanation, or asks for complexity)
      Schema: {"type": "analysis", "timeComplexity": "...", "spaceComplexity": "...", "explanation": "..."}

      INTENT 2: OPTIMIZATION (If user explicitly asks to make the code faster, better, or optimized)
      Schema: {"type": "optimization", "code": "<optimized code>", "explanation": "..."}

      INTENT 3: TRANSLATION (If user explicitly asks to translate, rewrite, or convert the code to a specific language like Python, Java, Rust, C++, etc.)
      Schema: {"type": "translation", "code": "<translated code>", "explanation": "..."}

      If the input is completely non-programming related, return: {"error": "Please provide a valid programming request."}`;
    } 
    else if (action === 'optimize') {
      systemMessage = `You are an expert code optimizer. Respond ONLY with a valid JSON object. 
      Schema requirement: {"type": "optimization", "code": "...", "explanation": "..."}. 
      Rewrite the provided code to be maximally efficient in time and space.`;
    }
    else if (action === 'translate') {
      systemMessage = `You are an expert polyglot compiler. Respond ONLY with a valid JSON object. 
      Schema requirement: {"type": "translation", "code": "...", "explanation": "..."}. 
      CRITICAL INSTRUCTION: You MUST translate the provided code entirely into ${targetLanguage}. Do NOT return the code in its original language. Keep the algorithmic logic identical. Write idiomatic ${targetLanguage} code.`;
    }

    const apiKey = process.env.GROQ_API_KEY;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Upgraded 70B Model
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: `User Input:\n${code}\n\nReturn the output in the requested JSON format.` }
        ],
        temperature: 0.1, // Low temperature forces strict JSON adherence
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: Groq API Failed. ${errText}`);
    }
    
    const data = await response.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (error) {
    if (error.message === "INSUFFICIENT_CREDITS") {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'You have exhausted your credits. Please wait up to 3 hours.' }) };
    }
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || 'Internal Server Error' }) };
  }
};