-- ============================================================
-- Dropped Database Schema
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- User profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_color text default '#d4a853',
  created_at timestamptz default now()
);

-- Trip boards
create table if not exists boards (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_by uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- Board members (so multiple users can join a board)
create table if not exists board_members (
  board_id uuid references boards(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (board_id, user_id)
);

-- Ideas on a board
create table if not exists ideas (
  id uuid default gen_random_uuid() primary key,
  board_id uuid references boards(id) on delete cascade,
  city_id text not null,
  city_name text not null,
  note text not null,
  created_by uuid references profiles(id) on delete cascade,
  username text not null,
  vote_score integer default 0,
  created_at timestamptz default now()
);

-- Per-user votes (prevents double-voting)
create table if not exists votes (
  idea_id uuid references ideas(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  direction text check (direction in ('up','down')),
  primary key (idea_id, user_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles      enable row level security;
alter table boards        enable row level security;
alter table board_members enable row level security;
alter table ideas         enable row level security;
alter table votes         enable row level security;

-- Profiles: public read, own write
create policy "Read profiles"        on profiles for select using (true);
create policy "Insert own profile"   on profiles for insert with check (auth.uid() = id);
create policy "Update own profile"   on profiles for update using (auth.uid() = id);

-- Boards: public read, auth write
create policy "Read boards"          on boards for select using (true);
create policy "Insert board"         on boards for insert with check (auth.uid() = created_by);
create policy "Delete own board"     on boards for delete using (auth.uid() = created_by);

-- Board members
create policy "Read members"         on board_members for select using (true);
create policy "Join board"           on board_members for insert with check (auth.uid() = user_id);
create policy "Leave board"          on board_members for delete using (auth.uid() = user_id);

-- Ideas: public read, auth write
create policy "Read ideas"           on ideas for select using (true);
create policy "Insert idea"          on ideas for insert with check (auth.uid() = created_by);
create policy "Delete own idea"      on ideas for delete using (auth.uid() = created_by);
create policy "Update vote score"    on ideas for update using (true);

-- Votes: public read, auth write
create policy "Read votes"           on votes for select using (true);
create policy "Cast vote"            on votes for insert with check (auth.uid() = user_id);
create policy "Remove vote"          on votes for delete using (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Enable Realtime on ideas and votes tables
-- (Go to Supabase Dashboard → Database → Replication and enable for these tables)
