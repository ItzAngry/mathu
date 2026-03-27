-- AI job queue: Vercel writes jobs here; LM Studio worker machines poll and process them.
-- This avoids needing inbound connections to the LM Studio machines (no Tailscale Funnel needed).

create table if not exists ai_jobs (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  type          text        not null check (type in ('matheus', 'vision')),
  payload       jsonb       not null,
  result        jsonb,
  status        text        not null default 'pending' check (status in ('pending', 'processing', 'done', 'error')),
  completed_at  timestamptz
);

-- Workers use the service role key and bypass RLS entirely.
alter table ai_jobs disable row level security;

-- Index for fast pending-job lookup per type.
create index if not exists ai_jobs_pending_idx on ai_jobs (type, created_at)
  where status = 'pending';
