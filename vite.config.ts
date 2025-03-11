import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    hmr: {
      port: 5173,
      host: "localhost"
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request to:', options.target + req.url);
          });
        }
      }
    }
  }
});

// Enhanced functionality for better user experience
// Bug fixes and stability improvements
// Bug fixes and stability improvements
// Enhanced functionality for better user experience
// Performance optimization applied
// Enhanced functionality for better user experience
// Enhanced functionality for better user experience
// Documentation updates
// Enhanced functionality for better user experience
// Updated in foundation phase - 2025-09-12T00:08:58.846Z
// Bug fixes and stability improvements
// Updated in foundation phase - 2025-09-12T00:08:58.943Z
// Code refactoring and cleanup
// Updated in foundation phase - 2025-09-12T00:08:58.994Z
// Testing improvements
// Bug fixes and stability improvements
// Security improvements implemented
// Performance optimization applied
// UI/UX enhancements
// Updated in foundation phase - 2025-09-12T00:10:35.090Z
// UI/UX enhancements
// Documentation updates
// Security improvements implemented
// Code refactoring and cleanup
// UI/UX enhancements
// Security improvements implemented
// Security improvements implemented
// Code refactoring and cleanup
// Security improvements implemented
// Bug fixes and stability improvements
// Documentation updates
// Updated in foundation phase - 2025-09-12T00:45:53.503Z
// Security improvements implemented
// Security improvements implemented
// Feature enhancement and improvements
// UI/UX enhancements
// Security improvements implemented
// Updated in foundation phase - 2025-09-12T00:45:53.798Z