// Correctly import 'admin' and 'db' from your custom zlib helper file
const { admin, db } = require('./utils/firebase-admin');

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
        
        // Correctly use admin.auth() here
        await admin.auth().verifyIdToken(token);

        const { userId, newBalance } = JSON.parse(event.body);

        if (!userId || typeof newBalance !== 'number') {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid data' }) };
        }

        // Use the db instance exported from your helper
        await db.collection('user_credits').doc(userId).set({
            credits: newBalance,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Credits updated" })
        };
    } catch (error) {
        console.error("Manage Credits Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};