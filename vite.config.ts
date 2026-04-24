import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = 'ResuMaker'
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true'

// https://vite.dev/config/
export default defineConfig({
  base: isGitHubActions ? `/${repoName}/` : '/',
  plugins: [react()],
})
