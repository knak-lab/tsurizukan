import { useEffect, useMemo } from "react"

// レアリティ(1-5)に応じた演出の強度設定
const RARITY_CONFIG = {
  1: { glowClass: "glow-white", particleClass: "particle-spark", particleCount: 6, duration: 2200 },
  2: { glowClass: "glow-white", particleClass: "particle-spark", particleCount: 8, duration: 2200 },
  3: { glowClass: "glow-teal", particleClass: "particle-spark", particleCount: 16, duration: 2600 },
  4: { glowClass: "glow-gold", particleClass: "particle-confetti", particleCount: 22, duration: 3000 },
  5: {
    glowClass: "glow-rainbow",
    particleClass: "particle-confetti particle-big",
    particleCount: 32,
    duration: 3800,
  },
}

export default function CaptureEffect({ fish, onClose }) {
  const config = RARITY_CONFIG[fish.rarity] || RARITY_CONFIG[1]

  useEffect(() => {
    const timer = setTimeout(onClose, config.duration)
    return () => clearTimeout(timer)
  }, [config.duration, onClose])

  const particles = useMemo(
    () =>
      Array.from({ length: config.particleCount }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 0.9 + Math.random() * 0.7,
        hue: Math.floor(Math.random() * 360),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.particleCount],
  )

  const isConfetti = config.particleClass.includes("confetti")

  return (
    <div className="capture-effect-overlay" onClick={onClose}>
      <div className="capture-effect-particles">
        {particles.map((p) => (
          <span
            key={p.id}
            className={config.particleClass}
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              ...(isConfetti ? { background: `hsl(${p.hue} 80% 60%)` } : {}),
            }}
          />
        ))}
      </div>

      <div className={`capture-effect-glow ${config.glowClass}`}>
        <img src={fish.illustration} alt={fish.name} className="capture-effect-illust" />
      </div>

      <div className="capture-effect-text">はじめての{fish.name}！</div>
    </div>
  )
}
