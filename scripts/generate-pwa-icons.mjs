import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const outDir = resolve(root, 'public', 'pwa')
mkdirSync(outDir, { recursive: true })

const source = resolve(root, 'scripts', 'assets', 'app-icon-source.png')
// Source has a transparent background outside the circular badge.
const solidBg = { r: 255, g: 255, b: 255 }

async function renderIcon(size, { maskable = false, flatten = false, name }) {
  if (!maskable) {
    let img = sharp(source).resize(size, size, { fit: 'cover' })
    if (flatten) img = img.flatten({ background: solidBg })
    await img.png().toFile(resolve(outDir, name))
    return
  }

  const contentSize = Math.round(size * 0.8)
  const content = await sharp(source)
    .resize(contentSize, contentSize, { fit: 'cover' })
    .flatten({ background: solidBg })
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: solidBg,
    },
  })
    .composite([
      {
        input: content,
        left: Math.round((size - contentSize) / 2),
        top: Math.round((size - contentSize) / 2),
      },
    ])
    .png()
    .toFile(resolve(outDir, name))
}

await renderIcon(192, { name: 'icon-192.png' })
await renderIcon(512, { name: 'icon-512.png' })
await renderIcon(512, { maskable: true, name: 'icon-512-maskable.png' })
// iOS fills transparent regions of apple-touch-icon with black, so flatten to white.
await renderIcon(180, { flatten: true, name: 'apple-touch-icon.png' })
await sharp(source).resize(48, 48, { fit: 'cover' }).png().toFile(resolve(root, 'public', 'favicon.png'))
await sharp(source).resize(32, 32, { fit: 'cover' }).png().toFile(resolve(root, 'public', 'favicon-32.png'))

console.log('PWA icons generated in public/pwa/ and public/favicon*.png')
