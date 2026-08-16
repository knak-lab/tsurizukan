import sharp from 'sharp'
import { mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const outDir = resolve(root, 'public', 'pwa')
mkdirSync(outDir, { recursive: true })

const bg = '#0d1f33'
const logoSvg = readFileSync(resolve(root, 'public', 'favicon.svg'))

async function renderIcon(size, { maskable = false, name }) {
  const logoScale = maskable ? 0.55 : 0.68
  const logoWidth = Math.round(size * logoScale)
  const logoHeight = Math.round(logoWidth * (46 / 48))

  const logo = await sharp(logoSvg)
    .resize(logoWidth, logoHeight, { fit: 'contain' })
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  })
    .composite([
      {
        input: logo,
        left: Math.round((size - logoWidth) / 2),
        top: Math.round((size - logoHeight) / 2),
      },
    ])
    .png()
    .toFile(resolve(outDir, name))
}

await renderIcon(192, { name: 'icon-192.png' })
await renderIcon(512, { name: 'icon-512.png' })
await renderIcon(512, { maskable: true, name: 'icon-512-maskable.png' })
await renderIcon(180, { name: 'apple-touch-icon.png' })

console.log('PWA icons generated in public/pwa/')
