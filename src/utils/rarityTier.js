/** fishMasterのrarity(1-5)を3段階の表示ラベルに変換する */
export function getRarityTier(rarity) {
  if (rarity >= 4) return "幻"
  if (rarity === 3) return "レア"
  return "定番"
}

/** レアリティバッジの配色を切り替えるためのCSSクラス名 */
export function getRarityTierClass(rarity) {
  if (rarity >= 4) return "tier-legend"
  if (rarity === 3) return "tier-rare"
  return "tier-common"
}
