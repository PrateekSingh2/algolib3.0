const { db, auth } = require('./firebase-admin');

exports.handler = async (event, context) => {
    // 1. Check if the request is an HTTP GET
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 2. Verify the Admin Token from the frontend
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(token);

        // OPTIONAL: Verify if the user is actually in your admins collection
        // const adminDoc = await db.collection('admins').doc(decodedToken.email).get();
        // if (!adminDoc.exists) return { statusCode: 403, body: 'Forbidden' };

        // 3. Fetch all credits (Bypassing frontend security rules)
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
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};