import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // Proxy API requests to backend to avoid CORS issues during development
      proxy: {
        '/api': {
          target: 'https://pharmacare-api.onrender.com',
          changeOrigin: true,
          secure: true,
          // Log proxy requests for debugging (only in development)
          configure: (proxy, options) => {
            if (!isProduction) {
              proxy.on('error', (err, req, res) => {
                console.log('[VITE PROXY] Error:', err.message);
              });
              proxy.on('proxyReq', (proxyReq, req, res) => {
                console.log('[VITE PROXY] Proxying request:', req.method, req.url, '->', options.target + req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log('[VITE PROXY] Response received:', proxyRes.statusCode, req.url);
              });
            }
          },
        },
      },
    },
    build: {
      // Production build optimizations
      outDir: 'dist',
      sourcemap: false, // Disable sourcemaps in production for security
      minify: 'esbuild',
      esbuild: {
        drop: isProduction ? ['console', 'debugger'] : [], // Remove console logs and debugger in production
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-avatar', '@radix-ui/react-dialog', '@radix-ui/react-icons', '@radix-ui/react-label', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-slot', '@radix-ui/react-tabs', '@radix-ui/react-tooltip'],
            'charts-vendor': ['recharts'],
            'utils-vendor': ['axios', 'date-fns', 'zustand'],
          },
        },
      },
      chunkSizeWarningLimit: 1000, // Increase chunk size warning limit
    },
    define: {
      // Define environment variables for build-time replacement
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
  };
});
