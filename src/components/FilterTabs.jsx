const ENV_TABS = [
  { key: "all", label: "すべて", cls: "" },
  { key: "salt", label: "🌊 海水", cls: "" },
  { key: "brackish", label: "🌗 汽水", cls: "env-brackish" },
  { key: "fresh", label: "🏞️ 淡水", cls: "env-fresh" },
]

const TAX_TABS = [
  { key: "all", label: "すべて", cls: "" },
  { key: "fish", label: "🐟 魚類", cls: "" },
  { key: "cephalo", label: "🦑 頭足類", cls: "tax-cephalo" },
  { key: "crust", label: "🦀 甲殻類", cls: "tax-crust", comingSoon: true },
]

export default function FilterTabs({ fishMaster, activeEnv, activeTax, onEnvChange, onTaxChange }) {
  const envCount = (key) =>
    key === "all" ? fishMaster.length : fishMaster.filter((f) => f.env === key).length
  const taxCount = (key) =>
    key === "all" ? fishMaster.length : fishMaster.filter((f) => f.tax === key).length

  return (
    <div className="filters">
      <div className="filter-row">
        <span className="filter-label">生息環境</span>
        {ENV_TABS.map((t) => (
          <div
            key={t.key}
            className={`chip ${t.cls} ${activeEnv === t.key ? "active" : ""}`}
            onClick={() => onEnvChange(t.key)}
          >
            {t.label} <span className="count">{envCount(t.key)}</span>
          </div>
        ))}
      </div>
      <div className="filter-row">
        <span className="filter-label">分類</span>
        {TAX_TABS.map((t) => (
          <div
            key={t.key}
            className={`chip ${t.cls} ${activeTax === t.key ? "active" : ""}`}
            style={{ opacity: t.comingSoon ? 0.55 : 1 }}
            onClick={() => onTaxChange(t.key)}
          >
            {t.label} <span className="count">{t.comingSoon ? "準備中" : taxCount(t.key)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
