"use client";

import { useState } from "react";
import AdminCatalogueView from "./components/admin-catalogue-view";
import OverviewPage from "./overview/page";
import OrdersPage from "./orders/page";
import SchoolsPage from "./schools/page";
import CustomerHistoryPage from "./customer-history/page";
import SupplyAdminPage from "./supply-admin/page";

type View = "overview" | "catalogue" | "orders" | "schools" | "customer-history" | "supply" | "payments" | "reports";
function Placeholder({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">PUPILS START</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">This module is not part of the current accepted workspace yet.</p>
      </div>
    </main>
  );
}

export default function AdminWorkspace() {
  const [activeView, setActiveView] = useState<View>("overview");

  function show(view: View) {
    setActiveView(view);
  }

  function itemButton(label: string, view: View) {
    const active = activeView === view;
    return (
      <button
        type="button"
        onClick={() => show(view)}
        className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm ${active ? "bg-slate-100 font-semibold text-slate-950" : "text-slate-700 hover:bg-slate-50"}`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
      <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-5 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">PUPILS START</p>
            <p className="mt-1 text-xs text-slate-500">Admin Workspace</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-3" aria-label="Admin navigation">
            <div className="mb-1">{itemButton("Overview", "overview")}</div>
            <div className="mb-1">{itemButton("Inventory", "catalogue")}</div>
            <div className="mb-1">{itemButton("Orders", "orders")}</div>
            <div className="mb-1">{itemButton("Customers", "schools")}</div>
            <div className="mb-1">{itemButton("Products", "catalogue")}</div>
            <div className="mb-1">{itemButton("Payments", "payments")}</div>
            <div className="mb-1">{itemButton("Supply", "supply")}</div>
            <div className="mb-1">{itemButton("Reports", "reports")}</div>
          </nav>

          <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-400">
            Current view: {activeView === "customer-history" ? "Customers" : activeView === "catalogue" ? "Inventory / Products" : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        {activeView === "overview" ? <OverviewPage /> : null}
        {activeView === "catalogue" ? <AdminCatalogueView /> : null}
        {activeView === "orders" ? <OrdersPage /> : null}
        {activeView === "schools" ? <SchoolsPage /> : null}
        {activeView === "customer-history" ? <CustomerHistoryPage /> : null}
        {activeView === "supply" ? <SupplyAdminPage /> : null}
        {activeView === "payments" ? <Placeholder title="Payments" /> : null}
        {activeView === "reports" ? <Placeholder title="Reports" /> : null}
      </main>
    </div>
  );
}
