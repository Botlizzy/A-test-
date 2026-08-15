import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Check, CircleAlert, LoaderCircle, LockKeyhole, LogOut, Search, ShieldCheck, UserRound, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = new Set(["mikeakex80@gmail.com", "elijahchinecheremonah@gmail.com"]);
type PremiumAdminProps = { user: User; onBack: () => void; onSignOut: () => Promise<void> };
type Customer = { id: string; full_name: string; email: string; avatar_url?: string | null };
type Entitlement = { active: boolean; transaction_reference?: string | null; notes?: string | null; activated_at?: string | null; activated_by?: string | null };

export default function PremiumAdmin({ user, onBack, onSignOut }: PremiumAdminProps) {
  const isAdmin = ADMIN_EMAILS.has((user.email || "").toLowerCase());
  const [customerId, setCustomerId] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { if (!isAdmin) setError("This account is not approved for premium verification."); }, [isAdmin]);

  const findCustomer = async (event: FormEvent) => {
    event.preventDefault();
    setError(""); setMessage(""); setCustomer(null); setEntitlement(null);
    if (!isAdmin || !supabase) return;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(customerId.trim())) { setError("Enter the customer's Supabase website ID (UUID)."); return; }
    setLoading(true);
    const [{ data: profile, error: profileError }, { data: status, error: statusError }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, avatar_url").eq("id", customerId.trim()).maybeSingle(),
      supabase.from("premium_entitlements").select("active, transaction_reference, notes, activated_at, activated_by").eq("user_id", customerId.trim()).maybeSingle(),
    ]);
    if (profileError) setError(profileError.message.includes("profiles") ? "The profiles table is not ready. Run supabase/schema.sql first." : profileError.message);
    else if (!profile) setError("No customer was found for that website ID.");
    else { setCustomer(profile as Customer); setEntitlement((statusError ? null : status) as Entitlement | null); setReference(status?.transaction_reference || ""); setNotes(status?.notes || ""); }
    setLoading(false);
  };

  const updatePremium = async (active: boolean) => {
    if (!supabase || !customer || !isAdmin) return;
    if (active && reference.trim().length < 3) { setError("Add the WhatsApp transaction reference before activating Premium."); return; }
    setError(""); setMessage(""); setBusy(true);
    const { error: updateError } = await supabase.from("premium_entitlements").upsert({ user_id: customer.id, active, transaction_reference: reference.trim() || null, notes: notes.trim() || null, activated_at: active ? new Date().toISOString() : null, activated_by: user.email || null }, { onConflict: "user_id" });
    if (updateError) setError(updateError.message.includes("premium_entitlements") ? "The premium table is not ready. Run supabase/schema.sql first." : updateError.message);
    else { setEntitlement({ active, transaction_reference: reference.trim() || null, notes: notes.trim() || null, activated_at: active ? new Date().toISOString() : null, activated_by: user.email || null }); setMessage(active ? "Premium access activated for this customer." : "Premium access revoked for this customer."); }
    setBusy(false);
  };

  return <div className="admin-shell"><header className="profile-topbar"><a className="brand" href="#admin" onClick={(event) => { event.preventDefault(); onBack(); }}><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>eliminator</strong><em>admin</em></span></a><div className="profile-topbar__actions"><button className="profile-link" onClick={onBack}><ArrowLeft size={15} /> Back to feed</button><button className="profile-link profile-link--muted" onClick={onSignOut}><LogOut size={15} /> Sign out</button></div></header><main className="admin-layout"><section className="admin-intro"><span className="eyebrow eyebrow--red">PRIVATE CONTROL ROOM</span><h1>Verify a<br /><i>premium signal.</i></h1><p>Find a customer by their website ID, review the WhatsApp transaction reference, then activate or revoke access. Every change records the approving administrator.</p><div className="profile-trust"><LockKeyhole size={18} /><div><b>Admin-only controls</b><span>{isAdmin ? user.email : "Access denied"}</span></div></div></section>{isAdmin ? <section className="admin-card"><div className="admin-card__heading"><span className="admin-card__icon"><ShieldCheck size={19} /></span><div><span className="eyebrow">CUSTOMER VERIFICATION</span><h2>Manual activation</h2></div></div><form className="admin-search" onSubmit={findCustomer}><label>Customer website ID<input value={customerId} onChange={(event) => setCustomerId(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></label><button className="primary-button" type="submit" disabled={loading}>{loading ? <LoaderCircle size={16} className="spin" /> : <Search size={16} />} Find customer</button></form>{customer && <div className="customer-result"><div className="customer-result__identity"><span className="profile-avatar"><UserRound size={18} /></span><div><b>{customer.full_name || "Unnamed viewer"}</b><span>{customer.email}</span><small>{customer.id}</small></div><span className={entitlement?.active ? "admin-status admin-status--active" : "admin-status"}>{entitlement?.active ? "PREMIUM ACTIVE" : "NOT ACTIVE"}</span></div><label>WhatsApp transaction reference<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Reference supplied by customer" /></label><label>Admin notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional verification notes" rows={3} /></label><div className="admin-actions"><button className="red-button" type="button" disabled={busy} onClick={() => updatePremium(true)}>{busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />} Activate Premium</button><button className="secondary-button" type="button" disabled={busy} onClick={() => updatePremium(false)}><X size={16} /> Revoke access</button></div></div>}{error && <div className="auth-message auth-message--error"><CircleAlert size={16} /><span>{error}</span></div>}{message && <div className="auth-message auth-message--success"><Check size={16} /><span>{message}</span></div>}</section> : <section className="admin-card admin-card--denied"><LockKeyhole size={28} /><h2>Access denied.</h2><p>Only the two approved administrator emails can use premium verification.</p></section>}</main></div>;
}
