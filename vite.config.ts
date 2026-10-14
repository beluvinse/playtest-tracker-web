import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // The folder the site is served from. On your computer it's the root ("/"). On GitHub Pages the
  // site lives at https://<user>.github.io/<repository>/, so every file (scripts, styles, icon)
  // has to be asked for under "/<repository>/". The deploy workflow sets BASE_PATH for that.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  test: {
    // The tests run in Node, with jsdom playing the part of the browser (document, localStorage…)
    environment: 'jsdom',
    // Tests never call the real API: this address is only what the app code puts in front of
    // each path, and the tests' fake fetch answers to it
    env: { VITE_API_URL: 'http://api.test' },
    // Each test starts from a clean browser state (see src/test/setup.ts)
    setupFiles: ['./src/test/setup.ts'],
  },
})
