export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { getMatchByIdFromDb } = await import("../../_lib/matches-read.js");
    const id = req.query?.id || req.params?.id;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "match_id_required" });
    }

    const match = await getMatchByIdFromDb(id);
    if (!match) {
      return res.status(404).json({ error: "match_not_found" });
    }

    return res.status(200).json({ match });
  } catch (error: any) {
    return res.status(500).json({
      error: "match_read_failed",
      message: error?.message || "Unexpected error",
    });
  }
}
