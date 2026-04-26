const admin = require('firebase-admin');

// 1. Initialize Firebase Admin (Ensures it only initializes once per cold start)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace literal \n with actual line breaks for the private key string
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // 2. Extract and verify the Firebase Auth Token
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { 
        statusCode: 401, 
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
        body: JSON.stringify({ error: 'Unauthorized: Invalid token' }) 
      };
    }

    const uid = decodedToken.uid;
    const { code } = JSON.parse(event.body || '{}');

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Code snippet is required' })
      };
    }

    // 3. Handle Credit Logic via Secure Server-Side Transaction
    const userRef = db.collection('user_credits').doc(uid);
    const now = Date.now();
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

    await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(userRef);
      let currentCredits = 0;
      let lastReset = 0;

      if (docSnap.exists) {
        const data = docSnap.data();
        currentCredits = data.credits;
        lastReset = data.last_reset_time || 0;
      }

      // Check if 3 hours have passed OR if it's a brand new user
      if (!docSnap.exists || (now - lastReset >= THREE_HOURS_MS)) {
        // Give 7 credits, deduct 1 immediately for this run (saving 6)
        transaction.set(userRef, { credits: 6, last_reset_time: now }, { merge: true });
      } else {
        if (currentCredits <= 0) {
          throw new Error("INSUFFICIENT_CREDITS");
        }
        // Deduct exactly 1 credit
        transaction.update(userRef, { credits: currentCredits - 1 });
      }
    });

    // 4. Call Groq API
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY is not defined in environment variables.');
      throw new Error('Server misconfiguration');
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
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `HTTP ${response.status}: Failed to reach Groq.`);
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Error in ask-groq function:', error);
    if (error.message === "INSUFFICIENT_CREDITS") {
      return { 
        statusCode: 403, 
        body: JSON.stringify({ error: 'You have exhausted your credits. Please wait up to 3 hours for a refill.' }) 
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' })
    };
  }
};