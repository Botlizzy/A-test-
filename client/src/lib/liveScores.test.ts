import { describe, expect, it } from "vitest";
import { LIVE_SCORES_ENDPOINT, SOCCER_SCORES_ENDPOINT, isLiveMatch, mergeLiveScoreFeeds, normalizeLiveScores } from "./liveScores";

describe("Premium LiveScore helper", () => {
  it("uses the documented sports endpoint", () => {
    expect(LIVE_SCORES_ENDPOINT).toBe("https://apis.davidcyril.name.ng/sports/live");
  });

  it("normalizes a direct Soccer Scores payload with every game", () => {
    const matches = normalizeLiveScores({ success: true, sport: "Soccer", league: "Premier League", leagueId: "eng.1", games: [
      { id: "1", name: "Away at Home", status: "In Progress", awayTeam: { name: "Away", score: "2" }, homeTeam: { name: "Home", score: "1" } },
      { id: "2", name: "Second at Third", status: "Scheduled", awayTeam: { name: "Second", score: "0" }, homeTeam: { name: "Third", score: "0" } },
    ] });
    expect(matches).toHaveLength(2);
    expect(matches[0]).toMatchObject({ id: "1", leagueLabel: "Premier League", status: "In Progress" });
    expect(matches[1]).toMatchObject({ id: "2", status: "Scheduled" });
  });

  it("normalizes league games into readable match cards", () => {
    const matches = normalizeLiveScores({ success: true, soccer: { name: "Premier League Football", games: [{ id: "1", name: "Away at Home", status: "In Progress", period: 2, clock: "45:00", awayTeam: { name: "Away Team", score: "1", logo: "https://cdn.example/away.png" }, homeTeam: { name: "Home Team", score: "0", logo: "https://cdn.example/home.png" } }] }, nfl: { games: [{ id: "nfl-1", awayTeam: { name: "American Away" }, homeTeam: { name: "American Home" } }] } });
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ league: "soccer", status: "In Progress", away: { name: "Away Team", score: "1" }, home: { name: "Home Team", score: "0" } });
  });

  it("supports event arrays and ignores malformed entries", () => {
    const matches = normalizeLiveScores({ success: true, soccer: { name: "Soccer", events: [{ id: "2", date: "2026-08-15T20:00:00Z", home: { name: "Home" }, away: { name: "Away" } }, { id: "bad" }] } });
    expect(matches).toHaveLength(1);
    expect(matches[0].name).toContain("Away");
  });

  it("deduplicates a fixture when it appears in both feed shapes", () => {
    const matches = normalizeLiveScores({ success: true, league: "Premier League", games: [{ id: "same", awayTeam: { name: "Away" }, homeTeam: { name: "Home" } }], soccer: { name: "Premier League", games: [{ id: "same", awayTeam: { name: "Away" }, homeTeam: { name: "Home" } }, { id: "new", awayTeam: { name: "New Away" }, homeTeam: { name: "New Home" } }] } });
    expect(matches.map((match) => match.id)).toEqual(["same", "new"]);
  });

  it("recognizes live statuses and excludes scheduled or finished statuses", () => {
    expect(isLiveMatch({ status: "In Progress" })).toBe(true);
    expect(isLiveMatch({ status: "Halftime" })).toBe(true);
    expect(isLiveMatch({ status: "Scheduled" })).toBe(false);
    expect(isLiveMatch({ status: "Final" })).toBe(false);
  });

  it("uses both documented football endpoints", () => {
    expect(SOCCER_SCORES_ENDPOINT).toBe("https://apis.davidcyril.name.ng/sports/soccer/scores");
  });

  it("merges both feed shapes, deduplicates, and keeps live games first", () => {
    const matches = mergeLiveScoreFeeds([
      { success: true, soccer: { name: "Premier League", games: [{ id: "same", status: "Scheduled", awayTeam: { name: "Away" }, homeTeam: { name: "Home" } }, { id: "agg-live", status: "In Progress", awayTeam: { name: "Away Live" }, homeTeam: { name: "Home Live" } }] } },
      { success: true, sport: "Soccer", league: "Premier League", leagueId: "eng.1", games: [{ id: "same", status: "Scheduled", awayTeam: { name: "Away" }, homeTeam: { name: "Home" } }, { id: "soc-live", status: "Halftime", awayTeam: { name: "Away Soccer" }, homeTeam: { name: "Home Soccer" } }] },
    ]);
    expect(matches.map((match) => match.id)).toEqual(["agg-live", "soc-live", "same"]);
  });

  it("normalizes every live football league in an aggregated response", () => {
    const matches = normalizeLiveScores({ success: true, premier: { name: "Premier League Football", games: [{ id: "p-live", status: "In Progress", awayTeam: { name: "Away P" }, homeTeam: { name: "Home P" } }, { id: "p-final", status: "Final", awayTeam: { name: "Away Final" }, homeTeam: { name: "Home Final" } }] }, laLiga: { name: "La Liga Soccer", games: [{ id: "la-live", status: "Halftime", awayTeam: { name: "Away LA" }, homeTeam: { name: "Home LA" } }] } });
    const live = matches.filter(isLiveMatch);
    expect(live.map((match) => match.id)).toEqual(["p-live", "la-live"]);
  });

  it("returns an empty result for unsuccessful payloads", () => {
    expect(normalizeLiveScores({ success: false, message: "unavailable" })).toEqual([]);
  });
});
