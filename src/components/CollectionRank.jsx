import fishMaster from "../data/fishMaster"
import { getCompletionRank } from "../utils/rank"

export default function CollectionRank({ records }) {
  const fishIds = new Set(fishMaster.map((f) => f.id))
  const caughtIds = new Set(records.filter((r) => fishIds.has(r.fishId)).map((r) => r.fishId))
  const totalCount = fishMaster.length
  const { label, pct } = getCompletionRank(caughtIds.size, totalCount)

  return (
    <div className="collection-rank">
      <span className="collection-rank-label">{label}</span>
      <span className="collection-rank-progress">
        {caughtIds.size}/{totalCount}種（{pct}%）
      </span>
    </div>
  )
}
