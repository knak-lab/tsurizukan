// 魚種の検索・重複判定。和名・英名に加えて別名（地方名など）も対象にする。
// ひらがな/カタカナ・大文字/小文字・前後の空白の違いは区別しない（「ままかり」でも「ママカリ」に当たる）。

/** 比較用に正規化する: 前後空白除去・小文字化・ひらがな→カタカナ */
export function normalizeName(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
}

/**
 * 魚が検索語に当たるか。当たらなければ null、当たれば { alias }。
 * 和名・英名(・id)で当たったときは alias=null、別名だけで当たったときはその別名を返す（候補表示用）。
 */
export function matchFish(fish, query, { includeId = false } = {}) {
  const q = normalizeName(query)
  if (!q) return { alias: null }
  if (normalizeName(fish.name).includes(q)) return { alias: null }
  if (normalizeName(fish.en).includes(q)) return { alias: null }
  if (includeId && String(fish.id).toLowerCase().includes(q)) return { alias: null }
  const alias = (fish.aliases || []).find((a) => normalizeName(a).includes(q))
  return alias ? { alias } : null
}

/** 検索語に当たる魚の一覧 [{ fish, alias }]。和名などで当たったものを先、別名だけで当たったものを後に並べる */
export function searchFish(fishMaster, query, options) {
  const direct = []
  const byAlias = []
  for (const fish of fishMaster) {
    const m = matchFish(fish, query, options)
    if (!m) continue
    ;(m.alias ? byAlias : direct).push({ fish, alias: m.alias })
  }
  return [...direct, ...byAlias]
}

/** 名前が和名か別名と完全一致する魚を探す（重複登録の防止用）。無ければ null、あれば { fish, viaAlias } */
export function findByExactName(fishMaster, name) {
  const n = normalizeName(name)
  if (!n) return null
  for (const fish of fishMaster) {
    if (normalizeName(fish.name) === n) return { fish, viaAlias: false }
  }
  for (const fish of fishMaster) {
    if ((fish.aliases || []).some((a) => normalizeName(a) === n)) return { fish, viaAlias: true }
  }
  return null
}

/** 管理画面の入力欄（「ママカリ、ハラカリ」など）を別名の配列にする */
export function parseAliases(text) {
  const seen = new Set()
  const out = []
  for (const raw of String(text ?? "").split(/[、,，/／\n]+/)) {
    const a = raw.trim()
    if (!a || seen.has(normalizeName(a))) continue
    seen.add(normalizeName(a))
    out.push(a)
  }
  return out
}
