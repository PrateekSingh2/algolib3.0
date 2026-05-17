// netlify/functions/getDiscoverContent.ts
import { createClient } from '@supabase/supabase-js';

export const handler = async (event: any, context: any) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  // 1. Check for missing Environment Variables
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in Netlify.");
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Supabase credentials missing. Check Netlify Env Vars.' }) 
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 2. Fetch data (Ensure 'created_at' and 'image_url' match your table exactly)
    const { data, error } = await supabase
      .from('discover_content')
      .select('id, type, title, slug, image_url')
      .order('created_at', { ascending: false }) // Changed to Supabase default 'created_at'
      .limit(4);

    // 3. Catch Specific Supabase Errors
    if (error) {
      console.error("Supabase Query Error:", error.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Database Error: ${error.message}` })
      };
    }

    // 4. Success Return
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Adjust for production security
      },
      body: JSON.stringify(data),
    };
    
  } catch (error: any) {
    // Catch-all for unexpected crashes
    console.error("Function Execution Error:", error.message);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: `Function Error: ${error.message}` }) 
    };
  }
};