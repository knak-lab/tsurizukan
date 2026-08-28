-- つりずかん: Supabase schema + RLS
-- Supabase dashboard の SQL Editor で一度だけ実行する

-- ============================================================
-- profiles: ユーザーごとのニックネーム
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now(),
  constraint nickname_length check (char_length(nickname) between 1 and 30)
);

-- ニックネームは大文字小文字を区別せず一意（「誰の図鑑を見るか」選択時に紛れないように）
create unique index profiles_nickname_unique_idx on public.profiles (lower(nickname));

alter table public.profiles enable row level security;

create policy "profiles are viewable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- records: 釣果記録
-- ============================================================
create table public.records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fish_id text not null,                 -- src/data/fishMaster.js への参照（DB側FKなしのsoft reference）
  size numeric not null check (size > 0),
  size_class text not null check (size_class in ('baby', 'kid', 'adult', 'nushi')),
  date date not null,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_at timestamptz not null default now()
);

create index records_user_id_idx on public.records (user_id);
create index records_fish_id_idx on public.records (fish_id);

alter table public.records enable row level security;

-- 公開範囲: 今はフル公開（ログイン中の誰でも public な記録を見られる）。
-- 将来「友人限定」を足す場合はここのUSING句を拡張するだけでよく、visibilityカラム自体は
-- 今回追加不要（スキーマ変更なしで拡張できるように最初から用意している）。
create policy "public records are viewable by any authenticated user"
  on public.records for select
  to authenticated
  using (visibility = 'public');

create policy "users can insert their own records"
  on public.records for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own records"
  on public.records for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own records"
  on public.records for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- サインアップ時に自動で profiles 行を作成する
-- （メールのローカル部を仮ニックネームにする。アプリ側の「ニックネーム設定」で上書き可能）
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
