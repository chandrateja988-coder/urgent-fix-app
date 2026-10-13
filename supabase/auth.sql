-- Run once in the Supabase SQL Editor to create the table that stores accounts.
-- The Python API (using the secret key) is the only thing that reads or writes it.
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null unique,
  -- A salted scrypt hash. The real password is never stored.
  password_hash text not null
);

-- Row Level Security on, with no public policies: the browser (anon key) can't read
-- or write this table.
alter table app_users enable row level security;
