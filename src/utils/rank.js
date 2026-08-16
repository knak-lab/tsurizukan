const RANKS = [
  { min: 0, max: 9, label: "見習い釣り師" },
  { min: 10, max: 24, label: "駆け出し釣り師" },
  { min: 25, max: 49, label: "中堅釣り師" },
  { min: 50, max: 74, label: "ベテラン釣り師" },
  { min: 75, max: 99, label: "達人釣り師" },
  { min: 100, max: 100, label: "伝説の釣り師" },
]

/**
 * 捕獲済み種数と全種数から、図鑑コンプ率(%)と称号を判定する。
 * 100%は全種捕獲時のみ（切り捨て計算のため、99%以下は「達人」止まり）。
 */
export function getCompletionRank(caughtCount, totalCount) {
  const pct = totalCount > 0 ? Math.floor((caughtCount / totalCount) * 100) : 0
  const rank = RANKS.find((r) => pct >= r.min && pct <= r.max) || RANKS[0]
  return { label: rank.label, pct, caughtCount, totalCount }
}
