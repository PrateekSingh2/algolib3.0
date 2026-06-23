const { supabaseAdmin } = require('./utils/supabase');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const handler = async (event) => {
  // Only allow POST requests (if triggered manually) or scheduled execution
  try {
    console.log("Starting scheduled account deletion process...");

    // 1. Fetch users scheduled for deletion
    // We look for users where deletion_scheduled_at is NOT null and is <= current time
    const now = new Date().toISOString();
    
    const { data: usersToDelete, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, firebase_uid, deletion_scheduled_at')
      .not('deletion_scheduled_at', 'is', null)
      .lte('deletion_scheduled_at', now);

    if (fetchError) {
      throw fetchError;
    }

    if (!usersToDelete || usersToDelete.length === 0) {
      console.log("No accounts scheduled for deletion today.");
      return { statusCode: 200, body: JSON.stringify({ message: "No accounts to delete" }) };
    }

    console.log(`Found ${usersToDelete.length} accounts to delete.`);

    let deletedCount = 0;
    let failedCount = 0;

    // 2. Iterate and delete from both Firebase Auth and Supabase
    for (const user of usersToDelete) {
      try {
        // Delete from Firebase Auth first
        if (user.firebase_uid) {
          await admin.auth().deleteUser(user.firebase_uid);
          console.log(`Deleted user ${user.firebase_uid} from Firebase Auth.`);
        }

        // Delete from Supabase Database
        const { error: deleteError } = await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', user.id);

        if (deleteError) {
          throw deleteError;
        }

        console.log(`Deleted user ${user.id} from Supabase.`);
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete user ${user.id}:`, err);
        failedCount++;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Account deletion process completed",
        deleted: deletedCount,
        failed: failedCount
      })
    };
  } catch (error) {
    console.error("Error in scheduled account deletion:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// For Netlify Scheduled Functions (requires @netlify/functions package if using the schedule wrapper)
// But we can also trigger this via an external CRON service hitting the webhook URL.
exports.handler = handler;
