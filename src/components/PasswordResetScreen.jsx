import { useState } from "react"
import { useAuth } from "../context/AuthContext"

// パスワードリセットメールのリンクから戻ってきたときに表示する、新しいパスワードの設定画面
export default function PasswordResetScreen() {
  const { updatePassword, cancelPasswordRecovery } = useAuth()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください")
      return
    }
    if (password !== confirm) {
      setError("確認用のパスワードが一致しません")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await updatePassword(password)
    } catch (err) {
      setError(err.message || "エラーが発生しました")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="app">
        <div className="eyebrow">TSURI ZUKAN</div>
        <h1>つりずかん</h1>
        <div className="wave" />
      </header>

      <div className="auth-screen">
        <div className="auth-card">
          <form className="record-form" onSubmit={handleSubmit}>
            <div className="form-label">新しいパスワードを設定</div>

            <label className="form-field">
              <span className="form-label">新しいパスワード</span>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>

            <label className="form-field">
              <span className="form-label">新しいパスワード（確認）</span>
              <input
                type="password"
                className="form-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="form-submit" disabled={submitting}>
              パスワードを変更する
            </button>
          </form>

          <button type="button" className="auth-link" onClick={cancelPasswordRecovery}>
            変更せずに図鑑へ進む
          </button>
        </div>
      </div>
    </>
  )
}
