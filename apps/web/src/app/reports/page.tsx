"use client";

import { useEffect, useMemo, useState } from "react";

type Order = {
  id: string;
  reference: string;
  school_name: string;
  total_kobo: number;
  payment_status: string;
  supply_status: string;
  created_at: string;
};

function naira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const body = await response.json() as { orders?: Order[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load reports.");
      setOrders(body.orders ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const paid = useMemo(() => orders.filter((order) => order.payment_status === "Paid"), [orders]);
  const pendingSupply = useMemo(
    () => orders.filter((order) => order.payment_status === "Paid" && order.supply_status !== "Supplied"),
    [orders],
  );
  const supplied = useMemo(
    () => orders.filter((order) => order.supply_status === "Supplied"),
    [orders],
  );
  const paidValue = paid.reduce((total, order) => total + order.total_kobo, 0);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">PUPIL'S STARTER ASSESSMENT BOOKS</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Reports</h1>
            </div>
          <button type="button" onClick={() => void load()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">Refresh</button>
        </header>

        {message ? <div className="mt-6 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-red-700">{message}</div> : null}

        {loading ? <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading reports...</div> : (
          <div className="mt-8 space-y-6">
            <section>
              <h2 className="mb-3 text-lg font-semibold">Business Position</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total Orders</p><p className="mt-2 text-2xl font-semibold">{orders.length}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Paid Orders</p><p className="mt-2 text-2xl font-semibold">{paid.length}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Pending Supply</p><p className="mt-2 text-2xl font-semibold">{pendingSupply.length}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Paid Order Value</p><p className="mt-2 text-2xl font-semibold">{naira(paidValue)}</p></div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Supply</h2>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Supplied Orders</p>
                <p className="mt-2 text-2xl font-semibold">{supplied.length}</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
