import { useMemo, useState } from "react"
import { classifyBySize } from "../utils/classify"
import { getRecords, saveRecords, updateRecord } from "../services/storage"
import { useAuth } from "../context/AuthContext"
import { useFishMaster } from "../context/FishMasterContext"
import NewFishForm from "./NewFishForm"

function todayStr() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10)
}

let rowSeq = 0
function newRow(fish = null, record = null) {
  rowSeq += 1
  return {
    key: rowSeq,
    fishId: fish ? fish.id : "",
    query: fish ? fish.name : "",
    locked: Boolean(fish),
    size: record ? String(record.size) : "",
    count: record ? String(record.count ?? 1) : "1",
  }
}

function isRowValid(row) {
  return Boolean(row.fishId) && Number(row.size) > 0 && Number.isInteger(Number(row.count)) && Number(row.count) >= 1
}

/** 魚種1つ分の入力行（魚種・最大サイズ・匹数） */
function CatchRow({ row, index, showIndex, removable, canAddFish, fishMaster, findFish, onChange, onRemove, onRequestNewFish }) {
  const selectedFish = findFish(row.fishId)

  const filtered = useMemo(() => {
    if (!row.query) return fishMaster
    const q = row.query.toLowerCase()
    return fishMaster.filter((f) => f.name.includes(row.query) || f.en.toLowerCase().includes(q))
  }, [row.query, fishMaster])

  const count = Number(row.count) || 0

  return (
    <div className="catch-row">
      {(showIndex || removable) && (
        <div className="catch-row-head">
          <span className="catch-row-index">{showIndex ? `魚種 ${index + 1}` : ""}</span>
          {removable && (
            <button type="button" className="catch-row-remove" onClick={onRemove} aria-label="この魚種を外す">
              ✕
            </button>
          )}
        </div>
      )}

      <label className="form-field">
        <span className="form-label">魚種</span>
        {row.locked ? (
          <div className="form-input form-input-locked">{row.query}</div>
        ) : (
          <>
            <input
              type="text"
              className="form-input"
              placeholder="魚の名前で検索"
              value={row.query}
              onChange={(e) => onChange({ query: e.target.value, fishId: "" })}
              autoComplete="off"
            />
            {row.query && !selectedFish && (
              <div className="fish-suggest">
                {filtered.length === 0 ? (
                  <div className="fish-suggest-empty">
                    該当する魚が見つかりません
                    <button type="button" className="fish-suggest-add" onClick={onRequestNewFish}>
                      ＋「{row.query.trim()}」を図鑑に登録する
                    </button>
                  </div>
                ) : (
                  filtered.slice(0, 30).map((f) => (
                    <div
                      key={f.id}
                      className="fish-suggest-item"
                      onClick={() => onChange({ fishId: f.id, query: f.name })}
                    >
                      {f.name} <span className="en">({f.en})</span>
                    </div>
                  ))
                )}
              </div>
            )}
            {canAddFish && (
              <button type="button" className="auth-link form-inline-link" onClick={onRequestNewFish}>
                図鑑にない魚を登録する
              </button>
            )}
          </>
        )}
        {selectedFish?.needsReview && (
          <span className="form-note">この魚は登録したばかりです。イラストは準備中です。</span>
        )}
      </label>

      <div className="catch-row-numbers">
        <label className="form-field">
          <span className="form-label">最大サイズ (cm)</span>
          <input
            type="number"
            className="form-input"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={row.size}
            onChange={(e) => onChange({ size: e.target.value })}
            placeholder={selectedFish?.sizeMin != null ? `${selectedFish.sizeMin}〜${selectedFish.sizeMax}` : ""}
          />
        </label>

        <div className="form-field">
          <span className="form-label">数 (匹)</span>
          <div className="count-stepper">
            <button
              type="button"
              className="count-step"
              disabled={count <= 1}
              onClick={() => onChange({ count: String(Math.max(1, count - 1)) })}
              aria-label="1匹減らす"
            >
              −
            </button>
            <input
              type="number"
              className="form-input count-input"
              min="1"
              step="1"
              inputMode="numeric"
              value={row.count}
              onChange={(e) => onChange({ count: e.target.value })}
            />
            <button
              type="button"
              className="count-step"
              onClick={() => onChange({ count: String(count + 1) })}
              aria-label="1匹増やす"
            >
              ＋
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 釣果記録の追加・編集フォーム。
 * - 新規追加: fish/record を渡さない（魚種を検索して選ぶ）。「＋ 魚種を追加」で複数魚種をまとめて記録できる
 * - 魚の詳細から新規追加: fish だけ渡す（1行目がその魚で固定。他の魚種も追加できる）
 * - 記録編集: fish（対象魚種、変更不可）と record（既存の記録）を渡す。1件だけ編集
 *
 * onSaved には、新規追加時は演出用イベントの配列（初捕獲/自己ベスト更新）、編集時は null を渡す。
 */
export default function AddRecordForm({ fish: fixedFish, record, onClose, onSaved }) {
  const { user } = useAuth()
  const { fishMaster, reload: reloadFish } = useFishMaster()
  const isEdit = Boolean(record)
  const [rows, setRows] = useState(() => [newRow(fixedFish, record)])
  const [date, setDate] = useState(record ? record.date : todayStr())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  // 「図鑑にない魚を登録する」を開いた行の key
  const [newFishRowKey, setNewFishRowKey] = useState(null)
  // 登録直後は図鑑の再読込が終わるまで fishMaster に居ないので、ここで保持しておく
  const [addedFish, setAddedFish] = useState([])

  function findFish(id) {
    if (!id) return null
    if (fixedFish && fixedFish.id === id) return fixedFish
    return fishMaster.find((f) => f.id === id) || addedFish.find((f) => f.id === id) || null
  }

  function handleFishAdded(fish) {
    setAddedFish((prev) => [...prev, fish])
    updateRow(newFishRowKey, { fishId: fish.id, query: fish.name })
    setNewFishRowKey(null)
    reloadFish()
  }

  function updateRow(key, patch) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRow(key) {
    setRows((prev) => prev.filter((r) => r.key !== key))
  }

  const canSave = rows.length > 0 && rows.every(isRowValid) && Boolean(date) && !submitting
  const totalCount = rows.reduce((sum, r) => sum + (Number(r.count) || 0), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSave) return
    setError(null)
    setSubmitting(true)

    const items = rows.map((r) => {
      const fish = findFish(r.fishId)
      const size = Number(r.size)
      return {
        fish,
        record: {
          fishId: fish.id,
          size,
          count: Number(r.count),
          // サイズ帯が未設定の魚種は仮に "adult" で保存する（表示時は都度判定し直すので、整備後に正しいクラスになる）
          sizeClass: classifyBySize(size, fish.sizeMin, fish.sizeMax) ?? "adult",
          date,
        },
      }
    })

    try {
      if (isEdit) {
        const { size, count, sizeClass } = items[0].record
        await updateRecord(record.id, { size, count, sizeClass, date })
        onSaved(null)
        return
      }

      // 新規記録の場合のみ、初捕獲/自己ベスト更新を判定する（編集による上書きは対象外）。
      // 同じ魚種が複数行あっても演出は魚種ごとに1回にまとめる。
      const existing = await getRecords(user.id)
      await saveRecords(items.map((it) => it.record))

      const events = []
      const seen = new Set()
      for (const { fish } of items) {
        if (seen.has(fish.id)) continue
        seen.add(fish.id)
        const prev = existing.filter((r) => r.fishId === fish.id)
        const newBest = Math.max(...items.filter((it) => it.fish.id === fish.id).map((it) => it.record.size))
        if (prev.length === 0) {
          events.push({ type: "first-catch", fish })
        } else if (newBest > Math.max(...prev.map((r) => r.size))) {
          events.push({ type: "best-update", fish, size: newBest })
        }
      }
      onSaved(events)
    } catch (err) {
      setError(err.message || "保存に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="overlay show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sheet">
        <div className="sheet-head compact">
          <button type="button" className="close" onClick={onClose} aria-label="閉じる">
            <span className="close-icon">✕</span>
          </button>
          <div className="eyebrow">{isEdit ? "EDIT RECORD" : "NEW RECORD"}</div>
          <h2>{isEdit ? "記録を編集する" : "釣果を記録する"}</h2>
        </div>

        <form className="record-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span className="form-label">日付</span>
            <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          {rows.map((row, i) => (
            <CatchRow
              key={row.key}
              row={row}
              index={i}
              showIndex={rows.length > 1}
              removable={!isEdit && rows.length > 1}
              canAddFish={!isEdit}
              fishMaster={fishMaster}
              findFish={findFish}
              onChange={(patch) => updateRow(row.key, patch)}
              onRemove={() => removeRow(row.key)}
              onRequestNewFish={() => setNewFishRowKey(row.key)}
            />
          ))}

          {!isEdit && (
            <button type="button" className="catch-row-add" onClick={() => setRows((prev) => [...prev, newRow()])}>
              ＋ 魚種を追加
            </button>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="form-submit" disabled={!canSave}>
            {submitting
              ? "送信中..."
              : isEdit
                ? "更新する"
                : rows.length > 1
                  ? `${rows.length}種・${totalCount}匹を保存する`
                  : "保存する"}
          </button>
        </form>
      </div>

      {newFishRowKey != null && (
        <NewFishForm
          initialName={(rows.find((r) => r.key === newFishRowKey)?.query || "").trim()}
          fishMaster={fishMaster}
          onClose={() => setNewFishRowKey(null)}
          onSaved={handleFishAdded}
        />
      )}
    </div>
  )
}
