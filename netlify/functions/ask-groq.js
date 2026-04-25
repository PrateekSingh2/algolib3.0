exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { code } = JSON.parse(event.body || '{}');

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Code snippet is required' })
      };
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY is not defined in environment variables.');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server misconfiguration' })
      };
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
            You MUST use these exact keys:
            {
              "complexity": "...",
              "explanation": "..."
            }
            The 'complexity' value MUST be a concise string representing the Big-O time complexity. Utilize the specific variables present in the user's code context (e.g., "O(N!)", "O(row * col)", "O(V + E)", "O(2^N)").
            The 'explanation' should be 2 concise sentences explaining why.`
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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' })
    };
  }
};
