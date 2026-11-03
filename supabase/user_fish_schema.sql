-- つりずかん: ユーザーによる魚種の追加登録
-- Supabase dashboard の SQL Editor で一度だけ実行する。
-- 前提: schema.sql / admin_schema.sql が実行済みであること。
--
-- 仕組み:
--   一般ユーザーも fish に INSERT できる。ただしトリガーで
--     ・id は "u001", "u002"... を自動採番（クライアント指定は無視）
--     ・画像/シリーズ/レア度/表示順はサーバー側で固定値に上書き
--     ・needs_review = true（「要整備」フラグ）, created_by = 投稿者
--   を強制する。管理者が管理画面で画像などを整備して保存すると needs_review が外れる。
--   通知メールは Database Webhook → Edge Function(notify-new-fish) で送る（docs/ユーザー魚種登録_セットアップ.md 参照）。

-- ============================================================
-- 1) カラム追加
-- ============================================================
alter table public.fish add column if not exists needs_review boolean not null default false;
alter table public.fish add column if not exists created_by uuid references public.profiles(id) on delete set null;

create index if not exists fish_needs_review_idx on public.fish (needs_review) where needs_review;

-- ユーザー登録魚種の ID 採番用
create sequence if not exists public.user_fish_id_seq;

-- ============================================================
-- 2) INSERT 時のガード（一般ユーザーの入力をサニタイズ）
-- ============================================================
create or replace function public.guard_fish_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  recent_count int;
begin
  -- ダッシュボード / service_role / 管理者はそのまま通す
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  new.name := btrim(new.name);
  if char_length(new.name) not between 1 and 30 then
    raise exception '魚の名前は1〜30文字で入力してください';
  end if;
  if exists (select 1 from public.fish where name = new.name) then
    raise exception '「%」はすでに図鑑に登録されています', new.name;
  end if;

  -- 連投ガード: 1ユーザー24時間あたり5件まで
  select count(*) into recent_count
    from public.fish
   where created_by = auth.uid()
     and created_at > now() - interval '24 hours';
  if recent_count >= 5 then
    raise exception '魚種の登録は1日5件までです。しばらくしてからお試しください';
  end if;

  new.id := 'u' || lpad(nextval('public.user_fish_id_seq')::text, 3, '0');
  new.created_by := auth.uid();
  new.needs_review := true;
  new.en := coalesce(btrim(new.en), '');
  new.rarity := 2;                -- 定番扱い。整備時に管理者が調整する
  new.image_path := null;
  new.series_id := null;
  new.series_stage := null;
  new.standard := null;
  new.tsurikata := null;
  new.miwake := null;
  new.tokuchou := left(new.tokuchou, 300);
  new.sort_order := coalesce((select max(sort_order) from public.fish), 0) + 1;
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists fish_guard_insert on public.fish;
create trigger fish_guard_insert
  before insert on public.fish
  for each row execute function public.guard_fish_insert();

-- ============================================================
-- 3) RLS: ログインユーザーは自分名義で INSERT 可能
--    （既存の "admins can insert fish" と OR で評価される）
-- ============================================================
drop policy if exists "users can submit fish" on public.fish;
create policy "users can submit fish"
  on public.fish for insert
  to authenticated
  with check (created_by = auth.uid());
