import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, CircleAlert, LoaderCircle, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const WHATSAPP_NUMBER = "2349039727490";

export function getWhatsAppPremiumUrl(customerId: string): string {
  const message = `Hello Eliminator team, I want to request Premium access. My Customer ID is: ${customerId}. Please verify my transaction manually.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

type PricingProps = { onBack: () => void; user?: User };

export default function Pricing({ onBack, user }: PricingProps) {
  const [requestState, setRequestState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const whatsappUrl = user ? getWhatsAppPremiumUrl(user.id) : "#";
  const recordRequest = async () => {
    if (!user || !supabase) return;
    setRequestState("sending");
    const requestMessage = `Customer requested Premium verification through WhatsApp. Customer ID: ${user.id}`;
    const { error } = await supabase.from("verification_requests").insert({ user_id: user.id, customer_email: user.email || "", customer_name: user.user_metadata?.full_name || null, message: requestMessage });
    setRequestState(error ? "error" : "sent");
  };

  return <div className="pricing-shell"><header className="profile-topbar"><a className="brand" href="#pricing" onClick={(event) => { event.preventDefault(); onBack(); }}><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>eliminator</strong><em>streaming</em></span></a><button className="profile-link" onClick={onBack}><ArrowLeft size={15} /> Back to feed</button></header><main className="pricing-layout"><section className="pricing-intro"><span className="eyebrow eyebrow--red">04 / PREMIUM ACCESS</span><h1>Choose your<br /><i>next signal.</i></h1><p>Premium access is activated manually after you contact the Eliminator team on WhatsApp. No payment is treated as verified by the browser itself.</p><div className="profile-trust"><ShieldCheck size={18} /><div><b>Human-verified access</b><span>Only an approved admin can activate your account.</span></div></div></section><section className="pricing-card"><div className="pricing-card__head"><div className="pricing-icon"><Sparkles size={20} /></div><span className="eyebrow">ELIMINATOR PREMIUM</span><h2>Premium member</h2><p>Request access, share your Customer ID and transaction reference in WhatsApp, then wait for an admin to activate your account. Your Customer/User ID is included automatically.</p></div><div className="pricing-features"><span><Check size={15} /> Premium entitlement on your account</span><span><Check size={15} /> Account-level activation by Customer ID</span><span><Check size={15} /> Support through the official WhatsApp line</span></div><a className="red-button pricing-cta" href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => void recordRequest()}>{requestState === "sending" ? <LoaderCircle size={17} className="spin" /> : <MessageCircle size={17} />} {requestState === "sent" ? "Request recorded — open WhatsApp" : "Contact on WhatsApp"} <ArrowUpRight size={16} /></a>{requestState === "error" && <div className="auth-message auth-message--error"><CircleAlert size={16} /><span>WhatsApp opened, but your request could not be recorded. Tell the admin your Customer ID.</span></div>}<small className="pricing-note">After you message the team, an approved admin will verify your transaction reference and activate Premium manually. Never send passwords, PINs, OTPs, or card details.</small></section></main></div>;
}
