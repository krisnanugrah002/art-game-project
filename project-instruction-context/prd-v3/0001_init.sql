-- =====================================================================
-- Skema Supabase Postgres (PRODUKSI)
-- Harus selalu ekuivalen dengan database/mysql/schema.sql
-- Tidak ada data dummy: semua tabel dibuat KOSONG.
-- Jalankan di Supabase Dashboard -> SQL Editor (atau `supabase db push`).
-- =====================================================================

create table if not exists public.players (
  id                  uuid primary key,
  username_key        varchar(16) not null unique,   -- huruf kecil, kunci unik
  display_name        varchar(16) not null,          -- ejaan asli untuk tampilan
  timezone            varchar(64) not null default 'Asia/Jakarta',
  username_changed_at timestamptz,
  created_at          timestamptz not null default now(),
  last_seen_at        timestamptz not null default now()
);

create table if not exists public.user_stats (
  player_id        uuid primary key references public.players(id) on delete cascade,
  lives_count      smallint    not null default 5 check (lives_count between 0 and 5),
  lives_anchor_at  timestamptz not null default now(),
  total_xp         integer     not null default 0 check (total_xp >= 0),
  current_streak   integer     not null default 0,
  longest_streak   integer     not null default 0,
  last_played_date date,
  version          integer     not null default 0,
  updated_at       timestamptz not null default now()
);

create table if not exists public.chapter_progress (
  player_id           uuid        not null references public.players(id) on delete cascade,
  chapter_id          varchar(32) not null,
  stars               smallint    not null default 0 check (stars between 0 and 3),
  best_minigame_score smallint    not null default 0,
  best_quiz_correct   smallint    not null default 0,
  completed_at        timestamptz,
  primary key (player_id, chapter_id)
);

create table if not exists public.chapter_attempts (
  id            uuid primary key,
  player_id     uuid        not null references public.players(id) on delete cascade,
  chapter_id    varchar(32) not null,
  status        varchar(12) not null default 'active'
                check (status in ('active','completed','failed')),
  quiz_correct  smallint    not null default 0,
  quiz_wrong    smallint    not null default 0,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);
create index if not exists idx_attempts_player on public.chapter_attempts (player_id, chapter_id);

create table if not exists public.attempt_answers (
  attempt_id   uuid        not null references public.chapter_attempts(id) on delete cascade,
  question_id  varchar(40) not null,
  is_correct   boolean     not null,
  answered_at  timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

create table if not exists public.xp_events (
  id          bigint generated always as identity primary key,
  player_id   uuid        not null references public.players(id) on delete cascade,
  amount      integer     not null,
  source      varchar(32) not null,
  ref_key     varchar(80) not null,      -- mencegah XP ganda, mis. chapter:s1-c1:stars:3
  created_at  timestamptz not null default now(),
  unique (player_id, ref_key)
);
create index if not exists idx_xp_created on public.xp_events (created_at, player_id);

create table if not exists public.submissions (
  id               uuid primary key,
  player_id        uuid        not null references public.players(id) on delete cascade,
  chapter_id       varchar(32) not null,
  score            smallint    not null,
  criteria_results jsonb,
  feedback         text,
  created_at       timestamptz not null default now()
);
create index if not exists idx_sub_player on public.submissions (player_id, created_at);

create table if not exists public.rate_limits (
  bucket        varchar(100) primary key,
  window_start  timestamptz  not null,
  hits          integer      not null default 0
);

-- ---------------------------------------------------------------------
-- KEAMANAN: aplikasi mengakses database hanya dari server (koneksi Postgres).
-- Aktifkan RLS TANPA policy + cabut hak role publik, sehingga API REST
-- publik Supabase (anon/authenticated) tidak bisa membaca/menulis data.
-- ---------------------------------------------------------------------
alter table public.players          enable row level security;
alter table public.user_stats       enable row level security;
alter table public.chapter_progress enable row level security;
alter table public.chapter_attempts enable row level security;
alter table public.attempt_answers  enable row level security;
alter table public.xp_events        enable row level security;
alter table public.submissions      enable row level security;
alter table public.rate_limits      enable row level security;

revoke all on public.players, public.user_stats, public.chapter_progress,
              public.chapter_attempts, public.attempt_answers, public.xp_events,
              public.submissions, public.rate_limits
  from anon, authenticated;
