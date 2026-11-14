-- つりずかん: 魚種の別名（地方名など。例: サッパ ↔ ママカリ）
-- Supabase dashboard の SQL Editor で一度だけ実行する（user_fish_schema.sql / merge_fish.sql の後）。
--
-- 1) fish.aliases 列を追加
-- 2) ユーザー登録時の重複チェックで、和名だけでなく別名も見る（「ママカリ」はサッパとして弾く）
-- 3) 魚種を統合したとき、統合元の和名と別名を統合先の別名に引き継ぐ

alter table public.fish add column if not exists aliases text[] not null default '{}';

-- ------------------------------------------------------------
-- 2) ユーザー登録ガード（user_fish_schema.sql の関数を別名対応に置き換え）
-- ------------------------------------------------------------
create or replace function public.guard_fish_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  recent_count int;
  dup_name text;
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
  select name into dup_name from public.fish where new.name = any(aliases) limit 1;
  if dup_name is not null then
    raise exception '「%」は「%」の別名として図鑑に登録されています', new.name, dup_name;
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
  new.aliases := '{}';            -- 別名は管理者が整備時に付ける
  new.tokuchou := left(new.tokuchou, 300);
  new.sort_order := coalesce((select max(sort_order) from public.fish), 0) + 1;
  new.created_at := now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 3) merge_fish: 統合元の和名・別名を統合先の別名に引き継ぐ
-- ------------------------------------------------------------
create or replace function public.merge_fish(source_id text, target_id text)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  moved integer;
  src public.fish%rowtype;
  tgt public.fish%rowtype;
begin
  if not public.is_admin() then
    raise exception '魚種の統合は管理者のみ実行できます';
  end if;
  if source_id = target_id then
    raise exception '同じ魚種には統合できません';
  end if;
  select * into src from public.fish where id = source_id;
  if not found then
    raise exception '統合元の魚種が見つかりません（%）', source_id;
  end if;
  select * into tgt from public.fish where id = target_id;
  if not found then
    raise exception '統合先の魚種が見つかりません（%）', target_id;
  end if;

  update public.records set fish_id = target_id where fish_id = source_id;
  get diagnostics moved = row_count;

  update public.fish
     set aliases = (
       select coalesce(array_agg(distinct a order by a), '{}')
         from unnest(tgt.aliases || src.name || src.aliases) as a
        where btrim(a) <> '' and a <> tgt.name
     )
   where id = target_id;

  delete from public.fish where id = source_id;
  return moved;
end;
$$;

revoke all on function public.merge_fish(text, text) from public, anon;
grant execute on function public.merge_fish(text, text) to authenticated;
