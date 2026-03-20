-- WARNING: This script deletes the existing users table and recreates it.
-- Run in Supabase SQL Editor.

begin;

-- Drop existing table used by this app
DROP TABLE IF EXISTS public.users CASCADE;

-- Required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text UNIQUE,
  email text UNIQUE,
  full_name text,
  display_name text,
  avatar_url text,
  has_seen_welcome boolean NOT NULL DEFAULT false,
  college text,
  age integer,
  gender text,
  city text,
  state text,
  country text,
  github_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX users_email_idx ON public.users(email);
CREATE INDEX users_firebase_uid_idx ON public.users(firebase_uid);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- For this Firebase-auth + Supabase-REST setup using anon key, keep RLS disabled.
-- If you later switch to Supabase Auth JWT, enable RLS and add per-user policies.
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

commit;
