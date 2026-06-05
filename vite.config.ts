import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiSportsKey = env.API_SPORTS_KEY || env.API_FOOTBALL_KEY;

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: apiSportsKey
        ? {
            "/api/football": {
              target: "https://v3.football.api-sports.io",
              changeOrigin: true,
              rewrite: (requestPath) => requestPath.replace(/^\/api\/football/, ""),
              configure: (proxy) => {
                proxy.on("proxyReq", (proxyReq) => {
                  proxyReq.setHeader("x-apisports-key", apiSportsKey);
                });
              },
            },
            "/api/nba": {
              target: "https://v2.nba.api-sports.io",
              changeOrigin: true,
              rewrite: (requestPath) => requestPath.replace(/^\/api\/nba/, ""),
              configure: (proxy) => {
                proxy.on("proxyReq", (proxyReq) => {
                  proxyReq.setHeader("x-apisports-key", apiSportsKey);
                });
              },
            },
            "/api/volleyball": {
              target: "https://v1.volleyball.api-sports.io",
              changeOrigin: true,
              rewrite: (requestPath) => requestPath.replace(/^\/api\/volleyball/, ""),
              configure: (proxy) => {
                proxy.on("proxyReq", (proxyReq) => {
                  proxyReq.setHeader("x-apisports-key", apiSportsKey);
                });
              },
            },
          }
        : undefined,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
