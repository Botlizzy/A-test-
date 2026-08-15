import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Download, LoaderCircle, Search, ShieldCheck, Sparkles, Wrench, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import catalogJson from "@/data/apiCatalog.json";
import { BUILD_REVISION } from "@/generated/buildRevision";
import { fieldLabel, functionalMode, isAudioUrl, isImageUrl, isVideoUrl, taskDescription, taskTitle } from "@/lib/toolTasks";

type Endpoint = { category: string; path: string; alias: string; method: string; tags: string[]; text: string };
type Catalog = { base: string; count: number; endpoints: Endpoint[] };

type ToolHubProps = { user?: User; onBack: () => void; onSignOut: () => Promise<void> };
const catalog = catalogJson as Catalog;
const categoryNames: Record<string, string> = { ai: "AI", aimusic: "AI Music", anime: "Anime", canvas: "Canvas", download: "Downloader", fun: "Fun", games: "Games", imagegen: "Image Generation", imageToImage: "Image to Image", movies: "Movies", news: "News", random: "Random", search: "Search", socialboost: "Social Boost", sports: "Sports", stalk: "Stalk", tempmail: "Tempmail", tempnumber: "Temp Numbers", tools: "Tools", uploader: "Uploader", urlshortener: "URL Shortener", xxx: "18+ / XXX" };
const workspaceFields: Record<string, string[]> = { downloader: ["url", "format", "quality", "page"], search: ["q", "query", "page", "url"], ai: ["prompt", "text", "model", "sessionId"], media: ["prompt", "text", "model", "url"], utility: ["url", "text", "username", "id"], adult: ["q", "query", "page", "url"] };
const featuredTasks = [
  { label: "Download a TikTok video", path: "/download/tiktok" },
  { label: "Search XNXX videos", path: "/search/xnxx" },
  { label: "Create an AI image", path: "/fluxv2" },
  { label: "Transform an image", path: "/imageToImage/gpt-image-2" },
  { label: "Get a random quote", path: "/random/quotes" },
  { label: "Create a full Suno track", path: "/aimusic/suno/create" },
  { label: "Open 18+ tools", path: "/xxx/xvideos" },
];
function modeLabel(mode: string) { return ({ downloader: "DO THE DOWNLOAD", search: "GET THE ANSWER", ai: "CREATE WITH AI", media: "MAKE YOUR MEDIA", adult: "18+ TOOL", utility: "COMPLETE THE TASK" } as Record<string, string>)[mode] || "COMPLETE THE TASK"; }
function safeFileName(url: string) { try { const name = new URL(url).pathname.split("/").pop() || "eliminator-result"; return name.replace(/[^a-z0-9._-]/gi, "-").slice(-80); } catch { return "eliminator-result"; } }

function prettyCategory(category: string) { return categoryNames[category] || category; }
function isAdult(endpoint: Endpoint) { return functionalMode(endpoint) === "adult"; }
function stringify(value: unknown) { return typeof value === "string" ? value : JSON.stringify(value, null, 2); }
function findLinks(value: unknown): string[] { const text = stringify(value); return Array.from(new Set(text.match(/https?:\/\/[^\s"'\\]+/g) || [])).filter((url) => !url.includes("apis.davidcyril.name.ng")).slice(0, 12); }
function findAudioLinks(value: unknown): string[] {
  const found: string[] = [];
  const visit = (node: unknown, keyHint = "") => {
    if (typeof node === "string") {
      const urls = node.match(/https?:\/\/[^\s"'\\]+/g) || [];
      urls.forEach((url) => { if (!url.includes("apis.davidcyril.name.ng") && !isVideoUrl(url) && (isAudioUrl(url) || /audio|music|song|track|download/i.test(keyHint))) found.push(url.replace(/[),.;]+$/, "")); });
      return;
    }
    if (Array.isArray(node)) { node.forEach((item) => visit(item, keyHint)); return; }
    if (node && typeof node === "object") Object.entries(node).forEach(([key, child]) => visit(child, key));
  };
  visit(value);
  return Array.from(new Set(found)).slice(0, 8);
}

export default function ToolHub({ user, onBack, onSignOut }: ToolHubProps) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedPath, setSelectedPath] = useState(() => new URLSearchParams(window.location.search).get("tool") || "");
  const [fields, setFields] = useState<Record<string, string>>(() => { const params = new URLSearchParams(window.location.search); return { url: params.get("url") || "", q: params.get("q") || "", query: params.get("query") || "", text: params.get("text") || "", prompt: params.get("prompt") || "", id: params.get("id") || "", username: params.get("username") || "", page: params.get("page") || "1" }; });
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadState, setDownloadState] = useState<Record<string, "idle" | "downloading" | "success" | "error">>({});
  const [adultAccepted, setAdultAccepted] = useState(() => localStorage.getItem("eliminator-tools-18-plus") === "true");
  const [liveRevision, setLiveRevision] = useState(() => new URLSearchParams(window.location.search).get("revision") || BUILD_REVISION);

  const categories = useMemo(() => Array.from(new Set(catalog.endpoints.map((item) => item.category))), []);
  const filtered = useMemo(() => catalog.endpoints.filter((item) => (category === "all" || item.category === category) && `${item.alias} ${item.path} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  const selected = catalog.endpoints.find((item) => item.path === selectedPath) || null;
  const activeMode = selected ? functionalMode(selected) : "utility";
  const activeFields = workspaceFields[activeMode] || workspaceFields.utility;
  const links = result ? findLinks(result) : [];
  const audioLinks = result ? findAudioLinks(result) : [];

  const choose = (endpoint: Endpoint) => { setSelectedPath(endpoint.path); setResult(null); setError(""); window.history.replaceState({}, "", `/?tools=1&tool=${encodeURIComponent(endpoint.path)}`); };
  const updateField = (name: string, value: string) => setFields((current) => ({ ...current, [name]: value }));
  const downloadLink = async (url: string) => {
    setDownloadState((current) => ({ ...current, [url]: "downloading" }));
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Download failed (${response.status})`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = safeFileName(url);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setDownloadState((current) => ({ ...current, [url]: "success" }));
    } catch {
      setDownloadState((current) => ({ ...current, [url]: "error" }));
    }
  };
  const execute = async () => {
    if (!selected) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const rawValues = Object.fromEntries(Object.entries(fields).filter(([key, value]) => key !== "__json" && value.trim()));
      let values: Record<string, string | number | boolean> = rawValues;
      if (fields.__json?.trim()) {
        const extra = JSON.parse(fields.__json) as Record<string, string | number | boolean>;
        values = { ...rawValues, ...extra };
      }
      const isPost = selected.method.includes("POST");
      const target = new URL(`${catalog.base}${selected.path}`);
      if (!isPost) Object.entries(values).forEach(([key, value]) => target.searchParams.set(key, String(value)));
      const response = await fetch(target.toString(), { method: isPost ? "POST" : "GET", headers: isPost ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" }, body: isPost ? JSON.stringify(values) : undefined });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || `Request failed (${response.status})`);
      setResult(payload);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The tool could not complete the request."); }
    finally { setBusy(false); }
  };

  useEffect(() => { const params = new URLSearchParams(window.location.search); if (params.get("run") === "1" && selected && !isAdult(selected)) void execute(); }, [selectedPath]);
  useEffect(() => { void fetch("https://api.github.com/repos/Botlizzy/A-test-/commits/main", { headers: { Accept: "application/vnd.github+json" } }).then((response) => response.ok ? response.json() : null).then((commit) => { const sha = typeof commit?.sha === "string" ? commit.sha.slice(0, 7) : ""; if (sha) setLiveRevision(sha); }).catch(() => undefined); }, []);

  if (selected && isAdult(selected) && !adultAccepted) return <div className="tools-shell"><header className="tools-topbar"><button className="brand" onClick={onBack}><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>eliminator</strong><em>multitools</em></span></button></header><main className="tools-gate"><div className="tools-gate__card"><span className="tools-gate__icon"><ShieldCheck size={26} /></span><span className="eyebrow eyebrow--red">18+ TOOL SPACE</span><h1>Confirm before continuing.</h1><p>This endpoint can return adult material. Continue only if you are legally an adult where you are.</p><button className="red-button" onClick={() => { localStorage.setItem("eliminator-tools-18-plus", "true"); setAdultAccepted(true); }}>I’m 18+ — open tool</button><button className="secondary-button" onClick={() => setSelectedPath("")}>Return to tools</button></div></main></div>;

  return <div className="tools-shell"><header className="tools-topbar"><button className="brand" onClick={onBack}><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>eliminator</strong><em>multitools</em></span></button><div className="tools-topbar__actions"><span className="tools-build" data-build-revision={liveRevision}>Build {liveRevision}</span><span className="tools-user">{user ? (user.user_metadata?.full_name || user.email) : "Public tools"}</span><button className="refresh-button" onClick={onBack}><ArrowLeft size={15} /> Feed</button>{user && <button className="refresh-button" onClick={onSignOut}><X size={15} /> Sign out</button>}</div></header><main className="tools-layout"><aside className="tools-sidebar"><div className="tools-sidebar__intro"><span className="eyebrow eyebrow--blue">ELIMINATOR LAB</span><h1>Every endpoint,<br /><i>one workspace.</i></h1><p>{catalog.count} practical tools across {categories.length} task spaces. Choose what you want to do, not the API behind it.</p></div><label className="tools-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" /></label><div className="tools-featured"><span className="eyebrow eyebrow--red">START WITH A TASK</span>{featuredTasks.map((task) => <button key={task.path} onClick={() => { const endpoint = catalog.endpoints.find((item) => item.path === task.path); if (endpoint) choose(endpoint); }}>{task.label}</button>)}</div><div className="tools-categories"><button className={category === "all" ? "is-active" : ""} onClick={() => setCategory("all")}>All tools <b>{catalog.count}</b></button>{categories.map((item) => <button className={category === item ? "is-active" : ""} key={item} onClick={() => setCategory(item)}>{prettyCategory(item)} <b>{catalog.endpoints.filter((endpoint) => endpoint.category === item).length}</b></button>)}</div></aside><section className="tools-content"><div className="tools-heading"><div><span className="eyebrow">{category === "all" ? "ALL ENDPOINTS" : prettyCategory(category).toUpperCase()}</span><h2>{selected ? selected.alias : "Choose a tool to begin."}</h2><p>{selected ? taskDescription(selected) : "Choose a task and complete it here with a focused input, a real result, and save/copy actions."}</p></div><span className="tools-count">{filtered.length} shown</span></div><div className="tools-body"><div className="tools-grid">{filtered.map((endpoint) => <button className={`tool-card ${selectedPath === endpoint.path ? "is-selected" : ""}`} key={`${endpoint.category}-${endpoint.path}`} onClick={() => choose(endpoint)}><span className="tool-card__icon">{isAdult(endpoint) ? <ShieldCheck size={17} /> : endpoint.category === "download" ? <Download size={17} /> : endpoint.category === "ai" ? <Sparkles size={17} /> : <Wrench size={17} />}</span><span><strong>{endpoint.alias}</strong><small>{taskTitle(endpoint)}</small></span><span className="tool-card__method">{functionalMode(endpoint) === "downloader" ? "DO IT" : functionalMode(endpoint) === "ai" || functionalMode(endpoint) === "media" ? "MAKE" : "RUN"}</span></button>)}</div>{selected && <section className="tool-workspace"><div className="tool-workspace__top"><div><span className="eyebrow eyebrow--blue">{modeLabel(activeMode)}</span><h3>{taskTitle(selected)}</h3><p>{taskDescription(selected)}</p></div><button className="text-button" onClick={() => { setSelectedPath(""); setResult(null); }}>Close workspace</button></div><div className="tool-form"><div className="tool-fields">{activeFields.map((field) => <label key={field}>{fieldLabel(field, activeMode)}<input value={fields[field] || ""} onChange={(event) => updateField(field, event.target.value)} placeholder={field === "url" ? "https://…" : field === "prompt" ? "Describe the result you want…" : field === "q" || field === "query" ? "Type your search…" : `Enter ${field}`} /></label>)}</div><p className="tool-hint">Need something extra? Add optional settings below. You never need to know the service URL to use this task.</p><label className="tool-json-field">Advanced options (optional)<textarea value={fields.__json || ""} onChange={(event) => updateField("__json", event.target.value)} placeholder='{"option":"value"}' rows={4} /></label><button className="primary-button" onClick={execute} disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />} {busy ? "Working on it…" : activeMode === "downloader" ? "Get my file" : activeMode === "ai" || activeMode === "media" ? "Create result" : "Complete task"}</button></div>{error && <div className="tools-error">{error}</div>}{result !== null && <div className="tool-result"><div className="tool-result__head"><span className="eyebrow">RESULT</span><div><button className="text-button" onClick={() => { navigator.clipboard?.writeText(stringify(result)); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }}><Copy size={14} /> {copied ? "Copied" : "Copy JSON"}</button></div></div>{links.length > 0 && <div className="tool-result__links">{links.map((link) => <div className="tool-result__link-row" key={link}><a href={link} target="_blank" rel="noreferrer">{isVideoUrl(link) ? "Open video preview" : isImageUrl(link) ? "Open image result" : "Open returned file"}</a><button className="tool-download" onClick={() => downloadLink(link)} disabled={downloadState[link] === "downloading"}>{downloadState[link] === "downloading" ? <LoaderCircle size={13} className="spin" /> : <Download size={13} />} {downloadState[link] === "downloading" ? "Preparing…" : downloadState[link] === "success" ? "Saved" : downloadState[link] === "error" ? "Retry" : "Save"}</button></div>)}</div>}{links.some(isVideoUrl) && <div className="tool-result__media">{links.filter(isVideoUrl).map((link) => <video key={link} controls preload="metadata" src={link} aria-label="Returned video preview" />)}</div>}{links.some(isImageUrl) && <div className="tool-result__media">{links.filter(isImageUrl).map((link) => <img key={link} src={link} alt="Returned result" loading="lazy" />)}</div>}{audioLinks.length > 0 && <div className="tool-result__audio"><span className="eyebrow eyebrow--blue">FULL TRACK RETURNED</span>{audioLinks.map((link) => <div className="tool-result__audio-row" key={link}><audio controls preload="metadata" src={link} aria-label="Complete returned track" /><button className="tool-download" onClick={() => downloadLink(link)} disabled={downloadState[link] === "downloading"}>{downloadState[link] === "downloading" ? "Preparing…" : downloadState[link] === "success" ? "Saved" : downloadState[link] === "error" ? "Retry save" : "Save full track"}</button></div>)}</div>}{selected.category === "aimusic" && audioLinks.length === 0 && <p className="tool-result__note">The endpoint returned its JSON response, but no complete audio URL was included yet. For async Suno jobs, copy the task ID into Suno Status and run it again when the track is ready.</p>}<pre>{stringify(result)}</pre></div>}</section>}</div></section></main></div>;
}
