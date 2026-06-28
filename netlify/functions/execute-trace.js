const rateLimitMap = new Map();
const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 1000;

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:8888",
  "https://algolib.vercel.app", 
  "https://algolib.netlify.app",
  "https://algolib.net",
  "https://www.algolib.net",
  "https://algolib.app"
];

exports.handler = async (event) => {
  const origin = event.headers.origin || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.includes("--algolib.netlify.app");
  
  const headers = {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (!isAllowed && origin) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "Unauthorized origin" }) };
  }

  const clientIp = event.headers["client-ip"] || event.headers["x-nf-client-connection-ip"] || "unknown";
  const now = Date.now();
  const rateLimitState = rateLimitMap.get(clientIp);

  if (rateLimitState) {
    if (now - rateLimitState.timestamp < WINDOW_MS) {
      if (rateLimitState.count >= RATE_LIMIT) {
        return { statusCode: 429, headers, body: JSON.stringify({ error: "Rate limit exceeded" }) };
      }
      rateLimitState.count++;
    } else {
      rateLimitMap.set(clientIp, { count: 1, timestamp: now });
    }
  } else {
    rateLimitMap.set(clientIp, { count: 1, timestamp: now });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { code, language, customInput } = body;

    if (!code || !language) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing fields" }) };
    }

    let endpoint = "web_exec_py3.py";
    if (language === "cpp" || language === "c") endpoint = "web_exec_cpp.py";
    if (language === "java") endpoint = "web_exec_java.py";
    if (language === "js") endpoint = "web_exec_js.py";

    const pyTutorUrl = `https://pythontutor.com/${endpoint}`;

    const formData = new URLSearchParams();
    formData.append("user_script", code);
    formData.append("raw_input_json", customInput ? customInput : "");
    formData.append("options_json", JSON.stringify({
      cumulative_mode: false,
      heap_primitives: false,
      show_only_outputs: false,
      origin: "opt-frontend.js"
    }));

    const response = await fetch(pyTutorUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "AlgoLib-Engine/1.0"
      },
      body: formData.toString()
    });

    if (!response.ok) {
      throw new Error(`Python Tutor returned ${response.status}`);
    }

    const responseText = await response.text();
    let traceData;
    try {
      traceData = JSON.parse(responseText);
    } catch(e) {
      throw new Error("Invalid trace response from engine");
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(traceData)
    };

  } catch (error) {
    console.error("Trace Engine Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Internal server error" })
    };
  }
};
