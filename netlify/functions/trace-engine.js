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
    let pyParam = "3";
    
    if (language === "cpp") {
      endpoint = "web_exec_cpp.py"; 
      pyParam = "cpp_g++9.3.0";
    } else if (language === "c") {
      endpoint = "web_exec_c.py"; 
      pyParam = "c_gcc9.3.0";
    } else if (language === "java") {
      endpoint = "web_exec_java.py";
      pyParam = "java";
    } else if (language === "js") {
      endpoint = "web_exec_js.py";
      pyParam = "js";
    }

    const pyTutorUrl = `https://pythontutor.com/${endpoint}?py=${pyParam}`;

    // Strip Windows carriage returns (\r) - Linux Valgrind wrappers crash on these!
    const sanitizedCode = code.replace(/\r/g, "");
    const sanitizedInput = customInput ? customInput.replace(/\r/g, "") : "";

    const optionsJson = {
      cumulative_mode: false,
      heap_primitives: (language === "cpp" || language === "c") ? false : "nevernest",
      show_only_outputs: false,
      origin: "opt-frontend.js",
      text_references: false
    };

    const formData = new URLSearchParams();
    formData.append("user_script", sanitizedCode);
    
    if (sanitizedInput && sanitizedInput.trim() !== "") {
      formData.append("raw_input_json", sanitizedInput);
    }

    formData.append("options_json", JSON.stringify(optionsJson));

    if (language === "cpp" || language === "c") {
      formData.append("ext", language === "c" ? "c" : "cpp");
    }

    let attempt = 0;
    const MAX_RETRIES = 3;
    let lastTraceData = null;

    while (attempt < MAX_RETRIES) {
      try {
        const clientUserAgent = event.headers["user-agent"] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

        const response = await fetch(pyTutorUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": clientUserAgent,
            "Referer": `https://pythontutor.com/visualize.html`,
            "Origin": "https://pythontutor.com",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: formData.toString()
        });

        if (!response.ok) {
          throw new Error(`Python Tutor returned ${response.status}`);
        }

        const responseText = await response.text();
        const traceData = JSON.parse(responseText);

        // Check if PyTutor specifically rejected this trace due to server overload
        if (traceData.exception_msg && traceData.exception_msg.includes("[#ErrorBackend]")) {
           lastTraceData = traceData;
           attempt++;
           // Wait before retrying (exponential backoff: 1s, 2s, 4s)
           await new Promise(r => setTimeout(r, Math.pow(2, attempt - 1) * 1000));
           continue;
        }

        // Success!
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(traceData)
        };
      } catch (e) {
         console.warn(`Attempt ${attempt + 1} failed:`, e);
         attempt++;
         if (attempt >= MAX_RETRIES) {
            throw e;
         }
         await new Promise(r => setTimeout(r, 1000));
      }
    }

    // If all retries failed with ErrorBackend
    if (lastTraceData) {
       return {
          statusCode: 200,
          headers,
          body: JSON.stringify(lastTraceData)
       };
    }

    throw new Error("Trace engine exhausted all retries.");

  } catch (error) {
    console.error("Trace Engine Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Internal server error" })
    };
  }
};
