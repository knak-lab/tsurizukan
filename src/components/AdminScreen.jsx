import { useEffect, useMemo, useState } from "react"
import { useFishMaster } from "../context/FishMasterContext"
import {
  createFish,
  updateFish,
  deleteFish,
  countRecordsForFish,
  uploadFishImage,
  deleteFishImage,
} from "../services/storage"
import {
  listFeatureRequests,
  updateFeatureRequestStatus,
  FR_STATUS,
  FR_STATUS_ORDER,
} from "../services/featureRequests"
import { resizeImage } from "../utils/resizeImage"

const ENV_OPTIONS = [
  { value: "salt", label: "海水" },
  { value: "brackish", label: "汽水" },
  { value: "fresh", label: "淡水" },
]
const TAX_OPTIONS = [
  { value: "fish", label: "魚類" },
  { value: "cephalo", label: "頭足類" },
  { value: "crust", label: "甲殻類" },
]
const RARITY_OPTIONS = [1, 2, 3, 4, 5]

/**
 * Storage のオブジェクトキーは ASCII のみ許可（日本語キーは "Invalid key" になる）。
 * 魚種 id ベースのキーに統一する（"001.png", "008a.png" など）。
 * id に非ASCIIが混じる場合はそこだけ落とし、空になれば時刻でフォールバック。
 */
function imageFilename(id) {
  const safe = String(id).replace(/[^A-Za-z0-9._-]/g, "")
  return `${safe || `fish-${Date.now()}`}.png`
}

function suggestNextId(fishMaster) {
  const nums = fishMaster.map((f) => parseInt(f.id, 10)).filter((n) => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return String(next).padStart(3, "0")
}

function blankDraft(fishMaster) {
  return {
    id: suggestNextId(fishMaster),
    name: "",
    en: "",
    env: "salt",
    tax: "fish",
    rarity: 1,
    sizeMin: "",
    sizeMax: "",
    tokuchou: "",
    miwake: "",
    standard: "",
    tsurikata: "",
    seriesId: "",
    seriesStage: "",
    sortOrder: fishMaster.reduce((m, f) => Math.max(m, f.sortOrder ?? 0), 0) + 1,
  }
}

function toDraft(fish) {
  return {
    id: fish.id,
    name: fish.name,
    en: fish.en,
    env: fish.env,
    tax: fish.tax,
    rarity: fish.rarity,
    sizeMin: String(fish.sizeMin),
    sizeMax: String(fish.sizeMax),
    tokuchou: fish.tokuchou || "",
    miwake: fish.miwake || "",
    standard: fish.standard || "",
    tsurikata: fish.tsurikata || "",
    seriesId: fish.seriesId || "",
    seriesStage: fish.seriesStage == null ? "" : String(fish.seriesStage),
    sortOrder: fish.sortOrder ?? 0,
  }
}

export default function AdminScreen({ onClose, onChanged }) {
  const { fishMaster } = useFishMaster()
  const [tab, setTab] = useState("fish") // "fish" | "requests"
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState(null) // { mode: "new" | "edit", fish?, draft }

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...fishMaster].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    if (!q) return sorted
    return sorted.filter(
      (f) => f.name.toLowerCase().includes(q) || f.en.toLowerCase().includes(q) || f.id.includes(q),
    )
  }, [fishMaster, query])

  function startNew() {
    setEditing({ mode: "new", draft: blankDraft(fishMaster) })
  }
  function startEdit(fish) {
    setEditing({ mode: "edit", fish, draft: toDraft(fish) })
  }

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet admin-sheet">
        <div className="sheet-head compact">
          <button type="button" className="close" onClick={onClose} aria-label="閉じる">
            <span className="close-icon">✕</span>
          </button>
          <div className="eyebrow">ADMIN</div>
          <h2>
            {editing
              ? editing.mode === "new"
                ? "魚種を追加"
                : "魚種を編集"
              : tab === "fish"
                ? "魚種の管理"
                : "要望の管理"}
          </h2>
        </div>

        {!editing && (
          <div className="auth-toggle admin-tabs">
            <button
              type="button"
              className={tab === "fish" ? "active" : ""}
              onClick={() => setTab("fish")}
            >
              魚種の管理
            </button>
            <button
              type="button"
              className={tab === "requests" ? "active" : ""}
              onClick={() => setTab("requests")}
            >
              要望管理
            </button>
          </div>
        )}

        {editing ? (
          <AdminFishForm
            key={editing.mode + (editing.fish?.id ?? "new")}
            mode={editing.mode}
            fish={editing.fish}
            initialDraft={editing.draft}
            fishMaster={fishMaster}
            onDone={() => {
              setEditing(null)
              onChanged()
            }}
            onCancel={() => setEditing(null)}
          />
        ) : tab === "requests" ? (
          <FeatureRequestAdmin />
        ) : (
          <div className="admin-list-wrap">
            <div className="admin-list-toolbar">
              <input
                type="text"
                className="form-input"
                placeholder="名前・英名・IDで検索"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              <button type="button" className="form-submit admin-new-btn" onClick={startNew}>
                ＋ 新しい魚種
              </button>
            </div>
            <div className="result-count">{list.length}種</div>
            <ul className="admin-list">
              {list.map((f) => (
                <li key={f.id} className="admin-list-item" onClick={() => startEdit(f)}>
                  <img className="admin-list-thumb" src={f.illustration} alt="" loading="lazy" />
                  <div className="admin-list-meta">
                    <span className="admin-list-name">{f.name}</span>
                    <span className="admin-list-sub">
                      {f.id}・{f.en}・{f.sizeMin}〜{f.sizeMax}cm
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminFishForm({ mode, fish, initialDraft, fishMaster, onDone, onCancel }) {
  const [d, setD] = useState(initialDraft)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(fish?.illustration || "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setD((prev) => ({ ...prev, [k]: e.target.value }))

  function pickFile(e) {
    const f = e.target.files?.[0] || null
    setFile(f)
    if (f) setPreview(URL.createObjectURL(f))
  }

  function validate() {
    if (!d.id.trim()) return "IDを入力してください"
    if (mode === "new" && fishMaster.some((f) => f.id === d.id.trim())) return "そのIDは既に使われています"
    if (!d.name.trim()) return "和名を入力してください"
    if (!d.en.trim()) return "英名を入力してください"
    const min = Number(d.sizeMin)
    const max = Number(d.sizeMax)
    if (!(min > 0)) return "サイズ下限は0より大きい数値にしてください"
    if (!(max > min)) return "サイズ上限は下限より大きくしてください"
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setError(null)
    setBusy(true)
    try {
      let imagePath = fish?.imagePath ?? null
      if (file) {
        const resized = await resizeImage(file)
        const filename = fish?.imagePath || imageFilename(d.id.trim())
        await uploadFishImage(resized, filename)
        imagePath = filename
      }

      const payload = {
        name: d.name.trim(),
        en: d.en.trim(),
        env: d.env,
        tax: d.tax,
        rarity: Number(d.rarity),
        sizeMin: Number(d.sizeMin),
        sizeMax: Number(d.sizeMax),
        tokuchou: d.tokuchou.trim(),
        miwake: d.miwake.trim(),
        standard: d.standard.trim(),
        tsurikata: d.tsurikata.trim(),
        seriesId: d.seriesId.trim(),
        seriesStage: d.seriesStage === "" ? null : Number(d.seriesStage),
        sortOrder: Number(d.sortOrder) || 0,
        imagePath,
      }

      if (mode === "new") {
        await createFish({ id: d.id.trim(), ...payload })
      } else {
        await updateFish(fish.id, payload)
      }
      onDone()
    } catch (err) {
      setError(err.message || "保存に失敗しました")
      setBusy(false)
    }
  }

  async function handleDelete() {
    setError(null)
    let refCount = 0
    try {
      refCount = await countRecordsForFish(fish.id)
    } catch {
      // カウントできなくても削除確認は続行する
    }
    const msg =
      refCount > 0
        ? `「${fish.name}」を削除します。この魚を参照している釣果記録が ${refCount} 件あり、それらはカードに表示されなくなります。続けますか？`
        : `「${fish.name}」を削除します。続けますか？`
    if (!window.confirm(msg)) return

    setBusy(true)
    try {
      await deleteFish(fish.id)
      if (fish.imagePath) {
        try {
          await deleteFishImage(fish.imagePath)
        } catch {
          // 画像削除の失敗は致命的ではない
        }
      }
      onDone()
    } catch (err) {
      setError(err.message || "削除に失敗しました")
      setBusy(false)
    }
  }

  return (
    <form className="record-form admin-form" onSubmit={handleSubmit}>
      <div className="admin-form-grid">
        <label className="form-field">
          <span className="form-label">ID</span>
          {mode === "new" ? (
            <input className="form-input" value={d.id} onChange={set("id")} autoComplete="off" />
          ) : (
            <div className="form-input form-input-locked">{d.id}</div>
          )}
        </label>
        <label className="form-field">
          <span className="form-label">表示順</span>
          <input type="number" className="form-input" value={d.sortOrder} onChange={set("sortOrder")} />
        </label>
        <label className="form-field">
          <span className="form-label">和名</span>
          <input className="form-input" value={d.name} onChange={set("name")} autoComplete="off" />
        </label>
        <label className="form-field">
          <span className="form-label">英名</span>
          <input className="form-input" value={d.en} onChange={set("en")} autoComplete="off" />
        </label>
        <label className="form-field">
          <span className="form-label">生息環境</span>
          <select className="form-input" value={d.env} onChange={set("env")}>
            {ENV_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="form-label">分類</span>
          <select className="form-input" value={d.tax} onChange={set("tax")}>
            {TAX_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="form-label">レア度</span>
          <select className="form-input" value={d.rarity} onChange={set("rarity")}>
            {RARITY_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="form-label">サイズ下限 (cm)</span>
          <input type="number" step="0.1" className="form-input" value={d.sizeMin} onChange={set("sizeMin")} />
        </label>
        <label className="form-field">
          <span className="form-label">サイズ上限 (cm)</span>
          <input type="number" step="0.1" className="form-input" value={d.sizeMax} onChange={set("sizeMax")} />
        </label>
        <label className="form-field">
          <span className="form-label">シリーズID（任意）</span>
          <input className="form-input" value={d.seriesId} onChange={set("seriesId")} autoComplete="off" />
        </label>
        <label className="form-field">
          <span className="form-label">シリーズ段階（任意）</span>
          <input type="number" className="form-input" value={d.seriesStage} onChange={set("seriesStage")} />
        </label>
      </div>

      <label className="form-field">
        <span className="form-label">画像</span>
        <div className="admin-image-row">
          {preview ? <img className="admin-image-preview" src={preview} alt="" /> : <div className="admin-image-preview empty">なし</div>}
          <input type="file" accept="image/*" onChange={pickFile} />
        </div>
      </label>

      <label className="form-field">
        <span className="form-label">特徴</span>
        <textarea className="form-input admin-textarea" rows={2} value={d.tokuchou} onChange={set("tokuchou")} />
      </label>
      <label className="form-field">
        <span className="form-label">見分け方</span>
        <textarea className="form-input admin-textarea" rows={2} value={d.miwake} onChange={set("miwake")} />
      </label>
      <label className="form-field">
        <span className="form-label">標準サイズ</span>
        <textarea className="form-input admin-textarea" rows={2} value={d.standard} onChange={set("standard")} />
      </label>
      <label className="form-field">
        <span className="form-label">釣り方</span>
        <textarea className="form-input admin-textarea" rows={2} value={d.tsurikata} onChange={set("tsurikata")} />
      </label>

      {error && <div className="auth-error">{error}</div>}

      <div className="admin-form-actions">
        <button type="button" className="auth-link" onClick={onCancel} disabled={busy}>
          もどる
        </button>
        {mode === "edit" && (
          <button type="button" className="record-delete admin-delete-btn" onClick={handleDelete} disabled={busy}>
            削除
          </button>
        )}
        <button type="submit" className="form-submit" disabled={busy}>
          {busy ? "保存中..." : "保存する"}
        </button>
      </div>
    </form>
  )
}

/** 要望管理: 各要望の status をプルダウンで変更するだけのシンプルな一覧 */
function FeatureRequestAdmin() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setList(await listFeatureRequests("new"))
    } catch (err) {
      setError(err.message || "読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function changeStatus(id, status) {
    const prev = list
    setList((cur) => cur.map((r) => (r.id === id ? { ...r, status } : r)))
    try {
      await updateFeatureRequestStatus(id, status)
    } catch (err) {
      setError(err.message || "更新に失敗しました")
      setList(prev)
    }
  }

  if (loading) return <div className="empty-state">読み込み中...</div>
  if (error) return <div className="empty-state">{error}</div>
  if (list.length === 0) return <div className="empty-state">まだ要望がありません。</div>

  return (
    <div className="admin-list-wrap">
      <div className="result-count">{list.length}件</div>
      <ul className="admin-list">
        {list.map((r) => (
          <li key={r.id} className="admin-list-item fr-admin-item">
            <div className="admin-list-meta">
              <span className="admin-list-name">{r.title}</span>
              <span className="admin-list-sub">
                ♥{r.voteCount}・{r.authorNickname}
              </span>
            </div>
            <select
              className="form-input fr-admin-select"
              value={r.status}
              onChange={(e) => changeStatus(r.id, e.target.value)}
            >
              {FR_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {FR_STATUS[s].label}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </div>
  )
}
