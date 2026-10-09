"use client";

import { useEffect, useMemo, useState } from "react";

type Order = { id: string; school_name: string; contact_name: string; phone: string; total_kobo: number; created_at: string };
type School = { school: string; contact: string; phone: string; orderCount: number; totalKobo: number; lastOrder: string };

function naira(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);
}

export default function SchoolsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/schools", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as { orders?: Order[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Unable to load schools.");
        setOrders(body.orders ?? []);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load schools."))
      .finally(() => setLoading(false));
  }, []);

  const schools = useMemo<School[]>(() => {
    const map = new Map<string, School>();
    for (const order of orders) {
      const key = order.school_name.trim().toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.orderCount += 1;
        existing.totalKobo += order.total_kobo;
        if (new Date(order.created_at) > new Date(existing.lastOrder)) {
          existing.contact = order.contact_name;
          existing.phone = order.phone;
          existing.lastOrder = order.created_at;
        }
      } else {
        map.set(key, {
          school: order.school_name,
          contact: order.contact_name,
          phone: order.phone,
          orderCount: 1,
          totalKobo: order.total_kobo,
          lastOrder: order.created_at,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.school.localeCompare(b.school));
  }, [orders]);

  const visible = schools.filter((school) =>
    (school.school + " " + school.contact + " " + school.phone).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">PUPIL'S STARTER ASSESSMENT BOOKS</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Schools</h1>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search school, contact, or phone" className="mt-6 w-full max-w-xl rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" />
        {message ? <div className="mt-5 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-red-700">{message}</div> : null}
        {loading ? (
          <p className="mt-8 text-sm text-slate-500">Loading schools...</p>
        ) : visible.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No schools found.</div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="sticky left-0 bg-slate-50 px-4 py-3 font-semibold">School</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Orders</th>
                  <th className="px-4 py-3 font-semibold">Total Ordered</th>
                  <th className="px-4 py-3 font-semibold">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {visible.map((school) => (
                  <tr key={school.school.toLowerCase()}>
                    <td className="sticky left-0 bg-white px-4 py-3 font-medium">{school.school}</td>
                    <td className="px-4 py-3">{school.contact}</td>
                    <td className="px-4 py-3">{school.phone}</td>
                    <td className="px-4 py-3">{school.orderCount}</td>
                    <td className="px-4 py-3 font-medium">{naira(school.totalKobo)}</td>
                    <td className="px-4 py-3">{new Date(school.lastOrder).toLocaleDateString("en-NG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
