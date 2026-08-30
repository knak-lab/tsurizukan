import { supabase } from "./supabaseClient"

const LEGACY_RECORDS_KEY = "tsurizukan:records"
const LEGACY_IMPORT_DONE_KEY = "tsurizukan:migrated"

function fromDbRecord(row) {
  return {
    id: row.id,
    fishId: row.fish_id,
    size: row.size,
    sizeClass: row.size_class,
    date: row.date,
  }
}

/** camelCaseの部分パッチをsnake_caseに変換する。渡されたキーだけを含める */
function toDbPatch(patch) {
  const dbPatch = {}
  if ("fishId" in patch) dbPatch.fish_id = patch.fishId
  if ("size" in patch) dbPatch.size = patch.size
  if ("sizeClass" in patch) dbPatch.size_class = patch.sizeClass
  if ("date" in patch) dbPatch.date = patch.date
  return dbPatch
}

/** 指定ユーザーの記録一覧を取得する（新しい日付順） */
export async function getRecords(userId) {
  const { data, error } = await supabase
    .from("records")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
  if (error) throw error
  return data.map(fromDbRecord)
}

/** 記録を1件追加する。{ fishId, size, sizeClass, date } を渡す（idとuser_idは自動付与） */
export async function saveRecord(record) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from("records")
    .insert({ ...toDbPatch(record), user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return fromDbRecord(data)
}

/** 記録を1件削除する */
export async function deleteRecord(recordId) {
  const { error } = await supabase.from("records").delete().eq("id", recordId)
  if (error) throw error
}

/** 記録を1件更新する。patchで渡したフィールドだけ上書きする */
export async function updateRecord(recordId, patch) {
  const { data, error } = await supabase
    .from("records")
    .update(toDbPatch(patch))
    .eq("id", recordId)
    .select()
    .single()
  if (error) throw error
  return fromDbRecord(data)
}

/** 全ユーザーのプロフィール一覧を取得する（「誰の図鑑を見るか」選択用） */
export async function listProfiles() {
  const { data, error } = await supabase.from("profiles").select("id, nickname").order("nickname")
  if (error) throw error
  return data
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nickname, is_admin")
    .eq("id", userId)
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(userId, nickname) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ nickname })
    .eq("id", userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ============================================================
// fish: 魚種マスタ（Supabaseの fish テーブル）
// ============================================================

const FISH_IMAGE_BUCKET = "fish-images"

/** DB行(snake_case)を、アプリ内で使う魚種オブジェクト(camelCase + illustration URL)に変換する */
function fromDbFish(row) {
  return {
    id: row.id,
    name: row.name,
    en: row.en,
    tax: row.tax,
    env: row.env,
    rarity: row.rarity,
    sizeMin: Number(row.size_min),
    sizeMax: Number(row.size_max),
    imagePath: row.image_path,
    illustration: row.image_path
      ? supabase.storage.from(FISH_IMAGE_BUCKET).getPublicUrl(row.image_path).data.publicUrl
      : "",
    tokuchou: row.tokuchou ?? "",
    miwake: row.miwake ?? "",
    standard: row.standard ?? "",
    tsurikata: row.tsurikata ?? "",
    seriesId: row.series_id,
    seriesStage: row.series_stage,
    sortOrder: row.sort_order,
  }
}

/** camelCaseの部分パッチをsnake_caseに変換する。渡されたキーだけを含める */
function toDbFish(patch) {
  const out = {}
  if ("id" in patch) out.id = patch.id
  if ("name" in patch) out.name = patch.name
  if ("en" in patch) out.en = patch.en
  if ("tax" in patch) out.tax = patch.tax
  if ("env" in patch) out.env = patch.env
  if ("rarity" in patch) out.rarity = patch.rarity
  if ("sizeMin" in patch) out.size_min = patch.sizeMin
  if ("sizeMax" in patch) out.size_max = patch.sizeMax
  if ("imagePath" in patch) out.image_path = patch.imagePath
  if ("tokuchou" in patch) out.tokuchou = patch.tokuchou || null
  if ("miwake" in patch) out.miwake = patch.miwake || null
  if ("standard" in patch) out.standard = patch.standard || null
  if ("tsurikata" in patch) out.tsurikata = patch.tsurikata || null
  if ("seriesId" in patch) out.series_id = patch.seriesId || null
  if ("seriesStage" in patch) out.series_stage = patch.seriesStage ?? null
  if ("sortOrder" in patch) out.sort_order = patch.sortOrder
  return out
}

/** 魚種マスタ全件を表示順で取得する */
export async function getFishMaster() {
  const { data, error } = await supabase.from("fish").select("*").order("sort_order")
  if (error) throw error
  return data.map(fromDbFish)
}

/** 魚種を1件追加する（管理者のみ。RLSで保護） */
export async function createFish(fish) {
  const { data, error } = await supabase.from("fish").insert(toDbFish(fish)).select().single()
  if (error) throw error
  return fromDbFish(data)
}

/** 魚種を1件更新する。patchで渡したフィールドだけ上書きする（管理者のみ） */
export async function updateFish(fishId, patch) {
  const { data, error } = await supabase
    .from("fish")
    .update(toDbFish(patch))
    .eq("id", fishId)
    .select()
    .single()
  if (error) throw error
  return fromDbFish(data)
}

/** 魚種を1件削除する（管理者のみ）。参照している records は孤立する（カード非表示になるだけ） */
export async function deleteFish(fishId) {
  const { error } = await supabase.from("fish").delete().eq("id", fishId)
  if (error) throw error
}

/** その魚種を参照している釣果記録の件数（削除前の警告用。管理者に見える範囲でのカウント） */
export async function countRecordsForFish(fishId) {
  const { count, error } = await supabase
    .from("records")
    .select("*", { count: "exact", head: true })
    .eq("fish_id", fishId)
  if (error) throw error
  return count ?? 0
}

/** 魚画像をアップロードする。filename はバケット内のパス（例: "042_ウツボ.png"）。管理者のみ */
export async function uploadFishImage(file, filename) {
  const { error } = await supabase.storage
    .from(FISH_IMAGE_BUCKET)
    .upload(filename, file, { contentType: file.type || "image/png", upsert: true })
  if (error) throw error
  return filename
}

/** 魚画像を削除する（管理者のみ） */
export async function deleteFishImage(filename) {
  if (!filename) return
  const { error } = await supabase.storage.from(FISH_IMAGE_BUCKET).remove([filename])
  if (error) throw error
}

// ============================================================
// 旧localStorageデータ（Supabase移行前の記録）を一度だけ取り込む
// ============================================================

function getLegacyLocalRecords() {
  try {
    const raw = localStorage.getItem(LEGACY_RECORDS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function hasPendingLegacyImport() {
  return getLegacyLocalRecords().length > 0 && !localStorage.getItem(LEGACY_IMPORT_DONE_KEY)
}

export async function importLegacyRecords() {
  const legacy = getLegacyLocalRecords()
  if (legacy.length === 0) {
    localStorage.setItem(LEGACY_IMPORT_DONE_KEY, "1")
    return { imported: 0 }
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const rows = legacy.map((r) => ({ ...toDbPatch(r), user_id: user.id }))
  const { error } = await supabase.from("records").insert(rows)
  if (error) throw error
  localStorage.setItem(LEGACY_IMPORT_DONE_KEY, "1")
  return { imported: rows.length }
}
