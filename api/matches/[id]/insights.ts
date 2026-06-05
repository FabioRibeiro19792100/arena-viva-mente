export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { getMatchInsights } = await import("../../_lib/match-insights-cache");
    const id = req.query?.id || req.params?.id;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "match_id_required" });
    }

    return res.status(200).json({
      insights: await getMatchInsights(id),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "match_insights_failed",
      message: error?.message || "Unexpected error",
    });
  }
}
