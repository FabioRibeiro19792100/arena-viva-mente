const API_NBA_BASE_URL = "https://v2.nba.api-sports.io";

const buildQuery = (input: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    search.set(key, String(value));
  });

  return search.toString();
};

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.API_SPORTS_KEY || process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API_SPORTS_KEY or API_FOOTBALL_KEY is not configured" });
  }

  const {
    id,
    date,
    live,
    league,
    season,
    team,
    h2h,
  } = req.query ?? {};

  const query = buildQuery({
    id,
    date,
    live,
    league,
    season,
    team,
    h2h,
  });

  try {
    const response = await fetch(`${API_NBA_BASE_URL}/games?${query}`, {
      headers: {
        "x-apisports-key": apiKey,
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "API-NBA request failed",
        details: payload,
      });
    }

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected API-NBA proxy error",
      details: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
