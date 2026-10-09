"use client";

import { useEffect, useState } from "react";

type SupplyOrder = {
  order_id: string;
  reference: string;
  school_name: string;
  contact_name: string;
  phone: string;
  payment_status: string;
  supply_status: string;
  delivery_code: string;
  total_kobo: number;
  created_at: string;
};

function maskOrderReference(reference: string) {
  if (reference.length <= 8) return reference;
  return `${reference.slice(0, 5)}******${reference.slice(-4)}`;
}

export default function SupplyPage() {
  const [purchaseCodes, setPurchaseCodes] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/supply", { cache: "no-store" });
      const body = (await response.json()) as { orders?: SupplyOrder[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Supply access required.");
      setOrders(body.orders ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load assigned orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function confirmPurchaseCode(orderId: string) {
    const purchaseCode = purchaseCodes[orderId]?.trim();
    if (!purchaseCode) { setMessage("Enter the purchase code given by the school."); return; }
    try {
      const response = await fetch("/api/supply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, purchaseCode }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to verify purchase code.");
      setMessage("Purchase code confirmed. Order supplied.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to verify purchase code.");
    }
  }

  async function markDelivered(orderId: string) {
    try {
      const response = await fetch("/api/supply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to mark delivery.");
      setMessage("Delivery marked supplied.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to mark delivery.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">PUPILS START</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">My Supply Orders</h1>
        <p className="mt-2 text-sm text-slate-600">Only orders assigned to this supply account are shown.</p>

        {message ? <div className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">{message}</div> : null}

        {loading ? (
          <p className="mt-8 text-sm text-slate-500">Loading assigned orders...</p>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No assigned orders.
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <section key={order.order_id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purchase</p>
                    <p className="mt-1 text-xl font-semibold">{maskOrderReference(order.reference)}</p>
                    <p className="mt-3 text-sm font-medium">{order.school_name}</p>
                    <p className="text-sm text-slate-500">{order.contact_name} · {order.phone}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Code</p>
                    <p className="mt-1 text-2xl font-bold tracking-[0.2em]">{order.delivery_code}</p>
                    <p className="mt-1 text-xs text-slate-500">Show this code to the school.</p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Optional Purchase Code</p>
                  <p className="mt-1 text-xs text-slate-500">Ask the school person for the purchase code if you want to use this verification option.</p>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={purchaseCodes[order.order_id] ?? ""}
                      onChange={(e) => setPurchaseCodes((current) => ({ ...current, [order.order_id]: e.target.value }))}
                      placeholder="PS-..."
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <button type="button" onClick={() => void confirmPurchaseCode(order.order_id)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold">Verify</button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void markDelivered(order.order_id)}
                  className="mt-6 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  ✓ Mark Delivered
                </button>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
