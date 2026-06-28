const { admin, db } = require('./utils/firebase-admin');
const { rateLimit } = require('./utils/rate-limit');

// Utility function to determine dynamic temperature
function determineTemperature(userPrompt, selectedMode) {
  if (selectedMode === 'deterministic') return 0.1;
  if (selectedMode === 'balanced') return 0.5;
  if (selectedMode === 'creative') return 0.9;

  if (!userPrompt || typeof userPrompt !== 'string') return 0.5;

  const text = userPrompt.toLowerCase();
  
  const techKeywords = ['code', 'optimize', 'c++', 'dijkstra', 'compile', 'complexity'];
  const creativeKeywords = ['brainstorm', 'ideate', 'visualize', 'ui', 'ux'];

  if (techKeywords.some(kw => text.includes(kw))) {
    return 0.1;
  }
  if (creativeKeywords.some(kw => text.includes(kw))) {
    return 0.9;
  }

  return 0.5;
}

exports.handler = async (event, context) => {
  // 1. CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  try {
    try {
      rateLimit(event, 10, 60000); // 10 requests per minute
    } catch (e) {
      if (e.message.includes('Rate limit exceeded')) {
        return { statusCode: 429, headers, body: JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }) };
      }
      throw e;
    }

    // 2. Authentication Verification
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized: Missing token' }) };
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized: Token expired or invalid' }) };
    }

    const uid = decodedToken.uid;
    
    // 3. Payload Parsing
    let bodyData = {};
    try { bodyData = JSON.parse(event.body || '{}'); } 
    catch (e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Malformed JSON payload' }) }; }

    const { code, history = [], action = 'analyze', targetLanguage = 'another language', mode } = bodyData;
    if (!code) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Input required' }) };

    // 4. User Credit Management (Transaction)
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

    // 5. History Formatting
    const groqMessages = history.map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.content || JSON.stringify(msg.result)
    }));

    // 6. Advanced Prompt Engineering (System Message)
    // Base persona and formatting rules applied to ALL requests
    const basePersona = `You are Vectoris, a world-class AI programming assistant.
    
    CRITICAL READABILITY RULE (STRICTLY ENFORCED):
    - NEVER output a giant wall of text.
    - You MUST break your explanations into short paragraphs by using double newlines (\\n\\n).
    - Use bullet points (-) extensively to list steps, features, or breakdowns.
    - Use **bold text** to highlight key terms and make your response highly scannable.
    
    CRITICAL MARKDOWN & CODE FORMATTING RULE:
    - You MUST enforce standard markdown formatting.
    - Code snippets MUST be wrapped in triple backticks (\`\`\`) with the appropriate language specified on the same line as the opening backticks.
    - The triple backticks MUST be on their own separate lines. NEVER put code on the same line as the backticks.

    CRITICAL MATH FORMATTING RULE:
    - You MUST format ALL Big-O notations, mathematical formulas, and expressions using standard LaTeX delimiters.
    - Use a single '$' for inline math (e.g., $O(n \\log n)$, $x = 5$). There MUST be NO spaces between the delimiter and the equation.
    - Use double '$$' for block/display math. There MUST be NO spaces between the delimiter and the equation.
    - Never use plain text for math formulas like O(n^2). Always use LaTeX.

    CRITICAL VISUALS & DIAGRAMS RULE:
    - If you need to explain an architectural concept, data structure, or flow, you MUST generate ASCII art diagrams, Markdown tables, or Mermaid.js code blocks instead of relying purely on text walls.
    
    CRITICAL JSON RULE:
    Respond ONLY with a valid JSON object. All values MUST be plain strings containing your beautifully formatted markdown.`;

    let systemMessage = "";
    
    if (action === 'analyze') {
      systemMessage = `${basePersona}
      Read the user's input and conversation history. Identify their primary intent: Analysis, Optimization, Translation, or Chat.

      INTENT 1: ANALYSIS (User pastes code to be analyzed, asks for complexity)
      Schema: {"type": "analysis", "timeComplexity": "...", "spaceComplexity": "...", "explanation": "..."}
      Rule: Make the explanation exhaustive but highly readable. Break down exactly why the time and space complexity are what they are using bullet points.

      INTENT 2: OPTIMIZATION (User explicitly asks to make code faster/better)
      Schema: {"type": "optimization", "code": "<Optimized code string>", "explanation": "..."}
      Rule: Explain the bottleneck in the original code and how your new approach solves it mathematically.

      INTENT 3: TRANSLATION (User asks to convert code to another language)
      Schema: {"type": "translation", "code": "<Translated code string>", "explanation": "..."}

      INTENT 4: CHAT (General programming question, math problem, or follow-up)
      Schema: {"type": "chat", "explanation": "<Your highly detailed, step-by-step response here.>"}
      Rule: For math or algorithmic problems, show your exact step-by-step mathematical reasoning using LaTeX before giving the final answer. Use short paragraphs.

      GUARDRAIL: If the user's input is completely unrelated to programming, math, or computer science, return: 
      {"error": "I am Vectoris, a technical assistant. Please ask me a question related to coding, math, or computer science."}`;
    }
    else if (action === 'optimize') {
      systemMessage = `${basePersona}
      You are executing an explicit OPTIMIZATION request. Provide the most optimal, production-ready code.
      Schema: {"type": "optimization", "code": "<Optimized code string>", "explanation": "<Detailed, bulleted explanation of memory and speed improvements>"}`;
    }
    else if (action === 'translate') {
      systemMessage = `${basePersona}
      You are executing an explicit TRANSLATION request. Translate the provided code entirely to ${targetLanguage}.
      Schema: {"type": "translation", "code": "<Translated code string>", "explanation": "<Explanation of language-specific idioms used, broken into short paragraphs>"}`;
    }

    // Determine dynamic temperature based on mode or keywords
    const dynamicTemperature = determineTemperature(code, mode);

    // 7. Payload Optimization
    const apiKey = process.env.GROQ_API_KEY;
    const apiPayload = {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemMessage },
          ...groqMessages, // Inject conversational memory
          { 
            role: "user", 
            content: `User Input:\n${code}\n\nRemember: Deliver a highly detailed response. Format all math/complexities with LaTeX ($). Use short paragraphs (\\n\\n) and bullet points. Return ONLY the requested JSON format.` 
          }
        ],
        temperature: dynamicTemperature,
        top_p: 0.9,
        max_tokens: 4096,
        response_format: { type: "json_object" }
    };

    // 8. API Execution
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok) {
      if (!isFreeAction) {
        try {
          await userRef.update({ credits: admin.firestore.FieldValue.increment(1) });
        } catch (err) {
          console.error("Failed to refund credit:", err);
        }
      }
      const errText = await response.text();
      console.error(`Groq API Error (${response.status}):`, errText);
      return { statusCode: response.status, headers, body: JSON.stringify({ error: `AI Provider Error: ${response.status} - Rate Limit or Server Overload. Your credit has been refunded.` }) };
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