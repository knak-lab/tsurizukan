-- つりずかん: 釣果記録に「数(匹数)」を追加する
-- Supabase dashboard の SQL Editor で一度だけ実行する（アプリのデプロイより先に）
-- 既存の記録はすべて 1匹 として扱われる。
-- size はその記録の中で一番大きかった1匹のサイズ（自己ベスト判定に使う）。

alter table public.records
  add column if not exists catch_count integer not null default 1
  constraint records_count_positive check (catch_count >= 1);
