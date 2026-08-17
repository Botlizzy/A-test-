import { FormEvent, useEffect, useState } from "react";
import { Archive, Check, CircleAlert, Download, Globe2, LoaderCircle, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const CLONE_STATUS_MESSAGES = ["Connecting to the clone service…", "Fetching the authorized website…", "Collecting pages and assets…", "Packaging the ZIP archive…"];

export default function PremiumWebCloner() {
  const [targetUrl, setTargetUrl] = useState("");
  const [statusIndex, setStatusIndex] = useState(0);
  const [authorized, setAuthorized] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string } | null>(null);
  const [error, setError] = useState("");
  const clone = trpc.webClone.clone.useMutation({
    onSuccess: (value) => { setResult(value); setError(""); toast.success("Web clone ready", { description: `${value.filename} is ready to download.` }); },
    onError: (cause) => { const message = cause.message || "The web clone could not be prepared."; setResult(null); setError(message); toast.error("Web clone failed", { description: message }); },
  });
  useEffect(() => {
    if (!clone.isPending) { setStatusIndex(0); return; }
    const timer = window.setInterval(() => setStatusIndex((current) => (current + 1) % CLONE_STATUS_MESSAGES.length), 1600);
    return () => window.clearInterval(timer);
  }, [clone.isPending]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = targetUrl.trim();
    if (!authorized || value.length < 8 || clone.isPending) return;
    setError(""); setResult(null);
    clone.mutate({ targetUrl: value, authorized: true });
  };
  return <section className="premium-web-cloner" id="premium-web-cloner">
    <div className="premium-web-cloner__heading"><div><span className="eyebrow eyebrow--red">PREMIUM WEB CLONER</span><h2>Clone an authorized website.</h2><p>Paste a public website you own or are authorized to reproduce. The service prepares a ZIP archive containing the returned clone files.</p></div><span className="premium-api-board__count"><Globe2 size={16} /> ZIP TOOL</span></div>
    <form className="premium-web-cloner__form" onSubmit={submit}><label>Target website URL<input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} type="url" inputMode="url" placeholder="https://your-authorized-site.com" autoComplete="url" /></label><label className="premium-web-cloner__consent"><input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} /><span><ShieldCheck size={17} /><span>I confirm I own this website or have permission to clone it.</span></span></label><button className="red-button" type="submit" disabled={!authorized || targetUrl.trim().length < 8 || clone.isPending}>{clone.isPending ? <><LoaderCircle size={16} className="spin" />Preparing ZIP…</> : <><Archive size={16} />Clone website</>}</button></form>
    {clone.isPending && <div className="premium-web-cloner__progress" role="status" aria-live="polite" aria-atomic="true"><span className="premium-web-cloner__spinner" aria-hidden="true"><LoaderCircle size={20} className="spin" /></span><div><strong>{CLONE_STATUS_MESSAGES[statusIndex]}</strong><p>Web Cloner is working. Keep this page open while the ZIP is prepared.</p><div className="premium-download-progress__track premium-download-progress__track--indeterminate" role="progressbar" aria-label="Web Cloner is processing"><span /></div><span className="premium-web-cloner__status-count">Step {statusIndex + 1} of {CLONE_STATUS_MESSAGES.length}</span></div></div>}
    {error && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{error}</span></div>}
    {result && <div className="premium-web-cloner__result"><div><Check size={18} /><div><strong>Clone ZIP is ready</strong><span>{result.filename}</span></div></div><a className="red-button" href={result.url} download={result.filename} target="_blank" rel="noreferrer"><Download size={16} />Download cloned ZIP</a></div>}
  </section>;
}
