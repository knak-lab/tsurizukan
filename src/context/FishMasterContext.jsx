import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { getFishMaster } from "../services/storage"
import { useAuth } from "./AuthContext"

const FishMasterContext = createContext(null)

export function FishMasterProvider({ children }) {
  const { user } = useAuth()
  const [fishMaster, setFishMaster] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setFishMaster(await getFishMaster())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // fish テーブルの取得はログイン必須（RLS）。ログイン後・ユーザー切替時にロードする。
  useEffect(() => {
    if (!user) {
      setFishMaster([])
      setLoading(false)
      return
    }
    load()
  }, [user, load])

  const value = { fishMaster, loading, error, reload: load }

  return <FishMasterContext.Provider value={value}>{children}</FishMasterContext.Provider>
}

export function useFishMaster() {
  return useContext(FishMasterContext)
}
