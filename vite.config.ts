import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        content: 'src/content.tsx',
        background: 'src/background.ts'
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es'
      }
    }
  }
})
