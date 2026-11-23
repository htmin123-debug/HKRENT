-- 렌탈 홈페이지 방문자 분석 (v349)
-- Supabase → SQL Editor 에 붙여 넣고 Run 한 번.
-- 홈페이지(Cloudflare Worker)가 방문 한 건마다 한 줄 넣고, 관리 페이지(로그인한 직원)만 읽고 지울 수 있음.
-- IP 는 앞 두 자리만 남김(예: 121.134.*.*). 이름 · 연락처는 들어오지 않음.

create table if not exists public.site_visits (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  kind     text not null default 'view' check (kind in ('view','leave','case','req')),
  vid      text check (length(vid) <= 40),
  sid      text check (length(sid) <= 40),
  is_new   boolean,
  path     text check (length(path) <= 300),
  ref      text check (length(ref) <= 500),
  source   text check (length(source) <= 40),
  keyword  text check (length(keyword) <= 120),
  device   text check (length(device) <= 20),
  os       text check (length(os) <= 20),
  browser  text check (length(browser) <= 20),
  country  text check (length(country) <= 8),
  region   text check (length(region) <= 60),
  city     text check (length(city) <= 60),
  ip_mask  text check (length(ip_mask) <= 50),
  dur      integer check (dur between 0 and 86400),
  extra    text check (length(extra) <= 120)
);
create index if not exists site_visits_at_idx on public.site_visits (at desc);

alter table public.site_visits enable row level security;
drop policy if exists "site_visits: anyone insert" on public.site_visits;
drop policy if exists "site_visits: staff read"    on public.site_visits;
drop policy if exists "site_visits: staff delete"  on public.site_visits;
create policy "site_visits: anyone insert" on public.site_visits for insert to anon, authenticated with check (true);
create policy "site_visits: staff read"    on public.site_visits for select to authenticated using (true);
create policy "site_visits: staff delete"  on public.site_visits for delete to authenticated using (true);
grant insert on public.site_visits to anon;
grant select, insert, delete on public.site_visits to authenticated;

-- (선택) 1년 지난 기록 정리: 필요할 때 아래 한 줄만 실행
-- delete from public.site_visits where at < now() - interval '1 year';
