const admin = require('firebase-admin');

// 1. Initialize Admin SDK directly in the function file
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const token = authHeader.split('Bearer ')[1];
        
        // 2. Directly use admin.auth() here instead of relying on an import
        await admin.auth().verifyIdToken(token);

        const { userId, newBalance } = JSON.parse(event.body);

        if (!userId || typeof newBalance !== 'number') {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid data' }) };
        }

        // 3. Directly use admin.firestore() here
        await admin.firestore().collection('user_credits').doc(userId).set({
            credits: newBalance,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Credits updated" })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};