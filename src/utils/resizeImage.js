/**
 * アップロード前に画像を縮小して容量・帯域を抑える。
 * 長辺を maxSize px 以内にリサイズし、PNG で再エンコードした File を返す。
 * 既に十分小さければ元ファイルをそのまま返す。
 */
export async function resizeImage(file, maxSize = 800) {
  if (!file.type.startsWith("image/")) return file

  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const scale = Math.min(1, maxSize / Math.max(width, height))

  if (scale === 1) {
    bitmap.close?.()
    return file
  }

  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"))
  const name = file.name.replace(/\.[^.]+$/, "") + ".png"
  return new File([blob], name, { type: "image/png" })
}
