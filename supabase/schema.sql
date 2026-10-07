-- Run once in the Supabase SQL Editor to create the table the Python API writes to.
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_email text not null,
  description text not null,
  date_noticed date not null,
  photo_name text,
  photo_size integer,
  rental_address text not null,
  contact_email text not null
);

-- Row Level Security on, with no public policies: the browser (anon key) can't read
-- or write this table. Only the Python API, using the secret key, can.
alter table reports enable row level security;
