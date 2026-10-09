"use client";

import { useEffect, useMemo, useState } from "react";

type Order = {
  id: string;
  reference: string;
  school_name: string;
  total_kobo: number;
  payment_status: string;
  created_at: string;
  paid_at: string | null;
};

function naira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const body = await response.json() as { orders?: Order[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load payments.");
      setOrders(body.orders ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const paidOrders = useMemo(
    () => orders.filter((order) => order.payment_status === "Paid"),
    [orders],
  );
  const paidValue = paidOrders.reduce((total, order) => total + order.total_kobo, 0);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">PUPILS START</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Payments</h1>
            <p className="mt-2 text-sm text-slate-600">View payment status and paid order value.</p>
          </div>
          <button type="button" onClick={() => void load()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">Refresh</button>
        </header>

        {message ? <div className="mt-6 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-red-700">{message}</div> : null}

        {loading ? <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading payments...</div> : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Paid Orders</p>
                <p className="mt-2 text-2xl font-semibold">{paidOrders.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Paid Order Value</p>
                <p className="mt-2 text-2xl font-semibold">{naira(paidValue)}</p>
              </div>
            </div>

            <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Payment Status</th>
                    <th className="px-4 py-3 font-semibold">Paid At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No orders yet.</td></tr>
                  ) : orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-3 font-medium">{order.reference}</td>
                      <td className="px-4 py-3">{order.school_name}</td>
                      <td className="px-4 py-3">{naira(order.total_kobo)}</td>
                      <td className="px-4 py-3">{order.payment_status}</td>
                      <td className="px-4 py-3">{order.paid_at ? new Date(order.paid_at).toLocaleString("en-NG") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
