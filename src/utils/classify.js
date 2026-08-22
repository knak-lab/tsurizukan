// scale: 図鑑カードのillust-wrap内で画像を拡大縮小する倍率。枠(illust-wrap)のサイズは共通のまま、
// 画像だけをclassに応じて拡大縮小することで、捕まえたサイズの迫力を表現する。
// illust-wrapは横長(約1.86:1)の箱だが魚画像は正方形キャンバスなので、object-fit:containで
// 高さ基準にフィットした後は縦方向が伸びやすい。1.85を超えるとマサバ等の口先や尾が枠外に
// 切れて消えることを実機確認済みなので、最大値は1.85を超えないようにする。
const CLASS_INFO = {
  baby: { key: "baby", label: "ベビー", emoji: "🐣", colorVar: "--baby", scale: 1.0 },
  kid: { key: "kid", label: "ひよっこ", emoji: "🐥", colorVar: "--kid", scale: 1.35 },
  adult: { key: "adult", label: "おとな", emoji: "🐟", colorVar: "--adult", scale: 1.6 },
  nushi: { key: "nushi", label: "ヌシ", emoji: "👑", colorVar: "--nushi", scale: 1.85 },
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
