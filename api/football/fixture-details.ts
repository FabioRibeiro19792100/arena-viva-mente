const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

const buildQuery = (input: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    search.set(key, String(value));
  });

  return search.toString();
};

const getApiKey = () => process.env.API_SPORTS_KEY || process.env.API_FOOTBALL_KEY;

const fetchFromApi = async (path: string, apiKey: string) => {
  const response = await fetch(`${API_FOOTBALL_BASE_URL}/${path}`, {
    headers: {
      "x-apisports-key": apiKey,
    },
  });

  if (response.status === 204) {
    return { response: [] };
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || "api_football_request_failed");
  }

  return payload;
};

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = getApiKey();

  if (!apiKey) {
    return res.status(500).json({ error: "API_SPORTS_KEY or API_FOOTBALL_KEY is not configured" });
  }

  const fixture = Number(req.query?.fixture);
  const homeTeam = Number(req.query?.homeTeam);
  const awayTeam = Number(req.query?.awayTeam);
  const league = req.query?.league ? Number(req.query.league) : undefined;
  const season = req.query?.season ? Number(req.query.season) : undefined;
  const timezone = req.query?.timezone || "America/Sao_Paulo";

  if (!Number.isFinite(fixture) || fixture <= 0) {
    return res.status(400).json({ error: "fixture is required" });
  }

  const headToHeadQuery =
    Number.isFinite(homeTeam) && homeTeam > 0 && Number.isFinite(awayTeam) && awayTeam > 0
      ? buildQuery({
          h2h: `${homeTeam}-${awayTeam}`,
          league,
          season,
          last: 5,
          timezone,
        })
      : "";

  try {
    const [events, lineups, statistics, players, predictions, odds, headToHead] =
      await Promise.allSettled([
        fetchFromApi(`fixtures/events?${buildQuery({ fixture, timezone })}`, apiKey),
        fetchFromApi(`fixtures/lineups?${buildQuery({ fixture, timezone })}`, apiKey),
        fetchFromApi(`fixtures/statistics?${buildQuery({ fixture, timezone })}`, apiKey),
        fetchFromApi(`fixtures/players?${buildQuery({ fixture, timezone })}`, apiKey),
        fetchFromApi(`predictions?${buildQuery({ fixture })}`, apiKey),
        fetchFromApi(`odds?${buildQuery({ fixture, timezone, page: 1 })}`, apiKey),
        headToHeadQuery
          ? fetchFromApi(`fixtures/headtohead?${headToHeadQuery}`, apiKey)
          : Promise.resolve({ response: [] }),
      ]);

    const unwrap = (result: PromiseSettledResult<any>) =>
      result.status === "fulfilled" ? result.value?.response || [] : [];

    return res.status(200).json({
      fixture,
      events: unwrap(events),
      lineups: unwrap(lineups),
      statistics: unwrap(statistics),
      players: unwrap(players),
      predictions: unwrap(predictions),
      odds: unwrap(odds),
      headToHead: unwrap(headToHead),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected API-Football fixture-details proxy error",
      details: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
