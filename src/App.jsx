import { useState } from "react"
import fishMaster from "./data/fishMaster"
import { getRecords } from "./services/storage"
import FilterTabs from "./components/FilterTabs"
import FishCard from "./components/FishCard"
import FishDetailSheet from "./components/FishDetailSheet"
import AddRecordForm from "./components/AddRecordForm"
import CollectionRank from "./components/CollectionRank"
import CaptureEffect from "./components/CaptureEffect"
import BestUpdateToast from "./components/BestUpdateToast"

function App() {
  const [activeEnv, setActiveEnv] = useState("all")
  const [activeTax, setActiveTax] = useState("all")
  const [selectedFish, setSelectedFish] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [records, setRecords] = useState(() => getRecords())
  const [captureFish, setCaptureFish] = useState(null)
  const [bestUpdate, setBestUpdate] = useState(null)

  const filtered = fishMaster.filter(
    (f) => (activeEnv === "all" || f.env === activeEnv) && (activeTax === "all" || f.tax === activeTax),
  )

  function handleRecordSaved(result) {
    setRecords(getRecords())
    if (result?.type === "first-catch") {
      setCaptureFish(result.fish)
    } else if (result?.type === "best-update") {
      setBestUpdate(result)
    }
  }

  return (
    <>
      <header className="app">
        <div className="eyebrow">TSURI ZUKAN</div>
        <h1>つりずかん</h1>
        <div className="wave" />
        <CollectionRank records={records} />
      </header>

      <FilterTabs
        fishMaster={fishMaster}
        activeEnv={activeEnv}
        activeTax={activeTax}
        onEnvChange={setActiveEnv}
        onTaxChange={setActiveTax}
      />

      <div className="result-count">{filtered.length}種を表示中</div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          この条件の魚はまだいません。
          <br />
          甲殻類セクションは今後追加予定です 🦀
        </div>
      ) : (
        <div className="grid">
          {filtered.map((f) => (
            <FishCard key={f.id} fish={f} records={records} onClick={() => setSelectedFish(f)} />
          ))}
        </div>
      )}

      {selectedFish && (
        <FishDetailSheet
          fish={selectedFish}
          records={records}
          onClose={() => setSelectedFish(null)}
          onRecordSaved={handleRecordSaved}
        />
      )}

      <button
        type="button"
        className="fab-add"
        onClick={() => setShowAddForm(true)}
        aria-label="釣果を記録する"
      >
        +
      </button>

      {showAddForm && (
        <AddRecordForm
          onClose={() => setShowAddForm(false)}
          onSaved={(result) => {
            setShowAddForm(false)
            handleRecordSaved(result)
          }}
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
