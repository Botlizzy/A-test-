import { describe, expect, it } from "vitest";
import { LIVE_SCORES_ENDPOINT, normalizeLiveScores } from "./liveScores";

describe("Premium LiveScore helper", () => {
  it("uses the documented sports endpoint", () => {
    expect(LIVE_SCORES_ENDPOINT).toBe("https://apis.davidcyril.name.ng/sports/live");
  });

  it("normalizes league games into readable match cards", () => {
    const matches = normalizeLiveScores({ success: true, nfl: { games: [{ id: "1", name: "Away at Home", status: "In Progress", period: 4, clock: "8:45", awayTeam: { name: "Away Team", score: "13", logo: "https://cdn.example/away.png" }, homeTeam: { name: "Home Team", score: "9", logo: "https://cdn.example/home.png" } }] } });
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ league: "nfl", status: "In Progress", away: { name: "Away Team", score: "13" }, home: { name: "Home Team", score: "9" } });
  });

  it("supports event arrays and ignores malformed entries", () => {
    const matches = normalizeLiveScores({ success: true, soccer: { events: [{ id: "2", date: "2026-08-15T20:00:00Z", home: { name: "Home" }, away: { name: "Away" } }, { id: "bad" }] } });
    expect(matches).toHaveLength(1);
    expect(matches[0].name).toContain("Away");
  });

  it("returns an empty result for unsuccessful payloads", () => {
    expect(normalizeLiveScores({ success: false, message: "unavailable" })).toEqual([]);
  });
});
