const { admin, db } = require('./utils/firebase-admin');

exports.handler = async (event, context) => {
  // 1. Standardize CORS headers for Vite/React frontend communication
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Catch the browser's preflight request before anything else
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // 3. Extract and verify the Firebase Auth Token safely
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { 
        statusCode: 401, 
        headers,
        body: JSON.stringify({ error: 'Unauthorized: Missing token' }) 
      };
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      return { 
        statusCode: 401, 
        headers,
        body: JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }) 
      };
    }

    const uid = decodedToken.uid;
    
    // Safely parse the body to prevent JSON syntax crashes
    let bodyData = {};
    try {
      bodyData = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Malformed JSON payload' })
      };
    }

    const { code } = bodyData;
    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Code snippet is required' })
      };
    }

    // 4. Handle Credit Logic via Secure Server-Side Transaction
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
        transaction.set(userRef, { credits: 6, last_reset_time: now }, { merge: true });
      } else {
        if (currentCredits <= 0) {
          throw new Error("INSUFFICIENT_CREDITS");
        }
        transaction.update(userRef, { credits: currentCredits - 1 });
      }
    });

    // 5. Call Groq API
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Server Misconfiguration: Missing Groq API Key.');
    }

    // Explicit check to ensure the Netlify environment supports native fetch
    if (typeof fetch === 'undefined') {
      throw new Error('Native fetch is undefined. Please ensure your Netlify project uses Node.js 18 or higher.');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", 
        messages: [
          {
            role: "system",
            content: `You are an expert algorithm analyzer. 
            Respond ONLY with a valid JSON object. No markdown, no conversational text.

            CRITICAL RULE: First, evaluate if the user's input is actual code, pseudo-code, or a valid algorithmic concept. If the input is general conversation, a random question, or clearly NOT related to programming, you MUST abort analysis and return exactly this JSON:
            {
              "error": "I can only analyze code snippets and algorithms. Please provide valid code."
            }

            If the input IS valid code or an algorithmic concept, return this exact structure:
            {
              "complexity": "...",
              "explanation": "..."
            }
            The 'complexity' value MUST be a concise string representing the Big-O time complexity. Utilize the specific variables present in the user's code context (e.g., "O(N!)", "O(row * col)"). The 'explanation' should be 2 concise sentences explaining why.`
          },
          { role: "user", content: code }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      let groqErrorMsg = `HTTP ${response.status}: Failed to reach Groq.`;
      try {
        const errorData = await response.json();
        groqErrorMsg = errorData?.error?.message || groqErrorMsg;
      } catch (parseError) {
        // Fallback if Groq sends HTML or a corrupted string
      }
      throw new Error(groqErrorMsg);
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Execution Error:', error);
    
    // Explicitly handle our known custom error
    if (error.message === "INSUFFICIENT_CREDITS") {
      return { 
        statusCode: 403, 
        headers,
        body: JSON.stringify({ error: 'You have exhausted your credits. Please wait up to 3 hours for a refill.' }) 
      };
    }

    // Return the actual error message inside the JSON so the frontend error card can display it,
    // rather than blindly returning a 502 network drop.
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' })
    };
  }
};