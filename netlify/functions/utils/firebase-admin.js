const admin = require('firebase-admin');

if (!admin.apps.length) {
  const b64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  
  if (!b64ServiceAccount) {
    throw new Error('Server Misconfiguration: Missing FIREBASE_SERVICE_ACCOUNT_B64 in Netlify.');
  }

  // Decode the Base64 string back into a standard JSON object
  const decodedSA = Buffer.from(b64ServiceAccount, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(decodedSA);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Export the initialized admin and db instances for your other functions to use
module.exports = { admin, db };