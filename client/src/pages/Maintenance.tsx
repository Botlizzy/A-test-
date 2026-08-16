import { Wrench, Radio } from "lucide-react";

export default function Maintenance() {
  return (
    <main className="maintenance-page">
      <div className="maintenance-glow maintenance-glow--one" />
      <div className="maintenance-glow maintenance-glow--two" />
      <section className="maintenance-card" aria-labelledby="maintenance-title">
        <div className="maintenance-brand"><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>ELIZZY</strong><em>DOMAIN</em></span></div>
        <div className="maintenance-icon" aria-hidden="true"><Wrench size={28} /></div>
        <span className="eyebrow eyebrow--red">TEMPORARILY UNAVAILABLE</span>
        <h1 id="maintenance-title">We’re tuning things up.</h1>
        <p>ELIZZY DOMAIN is currently under maintenance while we improve the experience. Please check back shortly.</p>
        <div className="maintenance-status"><Radio size={16} /><span>Maintenance mode is active</span></div>
        <button className="red-button maintenance-refresh" type="button" onClick={() => window.location.reload()}>Refresh page</button>
      </section>
    </main>
  );
}
