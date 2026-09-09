"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reggie } from "@/components/reggie";

type PaymentState = { kind: "loading" | "success" | "error"; text: string };

export default function PaymentStatus() {
  const query = useSearchParams();
  const reference = query.get("reference") ?? query.get("trxref");
  const [state, setState] = useState<PaymentState>(() => reference
    ? { kind: "loading", text: "Confirming your Paystack payment…" }
    : { kind: "error", text: "No payment reference was returned. Email pathfinderzar@gmail.com with your receipt." });

  useEffect(() => {
    if (!reference) return;
    fetch("/api/paystack/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    }).then(async (response) => {
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error ?? "Payment verification failed.");
      setState({ kind: "success", text: data.message ?? "Trailblazer access is active." });
    }).catch((error: unknown) => setState({
      kind: "error",
      text: error instanceof Error ? error.message : "Payment verification failed.",
    }));
  }, [reference]);

  return <section className={`payment-status ${state.kind}`}>
    <Reggie variant="trailblazer" size={150} message={state.kind === "success" ? "You’re in! Let’s keep moving." : state.kind === "loading" ? "I’m checking your payment securely." : "We’ll get you back on the path."} />
    {state.kind === "loading" ? <LoaderCircle className="spin" /> : state.kind === "success" ? <CheckCircle2 /> : <XCircle />}
    <h1>{state.kind === "loading" ? "One moment" : state.kind === "success" ? "Payment confirmed" : "We need to check this"}</h1>
    <p>{state.text}</p>
    {state.kind === "success" ? <Button asChild><Link href="/dashboard">Open my dashboard</Link></Button> : state.kind === "error" && <><Link href={`/account?next=${encodeURIComponent(`/payment/complete?reference=${reference??""}`)}`}>Sign in and retry verification</Link><a href="mailto:pathfinderzar@gmail.com">Contact pathfinderzar@gmail.com</a></>}
  </section>;
}
