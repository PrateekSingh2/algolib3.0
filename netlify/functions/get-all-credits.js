const { admin, db } = require('./firebase-admin');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
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

        // Use the db instance exported from your helper
        const snapshot = await db.collection('user_credits').get();
        const credits = [];
        
        snapshot.forEach(doc => {
            credits.push({
                id: doc.id,
                credits: doc.data().credits || 0
            });
        });

        return {
            statusCode: 200,
            body: JSON.stringify(credits)
        };
    } catch (error) {
        console.error("Get Credits Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};