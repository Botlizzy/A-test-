export type TikTokBoostType = "video_views" | "like" | "followers";

const BOOST_ENDPOINT = "https://apis.davidcyril.name.ng/api/tiktok/boost";

export function isTikTokTarget(value: string, type: TikTokBoostType): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (type === "followers") return trimmed.startsWith("@") || /^https?:\/\/(www\.)?tiktok\.com\/@[^/]+\/?$/i.test(trimmed);
  return /^https?:\/\/(www\.)?tiktok\.com\/@[^/]+\/video\/\d+/i.test(trimmed) || /^https?:\/\/vm\.tiktok\.com\/[A-Za-z0-9_-]+\/?$/i.test(trimmed);
}

export function getTikTokBoostUrl(target: string, type: TikTokBoostType): string {
  const url = new URL(BOOST_ENDPOINT);
  url.searchParams.set("url", target.trim());
  url.searchParams.set("type", type);
  return url.toString();
}
