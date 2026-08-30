import { useEffect, useState } from "react"
import { useAuth } from "./context/AuthContext"
import { useFishMaster } from "./context/FishMasterContext"
import { getRecords, hasPendingLegacyImport, importLegacyRecords } from "./services/storage"
import { getRarityTier } from "./utils/rarityTier"
import FilterTabs from "./components/FilterTabs"
import FishCard from "./components/FishCard"
import SeriesCard from "./components/SeriesCard"
import FishDetailSheet from "./components/FishDetailSheet"
import AddRecordForm from "./components/AddRecordForm"
import CollectionRank from "./components/CollectionRank"
import CaptureEffect from "./components/CaptureEffect"
import BestUpdateToast from "./components/BestUpdateToast"
import AuthScreen from "./components/AuthScreen"
import NicknameSetupPrompt from "./components/NicknameSetupPrompt"
import UserSwitcher from "./components/UserSwitcher"
import AdminScreen from "./components/AdminScreen"

function App() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const { fishMaster, loading: fishLoading, error: fishError, reload: reloadFish } = useFishMaster()

  const [activeEnv, setActiveEnv] = useState("all")
  const [activeTax, setActiveTax] = useState("all")
  const [selectedFish, setSelectedFish] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [viewedUserId, setViewedUserId] = useState(null)
  const [records, setRecords] = useState([])
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [recordsError, setRecordsError] = useState(null)
  const [captureFish, setCaptureFish] = useState(null)
  const [bestUpdate, setBestUpdate] = useState(null)
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false)
  const [importBanner, setImportBanner] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  const targetUserId = viewedUserId ?? user?.id
  const isOwnCollection = !viewedUserId || viewedUserId === user?.id

  useEffect(() => {
    if (!user) return
    if (profile && profile.nickname === user.email?.split("@")[0]) {
      setShowNicknamePrompt(true)
    }
  }, [user, profile])

  useEffect(() => {
    if (isOwnCollection) {
      setImportBanner(hasPendingLegacyImport())
    }
  }, [isOwnCollection, user])

  useEffect(() => {
    if (!targetUserId) return
    let cancelled = false
    setRecordsLoading(true)
    setRecordsError(null)
    getRecords(targetUserId)
      .then((data) => {
        if (!cancelled) setRecords(data)
      })
      .catch((err) => {
        if (!cancelled) setRecordsError(err)
      })
      .finally(() => {
        if (!cancelled) setRecordsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [targetUserId])

  async function refreshRecords() {
    const data = await getRecords(targetUserId)
    setRecords(data)
  }

  async function handleImportLegacy() {
    setImporting(true)
    try {
      await importLegacyRecords()
      setImportBanner(false)
      await refreshRecords()
    } finally {
      setImporting(false)
    }
  }

  async function handleRecordSaved(result) {
    await refreshRecords()
    if (result?.type === "first-catch") {
      setCaptureFish(result.fish)
    } else if (result?.type === "best-update") {
      setBestUpdate(result)
    }
  }

  if (authLoading) {
    return <div className="empty-state">読み込み中...</div>
  }

  if (!user) {
    return <AuthScreen />
  }

  if (fishLoading) {
    return <div className="empty-state">図鑑を読み込み中...</div>
  }

  if (fishError) {
    return (
      <div className="empty-state">
        図鑑の読み込みに失敗しました。
        <br />
        通信状態を確認してください。
      </div>
    )
  }

  const filtered = fishMaster.filter(
    (f) => (activeEnv === "all" || f.env === activeEnv) && (activeTax === "all" || f.tax === activeTax),
  )

  const standalone = filtered.filter((f) => !f.seriesId)
  const teiban = standalone.filter((f) => getRarityTier(f.rarity) === "定番")
  const rare = standalone.filter((f) => getRarityTier(f.rarity) === "レア")
  const legend = standalone.filter((f) => getRarityTier(f.rarity) === "幻")

  const seriesGroups = Object.values(
    filtered
      .filter((f) => f.seriesId)
      .reduce((acc, f) => {
        acc[f.seriesId] = acc[f.seriesId] || []
        acc[f.seriesId].push(f)
        return acc
      }, {}),
  ).map((members) => members.slice().sort((a, b) => a.seriesStage - b.seriesStage))

  return (
    <>
      <header className="app">
        <div className="eyebrow">TSURI ZUKAN</div>
        <h1>つりずかん</h1>
        <div className="wave" />
        <CollectionRank records={records} fishMaster={fishMaster} />
        <UserSwitcher currentUserId={user.id} viewedUserId={viewedUserId} onSelect={setViewedUserId} />
        <div className="header-actions">
          {profile?.is_admin && (
            <button type="button" className="auth-link" style={{ color: "#7fb8c9" }} onClick={() => setShowAdmin(true)}>
              管理
            </button>
          )}
          <button type="button" className="auth-link" style={{ color: "#7fb8c9" }} onClick={signOut}>
            ログアウト
          </button>
        </div>
      </header>

      {showNicknamePrompt && <NicknameSetupPrompt onClose={() => setShowNicknamePrompt(false)} />}

      {importBanner && (
        <div className="empty-state">
          過去の端末に保存されていた記録が見つかりました。
          <br />
          <button type="button" className="form-submit" disabled={importing} onClick={handleImportLegacy}>
            {importing ? "インポート中..." : "記録をインポートする"}
          </button>
        </div>
      )}

      <FilterTabs
        fishMaster={fishMaster}
        activeEnv={activeEnv}
        activeTax={activeTax}
        onEnvChange={setActiveEnv}
        onTaxChange={setActiveTax}
      />

      <div className="result-count">{filtered.length}種を表示中</div>

      {recordsLoading ? (
        <div className="empty-state">記録を読み込み中...</div>
      ) : recordsError ? (
        <div className="empty-state">
          記録の読み込みに失敗しました。
          <br />
          通信状態を確認してください。
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          この条件の魚はまだいません。
          <br />
          甲殻類セクションは今後追加予定です 🦀
        </div>
      ) : (
        <>
          {teiban.length > 0 && (
            <section className="fish-section">
              <h3 className="fish-section-title">定番</h3>
              <div className="grid">
                {teiban.map((f) => (
                  <FishCard key={f.id} fish={f} records={records} onClick={() => setSelectedFish(f)} />
                ))}
              </div>
            </section>
          )}

          {seriesGroups.length > 0 && (
            <section className="fish-section">
              <h3 className="fish-section-title">出世魚シリーズ</h3>
              <div className="series-list">
                {seriesGroups.map((members) => (
                  <SeriesCard
                    key={members[0].seriesId}
                    members={members}
                    records={records}
                    onSelect={setSelectedFish}
                  />
                ))}
              </div>
            </section>
          )}

          {rare.length > 0 && (
            <section className="fish-section">
              <h3 className="fish-section-title">レア</h3>
              <div className="grid">
                {rare.map((f) => (
                  <FishCard key={f.id} fish={f} records={records} onClick={() => setSelectedFish(f)} />
                ))}
              </div>
            </section>
          )}

          {legend.length > 0 && (
            <section className="fish-section">
              <h3 className="fish-section-title">幻</h3>
              <div className="grid">
                {legend.map((f) => (
                  <FishCard key={f.id} fish={f} records={records} onClick={() => setSelectedFish(f)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {selectedFish && (
        <FishDetailSheet
          fish={selectedFish}
          records={records}
          readOnly={!isOwnCollection}
          onClose={() => setSelectedFish(null)}
          onRecordSaved={handleRecordSaved}
        />
      )}

      {isOwnCollection && (
        <button
          type="button"
          className="fab-add"
          onClick={() => setShowAddForm(true)}
          aria-label="釣果を記録する"
        >
          +
        </button>
      )}

      {showAddForm && (
        <AddRecordForm
          onClose={() => setShowAddForm(false)}
          onSaved={(result) => {
            setShowAddForm(false)
            handleRecordSaved(result)
          }}
        />
      )}

      {showAdmin && (
        <AdminScreen
          onClose={() => setShowAdmin(false)}
          onChanged={reloadFish}
        />
      )}

      {captureFish && <CaptureEffect fish={captureFish} onClose={() => setCaptureFish(null)} />}

      {bestUpdate && (
        <BestUpdateToast fish={bestUpdate.fish} size={bestUpdate.size} onClose={() => setBestUpdate(null)} />
      )}
    </>
  )
}

export default App
