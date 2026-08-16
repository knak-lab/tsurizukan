import { classInfo, sizePercent } from "../utils/classify"
import { isCaught, bestRecordFor } from "../utils/isCaught"

export default function FishDetailSheet({ fish, records, onClose }) {
  const caught = isCaught(fish.id, records)
  const best = caught ? bestRecordFor(fish.id, records) : null
  const ci = best ? classInfo(best.sizeClass) : null
  const pct = best ? sizePercent(best.size, fish.sizeMin, fish.sizeMax) : 0

  return (
    <div
      className="overlay show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sheet">
        <div className="sheet-head">
          <button type="button" className="close" onClick={onClose} aria-label="閉じる">
            <span className="close-icon">✕</span>
          </button>
          <div className="eyebrow">{fish.en}</div>
          <h2>{fish.name}</h2>
        </div>

        <div className="sheet-illust">
          <img
            className={caught ? "fish-illust" : "fish-illust fish-silhouette"}
            src={fish.illustration}
            alt={fish.name}
          />
        </div>

        <div className="class-strip">
          <div style={{ textAlign: "center", width: "100%" }}>
            {best ? (
              <>
                <div style={{ fontSize: 12, color: "var(--sub)", marginTop: 2 }}>
                  今回の記録: <b style={{ color: "var(--ink)" }}>{best.size}cm</b>（{ci.emoji} {ci.label}）
                </div>
                <div className="class-track">
                  <div className="marker" style={{ left: `${pct}%` }} />
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "var(--sub)", marginTop: 2 }}>まだ記録がありません</div>
            )}
            <div className="class-labels">
              <span>ベビー</span>
              <span>ひよっこ</span>
              <span>おとな</span>
              <span>ヌシ</span>
            </div>
          </div>
        </div>

        <div className="info-sections">
          <div className="info-block">
            <div className="label">
              <span className="dot" />
              特徴
            </div>
            <p>{fish.tokuchou || "（準備中）"}</p>
          </div>
          <div className="info-block">
            <div className="label">
              <span className="dot" />
              見分け方
            </div>
            <p>{fish.miwake || "（準備中）"}</p>
          </div>
          <div className="info-block">
            <div className="label">
              <span className="dot" />
              標準サイズ
            </div>
            <p>{fish.standard || "（準備中）"}</p>
          </div>
          <div className="info-block">
            <div className="label">
              <span className="dot" />
              釣り方
            </div>
            <p>{fish.tsurikata || "（準備中）"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
