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
    const {
      ensureWorldCupGroupStageSeeded,
      syncWorldCupScoresFromGe,
    } = await import("../_lib/world-cup-matches.js");

    const seeded = await ensureWorldCupGroupStageSeeded();
    const ge = await Promise.allSettled([syncWorldCupScoresFromGe()]);

    return res.status(200).json({
      seeded,
      ge:
        ge[0].status === "fulfilled"
          ? ge[0].value
          : { updated: 0, error: ge[0].reason?.message || "ge_failed" },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "sync_world_cup_scores_failed",
      message: error?.message || "Unexpected error",
    });
  }
}
