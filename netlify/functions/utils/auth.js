const admin = require('firebase-admin');
const https = require('https');

// Fix for Node 24 + Netlify CLI ECONNRESET on Windows:
// Keep outbound TLS sockets alive so they don't trigger socket close
// events that propagate through Netlify CLI's internal proxy pipe.
const keepAliveAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 5,
});

// Monkey-patch Node's global HTTPS agent before firebase-admin initializes
https.globalAgent = keepAliveAgent;

if (!admin.apps.length) {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  
  if (!process.env.GOOGLE_CLIENT_EMAIL || !privateKey) {
    console.warn("Firebase Admin: Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "algolib-e0567",
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const verifyToken = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid Authorization header');
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("JWT Verification failed:", error);
    throw new Error('Unauthorized: Invalid token');
  }
};

module.exports = { admin, verifyToken };
