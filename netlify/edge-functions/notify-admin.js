export default async (request, context) => {
  // Only allow POST requests (Supabase Webhooks)
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const payload = await request.json();

    // Check if this is an INSERT to discover_content and the status is 'pending'
    if (
      payload.table === "discover_content" &&
      payload.type === "INSERT" &&
      payload.record.status === "pending"
    ) {
      const record = payload.record;
      
      // Firebase Realtime Database REST API URL
      // Requires FIREBASE_DATABASE_URL and FIREBASE_AUTH_SECRET in Netlify Env
      const firebaseUrl = Deno.env.get("FIREBASE_DATABASE_URL");
      const firebaseSecret = Deno.env.get("FIREBASE_AUTH_SECRET");

      if (!firebaseUrl) {
        console.error("Missing FIREBASE_DATABASE_URL environment variable.");
        return new Response("Configuration Error", { status: 500 });
      }

      // Construct the Firebase REST endpoint URL
      const targetUrl = `${firebaseUrl}/admin_notifications.json${
        firebaseSecret ? `?auth=${firebaseSecret}` : ""
      }`;

      // Push notification to Firebase
      const notification = {
        type: "NEW_CONTENT_PENDING",
        title: `New Post ready for review: ${record.title}`,
        record_id: record.id,
        timestamp: new Date().toISOString(),
        read: false,
      };

      const firebaseResponse = await fetch(targetUrl, {
        method: "POST", // POST in Firebase REST pushes to a list
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notification),
      });

      if (!firebaseResponse.ok) {
        const errorText = await firebaseResponse.text();
        console.error("Firebase Error:", errorText);
        return new Response("Failed to notify Firebase", { status: 500 });
      }

      console.log(`Successfully notified admin about new post: ${record.id}`);
      return new Response("Notification sent successfully", { status: 200 });
    }

    // Ignore other types of webhook events
    return new Response("Ignored", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error.message);
    return new Response("Bad Request", { status: 400 });
  }
};

export const config = {
  path: "/api/notify-admin",
};
