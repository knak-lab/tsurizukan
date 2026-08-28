import { useMemo, useState } from "react"
import fishMaster from "../data/fishMaster"
import { classifyBySize } from "../utils/classify"
import { getRecords, saveRecord, updateRecord } from "../services/storage"
import { useAuth } from "../context/AuthContext"

function todayStr() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10)
}

/**
 * 釣果記録の追加・編集フォーム。
 * - 新規追加: fish/record を渡さない（魚種を検索して選ぶ）
 * - 記録編集: fish（対象魚種、変更不可）と record（既存の記録）を渡す
 */
export default function AddRecordForm({ fish: fixedFish, record, onClose, onSaved }) {
  const { user } = useAuth()
  const isEdit = Boolean(record)
  const [query, setQuery] = useState(fixedFish ? fixedFish.name : "")
  const [selectedId, setSelectedId] = useState(fixedFish ? fixedFish.id : "")
  const [size, setSize] = useState(record ? String(record.size) : "")
  const [date, setDate] = useState(record ? record.date : todayStr())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const selectedFish = fixedFish || fishMaster.find((f) => f.id === selectedId) || null

  const filtered = useMemo(() => {
    if (!query) return fishMaster
    const q = query.toLowerCase()
    return fishMaster.filter((f) => f.name.includes(query) || f.en.toLowerCase().includes(q))
  }, [query])

  function handlePick(fish) {
    setSelectedId(fish.id)
    setQuery(fish.name)
  }

  function handleQueryChange(e) {
    setQuery(e.target.value)
    setSelectedId("")
  }

  const canSave = Boolean(selectedFish) && Number(size) > 0 && Boolean(date) && !submitting

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSave) return
    setError(null)
    setSubmitting(true)
    const sizeClass = classifyBySize(Number(size), selectedFish.sizeMin, selectedFish.sizeMax)

    try {
      if (isEdit) {
        await updateRecord(record.id, { size: Number(size), sizeClass, date })
        onSaved(null)
        return
      }

      // 新規記録の場合のみ、初捕獲/自己ベスト更新を判定する（編集による上書きは対象外）
      const existingRecords = (await getRecords(user.id)).filter((r) => r.fishId === selectedFish.id)
      await saveRecord({ fishId: selectedFish.id, size: Number(size), sizeClass, date })

      if (existingRecords.length === 0) {
        onSaved({ type: "first-catch", fish: selectedFish })
      } else if (Number(size) > Math.max(...existingRecords.map((r) => r.size))) {
        onSaved({ type: "best-update", fish: selectedFish, size: Number(size) })
      } else {
        onSaved(null)
      }
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
            <span className="form-label">魚種</span>
            {fixedFish ? (
              <div className="form-input form-input-locked">{fixedFish.name}</div>
            ) : (
              <>
                <input
                  type="text"
                  className="form-input"
                  placeholder="魚の名前で検索"
                  value={query}
                  onChange={handleQueryChange}
                  autoComplete="off"
                />
                {query && !selectedFish && (
                  <div className="fish-suggest">
                    {filtered.length === 0 ? (
                      <div className="fish-suggest-empty">該当する魚が見つかりません</div>
                    ) : (
                      filtered.slice(0, 30).map((f) => (
                        <div key={f.id} className="fish-suggest-item" onClick={() => handlePick(f)}>
                          {f.name} <span className="en">({f.en})</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </label>

          <label className="form-field">
            <span className="form-label">サイズ (cm)</span>
            <input
              type="number"
              className="form-input"
              min="0"
              step="0.1"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder={selectedFish ? `${selectedFish.sizeMin}〜${selectedFish.sizeMax}` : ""}
            />
          </label>

          <label className="form-field">
            <span className="form-label">日付</span>
            <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="form-submit" disabled={!canSave}>
            {submitting ? "送信中..." : isEdit ? "更新する" : "保存する"}
          </button>
        </form>
      </div>
    </div>
  )
}
