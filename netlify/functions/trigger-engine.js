// netlify/functions/trigger-engine.js
exports.handler = async (event, context) => {
  // Only allow POST requests for security
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Ensure the HF token exists in your Netlify Environment Variables
  const HF_TOKEN = process.env.HF_SPACE_TOKEN;

  if (!HF_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing HF Token in environment" }) };
  }

  try {
    // Make the secure call to your Hugging Face Space from the backend
    const response = await fetch("https://rajawatprateek-algolib-automation-engine.hf.space/trigger", {
      method: "GET", 
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`HF Space responded with status: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Pipeline triggered successfully", data })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};