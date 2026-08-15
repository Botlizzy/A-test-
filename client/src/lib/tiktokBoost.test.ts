import { describe, expect, it } from "vitest";
import { getTikTokBoostUrl, isTikTokTarget } from "./tiktokBoost";

describe("TikTok Boost helpers", () => {
  it("accepts video URLs for video views and likes", () => {
    const target = "https://www.tiktok.com/@creator/video/7309665333272778030";
    expect(isTikTokTarget(target, "video_views")).toBe(true);
    expect(isTikTokTarget(target, "like")).toBe(true);
  });

  it("accepts profile targets for followers only", () => {
    expect(isTikTokTarget("@creator", "followers")).toBe(true);
    expect(isTikTokTarget("https://www.tiktok.com/@creator", "followers")).toBe(true);
    expect(isTikTokTarget("@creator", "video_views")).toBe(false);
  });

  it("builds the documented API URL", () => {
    const url = getTikTokBoostUrl("https://www.tiktok.com/@creator/video/7309665333272778030", "video_views");
    expect(url).toContain("https://apis.davidcyril.name.ng/api/tiktok/boost?");
    expect(url).toContain("type=video_views");
    expect(url).toContain("url=https%3A%2F%2Fwww.tiktok.com");
  });
});
