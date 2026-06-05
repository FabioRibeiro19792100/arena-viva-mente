export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { getMatchesByIds, getMatchesFeed } = await import("../_lib/matches-read");
    const ids = typeof req.query?.ids === "string" ? req.query.ids.split(",").filter(Boolean) : [];
    if (ids.length > 0) {
      const matches = await getMatchesByIds(ids);
      return res.status(200).json({ matches, todayMatches: [], apiFeedStatus: null });
    }

    const sport = ["all", "futebol", "basquete", "volei"].includes(req.query?.sport)
      ? req.query.sport
      : "all";
    const quick = ["all", "live", "soon"].includes(req.query?.quick)
      ? req.query.quick
      : "all";
    const search = typeof req.query?.search === "string" ? req.query.search : "";

    return res.status(200).json(
      await getMatchesFeed({
        sport,
        quick,
        search,
      }),
    );
  } catch (error: any) {
    return res.status(500).json({
      error: "matches_read_failed",
      message: error?.message || "Unexpected error",
    });
  }
}
