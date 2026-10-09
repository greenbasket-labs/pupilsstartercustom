"use client";

import { useEffect, useMemo, useState } from "react";

type Order = {
  id: string; reference: string; school_name: string; contact_name: string; phone: string; email: string | null;
  total_kobo: number; payment_status: string; supply_status: string; created_at: string; paid_at: string | null;
};
type OrderItem = { id: string; order_id: string; product_name: string; class_name: string; unit_price_kobo: number; quantity: number; line_total_kobo: number; };
function naira(kobo: number) { return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100); }
function dateTime(value: string) { return new Date(value).toLocaleString("en-NG"); }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]); const [items, setItems] = useState<OrderItem[]>([]);
  const [filter, setFilter] = useState<"all" | "pending-supply">("all"); const [customerSchool, setCustomerSchool] = useState(""); const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(true); const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const body = await response.json() as { orders?:Order[]; items?:OrderItem[]; error?:string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load orders.");
      setOrders(body.orders ?? []); setItems(body.items ?? []);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load orders."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("filter") === "pending-supply") setFilter("pending-supply");
    setCustomerSchool(params.get("school") ?? ""); setCustomerPhone(params.get("phone") ?? "");
  }, []);

  const visibleOrders = useMemo(() => {
    let result = filter === "pending-supply"
      ? orders.filter(order => order.payment_status === "Paid" && order.supply_status !== "Supplied")
      : orders;
    if (customerSchool || customerPhone) result = result.filter(order => order.school_name === customerSchool && order.phone === customerPhone);
    return result;
  }, [filter, orders, customerSchool, customerPhone]);

  function orderItems(orderId: string) { return items.filter(item => item.order_id === orderId); }
  const customerView = Boolean(customerSchool || customerPhone);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950"><div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">PUPIL'S STARTER ASSESSMENT BOOKS</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-2 text-sm text-slate-600">{customerView ? "Read-only order history for this customer." : "View customer orders, payment status, and supply status."}</p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={()=>setFilter("all")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${filter==="all"?"bg-slate-950 text-white":"border border-slate-300 bg-white"}`}>Orders</button>
        <button type="button" onClick={()=>setFilter("pending-supply")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${filter==="pending-supply"?"bg-slate-950 text-white":"border border-slate-300 bg-white"}`}>Pending Supply</button>
        <button type="button" onClick={()=>void load()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">Refresh</button>
        {customerView ? <a href="/orders" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">All Orders</a> : null}
      </div>

      {customerView ? <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"><span className="font-semibold">{customerSchool}</span>{customerPhone ? <span className="ml-2 text-slate-500">· {customerPhone}</span> : null}</div> : null}
      {message ? <div className="mt-5 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-red-700">{message}</div> : null}

      {loading ? <p className="mt-8 text-sm text-slate-500">Loading orders...</p> : visibleOrders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{filter==="pending-supply" ? "No paid orders are pending supply." : "No orders yet."}</div>
      ) : (
        <div className="mt-8 space-y-4">{visibleOrders.map(order => (
          <section key={order.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xl font-semibold">{order.reference}</p><p className="mt-2 text-sm font-medium">{order.school_name}</p><p className="text-sm text-slate-500">{order.contact_name} · {order.phone}</p>{order.email ? <p className="text-sm text-slate-500">{order.email}</p> : null}<p className="mt-2 text-xs text-slate-400">{dateTime(order.created_at)}</p></div>
              <div className="text-right"><p className="text-lg font-semibold">{naira(order.total_kobo)}</p><div className="mt-2 flex flex-wrap justify-end gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">Payment: {order.payment_status}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">Supply: {order.supply_status}</span></div></div>
            </div>
            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50"><tr><th className="px-4 py-3 font-semibold">Assessment Book</th><th className="px-4 py-3 font-semibold">Class</th><th className="px-4 py-3 font-semibold">Qty</th><th className="px-4 py-3 font-semibold">Unit</th><th className="px-4 py-3 font-semibold">Total</th></tr></thead><tbody className="divide-y divide-slate-200">{orderItems(order.id).map(item=><tr key={item.id}><td className="px-4 py-3 font-medium">{item.product_name}</td><td className="px-4 py-3">{item.class_name}</td><td className="px-4 py-3">{item.quantity}</td><td className="px-4 py-3">{naira(item.unit_price_kobo)}</td><td className="px-4 py-3">{naira(item.line_total_kobo)}</td></tr>)}</tbody></table></div>
          </section>
        ))}</div>
      )}
    </div></main>
  );
}
