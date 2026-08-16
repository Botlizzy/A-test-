import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Bell, Check, CircleAlert, LoaderCircle, LockKeyhole, LogOut, RefreshCw, Search, ShieldCheck, UserRound, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { isCustomerId, normalizeCustomerId } from "@/lib/adminLookup";
import { getPremiumDurationDays, getPremiumExpiryIso, isPremiumCurrentlyActive, PREMIUM_DURATION_OPTIONS, type PremiumDurationSelection } from "@/lib/premiumDuration";
import { accountStatusLabel, getNextAccountStatus, getNextWarningState } from "@/lib/accountManagement";

const ADMIN_EMAILS = new Set(["mikeakex80@gmail.com", "elijahchinecheremonah@gmail.com"]);
type PremiumAdminProps = { user: User; onBack: () => void; onSignOut: () => Promise<void> };
type Customer = { id: string; full_name: string; email: string; avatar_url?: string | null; account_status?: "active" | "suspended"; account_warning?: boolean };
type Entitlement = { active: boolean; transaction_reference?: string | null; notes?: string | null; activated_at?: string | null; expires_at?: string | null; activated_by?: string | null };
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
  const [durationSelection, setDurationSelection] = useState<PremiumDurationSelection>("10");
  const [customDays, setCustomDays] = useState("");
  const [activationCelebration, setActivationCelebration] = useState(false);
  const [members, setMembers] = useState<Customer[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberBusyId, setMemberBusyId] = useState<string | null>(null);
  const [warningBusyId, setWarningBusyId] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!isAdmin || !supabase) return;
    setRequestsLoading(true);
    const { data, error: requestError } = await supabase.from("verification_requests").select("id, user_id, customer_email, customer_name, transaction_reference, message, status, created_at, reviewed_at, reviewed_by").order("created_at", { ascending: false }).limit(30);
    if (requestError) setError(requestError.message.includes("verification_requests") ? "Run the updated supabase/schema.sql to enable admin notifications." : requestError.message);
    else setRequests((data || []) as VerificationRequest[]);
    setRequestsLoading(false);
  };

  const loadMembers = async () => {
    if (!isAdmin || !supabase) return;
    setMembersLoading(true);
    const { data, error: membersError } = await supabase.from("profiles").select("id, full_name, email, avatar_url, account_status, account_warning").order("created_at", { ascending: false }).limit(100);
    if (membersError) setError(membersError.message.includes("account_status") ? "Run the latest Supabase schema to enable member suspension." : membersError.message);
    else setMembers((data || []) as Customer[]);
    setMembersLoading(false);
  };

  useEffect(() => { if (!isAdmin) setError("This account is not approved for premium verification."); else { void loadRequests(); void loadMembers(); } }, [isAdmin]);

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

  const selectMember = async (member: Customer) => {
    if (!supabase || !isAdmin) return;
    setError(""); setMessage(""); setCustomer(member); setCustomerId(member.id); setReference(""); setNotes("");
    const { data: status } = await supabase.from("premium_entitlements").select("active, transaction_reference, notes, activated_at, expires_at, activated_by").eq("user_id", member.id).maybeSingle();
    setEntitlement((status || null) as Entitlement | null);
    setReference(status?.transaction_reference || "");
    setNotes(status?.notes || "");
  };

  const setMemberSuspension = async (member: Customer) => {
    if (!supabase || !isAdmin) return;
    const nextStatus = getNextAccountStatus(member.account_status);
    setError(""); setMessage(""); setMemberBusyId(member.id);
    const { data, error: statusError } = await supabase.rpc("admin_set_account_status", { target_user_id: member.id, next_status: nextStatus });
    if (statusError) setError(statusError.message.includes("function") ? "Account suspension is not enabled yet. Run the latest Supabase schema first." : statusError.message);
    else {
      const updated = { ...member, account_status: nextStatus } as Customer;
      setMembers((items) => items.map((item) => item.id === member.id ? updated : item));
      if (customer?.id === member.id) setCustomer(updated);
      setMessage(nextStatus === "suspended" ? `${member.email} is suspended and cannot use the website.` : `${member.email} is active again.`);
      toast.success(nextStatus === "suspended" ? "Account suspended" : "Account reactivated", { description: member.email });
    }
    setMemberBusyId(null);
  };

  const requestMemberSuspension = (member: Customer) => {
    const nextStatus = getNextAccountStatus(member.account_status);
    const action = nextStatus === "suspended" ? "suspend" : "reactivate";
    const detail = nextStatus === "suspended" ? "They will be signed out at their next session check and blocked from the website." : "They will be allowed to use the website again.";
    if (window.confirm(`Are you sure you want to ${action} ${member.email}?\n\n${detail}`)) void setMemberSuspension(member);
  };

  const setMemberWarning = async (member: Customer) => {
    if (!supabase || !isAdmin) return;
    const nextWarning = getNextWarningState(member.account_warning);
    setError(""); setMessage(""); setWarningBusyId(member.id);
    const { error: warningError } = await supabase.rpc("admin_set_account_warning", { target_user_id: member.id, flagged: nextWarning });
    if (warningError) setError(warningError.message.includes("function") ? "Account warnings are not enabled yet. Run the latest Supabase schema first." : warningError.message);
    else {
      const updated = { ...member, account_warning: nextWarning } as Customer;
      setMembers((items) => items.map((item) => item.id === member.id ? updated : item));
      if (customer?.id === member.id) setCustomer(updated);
      setMessage(nextWarning ? `${member.email} is flagged for admin review without suspension.` : `Warning cleared for ${member.email}.`);
      toast.success(nextWarning ? "Account flagged for review" : "Account warning cleared", { description: member.email });
    }
    setWarningBusyId(null);
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
      supabase.from("profiles").select("id, full_name, email, avatar_url, account_status, account_warning").eq("id", normalizedId).maybeSingle(),
      supabase.from("premium_entitlements").select("active, transaction_reference, notes, activated_at, expires_at, activated_by").eq("user_id", normalizedId).maybeSingle(),
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
    const durationDays = getPremiumDurationDays(durationSelection, customDays);
    if (!durationDays) { setError("Choose a valid Premium duration between 1 and 3650 days."); return; }
    const auditTime = new Date().toISOString();
    const expiresAt = getPremiumExpiryIso(new Date(auditTime), durationDays);
    const { error: entitlementError } = await supabase.from("premium_entitlements").upsert({ user_id: request.user_id, active: true, transaction_reference: request.transaction_reference.trim(), activated_at: auditTime, expires_at: expiresAt, activated_by: user.email || null }, { onConflict: "user_id" });
    if (entitlementError) { setError(entitlementError.message); return; }
    const { error: requestError } = await supabase.from("verification_requests").update({ status: "activated", reviewed_at: auditTime, reviewed_by: user.email || null }).eq("id", request.id);
    if (requestError) setError(requestError.message);
    else { setRequests((items) => items.map((item) => item.id === request.id ? { ...item, status: "activated", reviewed_at: auditTime, reviewed_by: user.email } : item)); setMessage(`Premium access activated for ${durationDays} day${durationDays === 1 ? "" : "s"}.`); celebrateActivation(request.customer_name || request.customer_email); }
  };

  const updatePremium = async (active: boolean) => {
    if (!supabase || !customer || !isAdmin) return;
    if (!selectedRequestId) { setError("Select a WhatsApp verification request before changing Premium access."); return; }
    const linkedRequest = requests.find((request) => request.id === selectedRequestId);
    if (!linkedRequest || linkedRequest.user_id !== customer.id) { setError("The selected verification request does not belong to this customer. Reload the matching request before changing Premium access."); return; }
    if (active && reference.trim().length < 3) { setError("Add the WhatsApp transaction reference before activating Premium."); return; }
    const durationDays = active ? getPremiumDurationDays(durationSelection, customDays) : null;
    if (active && !durationDays) { setError("Choose a valid Premium duration between 1 and 3650 days."); return; }
    setError(""); setMessage(""); setBusy(true);
    const auditTime = new Date().toISOString();
    const expiresAt = active && durationDays ? getPremiumExpiryIso(new Date(auditTime), durationDays) : null;
    const { error: updateError } = await supabase.from("premium_entitlements").upsert({ user_id: customer.id, active, transaction_reference: reference.trim() || null, notes: notes.trim() || null, activated_at: active ? auditTime : null, expires_at: expiresAt, activated_by: user.email || null }, { onConflict: "user_id" });
    if (updateError) setError(updateError.message.includes("premium_entitlements") ? "The premium table is not ready. Run supabase/schema.sql first." : updateError.message);
    else {
      setEntitlement({ active, transaction_reference: reference.trim() || null, notes: notes.trim() || null, activated_at: active ? auditTime : null, expires_at: expiresAt, activated_by: user.email || null });
      let requestUpdateError: { message: string } | null = null;
      if (selectedRequestId) {
        const result = await supabase.from("verification_requests").update({ status: active ? "activated" : "declined", transaction_reference: reference.trim() || null, reviewed_at: auditTime, reviewed_by: user.email || null }).eq("id", selectedRequestId);
        requestUpdateError = result.error;
        if (!requestUpdateError) setRequests((items) => items.map((item) => item.id === selectedRequestId ? { ...item, status: active ? "activated" : "declined", transaction_reference: reference.trim() || null, reviewed_at: auditTime, reviewed_by: user.email } : item));
      }
      if (requestUpdateError) setError(requestUpdateError.message);
      else {
        setMessage(active ? `Premium access activated for ${durationDays} day${durationDays === 1 ? "" : "s"}.` : "Premium access revoked for this customer.");
        if (active) celebrateActivation(customer.full_name || customer.email);
      }
    }
    setBusy(false);
  };

  const entitlementActive = isPremiumCurrentlyActive(Boolean(entitlement?.active), entitlement?.expires_at);
  const expiryLabel = entitlement?.expires_at ? new Date(entitlement.expires_at).toLocaleString() : "No expiry set";

  return <div className="admin-shell"><header className="profile-topbar"><a className="brand" href="#admin" onClick={(event) => { event.preventDefault(); onBack(); }}><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>eliminator</strong><em>admin</em></span></a><div className="profile-topbar__actions"><button className="profile-link" onClick={onBack}><ArrowLeft size={15} /> Back to feed</button><button className="profile-link profile-link--muted" onClick={onSignOut}><LogOut size={15} /> Sign out</button></div></header><main className="admin-layout"><section className="admin-intro"><span className="eyebrow eyebrow--red">PRIVATE CONTROL ROOM</span><h1>Verify a<br /><i>premium signal.</i></h1><p>Find a customer by the copyable Customer / User ID shown on their Profile page, review the WhatsApp transaction reference, then activate or revoke access. Every change records the approving administrator.</p><div className="profile-trust"><LockKeyhole size={18} /><div><b>Admin-only controls</b><span>{isAdmin ? user.email : "Access denied"}</span></div></div></section>{isAdmin ? <section className="admin-card"><div className="admin-card__heading"><span className="admin-card__icon"><ShieldCheck size={19} /></span><div><span className="eyebrow">ADMIN CONTROL ROOM</span><h2>Members & premium grants</h2></div></div><div className="admin-section-jump" role="navigation" aria-label="Admin sections"><a href="#member-management">Member management</a><a href="#premium-grants">Premium grants</a></div><section className="admin-subsection" id="member-management"><div className="admin-subsection__heading"><div><span className="eyebrow eyebrow--blue">01 / MEMBER MANAGEMENT</span><h3>View and suspend accounts</h3></div><button className="text-button" type="button" onClick={() => void loadMembers()} disabled={membersLoading}>{membersLoading ? <LoaderCircle size={14} className="spin" /> : <RefreshCw size={14} />} Refresh members</button></div><p className="admin-section-copy">Search by Customer ID or tap a listed member. Suspended accounts are signed out at their next session check and cannot enter the website.</p><form className="admin-search admin-search--compact" onSubmit={findCustomer}><label>Customer / User ID<span className="admin-field-hint">Paste the ID copied from Profile.</span><input value={customerId} onChange={(event) => setCustomerId(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autoComplete="off" /></label><button className="primary-button" type="submit" disabled={loading}>{loading ? <LoaderCircle size={16} className="spin" /> : <Search size={16} />} Find member</button></form>{membersLoading ? <div className="member-list-loading"><LoaderCircle size={18} className="spin" /> Loading members…</div> : members.length ? <div className="member-list">{members.map((member) => <div className={`member-row member-row--${member.account_status || "active"}`} key={member.id}><button className="member-row__identity" type="button" onClick={() => void selectMember(member)}><span className="profile-avatar">{member.avatar_url ? <img src={member.avatar_url} alt="" /> : <UserRound size={17} />}</span><span><strong>{member.full_name || "Unnamed viewer"}</strong><small>{member.email}</small><code>{member.id}</code></span></button><div className="member-row__actions"><span className={`member-status member-status--${member.account_status || "active"}`}>{accountStatusLabel(member.account_status)}</span>{member.account_warning && <span className="member-status member-status--warning">WARNING</span>}<button className={member.account_status === "suspended" ? "secondary-button" : "danger-outline-button"} type="button" onClick={() => requestMemberSuspension(member)} disabled={memberBusyId === member.id || warningBusyId === member.id}>{memberBusyId === member.id ? <LoaderCircle size={14} className="spin" /> : member.account_status === "suspended" ? "Reactivate" : "Suspend"}</button><button className={member.account_warning ? "warning-button warning-button--active" : "warning-button"} type="button" onClick={() => void setMemberWarning(member)} disabled={warningBusyId === member.id || memberBusyId === member.id}>{warningBusyId === member.id ? <LoaderCircle size={14} className="spin" /> : member.account_warning ? "Clear warning" : "Flag warning"}</button></div></div>)}</div> : <p className="notification-empty">No member profiles found yet.</p>}</section><section className="admin-subsection" id="premium-grants"><div className="admin-subsection__heading"><div><span className="eyebrow eyebrow--red">02 / PREMIUM GRANTS</span><h3>Verify and grant premium</h3></div></div><div className="notification-panel"><div className="notification-panel__heading"><span><Bell size={16} /> Verification requests <b>{requests.filter((request) => request.status === "pending").length}</b></span><button className="text-button" type="button" onClick={() => void loadRequests()} disabled={requestsLoading}>{requestsLoading ? <LoaderCircle size={14} className="spin" /> : <RefreshCw size={14} />} Refresh</button></div>{requests.length ? <div className="notification-list">{requests.map((request) => <div className={`notification-item notification-item--${request.status}`} key={request.id}><div className="notification-item__copy"><strong>{request.customer_name || request.customer_email}</strong><span>{request.customer_email}</span><small>{new Date(request.created_at).toLocaleString()} · {request.user_id}</small></div><div className="notification-item__actions"><span className="notification-status">{request.status}</span>{request.status !== "activated" && request.status !== "declined" && <input className="notification-reference-input" value={request.transaction_reference || ""} onChange={(event) => updateRequestDraft(request.id, event.target.value)} placeholder="Transaction ref" aria-label="Transaction reference" />}<button className="text-button" type="button" onClick={() => { setCustomerId(request.user_id); setReference(request.transaction_reference || ""); setSelectedRequestId(request.id); setMessage("Request linked. Find the customer to complete verification."); }}>Use for activation</button>{request.status !== "activated" && request.status !== "declined" && <button className="text-button" type="button" disabled={!request.transaction_reference} onClick={() => void activateRequest(request)}>Activate</button>}{request.status === "pending" && <><button className="text-button" type="button" onClick={() => void markReviewed(request.id, "reviewed")}>Mark reviewed</button><button className="text-button text-button--danger" type="button" onClick={() => void markReviewed(request.id, "declined")}>Decline</button></>}</div></div>)}</div> : <p className="notification-empty">No WhatsApp verification requests yet.</p>}</div><form className="admin-search" onSubmit={findCustomer}><label>Customer / User ID<span className="admin-field-hint">Paste the ID copied from the customer’s Profile page.</span><input value={customerId} onChange={(event) => setCustomerId(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autoComplete="off" /></label><button className="primary-button" type="submit" disabled={loading}>{loading ? <LoaderCircle size={16} className="spin" /> : <Search size={16} />} Find customer</button></form>{activationCelebration && <div className="activation-success" role="status" aria-live="polite"><span className="activation-success__burst"><Check size={24} /></span><div><strong>Premium is live</strong><small>Activation confirmed and ready for the customer.</small></div></div>}{customer && <div className="customer-result"><div className="linked-request-banner">{selectedRequestId ? <>Linked verification request: <code>{selectedRequestId}</code></> : <>No verification request linked — Premium changes are disabled.</>}</div><div className="customer-result__identity"><span className="profile-avatar"><UserRound size={18} /></span><div><b>{customer.full_name || "Unnamed viewer"}</b><span>{customer.email}</span><small>{customer.id}</small></div><span className={entitlementActive ? "admin-status admin-status--active" : "admin-status"}>{entitlementActive ? "PREMIUM ACTIVE" : entitlement?.active ? "EXPIRED" : "NOT ACTIVE"}</span><button className={customer.account_status === "suspended" ? "secondary-button" : "danger-outline-button"} type="button" onClick={() => requestMemberSuspension(customer)} disabled={memberBusyId === customer.id || warningBusyId === customer.id}>{memberBusyId === customer.id ? <LoaderCircle size={14} className="spin" /> : customer.account_status === "suspended" ? "Reactivate account" : "Suspend account"}</button><button className={customer.account_warning ? "warning-button warning-button--active" : "warning-button"} type="button" onClick={() => void setMemberWarning(customer)} disabled={warningBusyId === customer.id || memberBusyId === customer.id}>{warningBusyId === customer.id ? <LoaderCircle size={14} className="spin" /> : customer.account_warning ? "Clear warning" : "Flag warning"}</button></div><label>WhatsApp transaction reference<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Reference supplied by customer" /></label><label>Admin notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional verification notes" rows={3} /></label><div className="premium-duration-control"><label htmlFor="premium-duration">Premium duration<select id="premium-duration" value={durationSelection} onChange={(event) => setDurationSelection(event.target.value as PremiumDurationSelection)}>{PREMIUM_DURATION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>{durationSelection === "custom" && <label htmlFor="custom-premium-days">Custom days<input id="custom-premium-days" type="number" min="1" max="3650" inputMode="numeric" value={customDays} onChange={(event) => setCustomDays(event.target.value)} placeholder="1–3650" /></label>}<small>Activation will expire at the end of the selected period. Current status: {entitlementActive ? `active until ${expiryLabel}` : entitlement?.active ? "expired" : "inactive"}.</small></div><div className="admin-actions"><button className="red-button" type="button" disabled={busy} onClick={() => updatePremium(true)}>{busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />} Activate Premium</button><button className="secondary-button" type="button" disabled={busy} onClick={() => updatePremium(false)}><X size={16} /> Revoke access</button></div></div>}{error && <div className="auth-message auth-message--error"><CircleAlert size={16} /><span>{error}</span></div>}{message && <div className="auth-message auth-message--success"><Check size={16} /><span>{message}</span></div>}</section></section> : <section className="admin-card admin-card--denied"><LockKeyhole size={28} /><h2>Access denied.</h2><p>Only the two approved administrator emails can use premium verification.</p></section>}</main></div>;
}
