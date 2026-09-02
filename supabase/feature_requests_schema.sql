-- つりずかん: 要望掲示板（feature request board）
-- Supabase dashboard の SQL Editor で一度だけ実行する。
-- 前提: schema.sql（profiles）と admin_schema.sql（public.is_admin()）が実行済みであること。

-- ============================================================
-- feature_requests: 要望本体
-- ============================================================
create table if not exists public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,   -- 投稿者。profiles経由でnicknameを引く
  title text not null check (char_length(title) between 1 and 120),         -- 短いタイトル（UI側は60文字目安で制限）
  body text,                                                                -- 詳細説明（任意）
  status text not null default 'new' check (status in ('new', 'reviewing', 'planned', 'done')),
  created_at timestamptz not null default now()
);

create index if not exists feature_requests_created_at_idx on public.feature_requests (created_at desc);

alter table public.feature_requests enable row level security;

-- SELECT: ログイン中の誰でも閲覧可（records と同じ思想）
drop policy if exists "feature requests are viewable by any authenticated user" on public.feature_requests;
create policy "feature requests are viewable by any authenticated user"
  on public.feature_requests for select
  to authenticated
  using (true);

-- INSERT: 自分の行のみ
drop policy if exists "users can insert their own feature request" on public.feature_requests;
create policy "users can insert their own feature request"
  on public.feature_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

-- DELETE: 自分の行のみ（投稿取り消し用）
drop policy if exists "users can delete their own feature request" on public.feature_requests;
create policy "users can delete their own feature request"
  on public.feature_requests for delete
  to authenticated
  using (auth.uid() = user_id);

-- UPDATE(status変更): 管理者のみ（既存の魚種マスタ管理と同じ権限モデル）
drop policy if exists "admins can update feature requests" on public.feature_requests;
create policy "admins can update feature requests"
  on public.feature_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- feature_request_votes: いいね（1人1票）
--   件数はこのテーブルの行数をCOUNTして算出。専用カウントカラムは持たない。
-- ============================================================
create table if not exists public.feature_request_votes (
  request_id uuid not null references public.feature_requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)     -- (request_id, user_id) の一意制約 = 1人1票を担保
);

create index if not exists feature_request_votes_request_id_idx on public.feature_request_votes (request_id);

alter table public.feature_request_votes enable row level security;

drop policy if exists "votes are viewable by any authenticated user" on public.feature_request_votes;
create policy "votes are viewable by any authenticated user"
  on public.feature_request_votes for select
  to authenticated
  using (true);

drop policy if exists "users can insert their own vote" on public.feature_request_votes;
create policy "users can insert their own vote"
  on public.feature_request_votes for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 自分の投票のみ削除可（いいね取り消し）
drop policy if exists "users can delete their own vote" on public.feature_request_votes;
create policy "users can delete their own vote"
  on public.feature_request_votes for delete
  to authenticated
  using (auth.uid() = user_id);
