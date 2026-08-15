import { describe, expect, it } from "vitest";
import { getApkDownloaderUrl, getOfficialStoreLinks, isApkSearch, isAuthorizedPackageUrl } from "./apkDownloader";
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

  it("builds official Google Play and Palmstore search links", () => {
    expect(getOfficialStoreLinks("WhatsApp")).toEqual({
      googlePlay: "https://play.google.com/store/search?q=WhatsApp&c=apps",
      palmstore: "https://palmstore.com/search?keyword=WhatsApp",
    });
  });

  it("accepts only official store hosts for optional provider package links", () => {
    expect(isAuthorizedPackageUrl("https://play.google.com/store/apps/details?id=com.example.app")).toBe(true);
    expect(isAuthorizedPackageUrl("https://palmstore.com/app/example")).toBe(true);
    expect(isAuthorizedPackageUrl("https://random-apk.example/file.apk")).toBe(false);
  });
});

describe("TikTok mobile target support", () => {
  it("accepts vm.tiktok.com short video links", () => {
    expect(isTikTokTarget("https://vm.tiktok.com/ZSVLwfdyf/", "like")).toBe(true);
  });
});
