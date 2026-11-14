-- つりずかん: 魚種のマージ（重複した魚種を既存の魚種へ統合する）
-- Supabase dashboard の SQL Editor で一度だけ実行する（user_fish_schema.sql の後）。
--
-- 他ユーザーの records も付け替える必要があるため security definer で実行し、
-- 関数内で is_admin() を確認する（records の RLS は本人しか update できないため）。
-- 付け替えと削除は1トランザクションなので、途中で失敗すれば何も変わらない。

create or replace function public.merge_fish(source_id text, target_id text)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  moved integer;
begin
  if not public.is_admin() then
    raise exception '魚種の統合は管理者のみ実行できます';
  end if;
  if source_id = target_id then
    raise exception '同じ魚種には統合できません';
  end if;
  if not exists (select 1 from public.fish where id = source_id) then
    raise exception '統合元の魚種が見つかりません（%）', source_id;
  end if;
  if not exists (select 1 from public.fish where id = target_id) then
    raise exception '統合先の魚種が見つかりません（%）', target_id;
  end if;

  update public.records set fish_id = target_id where fish_id = source_id;
  get diagnostics moved = row_count;

  delete from public.fish where id = source_id;
  return moved;
end;
$$;

revoke all on function public.merge_fish(text, text) from public, anon;
grant execute on function public.merge_fish(text, text) to authenticated;
