import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Resolve Credentials
let clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.VITE_GOOGLE_CLIENT_EMAIL;
let privateKey = process.env.GOOGLE_PRIVATE_KEY || process.env.VITE_GOOGLE_PRIVATE_KEY;

if (!clientEmail || !privateKey) {
  console.log("⚠️ Credentials not found in .env. Falling back to service_account.json...");
  
  const keyPath = path.resolve(__dirname, '../service_account.json');
  
  if (!fs.existsSync(keyPath)) {
    console.error(`❌ CRITICAL ERROR: Could not find service_account.json at: ${keyPath}`);
    process.exit(1);
  }

  try {
    const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    clientEmail = keyData.client_email;
    privateKey = keyData.private_key;
  } catch (err) {
    console.error("❌ CRITICAL ERROR: Failed to parse service_account.json.", err.message);
    process.exit(1);
  }
}

// 2. Strict Debugging Guardrails
if (!privateKey) {
  console.error("❌ CRITICAL ERROR: The private key is undefined!");
  console.error("👉 Check your service_account.json file. It MUST contain a field named exactly 'private_key'.");
  process.exit(1);
}

if (!clientEmail) {
  console.error("❌ CRITICAL ERROR: The client email is undefined!");
  console.error("👉 Check your service_account.json file. It MUST contain a field named exactly 'client_email'.");
  process.exit(1);
}

// 3. Fix formatting of the private key
const formattedKey = privateKey.replace(/\\n/g, '\n');

// 4. Initialize the JWT Client (Modern Object Syntax)
const jwtClient = new google.auth.JWT({
  email: clientEmail,
  key: formattedKey,
  scopes: ['https://www.googleapis.com/auth/indexing'],
});

const urlsToIndex = [
  "https://algolib.netlify.app/",
  "https://algolib.netlify.app/compiler/",
  "https://algolib.netlify.app/visualizer/",
  "https://algolib.netlify.app/blog/",
  "https://algolib.netlify.app/blog/algolib-engine-v2/",
  "https://algolib.netlify.app/blog/mastering-dynamic-programming/",
  "https://algolib.netlify.app/docs/",
  "https://algolib.netlify.app/support/",
  "https://algolib.netlify.app/developer/",
  "https://algolib.netlify.app/terms/",
  "https://algolib.netlify.app/privacy/",
  "https://algolib.netlify.app/cookies/"
];

async function submitUrls() {
  try {
    console.log("🔐 Authenticating with Google Cloud...");
    await jwtClient.authorize();
    console.log("🔓 Authentication successful. Pinging Google...");

    const indexing = google.indexing('v3');

    for (const url of urlsToIndex) {
      await indexing.urlNotifications.publish({
        auth: jwtClient,
        requestBody: {
          url: url,
          type: 'URL_UPDATED',
        },
      });
      console.log(`[SUCCESS] Indexing requested for: ${url}`);
      await new Promise(resolve => setTimeout(resolve, 300)); 
    }
    
    console.log("🚀 All pages submitted successfully.");
  } catch (error) {
    console.error("❌ Indexing API Error:");
    if (error.response && error.response.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

submitUrls();