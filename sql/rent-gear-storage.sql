-- FILM HK RENTAL — 장비 사진 보관함 (렌탈 홈페이지 카드용)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run 한 번. 여러 번 실행해도 괜찮아요.
--
-- · 보관함 이름: rent-gear (누구나 사진을 볼 수 있음 = 홈페이지에 보여야 하니까)
-- · 올리기 · 바꾸기 · 지우기: 관리자 화면에 로그인한 사람만
-- · 한 장 최대 2MB, WebP · PNG · JPEG 만 (관리자 화면이 알아서 줄여서 보통 50~150KB)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rent-gear', 'rent-gear', true, 2097152, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "rent-gear: staff read"   on storage.objects;
drop policy if exists "rent-gear: staff upload" on storage.objects;
drop policy if exists "rent-gear: staff update" on storage.objects;
drop policy if exists "rent-gear: staff delete" on storage.objects;

create policy "rent-gear: staff read"   on storage.objects for select to authenticated using (bucket_id = 'rent-gear');
create policy "rent-gear: staff upload" on storage.objects for insert to authenticated with check (bucket_id = 'rent-gear');
create policy "rent-gear: staff update" on storage.objects for update to authenticated using (bucket_id = 'rent-gear');
create policy "rent-gear: staff delete" on storage.objects for delete to authenticated using (bucket_id = 'rent-gear');

-- 참고: Supabase 인증에서 '누구나 가입'이 켜져 있으면, 가입한 아무 계정이나 사진을 올릴 수 있어요.
-- 관리자 계정만 허락하려면 위 네 줄의 'to authenticated' 조건에
--   and (auth.jwt() ->> 'email') = '관리자 이메일'
-- 을 더해 주세요.
