import { useState } from "react"
import { classInfo, sizePercent } from "../utils/classify"
import { isCaught, bestRecordFor } from "../utils/isCaught"
import { deleteRecord } from "../services/storage"
import AddRecordForm from "./AddRecordForm"

function formatDate(dateStr) {
  if (!dateStr) return ""
  return dateStr.replaceAll("-", "/")
}

export default function FishDetailSheet({ fish, records, onClose, onRecordSaved }) {
  const [editingRecord, setEditingRecord] = useState(null)
  const [showAddHere, setShowAddHere] = useState(false)

  const caught = isCaught(fish.id, records)
  const best = caught ? bestRecordFor(fish.id, records) : null
  const ci = best ? classInfo(best.sizeClass) : null
  const pct = best ? sizePercent(best.size, fish.sizeMin, fish.sizeMax) : 0

  const fishRecords = records
    .filter((r) => r.fishId === fish.id)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  function handleDelete(recordId) {
    if (!window.confirm("この記録を削除しますか？")) return
    deleteRecord(recordId)
    onRecordSaved()
  }

  return (
    <>
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
                    自己ベスト: <b style={{ color: "var(--ink)" }}>{best.size}cm</b>（{ci.emoji} {ci.label}）
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

          <div className="record-list-section">
            <div className="record-list-header">
              <div className="record-list-title">あなたの記録（{fishRecords.length}件）</div>
              <button type="button" className="record-add-button" onClick={() => setShowAddHere(true)}>
                ＋ 記録を追加
              </button>
            </div>
            {fishRecords.length === 0 ? (
              <div className="record-list-empty">まだ記録がありません</div>
            ) : (
              <ul className="record-list">
                {fishRecords.map((r) => {
                  const rci = classInfo(r.sizeClass)
                  return (
                    <li key={r.id} className="record-item">
                      <button type="button" className="record-item-main" onClick={() => setEditingRecord(r)}>
                        <span className="record-date">{formatDate(r.date)}</span>
                        <span className="record-size">{r.size}cm</span>
                        {rci && (
                          <span
                            className={`record-class-badge ${rci.key === "nushi" ? "nushi" : ""}`}
                            style={rci.key === "nushi" ? undefined : { background: `var(${rci.colorVar})` }}
                          >
                            {rci.emoji} {rci.label}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        className="record-delete"
                        onClick={() => handleDelete(r.id)}
                        aria-label="この記録を削除"
                      >
                        🗑️
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
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

      {editingRecord && (
        <AddRecordForm
          fish={fish}
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={() => {
            setEditingRecord(null)
            onRecordSaved()
          }}
        />
      )}

      {showAddHere && (
        <AddRecordForm
          fish={fish}
          onClose={() => setShowAddHere(false)}
          onSaved={(result) => {
            setShowAddHere(false)
            onRecordSaved(result)
          }}
        />
      )}
    </>
  )
}
