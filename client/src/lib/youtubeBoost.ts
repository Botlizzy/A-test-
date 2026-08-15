export type YouTubeBoostType = "views" | "likes" | "subscribers";

const BOOST_ENDPOINT = "https://apis.davidcyril.name.ng/api/youtube/boost4";

export function isYouTubeTarget(value: string, type: YouTubeBoostType): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (type === "subscribers") return /^https?:\/\/(www\.)?youtube\.com\/(channel\/|@)[^/]+/i.test(trimmed);
  return /^https?:\/\/(www\.)?youtube\.com\/(watch\?v=|shorts\/)[^\s]+/i.test(trimmed);
}

export function getYouTubeBoostUrl(target: string, type: YouTubeBoostType): string {
  const url = new URL(BOOST_ENDPOINT);
  url.searchParams.set("url", target.trim());
  url.searchParams.set("type", type);
  return url.toString();
}
