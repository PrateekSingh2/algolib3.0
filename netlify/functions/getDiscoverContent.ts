// netlify/functions/getDiscoverContent.ts
import { createClient } from '@supabase/supabase-js';

export const handler = async (event: any, context: any) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Supabase credentials missing.' }) 
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Fetch top 4 items from discover_content
    // We select id, type, title, and slug as seen in your table structure
    const { data, error } = await supabase
      .from('discover_content')
      .select('id, type, title, slug')
      .limit(4);

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Adjust for production security
      },
      body: JSON.stringify(data),
    };
  } catch (error: any) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};