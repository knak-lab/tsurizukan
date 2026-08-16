import { classInfo } from "../utils/classify"
import { isCaught, bestRecordFor } from "../utils/isCaught"

export default function FishCard({ fish, records, onClick }) {
  const caught = isCaught(fish.id, records)
  const best = caught ? bestRecordFor(fish.id, records) : null
  const ci = best ? classInfo(best.sizeClass) : null

  return (
    <div className="fish-card" onClick={onClick}>
      {ci && (
        <div
          className={`class-badge ${ci.key === "nushi" ? "nushi" : ""}`}
          style={ci.key === "nushi" ? undefined : { background: `var(${ci.colorVar})` }}
        >
          {ci.emoji} {ci.label}
        </div>
      )}
      <div className="ribbon">
        {fish.name} <span className="en">({fish.en})</span>
      </div>
      <div className="illust-wrap">
        <img
          className={caught ? "fish-illust" : "fish-illust fish-silhouette"}
          src={fish.illustration}
          alt={fish.name}
        />
      </div>
      <div className="fish-meta">
        <div className="size-range">
          {fish.sizeMin}〜{fish.sizeMax}cm
        </div>
      </div>
    </div>
  )
}
