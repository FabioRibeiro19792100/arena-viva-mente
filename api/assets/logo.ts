import { getSupabaseAdmin } from "../_lib/supabase-admin.js";

const ALLOWED_HOSTS = new Set([
  "media.api-sports.io",
]);

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const STALE_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 180;

const getCacheKey = (url: string) => `asset:${url}`;

const getCachedLogo = async (url: string) => {
  const admin = getSupabaseAdmin();
  const cacheKey = getCacheKey(url);
  const { data, error } = await admin
    .from("api_feed_cache")
    .select("payload, expires_at")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (error || !data?.payload) {
    return null;
  }

  const payload = data.payload as { contentType?: string; body?: string } | null;
  if (!payload?.body) {
    return null;
  }

  return {
    contentType: payload.contentType || "image/png",
    body: Buffer.from(payload.body, "base64"),
    isFresh: new Date(data.expires_at).getTime() > Date.now(),
  };
};

const writeCachedLogo = async (url: string, contentType: string, body: Buffer) => {
  const admin = getSupabaseAdmin();
  const cacheKey = getCacheKey(url);

  await admin.from("api_feed_cache").upsert({
    cache_key: cacheKey,
    payload: {
      contentType,
      body: body.toString("base64"),
    },
    source: "asset",
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
  });
};

const isAllowedLogoUrl = (value?: string | null) => {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && ALLOWED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.end("Method not allowed");
    return;
  }

  const rawUrl = typeof req.query?.url === "string" ? req.query.url : "";
  if (!isAllowedLogoUrl(rawUrl)) {
    res.statusCode = 400;
    res.end("Invalid logo URL");
    return;
  }

  const cached = await getCachedLogo(rawUrl);
  if (cached?.isFresh) {
    res.statusCode = 200;
    res.setHeader("Content-Type", cached.contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    res.end(cached.body);
    return;
  }

  try {
    const response = await fetch(rawUrl, {
      headers: {
        "user-agent": "Bancada Logo Proxy",
      },
    });

    if (!response.ok) {
      res.statusCode = response.status;
      res.end("Logo fetch failed");
      return;
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const cacheControl = response.headers.get("cache-control") || "public, max-age=86400";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeCachedLogo(rawUrl, contentType, buffer);

    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControl);
    if (req.method === "HEAD") {
      res.end();
      return;
    }

    res.end(buffer);
  } catch {
    if (cached?.body) {
      res.statusCode = 200;
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", `public, max-age=300, stale-while-revalidate=${STALE_CACHE_TTL_MS / 1000}`);
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      res.end(cached.body);
      return;
    }

    res.statusCode = 502;
    res.end("Logo fetch failed");
  }
}
