/**
 * 図鑑などの初回読み込み中に出す全画面ローディング。
 * 白背景・中央にアプリアイコン・下に now loading... の文字。
 * アイコンがゆっくり明滅することで「読み込み中でフリーズしていない」ことを示す。
 */
export default function LoadingScreen({ label = "now loading..." }) {
  return (
    <div className="loading-screen">
      <img
        className="loading-screen-icon"
        src={`${import.meta.env.BASE_URL}pwa/icon-192.png`}
        alt=""
        width="128"
        height="128"
      />
      <p className="loading-screen-text">{label}</p>
    </div>
  )
}
