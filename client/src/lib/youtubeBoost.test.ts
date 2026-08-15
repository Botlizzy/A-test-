import { describe, expect, it } from "vitest";
import { getYouTubeBoostUrl, isYouTubeTarget } from "./youtubeBoost";

describe("YouTube Boost 4 helpers", () => {
  it("accepts video targets for views and likes", () => {
    const target = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    expect(isYouTubeTarget(target, "views")).toBe(true);
    expect(isYouTubeTarget(target, "likes")).toBe(true);
  });

  it("accepts channel targets for subscribers", () => {
    expect(isYouTubeTarget("https://www.youtube.com/@creator", "subscribers")).toBe(true);
    expect(isYouTubeTarget("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "subscribers")).toBe(false);
  });

  it("builds the documented Boost 4 URL", () => {
    const url = getYouTubeBoostUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "views");
    expect(url).toContain("https://apis.davidcyril.name.ng/api/youtube/boost4?");
    expect(url).toContain("type=views");
    expect(url).toContain("url=https%3A%2F%2Fwww.youtube.com");
  });
});
