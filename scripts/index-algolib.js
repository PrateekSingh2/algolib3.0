import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // Automatically loads your .env file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Resolve Credentials
let clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
let privateKey = process.env.GOOGLE_PRIVATE_KEY;

if (!clientEmail || !privateKey) {
  console.log("⚠️ Environment variables not found. Falling back to service_account.json...");
  try {
    const keyPath = path.resolve(__dirname, '../service_account.json');
    const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    clientEmail = keyData.client_email;
    privateKey = keyData.private_key;
  } catch (err) {
    console.error("❌ Critical Error: No credentials found in .env OR service_account.json");
    process.exit(1);
  }
}

// Fix formatting of the private key
const formattedKey = privateKey.replace(/\\n/g, '\n');

// 2. Initialize the JWT Client
// NOTE: Use the 'credentials' object property - this solves the "No key set" error
const jwtClient = new google.auth.JWT({
  email: clientEmail,
  key: formattedKey,
  scopes: ['https://www.googleapis.com/auth/indexing'],
});

const urlsToIndex = [
  "https://algolib.netlify.app/",
  "https://algolib.netlify.app/compiler/",
  "https://algolib.netlify.app/contests/",
  "https://algolib.netlify.app/visualizer/",
  "https://algolib.netlify.app/analyzer/",
  "https://algolib.netlify.app/discussion/",
  "https://algolib.netlify.app/notes/",
  "https://algolib.netlify.app/docs/",
  "https://algolib.netlify.app/support/",
  "https://algolib.netlify.app/developer/",
  "https://algolib.netlify.app/terms/",
  "https://algolib.netlify.app/privacy/",
  "https://algolib.netlify.app/cookies/"
];

async function submitUrls() {
  try {
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
    console.error(error.response ? error.response.data : error.message);
  }
}

submitUrls();