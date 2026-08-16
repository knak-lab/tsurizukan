import { Fragment } from "react"
import { isCaught } from "../utils/isCaught"

export default function SeriesCard({ members, records, onSelect }) {
  return (
    <div className="series-card">
      {members.map((fish, i) => (
        <Fragment key={fish.id}>
          <button type="button" className="series-stage" onClick={() => onSelect(fish)}>
            <div className="series-stage-illust">
              <img
                className={isCaught(fish.id, records) ? "fish-illust" : "fish-illust fish-silhouette"}
                src={fish.illustration}
                alt={fish.name}
              />
            </div>
            <div className="series-stage-name">{fish.name}</div>
          </button>
          {i < members.length - 1 && <span className="series-arrow">→</span>}
        </Fragment>
      ))}
    </div>
  )
}
