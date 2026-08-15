import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Download, ExternalLink, LoaderCircle, Search, ShieldCheck, Sparkles, Wrench, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import catalogJson from "@/data/apiCatalog.json";
import { BUILD_REVISION } from "@/generated/buildRevision";

type Endpoint = { category: string; path: string; alias: string; method: string; tags: string[]; text: string };
type Catalog = { base: string; count: number; endpoints: Endpoint[] };

type ToolHubProps = { user?: User; onBack: () => void; onSignOut: () => Promise<void> };
const catalog = catalogJson as Catalog;
const categoryNames: Record<string, string> = { ai: "AI", aimusic: "AI Music", anime: "Anime", canvas: "Canvas", download: "Downloader", fun: "Fun", games: "Games", imagegen: "Image Generation", imageToImage: "Image to Image", movies: "Movies", news: "News", random: "Random", search: "Search", socialboost: "Social Boost", sports: "Sports", stalk: "Stalk", tempmail: "Tempmail", tempnumber: "Temp Numbers", tools: "Tools", uploader: "Uploader", urlshortener: "URL Shortener", xxx: "18+ / XXX" };
const workspaceFields: Record<string, string[]> = { downloader: ["url", "format", "quality", "page"], search: ["q", "query", "page", "url"], ai: ["prompt", "text", "model", "sessionId"], media: ["prompt", "text", "model", "url"], utility: ["url", "text", "username", "id"], adult: ["q", "query", "page", "url"] };
function workspaceMode(endpoint: Endpoint) { if (["download", "uploader", "urlshortener"].includes(endpoint.category)) return "downloader"; if (["search", "news", "movies", "sports", "stalk", "tempmail", "tempnumber"].includes(endpoint.category)) return "search"; if (["ai", "aimusic", "imagegen", "imageToImage", "anime"].includes(endpoint.category)) return endpoint.category === "ai" || endpoint.category === "aimusic" ? "ai" : "media"; if (endpoint.category === "xxx") return "adult"; return "utility"; }
function modeLabel(mode: string) { return ({ downloader: "Downloader workspace", search: "Search & lookup workspace", ai: "AI & generation workspace", media: "Media workspace", adult: "18+ media workspace", utility: "Utility workspace" } as Record<string, string>)[mode] || "Utility workspace"; }
function safeFileName(url: string) { try { const name = new URL(url).pathname.split("/").pop() || "eliminator-result"; return name.replace(/[^a-z0-9._-]/gi, "-").slice(-80); } catch { return "eliminator-result"; } }

function prettyCategory(category: string) { return categoryNames[category] || category; }
function isAdult(endpoint: Endpoint) { return endpoint.category === "xxx" || endpoint.tags.some((tag) => /nsfw|xxx|adult|porn/i.test(tag)); }
function stringify(value: unknown) { return typeof value === "string" ? value : JSON.stringify(value, null, 2); }
function findLinks(value: unknown): string[] { const text = stringify(value); return Array.from(new Set(text.match(/https?:\/\/[^\s"'\\]+/g) || [])).filter((url) => !url.includes("apis.davidcyril.name.ng")).slice(0, 12); }

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
  const [liveRevision, setLiveRevision] = useState(BUILD_REVISION);

  const categories = useMemo(() => Array.from(new Set(catalog.endpoints.map((item) => item.category))), []);
  const filtered = useMemo(() => catalog.endpoints.filter((item) => (category === "all" || item.category === category) && `${item.alias} ${item.path} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  const selected = catalog.endpoints.find((item) => item.path === selectedPath) || null;
  const activeMode = selected ? workspaceMode(selected) : "utility";
  const activeFields = workspaceFields[activeMode] || workspaceFields.utility;
  const links = result ? findLinks(result) : [];

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

  return <div className="tools-shell"><header className="tools-topbar"><button className="brand" onClick={onBack}><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>eliminator</strong><em>multitools</em></span></button><div className="tools-topbar__actions"><span className="tools-build" data-build-revision={liveRevision}>Build {liveRevision}</span><span className="tools-user">{user ? (user.user_metadata?.full_name || user.email) : "Public tools"}</span><button className="refresh-button" onClick={onBack}><ArrowLeft size={15} /> Feed</button>{user && <button className="refresh-button" onClick={onSignOut}><X size={15} /> Sign out</button>}</div></header><main className="tools-layout"><aside className="tools-sidebar"><div className="tools-sidebar__intro"><span className="eyebrow eyebrow--blue">ELIMINATOR LAB</span><h1>Every endpoint,<br /><i>one workspace.</i></h1><p>{catalog.count} documented API tools across {categories.length} categories.</p></div><label className="tools-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools" /></label><div className="tools-categories"><button className={category === "all" ? "is-active" : ""} onClick={() => setCategory("all")}>All tools <b>{catalog.count}</b></button>{categories.map((item) => <button className={category === item ? "is-active" : ""} key={item} onClick={() => setCategory(item)}>{prettyCategory(item)} <b>{catalog.endpoints.filter((endpoint) => endpoint.category === item).length}</b></button>)}</div></aside><section className="tools-content"><div className="tools-heading"><div><span className="eyebrow">{category === "all" ? "ALL ENDPOINTS" : prettyCategory(category).toUpperCase()}</span><h2>{selected ? selected.alias : "Choose a tool to begin."}</h2><p>{selected ? `${selected.method} · ${selected.path} · ${selected.tags.slice(0, 4).join(" · ")}` : "Each card opens a dedicated request workspace with results, links, and copy actions."}</p></div><span className="tools-count">{filtered.length} shown</span></div><div className="tools-body"><div className="tools-grid">{filtered.map((endpoint) => <button className={`tool-card ${selectedPath === endpoint.path ? "is-selected" : ""}`} key={`${endpoint.category}-${endpoint.path}`} onClick={() => choose(endpoint)}><span className="tool-card__icon">{isAdult(endpoint) ? <ShieldCheck size={17} /> : endpoint.category === "download" ? <Download size={17} /> : endpoint.category === "ai" ? <Sparkles size={17} /> : <Wrench size={17} />}</span><span><strong>{endpoint.alias}</strong><small>{endpoint.path}</small></span><span className="tool-card__method">{endpoint.method}</span></button>)}</div>{selected && <section className="tool-workspace"><div className="tool-workspace__top"><div><span className="eyebrow eyebrow--blue">{modeLabel(activeMode).toUpperCase()}</span><h3>{selected.alias}</h3><p>Request <code>{selected.path}</code> using the documented {selected.method} interface. This workspace is tuned for {activeMode} inputs and result links.</p></div><button className="text-button" onClick={() => { setSelectedPath(""); setResult(null); }}>Close workspace</button></div><div className="tool-form"><div className="tool-fields">{activeFields.map((field) => <label key={field}>{field}<input value={fields[field] || ""} onChange={(event) => updateField(field, event.target.value)} placeholder={field === "url" ? "https://…" : `Optional ${field}`} /></label>)}</div><p className="tool-hint">The API documentation may require additional fields for this endpoint. Add them as JSON below when needed.</p><label className="tool-json-field">Additional JSON body (optional)<textarea value={fields.__json || ""} onChange={(event) => updateField("__json", event.target.value)} placeholder='{"key":"value"}' rows={4} /></label><button className="primary-button" onClick={execute} disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />} {busy ? "Running tool…" : "Run tool"}</button></div>{error && <div className="tools-error">{error}</div>}{result !== null && <div className="tool-result"><div className="tool-result__head"><span className="eyebrow">RESULT</span><div><button className="text-button" onClick={() => { navigator.clipboard?.writeText(stringify(result)); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }}><Copy size={14} /> {copied ? "Copied" : "Copy JSON"}</button><a className="text-button" href={`${catalog.base}${selected.path}`} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Docs endpoint</a></div></div>{links.length > 0 && <div className="tool-result__links">{links.map((link) => <div className="tool-result__link-row" key={link}><a href={link} target="_blank" rel="noreferrer">{link}</a><button className="tool-download" onClick={() => downloadLink(link)} disabled={downloadState[link] === "downloading"}>{downloadState[link] === "downloading" ? <LoaderCircle size={13} className="spin" /> : <Download size={13} />} {downloadState[link] === "downloading" ? "Preparing…" : downloadState[link] === "success" ? "Saved" : downloadState[link] === "error" ? "Retry" : "Save"}</button></div>)}</div>}<pre>{stringify(result)}</pre></div>}</section>}</div></section></main></div>;
}
