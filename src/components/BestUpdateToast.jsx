import { useEffect } from "react"

export default function BestUpdateToast({ fish, size, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3200)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="best-update-toast" onClick={onClose}>
      <span className="best-update-toast-icon">🏆</span>
      <div className="best-update-toast-text">
        <div className="best-update-toast-title">自己ベスト更新！</div>
        <div className="best-update-toast-sub">
          {fish.name} {size}cm
        </div>
      </div>
    </div>
  )
}
