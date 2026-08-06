create table if not exists public.blackcrown_world_status (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  display_name text not null,
  status text not null check (
    status in ('LIVE', 'ALPHA', 'BETA', 'MAINTENANCE', 'OFFLINE', 'COMING_SOON')
  ),
  tone text not null default 'cyan' check (
    tone in ('cyan', 'orange', 'violet', 'green', 'neutral')
  ),
  summary text not null default '',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table public.blackcrown_world_status is
  'Public read-only status registry for the BlackCrown platform.';

alter table public.blackcrown_world_status enable row level security;

drop policy if exists blackcrown_world_status_public_read
  on public.blackcrown_world_status;

create policy blackcrown_world_status_public_read
  on public.blackcrown_world_status
  for select
  to anon, authenticated
  using (is_visible = true);

grant select on table public.blackcrown_world_status to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.blackcrown_world_status
  from anon, authenticated;

create or replace function public.blackcrown_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blackcrown_world_status_set_updated_at
  on public.blackcrown_world_status;

create trigger blackcrown_world_status_set_updated_at
before update on public.blackcrown_world_status
for each row execute function public.blackcrown_set_updated_at();

insert into public.blackcrown_world_status (
  slug,
  display_name,
  status,
  tone,
  summary,
  sort_order,
  is_visible
)
values
  (
    'evofish',
    'EvoFish',
    'LIVE',
    'cyan',
    'Океанский мир доступен.',
    10,
    true
  ),
  (
    'crown-front',
    'CROWN//FRONT',
    'ALPHA',
    'orange',
    'Мобильная WebGL alpha доступна.',
    20,
    true
  ),
  (
    'blackcrown-network',
    'BlackCrown Network',
    'LIVE',
    'green',
    'Платформа работает штатно.',
    30,
    true
  )
on conflict (slug) do update set
  display_name = excluded.display_name,
  status = excluded.status,
  tone = excluded.tone,
  summary = excluded.summary,
  sort_order = excluded.sort_order,
  is_visible = excluded.is_visible,
  updated_at = now();
