import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import matchesHandler from "./api/matches/index";
import matchByIdHandler from "./api/matches/[id]";
import matchInsightsHandler from "./api/matches/[id]/insights";
import syncMatchesHandler from "./api/jobs/sync-matches";
import logoHandler from "./api/assets/logo";

const buildQuery = (url: string) =>
  Object.fromEntries(new URL(url, "http://localhost").searchParams.entries());

const createResponseAdapter = (res: any) => {
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };

  res.json = (payload: unknown) => {
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    res.end(JSON.stringify(payload));
    return res;
  };

  res.send = (payload: unknown) => {
    if (typeof payload === "object" && payload !== null) {
      return res.json(payload);
    }

    if (!res.headersSent) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
    }
    res.end(String(payload ?? ""));
    return res;
  };

  return res;
};

const localApiPlugin = () => ({
  name: "local-api-plugin",
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const rawUrl = req.url || "/";
      const pathname = rawUrl.split("?")[0];
      req.query = buildQuery(rawUrl);
      createResponseAdapter(res);

      try {
        if (pathname === "/api/matches") {
          await matchesHandler(req, res);
          return;
        }

        if (pathname === "/api/jobs/sync-matches") {
          await syncMatchesHandler(req, res);
          return;
        }

        if (pathname === "/api/assets/logo") {
          await logoHandler(req, res);
          return;
        }

        const insightsMatch = pathname.match(/^\/api\/matches\/([^/]+)\/insights$/);
        if (insightsMatch) {
          req.params = { id: decodeURIComponent(insightsMatch[1]) };
          req.query = {
            ...req.query,
            id: decodeURIComponent(insightsMatch[1]),
          };
          await matchInsightsHandler(req, res);
          return;
        }

        const matchById = pathname.match(/^\/api\/matches\/([^/]+)$/);
        if (matchById) {
          req.params = { id: decodeURIComponent(matchById[1]) };
          req.query = {
            ...req.query,
            id: decodeURIComponent(matchById[1]),
          };
          await matchByIdHandler(req, res);
          return;
        }
      } catch (error: any) {
        res.status(500).json({
          error: "local_api_handler_failed",
          message: error?.message || "Unexpected error",
        });
        return;
      }

      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), localApiPlugin(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
