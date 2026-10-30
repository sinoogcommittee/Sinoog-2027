import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules\/(?:react|react-dom|react-router|react-router-dom)\//,
            },
            {
              name: 'supabase-vendor',
              test: /node_modules\/@supabase\//,
            },
            {
              name: 'ui-vendor',
              test: /node_modules\/(?:lucide-react|qrcode\.react|dompurify)\//,
            },
            {
              name: 'map-vendor',
              test: /node_modules\/(?:maplibre-gl)\//,
            },
          ],
        },
      },
    },
  },
})
