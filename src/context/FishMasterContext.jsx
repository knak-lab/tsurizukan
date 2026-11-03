import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { getFishMaster } from "../services/storage"
import { useAuth } from "./AuthContext"

const FishMasterContext = createContext(null)

export function FishMasterProvider({ children }) {
  const { user } = useAuth()
  const [fishMaster, setFishMaster] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // silent=true のときは全画面ローディングに切り替えない（開いているフォーム等をアンマウントさせないため）
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      setFishMaster(await getFishMaster())
    } catch (err) {
      // 再読み込みの失敗では既存の一覧を残す（全画面エラーにしない）
      if (!silent) setError(err)
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

  const reload = useCallback(() => load({ silent: true }), [load])

  const value = { fishMaster, loading, error, reload }

  return <FishMasterContext.Provider value={value}>{children}</FishMasterContext.Provider>
}

export function useFishMaster() {
  return useContext(FishMasterContext)
}
