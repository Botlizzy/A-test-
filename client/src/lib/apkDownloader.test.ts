import { describe, expect, it } from "vitest";
import { getApkDownloaderUrl, isApkSearch } from "./apkDownloader";
import { isTikTokTarget } from "./tiktokBoost";

describe("APK Downloader helpers", () => {
  it("validates useful app-name searches", () => {
    expect(isApkSearch("WhatsApp")).toBe(true);
    expect(isApkSearch("a")).toBe(false);
    expect(isApkSearch(" ".repeat(81))).toBe(false);
  });

  it("builds the documented APK endpoint URL", () => {
    expect(getApkDownloaderUrl("WhatsApp")).toBe("https://apis.davidcyril.name.ng/download/apk?text=WhatsApp");
  });
});

describe("TikTok mobile target support", () => {
  it("accepts vm.tiktok.com short video links", () => {
    expect(isTikTokTarget("https://vm.tiktok.com/ZSVLwfdyf/", "like")).toBe(true);
  });
});
