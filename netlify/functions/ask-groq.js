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

    // NEW: Accept history array from the frontend
    const { code, history = [], action = 'analyze', targetLanguage = 'another language' } = bodyData;
    if (!code) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Input required' }) };

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

    // Format history for Groq
    const groqMessages = history.map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.content || JSON.stringify(msg.result)
    }));

    let systemMessage = "";
    
    // UPGRADED NLP ROUTER: Now supports conversational context
    // THE SMART INTENT ROUTER (NLP Engine)
    if (action === 'analyze') {
      systemMessage = `You are a highly intelligent polyglot programming assistant. 
      Read the user's input and consider the conversation history.
      Identify their primary intent: Analysis, Optimization, Translation, or Chat.
      Respond ONLY with a valid JSON object matching the detected intent.

      CRITICAL RULE: All values in the JSON MUST be plain strings. Never use nested objects or arrays as values. If providing multiple languages, combine them into a SINGLE string using markdown blocks.

      INTENT 1: ANALYSIS (User pastes code to be analyzed, asks for complexity)
      Schema: {"type": "analysis", "timeComplexity": "...", "spaceComplexity": "...", "explanation": "..."}

      INTENT 2: OPTIMIZATION (User explicitly asks to make code faster/better)
      Schema: {"type": "optimization", "code": "<A single string of optimized code>", "explanation": "..."}

      INTENT 3: TRANSLATION (User asks to convert code to another language)
      Schema: {"type": "translation", "code": "<A single string containing the translated code. Use markdown if multiple languages>", "explanation": "..."}

      INTENT 4: CHAT (User asks a general programming question, follows up on previous code, or wants to learn a concept)
      Schema: {"type": "chat", "explanation": "<Your detailed response here. Use markdown for code blocks if needed.>"}

      STRICT GUARDRAIL: If the user's input is NOT related to programming, computer science, or technology, you MUST return: 
      {"error": "I am strictly a programming assistant. Please ask me a question related to coding or computer science."}`;
    }
    else if (action === 'optimize') {
      systemMessage = `You are an expert code optimizer. Respond ONLY with a valid JSON object. Schema: {"type": "optimization", "code": "...", "explanation": "..."}.`;
    }
    else if (action === 'translate') {
      systemMessage = `You are an expert polyglot compiler. Respond ONLY with a valid JSON object. Schema: {"type": "translation", "code": "...", "explanation": "..."}. Translate entirely to ${targetLanguage}.`;
    }

    const apiKey = process.env.GROQ_API_KEY;
    const apiPayload = {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemMessage },
          ...groqMessages, // Inject conversational memory
          { role: "user", content: `User Input:\n${code}\n\nReturn the output in the requested JSON format.` }
        ],
        temperature: 0.2, // Slightly higher temp for better conversational flow
        response_format: { type: "json_object" }
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload)
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