export type ToolEndpointLike = {
  category: string;
  alias: string;
  path: string;
  tags?: string[];
};

export type FunctionalMode = "downloader" | "search" | "ai" | "media" | "adult" | "utility";

export function functionalMode(endpoint: ToolEndpointLike): FunctionalMode {
  if (["download", "uploader", "urlshortener"].includes(endpoint.category)) return "downloader";
  if (["search", "news", "movies", "sports", "stalk", "tempmail", "tempnumber"].includes(endpoint.category)) return "search";
  if (["ai", "aimusic"].includes(endpoint.category)) return "ai";
  if (["imagegen", "imageToImage", "anime"].includes(endpoint.category)) return "media";
  if (endpoint.category === "xxx" || endpoint.tags?.some((tag) => /nsfw|xxx|adult|porn/i.test(tag))) return "adult";
  return "utility";
}

export function taskTitle(endpoint: ToolEndpointLike): string {
  switch (endpoint.category) {
    case "download": return "Download your media";
    case "uploader": return "Upload and share a file";
    case "urlshortener": return "Shorten a long URL";
    case "imagegen": return "Generate an image";
    case "imageToImage": return "Transform an image";
    case "anime": return "Create an anime-style result";
    case "ai": return "Create with AI";
    case "aimusic": return "Create a complete track with AI";
    case "search": return "Search the web service";
    case "news": return "Find the latest news";
    case "movies": return "Find a movie or show";
    case "sports": return "Look up sports information";
    case "stalk": return "Look up a public profile";
    case "tempmail": return "Create a temporary inbox";
    case "tempnumber": return "Create a temporary number";
    case "xxx": return "Open the 18+ tool";
    case "fun": return "Run a fun utility";
    case "random": return "Generate a random result";
    default: return "Run this utility";
  }
}

export function taskDescription(endpoint: ToolEndpointLike): string {
  if (endpoint.category === "aimusic") return "Describe the track you want. When the service returns a complete audio URL, Eliminator plays the full track here and gives you a Save full track action.";
  switch (functionalMode(endpoint)) {
    case "downloader": return "Paste the link or file input below and get the result here, with preview and save actions when the service returns a usable file.";
    case "search": return "Enter what you want to find and receive the result in this workspace instead of leaving Eliminator.";
    case "ai": return "Describe what you want created, then review the returned text, media, or downloadable result here.";
    case "media": return "Provide a prompt or source image URL and review the generated or transformed result here.";
    case "adult": return "Enter the requested input after confirming you are legally an adult. Results stay behind the 18+ gate.";
    default: return "Enter the requested input and complete the task in this workspace.";
  }
}

export function fieldLabel(field: string, mode: FunctionalMode): string {
  if (field === "url") return mode === "downloader" ? "Paste your video, image, or file URL" : "Paste a URL";
  if (field === "prompt") return "Describe what you want";
  if (field === "text") return "Enter text";
  if (field === "q" || field === "query") return "What should we search for?";
  if (field === "username") return "Enter a username";
  if (field === "id") return "Enter an ID";
  if (field === "page") return "Page number";
  if (field === "quality") return "Quality (optional)";
  if (field === "format") return "Format (optional)";
  if (field === "model") return "Model (optional)";
  if (field === "sessionId") return "Session (optional)";
  return field;
}

export function isAudioUrl(url: string): boolean {
  return /\.(mp3|wav|m4a|aac|ogg|opus|flac)(?:$|[?#])/i.test(url) || /(?:audio|music|song|track|sound|tts)/i.test(url);
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(url) || /video/i.test(url);
}

export function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg)(?:$|[?#])/i.test(url) || /image/i.test(url);
}
