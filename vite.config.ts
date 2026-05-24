import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves at /<repo-name>/, so the asset base must match.
// For local `npm run dev` we want / so assets resolve correctly.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/team_plan_view/' : '/',
  plugins: [react()],
}));
