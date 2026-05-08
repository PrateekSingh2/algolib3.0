-- Table creation for discover_content
CREATE TABLE public.discover_content (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    content_markdown text NOT NULL,
    crisp_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    image_url text,
    seo_desc text,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Full-Text Search (FTS) Setup
-- Adds a generated tsvector column combining title, content, and seo description
ALTER TABLE public.discover_content
ADD COLUMN fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content_markdown, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(seo_desc, '')), 'C')
) STORED;

-- Create a GIN index on the generated tsvector column for rapid search
CREATE INDEX discover_content_fts_idx ON public.discover_content USING GIN (fts);

-- Enable Row Level Security (RLS)
ALTER TABLE public.discover_content ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Public access is strictly limited to published content
CREATE POLICY "Public can view published content"
ON public.discover_content
FOR SELECT
TO public
USING (status = 'published');

-- RLS Policy 2: Admin can perform any operation (including changing status to 'published')
-- Adjust the condition below based on your specific admin authentication mechanism.
-- Commonly, admins are tracked via a JWT claim, or by a separate user roles table.
CREATE POLICY "Admin has full access"
ON public.discover_content
FOR ALL
TO authenticated
USING ( 
    -- Assuming a custom claim 'role' = 'admin'. Update to match your auth structure.
    auth.jwt() ->> 'role' = 'admin' 
)
WITH CHECK ( 
    auth.jwt() ->> 'role' = 'admin' 
);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER discover_content_updated_at_trigger
    BEFORE UPDATE ON public.discover_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
