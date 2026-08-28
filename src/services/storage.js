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
  const { data, error } = await supabase.from("profiles").select("id, nickname").eq("id", userId).single()
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
