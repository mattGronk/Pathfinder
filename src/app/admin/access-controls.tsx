"use client";
import { useActionState, useRef, useState } from "react";
import type { FormResult } from "@/lib/profile";
import type { Product } from "@/lib/entitlements";
import { grantAccess, revokeAccess } from "./actions";

export default function AccessControl({ userId, email, products, entitlement, revoked = false }: { userId: string; email: string; revoked?: boolean; products?: Product[]; entitlement?: { id: string; name: string } }) {
  const [state, action, pending] = useActionState<FormResult, FormData>(entitlement ? revokeAccess : grantAccess, {});
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [requestId, setRequestId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmedRef = useRef<HTMLInputElement>(null);
  const expiresRef = useRef<HTMLInputElement>(null);
  const approvedRef = useRef(false);
  const isRevoke = Boolean(entitlement);
  return <div className="admin-access-control">
    <button type="button" className={`admin-button ${isRevoke ? "secondary" : ""}`} disabled={pending || revoked} onClick={() => { setOpen(!open); setRequestId(crypto.randomUUID()); }}>{revoked ? "Access revoked" : open ? "Close" : isRevoke ? "Revoke access" : "Grant access"}</button>
    {state.error && <p role="alert" className="form-error">{state.error}</p>}
    {state.message && <p role="status" className="form-success">{state.message}</p>}
    {open && !revoked && <form ref={formRef} action={action} className="admin-grant-form" onSubmit={event => {
      if (approvedRef.current) { approvedRef.current = false; return; }
      if (confirmedRef.current) confirmedRef.current.value = "";
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const localExpiry = String(data.get("localExpiry") || "");
      if (expiresRef.current) expiresRef.current.value = localExpiry ? new Date(localExpiry).toISOString() : "";
      const name = entitlement?.name ?? products?.find(p => p.id === data.get("product"))?.name ?? "Product";
      setSummary(`${name} · ${email}${isRevoke ? "" : localExpiry ? ` · expires ${new Date(localExpiry).toLocaleString()}` : " · no expiry"}`);
      dialogRef.current?.showModal();
    }}>
      <input type="hidden" name="user" value={userId} /><input type="hidden" name="request" value={requestId} /><input type="hidden" name="confirmed" ref={confirmedRef} /><input type="hidden" name="expires" ref={expiresRef} />
      {entitlement ? <input type="hidden" name="entitlement" value={entitlement.id} /> : <><label>Product<select name="product" required defaultValue=""><option value="" disabled>Select a product</option>{products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Expiry (optional, your local time)<input name="localExpiry" type="datetime-local" /></label></>}
      <label>Internal note (optional)<textarea name="note" maxLength={2000} rows={3} placeholder={isRevoke ? "Why is access being revoked?" : "Reason for this grant"} /></label>
      <button className={`admin-button ${isRevoke ? "danger" : ""}`} disabled={pending || (!isRevoke && !products?.length)}>{pending ? "Saving…" : isRevoke ? "Review revocation" : "Review grant"}</button>
      <dialog ref={dialogRef} className="admin-dialog" aria-labelledby={`confirm-${entitlement?.id ?? "grant"}`} onCancel={() => { if (confirmedRef.current) confirmedRef.current.value = ""; }}><h2 id={`confirm-${entitlement?.id ?? "grant"}`}>{isRevoke ? "Revoke this entitlement?" : "Grant this product?"}</h2><p>{summary}</p><p>{isRevoke ? "This entitlement will stop providing access. Other active entitlements still apply. The history is kept." : "This will give the selected account access immediately. This is a manual grant; no payment is taken."}</p><div className="admin-dialog-actions"><button type="button" className="admin-button secondary" onClick={() => dialogRef.current?.close()}>Cancel</button><button type="button" className={`admin-button ${isRevoke ? "danger" : ""}`} disabled={pending} onClick={() => { if (confirmedRef.current) confirmedRef.current.value = "yes"; approvedRef.current = true; dialogRef.current?.close(); formRef.current?.requestSubmit(); }}>{isRevoke ? "Confirm revocation" : "Confirm grant"}</button></div></dialog>
    </form>}
  </div>;
}
