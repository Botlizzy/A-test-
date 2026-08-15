import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Bell, Check, CircleAlert, LoaderCircle, LockKeyhole, LogOut, RefreshCw, Search, ShieldCheck, UserRound, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { isCustomerId, normalizeCustomerId } from "@/lib/adminLookup";

const ADMIN_EMAILS = new Set(["mikeakex80@gmail.com", "elijahchinecheremonah@gmail.com"]);
type PremiumAdminProps = { user: User; onBack: () => void; onSignOut: () => Promise<void> };
type Customer = { id: string; full_name: string; email: string; avatar_url?: string | null };
type Entitlement = { active: boolean; transaction_reference?: string | null; notes?: string | null; activated_at?: string | null; activated_by?: string | null };
type VerificationRequest = { id: string; user_id: string; customer_email: string; customer_name?: string | null; transaction_reference?: string | null; message?: string | null; status: "pending" | "reviewed" | "activated" | "declined"; created_at: string; reviewed_at?: string | null; reviewed_by?: string | null };

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
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [activationCelebration, setActivationCelebration] = useState(false);

  const loadRequests = async () => {
    if (!isAdmin || !supabase) return;
    setRequestsLoading(true);
    const { data, error: requestError } = await supabase.from("verification_requests").select("id, user_id, customer_email, customer_name, transaction_reference, message, status, created_at, reviewed_at, reviewed_by").order("created_at", { ascending: false }).limit(30);
    if (requestError) setError(requestError.message.includes("verification_requests") ? "Run the updated supabase/schema.sql to enable admin notifications." : requestError.message);
    else setRequests((data || []) as VerificationRequest[]);
    setRequestsLoading(false);
  };

  useEffect(() => { if (!isAdmin) setError("This account is not approved for premium verification."); else void loadRequests(); }, [isAdmin]);

  const updateRequestDraft = (id: string, transaction_reference: string) => setRequests((items) => items.map((item) => item.id === id ? { ...item, transaction_reference } : item));

  const celebrateActivation = (customerLabel: string) => {
    setActivationCelebration(true);
    toast.success("Premium activated", { description: `${customerLabel} can now access premium features.` });
    window.setTimeout(() => setActivationCelebration(false), 2600);
  };

  const markReviewed = async (id: string, status: VerificationRequest["status"] = "reviewed") => {
    if (!supabase || !isAdmin) return;
    const { error: updateError } = await supabase.from("verification_requests").update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.email || null }).eq("id", id);
    if (updateError) setError(updateError.message);
    else setRequests((items) => items.map((item) => item.id === id ? { ...item, status, reviewed_at: new Date().toISOString(), reviewed_by: user.email } : item));
  };

  const findCustomer = async (event: FormEvent) => {
    event.preventDefault();
    setError(""); setMessage(""); setCustomer(null); setEntitlement(null);
    if (!isAdmin || !supabase) return;
    const normalizedId = normalizeCustomerId(customerId);
    const linkedRequest = selectedRequestId ? requests.find((request) => request.id === selectedRequestId) : null;
    if (linkedRequest && normalizeCustomerId(linkedRequest.user_id) !== normalizedId) { setError("The selected verification request belongs to a different Customer ID. Tap Use for activation on the matching request or clear the request selection."); return; }
    if (!isCustomerId(normalizedId)) { setError("Paste the customer's Customer / User ID from their Profile page."); return; }
    setCustomerId(normalizedId);
    setLoading(true);
    const [{ data: profile, error: profileError }, { data: status, error: statusError }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, avatar_url").eq("id", normalizedId).maybeSingle(),
      supabase.from("premium_entitlements").select("active, transaction_reference, notes, activated_at, activated_by").eq("user_id", normalizedId).maybeSingle(),
    ]);
    if (profileError) setError(profileError.message.includes("permission") || profileError.message.includes("row-level") ? "Admin profile access is blocked by Supabase RLS. Run the latest supabase/schema.sql so approved admins can read profiles." : profileError.message.includes("profiles") ? "The profiles table is not ready. Run supabase/schema.sql first." : profileError.message);
    else if (!profile) {
      const requestIdentity = requests.find((request) => normalizeCustomerId(request.user_id) === normalizedId);
      if (requestIdentity) {
        setCustomer({ id: normalizedId, full_name: requestIdentity.customer_name || "Unnamed viewer", email: requestIdentity.customer_email });
        setMessage("Profile row not available yet; loaded the matching verification request. Confirm the transaction reference before continuing.");
        setEntitlement((statusError ? null : status) as Entitlement | null);
        setReference(status?.transaction_reference || requestIdentity.transaction_reference || "");
        setNotes(status?.notes || "");
      } else setError("No customer was found for that Customer / User ID. Confirm that the ID matches the customer’s Profile page exactly.");
    } else { setCustomer(profile as Customer); setEntitlement((statusError ? null : status) as Entitlement | null); setReference(status?.transaction_reference || ""); setNotes(status?.notes || ""); }
    setLoading(false);
  };

  const activateRequest = async (request: VerificationRequest) => {
    if (!supabase || !isAdmin) return;
    if (!request.transaction_reference || request.transaction_reference.trim().length < 3) {
      setError("Use the request ID first, then add the WhatsApp transaction reference before activating.");
      return;
    }
    const auditTime = new Date().toISOString();
    const { error: entitlementError } = await supabase.from("premium_entitlements").upsert({ user_id: request.user_id, active: true, transaction_reference: request.transaction_reference.trim(), activated_at: auditTime, activated_by: user.email || null }, { onConflict: "user_id" });
    if (entitlementError) { setError(entitlementError.message); return; }
    const { error: requestError } = await supabase.from("verification_requests").update({ status: "activated", reviewed_at: auditTime, reviewed_by: user.email || null }).eq("id", request.id);
    if (requestError) setError(requestError.message);
    else { setRequests((items) => items.map((item) => item.id === request.id ? { ...item, status: "activated", reviewed_at: auditTime, reviewed_by: user.email } : item)); setMessage("Premium access activated from the verification request."); celebrateActivation(request.customer_name || request.customer_email); }
  };

  const updatePremium = async (active: boolean) => {
    if (!supabase || !customer || !isAdmin) return;
    if (!selectedRequestId) { setError("Select a WhatsApp verification request before changing Premium access."); return; }
    const linkedRequest = requests.find((request) => request.id === selectedRequestId);
    if (!linkedRequest || linkedRequest.user_id !== customer.id) { setError("The selected verification request does not belong to this customer. Reload the matching request before changing Premium access."); return; }
    if (active && reference.trim().length < 3) { setError("Add the WhatsApp transaction reference before activating Premium."); return; }
    setError(""); setMessage(""); setBusy(true);
    const { error: updateError } = await supabase.from("premium_entitlements").upsert({ user_id: customer.id, active, transaction_reference: reference.trim() || null, notes: notes.trim() || null, activated_at: active ? new Date().toISOString() : null, activated_by: user.email || null }, { onConflict: "user_id" });
    if (updateError) setError(updateError.message.includes("premium_entitlements") ? "The premium table is not ready. Run supabase/schema.sql first." : updateError.message);
    else {
      const auditTime = new Date().toISOString();
      setEntitlement({ active, transaction_reference: reference.trim() || null, notes: notes.trim() || null, activated_at: active ? auditTime : null, activated_by: user.email || null });
      let requestUpdateError: { message: string } | null = null;
      if (selectedRequestId) {
        const result = await supabase.from("verification_requests").update({ status: active ? "activated" : "declined", transaction_reference: reference.trim() || null, reviewed_at: auditTime, reviewed_by: user.email || null }).eq("id", selectedRequestId);
        requestUpdateError = result.error;
        if (!requestUpdateError) setRequests((items) => items.map((item) => item.id === selectedRequestId ? { ...item, status: active ? "activated" : "declined", transaction_reference: reference.trim() || null, reviewed_at: auditTime, reviewed_by: user.email } : item));
      }
      if (requestUpdateError) setError(requestUpdateError.message);
      else {
        setMessage(active ? "Premium access activated for this customer." : "Premium access revoked for this customer.");
        if (active) celebrateActivation(customer.full_name || customer.email);
      }
    }
    setBusy(false);
  };

  return <div className="admin-shell"><header className="profile-topbar"><a className="brand" href="#admin" onClick={(event) => { event.preventDefault(); onBack(); }}><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>eliminator</strong><em>admin</em></span></a><div className="profile-topbar__actions"><button className="profile-link" onClick={onBack}><ArrowLeft size={15} /> Back to feed</button><button className="profile-link profile-link--muted" onClick={onSignOut}><LogOut size={15} /> Sign out</button></div></header><main className="admin-layout"><section className="admin-intro"><span className="eyebrow eyebrow--red">PRIVATE CONTROL ROOM</span><h1>Verify a<br /><i>premium signal.</i></h1><p>Find a customer by the copyable Customer / User ID shown on their Profile page, review the WhatsApp transaction reference, then activate or revoke access. Every change records the approving administrator.</p><div className="profile-trust"><LockKeyhole size={18} /><div><b>Admin-only controls</b><span>{isAdmin ? user.email : "Access denied"}</span></div></div></section>{isAdmin ? <section className="admin-card"><div className="admin-card__heading"><span className="admin-card__icon"><ShieldCheck size={19} /></span><div><span className="eyebrow">CUSTOMER VERIFICATION</span><h2>Manual activation</h2></div></div><div className="notification-panel"><div className="notification-panel__heading"><span><Bell size={16} /> Verification requests <b>{requests.filter((request) => request.status === "pending").length}</b></span><button className="text-button" type="button" onClick={() => void loadRequests()} disabled={requestsLoading}>{requestsLoading ? <LoaderCircle size={14} className="spin" /> : <RefreshCw size={14} />} Refresh</button></div>{requests.length ? <div className="notification-list">{requests.map((request) => <div className={`notification-item notification-item--${request.status}`} key={request.id}><div className="notification-item__copy"><strong>{request.customer_name || request.customer_email}</strong><span>{request.customer_email}</span><small>{new Date(request.created_at).toLocaleString()} · {request.user_id}</small></div><div className="notification-item__actions"><span className="notification-status">{request.status}</span>{request.status !== "activated" && request.status !== "declined" && <input className="notification-reference-input" value={request.transaction_reference || ""} onChange={(event) => updateRequestDraft(request.id, event.target.value)} placeholder="Transaction ref" aria-label="Transaction reference" />}<button className="text-button" type="button" onClick={() => { setCustomerId(request.user_id); setReference(request.transaction_reference || ""); setSelectedRequestId(request.id); setMessage("Request linked. Find the customer to complete verification."); }}>Use for activation</button>{request.status !== "activated" && request.status !== "declined" && <button className="text-button" type="button" disabled={!request.transaction_reference} onClick={() => void activateRequest(request)}>Activate</button>}{request.status === "pending" && <><button className="text-button" type="button" onClick={() => void markReviewed(request.id, "reviewed")}>Mark reviewed</button><button className="text-button text-button--danger" type="button" onClick={() => void markReviewed(request.id, "declined")}>Decline</button></>}</div></div>)}</div> : <p className="notification-empty">No WhatsApp verification requests yet.</p>}</div><form className="admin-search" onSubmit={findCustomer}><label>Customer / User ID<span className="admin-field-hint">Paste the ID copied from the customer’s Profile page.</span><input value={customerId} onChange={(event) => setCustomerId(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autoComplete="off" /></label><button className="primary-button" type="submit" disabled={loading}>{loading ? <LoaderCircle size={16} className="spin" /> : <Search size={16} />} Find customer</button></form>{activationCelebration && <div className="activation-success" role="status" aria-live="polite"><span className="activation-success__burst"><Check size={24} /></span><div><strong>Premium is live</strong><small>Activation confirmed and ready for the customer.</small></div></div>}{customer && <div className="customer-result"><div className="linked-request-banner">{selectedRequestId ? <>Linked verification request: <code>{selectedRequestId}</code></> : <>No verification request linked — Premium changes are disabled.</>}</div><div className="customer-result__identity"><span className="profile-avatar"><UserRound size={18} /></span><div><b>{customer.full_name || "Unnamed viewer"}</b><span>{customer.email}</span><small>{customer.id}</small></div><span className={entitlement?.active ? "admin-status admin-status--active" : "admin-status"}>{entitlement?.active ? "PREMIUM ACTIVE" : "NOT ACTIVE"}</span></div><label>WhatsApp transaction reference<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Reference supplied by customer" /></label><label>Admin notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional verification notes" rows={3} /></label><div className="admin-actions"><button className="red-button" type="button" disabled={busy} onClick={() => updatePremium(true)}>{busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />} Activate Premium</button><button className="secondary-button" type="button" disabled={busy} onClick={() => updatePremium(false)}><X size={16} /> Revoke access</button></div></div>}{error && <div className="auth-message auth-message--error"><CircleAlert size={16} /><span>{error}</span></div>}{message && <div className="auth-message auth-message--success"><Check size={16} /><span>{message}</span></div>}</section> : <section className="admin-card admin-card--denied"><LockKeyhole size={28} /><h2>Access denied.</h2><p>Only the two approved administrator emails can use premium verification.</p></section>}</main></div>;
}
