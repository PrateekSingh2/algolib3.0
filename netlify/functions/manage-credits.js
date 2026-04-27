const { db, auth } = require('./utils/firebase-admin');

exports.handler = async (event, context) => {
    // 1. Check if the request is a POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 2. Verify the Admin Token
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const token = authHeader.split('Bearer ')[1];
        await auth.verifyIdToken(token);

        // 3. Get the data sent from the Admin.tsx file
        const { userId, newBalance } = JSON.parse(event.body);

        if (!userId || typeof newBalance !== 'number') {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid data' }) };
        }

        // 4. Update the database (Bypassing frontend security rules)
        await db.collection('user_credits').doc(userId).set({
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