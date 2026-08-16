export const LIVE_SCORES_ENDPOINT = "https://apis.davidcyril.name.ng/sports/live";
export const SOCCER_SCORES_ENDPOINT = "https://apis.davidcyril.name.ng/sports/soccer/scores";
export const LIVE_SCORES_REFRESH_MS = 60_000;

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

function text(value: unknown): string | undefined {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function isSoccerLeague(league: string, label: string): boolean {
  const value = `${league} ${label}`.toLowerCase();
  if (/\b(nfl|cfl|xfl|usfl|ncaa|college|american football)\b/.test(value)) return false;
  return /\b(soccer|football|fifa|uefa|epl|premier league|champions league|europa league|laliga|la liga|serie a|bundesliga|ligue 1|mls)\b/.test(value);
}

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

function appendGames(matches: LiveMatch[], games: unknown, league: string, leagueLabel: string) {
  if (!Array.isArray(games)) return;
  games.forEach((game, index) => {
    const normalized = normalizeGame(game, league, leagueLabel, index);
    if (normalized) matches.push(normalized);
  });
}

export function isLiveMatch(match: Pick<LiveMatch, "status">): boolean {
  return /live|in progress|in-play|in play|halftime|half time|1st half|2nd half|extra time|penalty/i.test(match.status);
}

export function normalizeLiveScores(payload: any): LiveMatch[] {
  if (!payload?.success) return [];
  const matches: LiveMatch[] = [];

  if (Array.isArray(payload.games)) {
    const league = text(payload.leagueId) ?? text(payload.league) ?? "soccer";
    const leagueLabel = text(payload.league) ?? "Football";
    if (isSoccerLeague(league, leagueLabel)) appendGames(matches, payload.games, league, leagueLabel);
  }

  for (const [league, value] of Object.entries(payload)) {
    if (league === "success" || league === "games" || !value || typeof value !== "object") continue;
    const record = value as any;
    const leagueLabel = text(record.name) ?? text(record.league) ?? league.toUpperCase();
    if (!isSoccerLeague(league, leagueLabel)) continue;
    appendGames(matches, record.games ?? record.events, league, leagueLabel);
  }

  const unique = new Map<string, LiveMatch>();
  matches.forEach((match) => {
    const key = match.id || `${match.league}:${match.name}:${match.date}`;
    if (!unique.has(key)) unique.set(key, match);
  });
  return Array.from(unique.values()).sort((a, b) => {
    const aLive = /live|progress|halftime|in play/i.test(a.status) ? 0 : 1;
    const bLive = /live|progress|halftime|in play/i.test(b.status) ? 0 : 1;
    return aLive - bLive || (a.date || "").localeCompare(b.date || "");
  });
}

export function mergeLiveScoreFeeds(payloads: any[]): LiveMatch[] {
  const matches = payloads.flatMap((payload) => normalizeLiveScores(payload));
  const unique = new Map<string, LiveMatch>();
  matches.forEach((match) => unique.set(match.id || `${match.league}:${match.name}:${match.date}`, match));
  return Array.from(unique.values()).sort((a, b) => {
    const aLive = isLiveMatch(a) ? 0 : 1;
    const bLive = isLiveMatch(b) ? 0 : 1;
    return aLive - bLive || (a.date || "").localeCompare(b.date || "");
  });
}

async function fetchScorePayload(endpoint: string): Promise<any> {
  const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
  const raw = await response.text().catch(() => "");
  if (!response.ok) throw new Error(`LiveScore service returned HTTP ${response.status}.`);
  if (!raw.trim()) throw new Error("LiveScore returned no match data.");
  let payload: any;
  try { payload = JSON.parse(raw); } catch { throw new Error("LiveScore returned an unreadable response."); }
  if (payload?.success === false) throw new Error(typeof payload.message === "string" ? payload.message : "LiveScore is temporarily unavailable.");
  return payload;
}

export async function fetchLiveScores(): Promise<LiveMatch[]> {
  const results = await Promise.allSettled([
    fetchScorePayload(LIVE_SCORES_ENDPOINT),
    fetchScorePayload(SOCCER_SCORES_ENDPOINT),
  ]);
  const payloads = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  if (!payloads.length) throw new Error("Football LiveScore sources are temporarily unavailable. Try again shortly.");
  return mergeLiveScoreFeeds(payloads);
}
