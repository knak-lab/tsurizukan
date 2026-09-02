import { supabase } from "./supabaseClient"

// ステータス4値と表示メタ（バッジのラベル・色クラスは index.css の .fr-status-* に対応）
export const FR_STATUS_ORDER = ["new", "reviewing", "planned", "done"]
export const FR_STATUS = {
  new: { label: "新規", cls: "fr-status-new" },
  reviewing: { label: "検討中", cls: "fr-status-reviewing" },
  planned: { label: "予定", cls: "fr-status-planned" },
  done: { label: "対応済", cls: "fr-status-done" },
}

// profiles へのFK経路が2つ（直接 user_id と votes 経由）あるため、明示的にFK名で曖昧さを解消する
const SELECT =
  "*, author:profiles!feature_requests_user_id_fkey(nickname), feature_request_votes(user_id)"

function fromDb(row, myUserId) {
  const votes = row.feature_request_votes || []
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body || "",
    status: row.status,
    createdAt: row.created_at,
    authorNickname: row.author?.nickname || "名無し",
    voteCount: votes.length,
    votedByMe: myUserId ? votes.some((v) => v.user_id === myUserId) : false,
  }
}

/** 要望一覧を取得する。sort = "popular"（いいね数の多い順）| "new"（新着順） */
export async function listFeatureRequests(sort = "popular") {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from("feature_requests")
    .select(SELECT)
    .order("created_at", { ascending: false })
  if (error) throw error
  const list = data.map((row) => fromDb(row, user?.id))
  if (sort === "popular") {
    list.sort((a, b) => b.voteCount - a.voteCount || (a.createdAt < b.createdAt ? 1 : -1))
  }
  return list
}

/** 要望を1件投稿する。{ title, body } を渡す（id と user_id は自動付与） */
export async function createFeatureRequest({ title, body }) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from("feature_requests")
    .insert({ user_id: user.id, title: title.trim(), body: body?.trim() || null })
    .select(SELECT)
    .single()
  if (error) throw error
  return fromDb(data, user.id)
}

/** いいねをトグルする。voted は「今押している状態か」 */
export async function toggleVote(requestId, voted) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (voted) {
    const { error } = await supabase
      .from("feature_request_votes")
      .delete()
      .match({ request_id: requestId, user_id: user.id })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from("feature_request_votes")
      .insert({ request_id: requestId, user_id: user.id })
    if (error) throw error
  }
}

/** ステータスを変更する（管理者のみ。RLSで保護） */
export async function updateFeatureRequestStatus(id, status) {
  const { error } = await supabase.from("feature_requests").update({ status }).eq("id", id)
  if (error) throw error
}
