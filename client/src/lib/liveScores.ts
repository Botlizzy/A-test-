export const LIVE_SCORES_ENDPOINT = "https://apis.davidcyril.name.ng/sports/live";

export type LiveMatch = {
  id: string;
  league: string;
  leagueLabel: string;
  name: string;
  date: string;
  status: string;
  period?: string;
  clock?: string;
  home: { name: string; shortName?: string; logo?: string; score?: string; winner?: boolean };
  away: { name: string; shortName?: string; logo?: string; score?: string; winner?: boolean };
  venue?: string;
  broadcast?: string;
};

function text(value: unknown): string | undefined { return typeof value === "string" || typeof value === "number" ? String(value) : undefined; }

function normalizeGame(game: any, league: string, leagueLabel: string, index: number): LiveMatch | null {
  const home = game?.homeTeam ?? game?.home ?? game?.teams?.home;
  const away = game?.awayTeam ?? game?.away ?? game?.teams?.away;
  if (!home || !away) return null;
  return {
    id: text(game.id) ?? `${league}-${index}`,
    league,
    leagueLabel,
    name: text(game.name) ?? `${text(away.name) ?? "Away team"} at ${text(home.name) ?? "Home team"}`,
    date: text(game.date) ?? text(game.startTime) ?? "",
    status: text(game.status?.type?.shortDetail) ?? text(game.status?.type?.detail) ?? text(game.status) ?? "Scheduled",
    period: text(game.period) ?? text(game.status?.period),
    clock: text(game.clock) ?? text(game.status?.clock),
    home: { name: text(home.name) ?? "Home team", shortName: text(home.shortName), logo: text(home.logo), score: text(home.score), winner: Boolean(home.winner) },
    away: { name: text(away.name) ?? "Away team", shortName: text(away.shortName), logo: text(away.logo), score: text(away.score), winner: Boolean(away.winner) },
    venue: text(game.venue),
    broadcast: text(game.broadcast),
  };
}

export function normalizeLiveScores(payload: any): LiveMatch[] {
  if (!payload?.success) return [];
  const matches: LiveMatch[] = [];
  for (const [league, value] of Object.entries(payload)) {
    if (league === "success" || !value || typeof value !== "object") continue;
    const games = Array.isArray((value as any).games) ? (value as any).games : Array.isArray((value as any).events) ? (value as any).events : [];
    games.forEach((game: any, index: number) => {
      const normalized = normalizeGame(game, league, text((value as any).name) ?? league.toUpperCase(), index);
      if (normalized) matches.push(normalized);
    });
  }
  return matches;
}

export async function fetchLiveScores(): Promise<LiveMatch[]> {
  const response = await fetch(LIVE_SCORES_ENDPOINT, { headers: { Accept: "application/json" } });
  const raw = await response.text().catch(() => "");
  if (!response.ok) throw new Error(`LiveScore service returned HTTP ${response.status}.`);
  if (!raw.trim()) throw new Error("LiveScore returned no match data.");
  let payload: any;
  try { payload = JSON.parse(raw); } catch { throw new Error("LiveScore returned an unreadable response."); }
  if (payload?.success === false) throw new Error(typeof payload.message === "string" ? payload.message : "LiveScore is temporarily unavailable.");
  return normalizeLiveScores(payload);
}
