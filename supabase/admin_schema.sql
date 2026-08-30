-- つりずかん: 管理者画面 + 魚種マスタの Supabase 化
-- Supabase dashboard の SQL Editor で一度だけ実行する。
-- 実行後: Table editor → profiles → 自分の行の is_admin を true にする。

-- ============================================================
-- 1) 管理者フラグ
-- ============================================================
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- 呼び出し元が管理者かを返すヘルパー（fish / storage の RLS ポリシーで使う）
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- 一般ユーザーが自分で is_admin を書き換えられないようにするガード。
-- auth.uid() が null のとき（ダッシュボード / service_role）は素通し。
create or replace function public.guard_is_admin()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    raise exception 'is_admin は管理者のみ変更できます';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_is_admin on public.profiles;
create trigger profiles_guard_is_admin
  before update on public.profiles
  for each row execute function public.guard_is_admin();

-- ============================================================
-- 2) fish: 魚種マスタ（src/data/fishMaster.js の raw エントリと一致）
--    id は既存の文字列（"001", "008a" など）をそのまま維持し、
--    records.fish_id との参照関係を壊さない（FK は張らない soft reference）。
-- ============================================================
create table if not exists public.fish (
  id text primary key,
  name text not null,
  en text not null,
  tax text not null check (tax in ('fish', 'cephalo', 'crust')),
  env text not null check (env in ('salt', 'brackish', 'fresh')),
  rarity int not null check (rarity between 1 and 5),
  size_min numeric not null check (size_min > 0),
  size_max numeric not null check (size_max > size_min),
  image_path text,                       -- fish-images バケット内のファイル名。null 可
  tokuchou text,
  miwake text,
  standard text,
  tsurikata text,
  series_id text,
  series_stage int,
  sort_order int not null default 0,     -- 図鑑内の表示順（現在の配列順を引き継ぐ）
  created_at timestamptz not null default now()
);

alter table public.fish enable row level security;

drop policy if exists "fish are viewable by any authenticated user" on public.fish;
create policy "fish are viewable by any authenticated user"
  on public.fish for select
  to authenticated
  using (true);

drop policy if exists "admins can insert fish" on public.fish;
create policy "admins can insert fish"
  on public.fish for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admins can update fish" on public.fish;
create policy "admins can update fish"
  on public.fish for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins can delete fish" on public.fish;
create policy "admins can delete fish"
  on public.fish for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- 3) Storage: fish-images バケット（公開読み取り / 書き込みは管理者のみ）
-- ============================================================
insert into storage.buckets (id, name, public)
values ('fish-images', 'fish-images', true)
on conflict (id) do nothing;

drop policy if exists "fish images are publicly readable" on storage.objects;
create policy "fish images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'fish-images');

drop policy if exists "admins insert fish images" on storage.objects;
create policy "admins insert fish images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'fish-images' and public.is_admin());

drop policy if exists "admins update fish images" on storage.objects;
create policy "admins update fish images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'fish-images' and public.is_admin());

drop policy if exists "admins delete fish images" on storage.objects;
create policy "admins delete fish images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'fish-images' and public.is_admin());
