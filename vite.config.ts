import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import Components from "unplugin-vue-components/vite"
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers"
import path from "path"

// https://vite.dev/config/
const pagesBase = process.env.VITE_BASE_PATH
  || (process.env.GITHUB_PAGES === "true" ? "/inspection-system/" : "/")

export default defineConfig({
  base: pagesBase,
  plugins: [
    vue(),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false, // css in js
        }),
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          if (id.includes("/vue") || id.includes("/pinia") || id.includes("/vue-router")) {
            return "vue-vendor"
          }
          if (id.includes("/ant-design-vue") || id.includes("/@ant-design")) {
            return "antd-vendor"
          }
          return "vendor"
        }
      }
    }
  }
})
