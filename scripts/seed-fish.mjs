/**
 * 既存122種を Supabase へ一度だけ移行する。
 *
 *  - scripts/fish-seed.json の各行を public.fish へ upsert
 *  - src/assets/fish/<image_path> を fish-images バケットへ upsert アップロード
 *
 * service_role キーは不要。管理者アカウントでログインして RLS / Storage ポリシーを通過する。
 * 事前に:
 *   1. supabase/admin_schema.sql を実行済み
 *   2. 自分の profiles.is_admin = true
 *   3. プロジェクト直下に .env.seed を用意（.gitignore 済み）:
 *        SEED_ADMIN_EMAIL=you@example.com
 *        SEED_ADMIN_PASSWORD=********
 *
 * 実行: node scripts/seed-fish.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function readEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(join(root, file), 'utf8')
        .split(/\r?\n/)
        .filter((l) => l && !l.startsWith('#'))
        .map((l) => {
          const i = l.indexOf('=')
          return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
        }),
    )
  } catch {
    return {}
  }
}

const env = { ...readEnv('.env'), ...readEnv('.env.seed') }
const URL = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY
const EMAIL = env.SEED_ADMIN_EMAIL
const PASSWORD = env.SEED_ADMIN_PASSWORD

if (!URL || !ANON || !EMAIL || !PASSWORD) {
  console.error('必要な環境変数が足りません（.env の VITE_SUPABASE_URL/ANON_KEY、.env.seed の SEED_ADMIN_EMAIL/PASSWORD）')
  process.exit(1)
}

const supabase = createClient(URL, ANON, { auth: { persistSession: false } })

const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
})
if (authErr) {
  console.error('ログイン失敗:', authErr.message)
  process.exit(1)
}

const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', auth.user.id).single()
if (!me?.is_admin) {
  console.error('このアカウントは is_admin = true ではありません。ダッシュボードで設定してください。')
  process.exit(1)
}
console.log(`ログイン: ${EMAIL} (is_admin=${me.is_admin})`)

const seed = JSON.parse(readFileSync(join(root, 'scripts/fish-seed.json'), 'utf8'))
console.log(`シード対象: ${seed.length} 種`)

// fish-seed.json の image_path はディスク上の日本語ファイル名。
// Supabase Storage のキーは ASCII のみ許可されるため、バケット内のキー / DB の image_path は
// 魚種 id ベース（"001.png", "008a.png" など）に統一する。
const storageKey = (f) => `${f.id}.png`

// --- 画像アップロード ---
let uploaded = 0
let uploadFailed = 0
for (const f of seed) {
  if (!f.image_path) continue
  const bytes = readFileSync(join(root, 'src/assets/fish', f.image_path)) // 読み込みは元の日本語ファイル名
  const key = storageKey(f)
  const { error } = await supabase.storage
    .from('fish-images')
    .upload(key, bytes, { contentType: 'image/png', upsert: true })
  if (error) {
    console.error(`  画像NG ${key}: ${error.message}`)
    uploadFailed++
  } else {
    uploaded++
    if (uploaded % 20 === 0) console.log(`  画像 ${uploaded}/${seed.length} ...`)
  }
}
console.log(`画像アップロード: 成功 ${uploaded} / 失敗 ${uploadFailed}`)

// --- 行 upsert（image_path は id ベースのキーに置き換える） ---
const rows = seed.map((f) => ({ ...f, image_path: f.image_path ? storageKey(f) : null }))
const { error: upsertErr } = await supabase.from('fish').upsert(rows, { onConflict: 'id' })
if (upsertErr) {
  console.error('fish upsert 失敗:', upsertErr.message)
  process.exit(1)
}

const { count: total } = await supabase.from('fish').select('*', { count: 'exact', head: true })
console.log(`fish テーブル upsert 完了。現在の総行数: ${total}`)

const { data: sample } = await supabase.from('fish').select('id,name,image_path,sort_order').order('sort_order').limit(3)
console.log('先頭3件:', JSON.stringify(sample))

if (uploadFailed > 0) {
  console.error('※ 画像アップロードに失敗があります。上のログを確認してください。')
  process.exit(1)
}
console.log('完了 ✅')
