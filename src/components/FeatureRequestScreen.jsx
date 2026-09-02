import { useEffect, useState } from "react"
import { listFeatureRequests, createFeatureRequest, toggleVote, FR_STATUS } from "../services/featureRequests"

const TITLE_MAX = 60

export default function FeatureRequestScreen({ onClose }) {
  const [sort, setSort] = useState("popular")
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [pendingVote, setPendingVote] = useState(null)

  async function load(nextSort = sort) {
    setLoading(true)
    setError(null)
    try {
      setList(await listFeatureRequests(nextSort))
    } catch (err) {
      setError(err.message || "読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(sort)
  }, [sort])

  async function handleVote(req) {
    if (pendingVote) return
    setPendingVote(req.id)
    setList((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? { ...r, votedByMe: !r.votedByMe, voteCount: r.voteCount + (r.votedByMe ? -1 : 1) }
          : r,
      ),
    )
    try {
      await toggleVote(req.id, req.votedByMe)
    } catch {
      setList((prev) =>
        prev.map((r) =>
          r.id === req.id ? { ...r, votedByMe: req.votedByMe, voteCount: req.voteCount } : r,
        ),
      )
    } finally {
      setPendingVote(null)
    }
  }

  return (
    <>
      <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="sheet">
          <div className="sheet-head compact">
            <button type="button" className="close" onClick={onClose} aria-label="閉じる">
              <span className="close-icon">✕</span>
            </button>
            <div className="eyebrow">REQUESTS</div>
            <h2>要望掲示板</h2>
          </div>

          <div className="fr-body">
            <div className="fr-sort">
              <button
                type="button"
                className={sort === "popular" ? "active" : ""}
                onClick={() => setSort("popular")}
              >
                人気順
              </button>
              <button
                type="button"
                className={sort === "new" ? "active" : ""}
                onClick={() => setSort("new")}
              >
                新着順
              </button>
            </div>

            {loading ? (
              <div className="empty-state">読み込み中...</div>
            ) : error ? (
              <div className="empty-state">{error}</div>
            ) : list.length === 0 ? (
              <div className="empty-state">
                まだ要望がありません。
                <br />
                右下の＋から投稿できます。
              </div>
            ) : (
              <ul className="fr-list">
                {list.map((r) => {
                  const st = FR_STATUS[r.status]
                  return (
                    <li key={r.id} className="fr-card">
                      <div className="fr-card-main">
                        <div className="fr-card-head">
                          <span className={`fr-status ${st.cls}`}>{st.label}</span>
                          <span className="fr-title">{r.title}</span>
                        </div>
                        {r.body && <p className="fr-desc">{r.body}</p>}
                        <div className="fr-by">{r.authorNickname}</div>
                      </div>
                      <button
                        type="button"
                        className={`fr-vote ${r.votedByMe ? "voted" : ""}`}
                        onClick={() => handleVote(r)}
                        disabled={pendingVote === r.id}
                        aria-pressed={r.votedByMe}
                        aria-label={r.votedByMe ? "いいねを取り消す" : "いいねする"}
                      >
                        <span className="fr-vote-icon">♥</span>
                        <span className="fr-vote-count">{r.voteCount}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <button
            type="button"
            className="fab-add fr-fab"
            onClick={() => setShowNew(true)}
            aria-label="要望を投稿する"
          >
            ＋
          </button>
        </div>
      </div>

      {showNew && (
        <NewRequestForm
          onClose={() => setShowNew(false)}
          onSaved={() => {
            setShowNew(false)
            load()
          }}
        />
      )}
    </>
  )
}

function NewRequestForm({ onClose, onSaved }) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      await createFeatureRequest({ title, body })
      onSaved()
    } catch (err) {
      setError(err.message || "投稿に失敗しました")
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
          <div className="eyebrow">NEW REQUEST</div>
          <h2>要望を投稿する</h2>
        </div>
        <form className="record-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span className="form-label">
              タイトル（{title.length}/{TITLE_MAX}）
            </span>
            <input
              type="text"
              className="form-input"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ほしい機能を短く"
              autoComplete="off"
            />
          </label>
          <label className="form-field">
            <span className="form-label">詳細（任意）</span>
            <textarea
              className="form-input admin-textarea"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="どんな場面で困っているか等"
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="form-submit" disabled={!title.trim() || busy}>
            {busy ? "送信中..." : "投稿する"}
          </button>
        </form>
      </div>
    </div>
  )
}
