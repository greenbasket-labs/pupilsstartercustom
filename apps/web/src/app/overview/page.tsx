"use client";

import { useEffect, useState } from "react";

type Overview = {
  orders: { total: number; paid: number; pendingSupply: number; supplied: number; totalSalesKobo: number };
  inventory: { available: number; incoming: number; activeProducts: number };
};

function naira(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);
}

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });
      const body = await response.json() as Overview & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load overview.");
      setData(body);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load overview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">PUPIL'S STARTER ASSESSMENT BOOKS</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Overview</h1>
            <p className="mt-2 text-sm text-slate-600">A simple view of the current business position.</p>
          </div>
          <button type="button" onClick={() => void load()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">Refresh</button>
        </header>

        {message ? <div className="mt-6 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-red-700">{message}</div> : null}
        {loading ? <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading overview...</div> : data ? (
          <div className="mt-8 space-y-6">
            <section>
              <h2 className="mb-3 text-lg font-semibold">Orders</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <a href="/orders" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300"><p className="text-sm text-slate-500">Total Orders</p><p className="mt-2 text-2xl font-semibold">{data.orders.total}</p></a>
                <a href="/orders" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300"><p className="text-sm text-slate-500">Paid Orders</p><p className="mt-2 text-2xl font-semibold">{data.orders.paid}</p></a>
                <a href="/orders?filter=pending-supply" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300"><p className="text-sm text-slate-500">Pending Supply</p><p className="mt-2 text-2xl font-semibold">{data.orders.pendingSupply}</p></a>
                <a href="/orders" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300"><p className="text-sm text-slate-500">Supplied Orders</p><p className="mt-2 text-2xl font-semibold">{data.orders.supplied}</p></a>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Sales & Inventory</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Paid Order Value</p><p className="mt-2 text-2xl font-semibold">{naira(data.orders.totalSalesKobo)}</p></div>
                <a href="/#inventory-stock" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300"><p className="text-sm text-slate-500">Available Stock</p><p className="mt-2 text-2xl font-semibold">{data.inventory.available}</p></a>
                <a href="/#inventory-incoming" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300"><p className="text-sm text-slate-500">Incoming Stock</p><p className="mt-2 text-2xl font-semibold">{data.inventory.incoming}</p></a>
                <a href="/#assessment-books" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300"><p className="text-sm text-slate-500">Active Books</p><p className="mt-2 text-2xl font-semibold">{data.inventory.activeProducts}</p></a>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
