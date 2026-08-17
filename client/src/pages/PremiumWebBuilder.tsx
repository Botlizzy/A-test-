import { FormEvent, useState, type CSSProperties } from "react";
import { CircleAlert, ExternalLink, Globe2, LoaderCircle, Rocket, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Draft = {
  title: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  sections: Array<{ heading: string; body: string; ctaLabel?: string }>;
  footer: string;
};

type CodeArtifact = { downloadUrl: string; filename: string; files: string[]; model?: string; totalFiles?: number };

export default function PremiumWebBuilder() {
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [artifact, setArtifact] = useState<CodeArtifact | null>(null);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [error, setError] = useState("");
  const generate = trpc.webBuilder.generate.useMutation({
    onSuccess: (result) => { setDraft(result.draft as Draft); setArtifact(result.artifact as CodeArtifact); setPublishedUrl(""); setError(""); },
    onError: (cause) => setError(cause.message || "The AI builder could not create a draft."),
  });
  const publish = trpc.webBuilder.publish.useMutation({
    onSuccess: (result) => { setPublishedUrl(result.url); setError(""); },
    onError: (cause) => setError(cause.message || "The site could not be published."),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const brief = prompt.trim();
    if (brief.length < 12 || generate.isPending) return;
    setError("");
    generate.mutate({ prompt: brief });
  };

  return <section className="premium-web-builder" id="premium-web-builder">
    <div className="premium-web-builder__heading"><div><span className="eyebrow eyebrow--red">PREMIUM AI WEB BUILDER</span><h2>Describe it. Preview it. Publish it.</h2><p>Turn a clear brief into a mobile-first website project with the Azbry AI coder. Download the generated ZIP, review the safe preview, and publish the approved static page when ready.</p></div><span className="premium-api-board__count"><Globe2 size={16} /> BUILDER</span></div>
    <form className="premium-web-builder__form" onSubmit={submit}><label>What should your website be?<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} maxLength={1200} placeholder="Create a bold landing page for a Lagos photography studio with a warm orange palette, three services, a booking call to action, and a concise footer." /></label><div className="premium-web-builder__actions"><span>{prompt.trim().length}/1200 characters</span><button className="red-button" type="submit" disabled={generate.isPending || prompt.trim().length < 12}>{generate.isPending ? <><LoaderCircle size={16} className="spin" />Building draft…</> : <><Sparkles size={16} />Generate code project</>}</button></div></form>
    {error && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{error}</span></div>}
    {generate.isPending && <div className="premium-web-builder__status"><LoaderCircle size={18} className="spin" /><div><strong>AI is shaping your site</strong><p>Creating readable sections, colors, and mobile-first copy.</p></div></div>}
    {draft && <div className="premium-web-builder__workspace"><div className="premium-web-builder__preview"><div className="premium-web-builder__previewbar"><span>LIVE DRAFT PREVIEW</span><span className="premium-web-builder__dots"><i /><i /><i /></span></div><div className="premium-web-builder__site" style={{ "--builder-primary": draft.primaryColor, "--builder-accent": draft.accentColor } as CSSProperties}><header><span className="eyebrow">AI WEB BUILDER</span><h3>{draft.title}</h3><p>{draft.tagline}</p></header>{draft.sections.map((section, index) => <article key={`${section.heading}-${index}`}><span>0{index + 1}</span><div><h4>{section.heading}</h4><p>{section.body}</p>{section.ctaLabel && <button type="button">{section.ctaLabel}</button>}</div></article>)}<footer>{draft.footer}</footer></div></div><aside className="premium-web-builder__publish"><span className="eyebrow eyebrow--blue">PUBLISH CONTROL</span><h3>Ready to go live?</h3><p>The AI coder has prepared a downloadable project ZIP. The safe preview can also be published as a hosted static page after you approve it.</p>{artifact && <div className="premium-web-builder__published"><strong>AI code package ready</strong><span>{artifact.model ? `${artifact.model} · ` : ""}{artifact.totalFiles || artifact.files.length || 1} file{(artifact.totalFiles || artifact.files.length || 1) === 1 ? "" : "s"}</span><a href={artifact.downloadUrl} download={artifact.filename} target="_blank" rel="noreferrer">Download {artifact.filename} <ExternalLink size={14} /></a></div>}<button className="red-button" type="button" onClick={() => publish.mutate({ draft })} disabled={publish.isPending}>{publish.isPending ? <><LoaderCircle size={16} className="spin" />Publishing…</> : <><Rocket size={16} />Publish static site</>}</button>{publishedUrl && <div className="premium-web-builder__published"><strong>Published successfully</strong><a href={publishedUrl} target="_blank" rel="noreferrer">Open published site <ExternalLink size={14} /></a><code>{publishedUrl}</code></div>}</aside></div>}
  </section>;
}
