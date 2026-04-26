const https = require('https');

// Fix for Node 24 + Netlify CLI ECONNRESET on Windows:
// Keep outbound TLS sockets alive so they don't trigger socket close
// events that propagate through Netlify CLI's internal proxy pipe.
const keepAliveAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 5,
});

// Monkey-patch Node's global HTTPS agent BEFORE firebase-admin initializes
https.globalAgent = keepAliveAgent;

// NOW import the centralized admin utility so it uses the patched agent
const { admin } = require('./firebase-admin');

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