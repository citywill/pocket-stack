import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        '/api/llm': {
          target: env.VITE_ALI_LLM_URL ? new URL(env.VITE_ALI_LLM_URL).origin + new URL(env.VITE_ALI_LLM_URL).pathname.replace(/\/chat\/completions$/, '') : 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/llm/, ''),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              if (env.VITE_ALI_LLM_API_KEY) {
                proxyReq.setHeader('Authorization', `Bearer ${env.VITE_ALI_LLM_API_KEY}`);
              }
            });
          }
        }
      }
    }
  }
})
