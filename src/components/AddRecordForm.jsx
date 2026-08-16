import { useMemo, useState } from "react"
import fishMaster from "../data/fishMaster"
import { classifyBySize } from "../utils/classify"
import { saveRecord } from "../services/storage"

function todayStr() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10)
}

export default function AddRecordForm({ onClose, onSaved }) {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState("")
  const [size, setSize] = useState("")
  const [date, setDate] = useState(todayStr())

  const selectedFish = fishMaster.find((f) => f.id === selectedId) || null

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

  const canSave = Boolean(selectedFish) && Number(size) > 0 && Boolean(date)

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSave) return
    const sizeClass = classifyBySize(Number(size), selectedFish.sizeMin, selectedFish.sizeMax)
    saveRecord({ fishId: selectedFish.id, size: Number(size), sizeClass, date })
    onSaved()
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
          <div className="eyebrow">NEW RECORD</div>
          <h2>釣果を記録する</h2>
        </div>

        <form className="record-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span className="form-label">魚種</span>
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

          <button type="submit" className="form-submit" disabled={!canSave}>
            保存する
          </button>
        </form>
      </div>
    </div>
  )
}
