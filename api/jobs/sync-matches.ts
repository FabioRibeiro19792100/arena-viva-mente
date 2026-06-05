const isAuthorized = (req: any) => {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return true;
  }

  return req.headers?.authorization === `Bearer ${cronSecret}` || req.query?.secret === cronSecret;
};

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { syncLiveMatches, syncMatchesByIds, syncScheduledMatches } = await import("../_lib/sports-sync.js");
    const mode = ["scheduled", "live", "all", "ids"].includes(req.query?.mode)
      ? req.query.mode
      : "scheduled";

    if (mode === "ids") {
      const ids = typeof req.query?.ids === "string" ? req.query.ids.split(",").filter(Boolean) : [];
      await syncMatchesByIds(ids);
      return res.status(200).json({ mode, syncedIds: ids.length });
    }

    if (mode === "live") {
      return res.status(200).json({ mode, results: await syncLiveMatches() });
    }

    if (mode === "all") {
      const [scheduled, live] = await Promise.all([syncScheduledMatches(), syncLiveMatches()]);
      return res.status(200).json({ mode, scheduled, live });
    }

    return res.status(200).json({ mode, results: await syncScheduledMatches() });
  } catch (error: any) {
    return res.status(500).json({
      error: "sync_matches_failed",
      message: error?.message || "Unexpected error",
    });
  }
}
