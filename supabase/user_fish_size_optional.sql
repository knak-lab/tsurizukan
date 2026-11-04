-- つりずかん: ユーザー登録時のサイズ帯を任意にする
-- Supabase dashboard の SQL Editor で一度だけ実行する（user_fish_schema.sql の後）。
-- size_min / size_max は「両方空」か「両方入力（0 < 下限 < 上限）」のどちらか。
-- 空の魚種はアプリ上「サイズ調査中」と表示され、クラス（ベビー〜ヌシ）判定もしない。
-- 管理者が整備時にサイズ帯を入れると、既存の記録にもクラスが反映される。

alter table public.fish alter column size_min drop not null;
alter table public.fish alter column size_max drop not null;

-- 既存のサイズ系 CHECK 制約（自動命名）を名前に依存せずすべて外す
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.fish'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) ~ 'size_m(in|ax)'
  loop
    execute format('alter table public.fish drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.fish add constraint fish_size_range_check check (
  (size_min is null and size_max is null)
  or (size_min > 0 and size_max > size_min)
);
