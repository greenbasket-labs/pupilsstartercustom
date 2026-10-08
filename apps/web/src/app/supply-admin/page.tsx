"use client";

import { FormEvent, useEffect, useState } from "react";

type Person = { id: string; name: string; phone: string; is_active: boolean; created_at: string };
type Order = {
  id: string; reference: string; school_name: string; contact_name: string;
  total_kobo: number; payment_status: string; supply_status: string;
  supply_person_id: string | null; delivery_code: string | null; created_at: string;
};

export default function SupplyAdminPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [accessUrl, setAccessUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/supply", { cache: "no-store" });
      const body = (await response.json()) as { persons?: Person[]; orders?: Order[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load supply data.");
      setPersons(body.persons ?? []);
      setOrders(body.orders ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load supply data.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function createPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch("/api/admin/supply", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_person", name, phone }),
      });
      const body = (await response.json()) as { person?: Person; accessUrl?: string; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to create supply person.");
      setName(""); setPhone(""); setAccessUrl(body.accessUrl ?? "");
      setMessage("Supply person created. Save/share the access link securely.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create supply person."); }
  }

  async function assign(orderId: string, personId: string) {
    try {
      const response = await fetch("/api/admin/supply", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", orderId, personId }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to assign order.");
      setMessage("Supply person assigned. Delivery code generated.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to assign order."); }
  }

  async function togglePerson(person: Person) {
    try {
      const response = await fetch("/api/admin/supply", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_person_active", personId: person.id, isActive: !person.is_active }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to update supply person.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update supply person."); }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">PUPILS START · Supply</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Supply Persons & Delivery</h1>
        <p className="mt-2 text-sm text-slate-600">Assign paid orders, generate delivery codes, and monitor handover.</p>

        {message ? <div className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">{message}</div> : null}
        {accessUrl ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold">Supply-person access link</p>
            <p className="mt-1 break-all text-xs text-slate-600">{accessUrl}</p>
            <p className="mt-2 text-xs text-slate-500">This link is shown once. Treat it as the supply person's private access credential.</p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Supply Persons</h2>
            <form onSubmit={createPerson} className="mt-5 space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <button type="submit" className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Add Supply Person</button>
            </form>
            <div className="mt-6 space-y-3">
              {persons.map(person => (
                <div key={person.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-medium">{person.name}</p><p className="text-sm text-slate-500">{person.phone}</p></div>
                    <button type="button" onClick={() => void togglePerson(person)} className="text-xs font-semibold text-slate-700">{person.is_active ? "Deactivate" : "Activate"}</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Paid Orders for Supply</h2>
            {loading ? <p className="mt-5 text-sm text-slate-500">Loading...</p> : orders.length === 0 ? (
              <p className="mt-5 text-sm text-slate-500">No paid orders are waiting for supply.</p>
            ) : (
              <div className="mt-5 space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div><p className="font-semibold">{order.reference}</p><p className="text-sm text-slate-600">{order.school_name} · {order.contact_name}</p></div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{order.supply_status}</span>
                    </div>
                    {order.supply_status === "Pending Supply" ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {persons.filter(p => p.is_active).map(person => (
                          <button key={person.id} type="button" onClick={() => void assign(order.id, person.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50">
                            Assign {person.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
                        <p>Assigned supply person: <strong>{persons.find(p => p.id === order.supply_person_id)?.name ?? "Assigned"}</strong></p>
                        <p className="mt-1">Delivery Code: <strong className="tracking-[0.2em]">{order.delivery_code}</strong></p>
                        <p className="mt-2 text-xs text-slate-500">The supply person shows this code to the school. The school may enter it on the optional confirmation page.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
