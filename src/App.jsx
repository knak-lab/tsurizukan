import { useState } from "react"
import fishMaster from "./data/fishMaster"
import { getRecords } from "./services/storage"
import FilterTabs from "./components/FilterTabs"
import FishCard from "./components/FishCard"
import FishDetailSheet from "./components/FishDetailSheet"
import AddRecordForm from "./components/AddRecordForm"
import CollectionRank from "./components/CollectionRank"

function App() {
  const [activeEnv, setActiveEnv] = useState("all")
  const [activeTax, setActiveTax] = useState("all")
  const [selectedFish, setSelectedFish] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [records, setRecords] = useState(() => getRecords())

  const filtered = fishMaster.filter(
    (f) => (activeEnv === "all" || f.env === activeEnv) && (activeTax === "all" || f.tax === activeTax),
  )

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
          onRecordsChange={() => setRecords(getRecords())}
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
          onSaved={() => {
            setRecords(getRecords())
            setShowAddForm(false)
          }}
        />
      )}
    </>
  )
}

export default App
