import { classInfo, classifyBySize } from "../utils/classify"
import { isCaught, bestRecordFor, totalCountFor } from "../utils/isCaught"
import { getRarityTier, getRarityTierClass } from "../utils/rarityTier"

export default function FishCard({ fish, records, onClick }) {
  const caught = isCaught(fish.id, records)
  const best = caught ? bestRecordFor(fish.id, records) : null
  // 記録保存時の sizeClass ではなく、その魚の現在のサイズ帯から都度判定する
  // (判定基準の変更や管理画面でのサイズ帯編集を、過去の記録にも即反映させるため)
  const ci = best ? classInfo(classifyBySize(best.size, fish.sizeMin, fish.sizeMax)) : null

  return (
    <div className="fish-card" onClick={onClick}>
      <div className={`rarity-badge ${getRarityTierClass(fish.rarity)}`}>{getRarityTier(fish.rarity)}</div>
      <div className="ribbon">
        <span className="name">{fish.name}</span>
        {fish.aliases?.length > 0 && <span className="alias">{fish.aliases.join("・")}</span>}
        {fish.en && <span className="en">{fish.en}</span>}
      </div>
      <div className="illust-wrap">
        {ci && (
          <div
            className={`class-badge ${ci.key === "nushi" ? "nushi" : ""}`}
            style={ci.key === "nushi" ? undefined : { background: `var(${ci.colorVar})` }}
          >
            {ci.emoji} {ci.label}
          </div>
        )}
        <img
          className={caught ? "fish-illust" : "fish-illust fish-silhouette"}
          src={fish.illustration}
          alt={fish.name}
          style={caught && ci ? { transform: `scale(${ci.scale})` } : undefined}
        />
      </div>
      <div className="fish-meta">
        {/* 標準サイズ帯ではなく、この図鑑の持ち主が釣った最大サイズを出す（標準サイズ帯は詳細シートで見られる） */}
        {best ? (
          <div className="best-size">
            最大 <b>{best.size}cm</b>
            <span className="catch-total">・{totalCountFor(fish.id, records)}匹</span>
          </div>
        ) : (
          <div className="size-range">未捕獲</div>
        )}
      </div>
    </div>
  )
}
