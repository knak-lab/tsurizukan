/** その魚種の記録が1件でもあれば捕獲済みとみなす */
export function isCaught(fishId, records) {
  return records.some((r) => r.fishId === fishId)
}

/** その魚種の記録の中でサイズが最大のものを返す（無ければnull） */
export function bestRecordFor(fishId, records) {
  const matches = records.filter((r) => r.fishId === fishId)
  if (matches.length === 0) return null
  return matches.reduce((best, r) => (r.size > best.size ? r : best))
}
