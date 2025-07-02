import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

let lastCommitDate = '';
try {
  lastCommitDate = execSync('git log -1 --format=%cd --date=iso-strict').toString().trim();
} catch (e) {
  lastCommitDate = new Date().toISOString();
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/social-toggle-app/',
  define: {
    __LAST_UPDATED__: JSON.stringify(lastCommitDate)
  }
})
