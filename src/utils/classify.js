const CLASS_INFO = {
  baby: { key: "baby", label: "ベビー", emoji: "🐣", colorVar: "--baby" },
  kid: { key: "kid", label: "ひよっこ", emoji: "🐥", colorVar: "--kid" },
  adult: { key: "adult", label: "おとな", emoji: "🐟", colorVar: "--adult" },
  nushi: { key: "nushi", label: "ヌシ", emoji: "👑", colorVar: "--nushi" },
}

export const CLASS_ORDER = ["baby", "kid", "adult", "nushi"]

/** sizeMin〜sizeMaxの範囲を4等分し、sizeがどのクラスに入るかを判定する */
export function classifyBySize(size, sizeMin, sizeMax) {
  const pct = sizePercent(size, sizeMin, sizeMax)
  if (pct < 25) return "baby"
  if (pct < 50) return "kid"
  if (pct < 75) return "adult"
  return "nushi"
}

export function classInfo(classKey) {
  return CLASS_INFO[classKey]
}

/** sizeMin〜sizeMaxの範囲内でsizeが何%の位置かを0〜100に収めて返す */
export function sizePercent(size, sizeMin, sizeMax) {
  if (sizeMax <= sizeMin) return 0
  const pct = ((size - sizeMin) / (sizeMax - sizeMin)) * 100
  return Math.min(100, Math.max(0, pct))
}
