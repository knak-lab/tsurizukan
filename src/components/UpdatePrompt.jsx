import { useRegisterSW } from "virtual:pwa-register/react"

// 開きっぱなしのPWAでも新版に気づけるよう、定期的にサーバーへ更新確認する間隔
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000

/**
 * 新しいバージョンが公開されていたら「更新があります」バーを出し、ボタンで新版に切り替える。
 * Service Worker は registerType: "prompt"（vite.config.js）なので、ボタンを押すまで旧版のまま動き続ける。
 */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return
      const check = async () => {
        if (registration.installing || !navigator.onLine) return
        // SW スクリプト自体が取れない（オフライン等）ときは確認をスキップする
        try {
          const resp = await fetch(swUrl, { cache: "no-store", headers: { "cache-control": "no-cache" } })
          if (resp.status === 200) await registration.update()
        } catch {
          // 次回の確認に任せる
        }
      }
      setInterval(check, UPDATE_CHECK_INTERVAL_MS)
      // アプリに戻ってきたとき（スマホでバックグラウンドから復帰など）にも確認する
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check()
      })
    },
  })

  if (!needRefresh) return null

  return (
    <div className="update-prompt" role="status">
      <span className="update-prompt-text">🎣 更新があります</span>
      <button type="button" className="update-prompt-later" onClick={() => setNeedRefresh(false)}>
        あとで
      </button>
      <button
        type="button"
        className="update-prompt-button"
        onClick={() => {
          updateServiceWorker(true)
          // 待機中の新版が無い等で切り替えが起きなかった場合の保険（通常は上の呼び出しで自動リロードされる）
          setTimeout(() => window.location.reload(), 3000)
        }}
      >
        更新
      </button>
    </div>
  )
}
