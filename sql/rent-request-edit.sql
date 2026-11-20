-- FILM HK RENTAL — 홈페이지에서 '내 신청 불러오기 · 고치기'
-- Supabase > SQL Editor 에 통째로 붙여 넣고 Run 한 번. 여러 번 실행해도 괜찮아요.
--
-- · 손님은 신청할 때 비밀번호(숫자 4자리)를 정해요. 비밀번호는 bcrypt 로 바꿔서만 저장돼요(원래 숫자는 남지 않음).
-- · 연락처 + 비밀번호가 맞으면 홈페이지에서 그 사람의 신청만 불러와요.
-- · 상태가 new / seen(관리자 '확인함')일 때만 고칠 수 있어요.
--   관리자에서 '예약으로 만들기'(converted)나 '거절·종료'(declined)를 했으면 잠겨서, 홈페이지는 "직접 문의해 주세요"라고 안내해요.
-- · 손님이 고치면 같은 신청 줄이 바뀌고 상태가 다시 new 가 돼요 → 관리자 신청함에 'NEW · 손님이 고침'으로 다시 떠요.
-- · 비밀번호가 15분 안에 8번 틀리면 그 연락처는 잠깐 막혀요.

create extension if not exists pgcrypto with schema extensions;

alter table public.rental_requests add column if not exists pin text;                      -- 들어오는 순간 아래 트리거가 지움
alter table public.rental_requests add column if not exists pin_hash text;
alter table public.rental_requests add column if not exists customer_edited_at timestamptz;
alter table public.rental_requests add column if not exists customer_edit_count int not null default 0;

-- 1) 신청이 들어올 때 비밀번호를 해시로 바꿔 저장
create or replace function public.rent_hash_pin() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.pin is not null and new.pin ~ '^\d{4}$' then
    new.pin_hash := extensions.crypt(new.pin, extensions.gen_salt('bf'));
  end if;
  new.pin := null;
  return new;
end $$;
drop trigger if exists rent_hash_pin on public.rental_requests;
create trigger rent_hash_pin before insert or update of pin on public.rental_requests
  for each row execute function public.rent_hash_pin();

-- 2) 틀린 시도 기록 (함수만 씀, 손님은 직접 못 봄)
create table if not exists public.rent_lookup_fail (phone text not null, at timestamptz not null default now());
alter table public.rent_lookup_fail enable row level security;

-- 3) 내 신청 불러오기
create or replace function public.rent_lookup(p_phone text, p_pin text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  d text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  r jsonb;
begin
  if length(d) < 9 or coalesce(p_pin, '') !~ '^\d{4}$' then return '[]'::jsonb; end if;
  if (select count(*) from public.rent_lookup_fail where phone = d and at > now() - interval '15 minutes') >= 8 then
    raise exception 'too_many_attempts';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', q.id::text, 'created_at', q.created_at, 'status', q.status,
      'editable', q.status in ('new', 'seen'),
      'name', q.name, 'phone', q.phone, 'cust_type', q.cust_type, 'org', q.org,
      'start_date', q.start_date, 'start_time', q.start_time, 'end_date', q.end_date, 'end_time', q.end_time,
      'items', q.items, 'message', q.message, 'edited_at', q.customer_edited_at
    ) order by q.created_at desc), '[]'::jsonb)
  into r
  from public.rental_requests q
  where regexp_replace(q.phone, '\D', '', 'g') = d
    and q.pin_hash is not null and q.pin_hash = extensions.crypt(p_pin, q.pin_hash)
    and q.created_at > now() - interval '1 year';
  if r = '[]'::jsonb then
    insert into public.rent_lookup_fail(phone) values (d);
    delete from public.rent_lookup_fail where at < now() - interval '1 day';
  end if;
  return r;
end $$;

-- 4) 내 신청 고치기 → 'ok' | 'locked'(관리자가 이미 처리) | 'nomatch'
create or replace function public.rent_update(p_id text, p_phone text, p_pin text, p_row jsonb) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  d text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  rec public.rental_requests;
  nr public.rental_requests;
begin
  select * into rec from public.rental_requests where id::text = p_id for update;
  if not found or regexp_replace(rec.phone, '\D', '', 'g') <> d
     or rec.pin_hash is null or rec.pin_hash <> extensions.crypt(coalesce(p_pin, ''), rec.pin_hash) then
    return 'nomatch';
  end if;
  if rec.status not in ('new', 'seen') then return 'locked'; end if;
  -- 손님이 바꿀 수 있는 칸만 (연락처 · 상태 · 관리자 칸은 그대로)
  nr := jsonb_populate_record(rec, coalesce(p_row, '{}'::jsonb)
        - 'id' - 'phone' - 'status' - 'pin' - 'pin_hash' - 'created_at' - 'handled_at' - 'booking_id'
        - 'consent' - 'customer_edited_at' - 'customer_edit_count');
  update public.rental_requests set
    name = coalesce(nullif(nr.name, ''), rec.name), cust_type = nr.cust_type, org = nr.org,
    start_date = nr.start_date, start_time = nr.start_time, end_date = nr.end_date, end_time = nr.end_time,
    items = nr.items, message = nr.message,
    status = 'new', customer_edited_at = now(), customer_edit_count = rec.customer_edit_count + 1
  where id = rec.id;
  return 'ok';
end $$;

revoke all on function public.rent_lookup(text, text) from public;
revoke all on function public.rent_update(text, text, text, jsonb) from public;
grant execute on function public.rent_lookup(text, text) to anon, authenticated;
grant execute on function public.rent_update(text, text, text, jsonb) to anon, authenticated;
