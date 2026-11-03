import { useState } from "react"
import { submitFish } from "../services/storage"

const ENV_OPTIONS = [
  { value: "salt", label: "海水" },
  { value: "brackish", label: "汽水" },
  { value: "fresh", label: "淡水" },
]
const TAX_OPTIONS = [
  { value: "fish", label: "魚類" },
  { value: "cephalo", label: "イカ・タコ" },
  { value: "crust", label: "エビ・カニ" },
]

/**
 * 一般ユーザー向け: 図鑑にない魚種を登録するフォーム。
 * 登録直後は仮画像で図鑑に並び、管理者に通知が届いて画像などが整備される。
 */
export default function NewFishForm({ initialName = "", fishMaster, onClose, onSaved }) {
  const [name, setName] = useState(initialName)
  const [en, setEn] = useState("")
  const [env, setEnv] = useState("salt")
  const [tax, setTax] = useState("fish")
  const [sizeMin, setSizeMin] = useState("")
  const [sizeMax, setSizeMax] = useState("")
  const [memo, setMemo] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const trimmed = name.trim()
  const duplicate = trimmed ? fishMaster.find((f) => f.name === trimmed) : null

  function validate() {
    if (!trimmed) return "魚の名前を入力してください"
    if (trimmed.length > 30) return "魚の名前は30文字以内にしてください"
    if (duplicate) return `「${trimmed}」はすでに図鑑にあります`
    const min = Number(sizeMin)
    const max = Number(sizeMax)
    if (!(min > 0)) return "よく釣れるサイズの下限を入力してください"
    if (!(max > min)) return "サイズの上限は下限より大きくしてください"
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setError(null)
    setBusy(true)
    try {
      const fish = await submitFish({
        name: trimmed,
        en,
        env,
        tax,
        sizeMin: Number(sizeMin),
        sizeMax: Number(sizeMax),
        memo,
      })
      onSaved(fish)
    } catch (err) {
      setError(err.message || "登録に失敗しました")
      setBusy(false)
    }
  }

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-head compact">
          <button type="button" className="close" onClick={onClose} aria-label="閉じる">
            <span className="close-icon">✕</span>
          </button>
          <div className="eyebrow">NEW FISH</div>
          <h2>図鑑に魚を登録する</h2>
        </div>

        <form className="record-form" onSubmit={handleSubmit}>
          <p className="form-note">
            図鑑にない魚を追加できます。登録するとすぐ図鑑に並び、イラストや解説はあとから管理人が用意します。
          </p>

          <label className="form-field">
            <span className="form-label">魚の名前（和名）</span>
            <input
              className="form-input"
              value={name}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ハオコゼ"
              autoComplete="off"
            />
            {duplicate && <span className="form-note warn">「{duplicate.name}」はすでに図鑑にあります</span>}
          </label>

          <label className="form-field">
            <span className="form-label">英名（わかれば）</span>
            <input className="form-input" value={en} onChange={(e) => setEn(e.target.value)} autoComplete="off" />
          </label>

          <div className="admin-form-grid">
            <label className="form-field">
              <span className="form-label">釣れる場所</span>
              <select className="form-input" value={env} onChange={(e) => setEnv(e.target.value)}>
                {ENV_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">なかま</span>
              <select className="form-input" value={tax} onChange={(e) => setTax(e.target.value)}>
                {TAX_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">よく釣れるサイズ 下限 (cm)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                className="form-input"
                value={sizeMin}
                onChange={(e) => setSizeMin(e.target.value)}
              />
            </label>
            <label className="form-field">
              <span className="form-label">上限 (cm)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                className="form-input"
                value={sizeMax}
                onChange={(e) => setSizeMax(e.target.value)}
              />
            </label>
          </div>

          <label className="form-field">
            <span className="form-label">メモ（任意・特徴や釣れた場所など）</span>
            <textarea
              className="form-input admin-textarea"
              rows={3}
              maxLength={300}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="form-submit" disabled={busy || !trimmed}>
            {busy ? "登録中..." : "図鑑に登録する"}
          </button>
        </form>
      </div>
    </div>
  )
}
