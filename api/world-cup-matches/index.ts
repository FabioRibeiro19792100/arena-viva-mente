export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { getWorldCupPoolMatches } = await import("../_lib/world-cup-matches.js");
    const matches = await getWorldCupPoolMatches();
    return res.status(200).json({ matches });
  } catch (error: any) {
    return res.status(500).json({
      error: "world_cup_matches_read_failed",
      message: error?.message || "Unexpected error",
    });
  }
}
