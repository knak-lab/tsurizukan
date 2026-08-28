import { useEffect, useState } from "react"
import { listProfiles } from "../services/storage"

export default function UserSwitcher({ currentUserId, viewedUserId, onSelect }) {
  const [profiles, setProfiles] = useState([])

  useEffect(() => {
    listProfiles()
      .then(setProfiles)
      .catch(() => setProfiles([]))
  }, [])

  const activeId = viewedUserId ?? currentUserId

  return (
    <select
      className="user-switcher"
      value={activeId}
      onChange={(e) => onSelect(e.target.value === currentUserId ? null : e.target.value)}
    >
      {profiles.map((p) => (
        <option key={p.id} value={p.id}>
          {p.id === currentUserId ? `${p.nickname}（自分）` : p.nickname}
        </option>
      ))}
    </select>
  )
}
