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

// ひよっこ→おとな の境目を、標準サイズ帯(sizeMin〜sizeMax)の下から何割の位置に置くか。
// 0.4 なら「下限からレンジの40%まで」がひよっこ、そこから上限までがおとな。
const KID_ADULT_SPLIT = 0.4

/**
 * その魚の標準サイズ帯(sizeMin〜sizeMax)を基準にクラスを判定する。
 *  - sizeMin 未満      → baby (ベビー): その魚としては明らかに小さい
 *  - sizeMin 〜 split   → kid  (ひよっこ)
 *  - split 〜 sizeMax   → adult(おとな)
 *  - sizeMax 以上      → nushi(ヌシ): 標準サイズの上限に到達 or 超過
 * 例) sizeMin=25, sizeMax=50 なら -25 ベビー / 25-35 ひよっこ / 35-50 おとな / 50- ヌシ
 */
export function classifyBySize(size, sizeMin, sizeMax) {
  if (!(sizeMax > sizeMin)) return "baby"
  if (size < sizeMin) return "baby"
  if (size >= sizeMax) return "nushi"
  const split = sizeMin + (sizeMax - sizeMin) * KID_ADULT_SPLIT
  return size < split ? "kid" : "adult"
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
