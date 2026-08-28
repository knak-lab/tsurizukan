import { useState } from "react"
import { useAuth } from "../context/AuthContext"

export default function NicknameSetupPrompt({ onClose }) {
  const { updateNickname } = useAuth()
  const [nickname, setNickname] = useState("")
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nickname.trim() || submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await updateNickname(nickname.trim())
      onClose()
    } catch (err) {
      setError(err.message || "エラーが発生しました")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="overlay show">
      <div className="sheet">
        <div className="sheet-head compact">
          <div className="eyebrow">WELCOME</div>
          <h2>ニックネームを設定</h2>
        </div>

        <form className="record-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span className="form-label">友人に表示される名前</span>
            <input
              type="text"
              className="form-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
              autoFocus
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="form-submit" disabled={submitting || !nickname.trim()}>
            決定
          </button>
          <button type="button" className="auth-link" onClick={onClose}>
            あとで設定する
          </button>
        </form>
      </div>
    </div>
  )
}
