const RECORDS_KEY = "tsurizukan:records"

/** 記録一覧を取得する。壊れたデータや未設定の場合は空配列を返す */
export function getRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** 記録を1件追加する。{ fishId, size, sizeClass, date } を渡す（idは自動付与） */
export function saveRecord(record) {
  const records = getRecords()
  const next = [
    ...records,
    {
      id: crypto.randomUUID(),
      ...record,
    },
  ]
  localStorage.setItem(RECORDS_KEY, JSON.stringify(next))
  return next
}

/** 記録を1件削除する */
export function deleteRecord(recordId) {
  const next = getRecords().filter((r) => r.id !== recordId)
  localStorage.setItem(RECORDS_KEY, JSON.stringify(next))
  return next
}
