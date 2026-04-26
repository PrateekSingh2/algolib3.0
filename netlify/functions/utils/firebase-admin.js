// netlify/functions/utils/firebase-admin.js
const admin = require('firebase-admin');
const zlib = require('zlib'); 

if (!admin.apps.length) {
  // Use the NEW variable name you set in Netlify
  const gzBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_GZ_B64;
  
  if (!gzBase64) {
    throw new Error('Server Misconfiguration: Missing FIREBASE_SERVICE_ACCOUNT_GZ_B64');
  }

  try {
    // 1. Decode Base64 to Buffer
    const buffer = Buffer.from(gzBase64, 'base64');
    // 2. Decompress Gzip to original JSON string
    const decompressed = zlib.gunzipSync(buffer);
    // 3. Parse JSON
    const serviceAccount = JSON.parse(decompressed.toString());

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    console.error("Firebase Initialization Error:", err);
    throw new Error("Failed to initialize Firebase Admin from compressed string.");
  }
}

const db = admin.firestore();
module.exports = { admin, db };