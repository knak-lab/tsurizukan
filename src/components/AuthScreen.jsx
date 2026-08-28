import { useState } from "react"
import { useAuth } from "../context/AuthContext"

export default function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState("login") // "login" | "signup"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isSignup = mode === "signup"

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password || submitting) return
    setError(null)
    setInfo(null)
    setSubmitting(true)
    try {
      if (isSignup) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err.message || "エラーが発生しました")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword() {
    if (!email) {
      setError("パスワード再設定にはメールアドレスの入力が必要です")
      return
    }
    setError(null)
    setInfo(null)
    try {
      await resetPassword(email)
      setInfo("パスワード再設定用のメールを送信しました")
    } catch (err) {
      setError(err.message || "エラーが発生しました")
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
          <div className="auth-toggle">
            <button
              type="button"
              className={!isSignup ? "active" : ""}
              onClick={() => {
                setMode("login")
                setError(null)
                setInfo(null)
              }}
            >
              ログイン
            </button>
            <button
              type="button"
              className={isSignup ? "active" : ""}
              onClick={() => {
                setMode("signup")
                setError(null)
                setInfo(null)
              }}
            >
              新規登録
            </button>
          </div>

          <form className="record-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span className="form-label">メールアドレス</span>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className="form-field">
              <span className="form-label">パスワード</span>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={6}
                required
              />
            </label>

            {error && <div className="auth-error">{error}</div>}
            {info && <div className="auth-info">{info}</div>}

            <button type="submit" className="form-submit" disabled={submitting}>
              {isSignup ? "登録する" : "ログインする"}
            </button>
          </form>

          {!isSignup && (
            <button type="button" className="auth-link" onClick={handleResetPassword}>
              パスワードをお忘れですか？
            </button>
          )}
        </div>
      </div>
    </>
  )
}
