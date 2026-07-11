// vite.config.ts
import { defineConfig } from "file:///D:/TradeSealed/deploy-harness/node_modules/vite/dist/node/index.js";
import react from "file:///D:/TradeSealed/deploy-harness/node_modules/@vitejs/plugin-react/dist/index.js";
import wasm from "file:///D:/TradeSealed/deploy-harness/node_modules/vite-plugin-wasm/exports/import.mjs";
import topLevelAwait from "file:///D:/TradeSealed/deploy-harness/node_modules/vite-plugin-top-level-await/exports/import.mjs";
import { nodePolyfills } from "file:///D:/TradeSealed/deploy-harness/node_modules/vite-plugin-node-polyfills/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "D:\\TradeSealed\\deploy-harness";
var vite_config_default = defineConfig({
  resolve: {
    alias: {
      "@midnight-ntwrk/compact-runtime": path.resolve(__vite_injected_original_dirname, "node_modules/@midnight-ntwrk/compact-runtime")
    }
  },
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true
      },
      protocolImports: true
    })
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext"
    }
  },
  build: {
    target: "esnext"
  },
  server: {
    port: 5173,
    fs: {
      allow: [".."]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxUcmFkZVNlYWxlZFxcXFxkZXBsb3ktaGFybmVzc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcVHJhZGVTZWFsZWRcXFxcZGVwbG95LWhhcm5lc3NcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L1RyYWRlU2VhbGVkL2RlcGxveS1oYXJuZXNzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHdhc20gZnJvbSAndml0ZS1wbHVnaW4td2FzbSc7XG5pbXBvcnQgdG9wTGV2ZWxBd2FpdCBmcm9tICd2aXRlLXBsdWdpbi10b3AtbGV2ZWwtYXdhaXQnO1xuaW1wb3J0IHsgbm9kZVBvbHlmaWxscyB9IGZyb20gJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAbWlkbmlnaHQtbnR3cmsvY29tcGFjdC1ydW50aW1lJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ25vZGVfbW9kdWxlcy9AbWlkbmlnaHQtbnR3cmsvY29tcGFjdC1ydW50aW1lJyksXG4gICAgfVxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICB3YXNtKCksXG4gICAgdG9wTGV2ZWxBd2FpdCgpLFxuICAgIG5vZGVQb2x5ZmlsbHMoe1xuICAgICAgZ2xvYmFsczoge1xuICAgICAgICBCdWZmZXI6IHRydWUsXG4gICAgICAgIGdsb2JhbDogdHJ1ZSxcbiAgICAgICAgcHJvY2VzczogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBwcm90b2NvbEltcG9ydHM6IHRydWUsXG4gICAgfSksXG4gIF0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICB0YXJnZXQ6ICdlc25leHQnXG4gICAgfVxuICB9LFxuICBidWlsZDoge1xuICAgIHRhcmdldDogJ2VzbmV4dCdcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3MyxcbiAgICBmczoge1xuICAgICAgYWxsb3c6IFsnLi4nXVxuICAgIH1cbiAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQStRLFNBQVMsb0JBQW9CO0FBQzVTLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsT0FBTyxtQkFBbUI7QUFDMUIsU0FBUyxxQkFBcUI7QUFDOUIsT0FBTyxVQUFVO0FBTGpCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLG1DQUFtQyxLQUFLLFFBQVEsa0NBQVcsOENBQThDO0FBQUEsSUFDM0c7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsSUFDTCxjQUFjO0FBQUEsSUFDZCxjQUFjO0FBQUEsTUFDWixTQUFTO0FBQUEsUUFDUCxRQUFRO0FBQUEsUUFDUixRQUFRO0FBQUEsUUFDUixTQUFTO0FBQUEsTUFDWDtBQUFBLE1BQ0EsaUJBQWlCO0FBQUEsSUFDbkIsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLGdCQUFnQjtBQUFBLE1BQ2QsUUFBUTtBQUFBLElBQ1Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sSUFBSTtBQUFBLE1BQ0YsT0FBTyxDQUFDLElBQUk7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
