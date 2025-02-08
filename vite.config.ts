import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// Custom plugin to copy manifest and assets
const copyAssets = () => {
  return {
    name: 'copy-assets',
    writeBundle: async () => {
      // Copy and update manifest
      const manifestContent = await fs.promises.readFile('manifest.json', 'utf-8')
      const manifest = JSON.parse(manifestContent)
      
      manifest.content_scripts[0].js = ['content.js']
      manifest.content_scripts[0].css = ['content.css']
      manifest.background.service_worker = 'background.js'
      
      await fs.promises.writeFile(
        resolve('dist', 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      )

      // Copy icons if they exist
      const iconSizes = ['16', '48', '128']
      for (const size of iconSizes) {
        const iconPath = resolve('assets', `icon${size}.png`)
        if (fs.existsSync(iconPath)) {
          await fs.promises.copyFile(iconPath, resolve('dist', `icon${size}.png`))
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), copyAssets()],
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    assetsDir: '',
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.tsx'),
        background: resolve(__dirname, 'src/background.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
})
