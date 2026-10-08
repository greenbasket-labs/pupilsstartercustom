"use client";

import { FormEvent, useState } from "react";

export default function DeliveryConfirmationPage() {
  const [reference, setReference] = useState("");
  const [deliveryCode, setDeliveryCode] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, deliveryCode }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to confirm delivery.");
      setDone(true);
      setMessage("Delivery confirmed. Thank you.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to confirm delivery.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">PUPILS START</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Confirm Delivery</h1>
          <p className="mt-3 text-sm text-slate-600">The supply person gives you the Delivery Code. Enter it here if you want to use code confirmation.</p>
          {message ? <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">{message}</div> : null}
          {!done ? (
            <form onSubmit={confirm} className="mt-6 space-y-3">
              <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Purchase code e.g. PS-88DEAA4647D0" className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm" />
              <input value={deliveryCode} onChange={(e) => setDeliveryCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="Delivery code" className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm tracking-[0.2em]" />
              <button type="submit" className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Confirm Delivery</button>
            </form>
          ) : null}
        </div>
      </div>
    </main>
  );
}
