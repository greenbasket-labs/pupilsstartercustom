"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ClassItem = {
  id: string;
  name: string;
  is_active: boolean;
};

type Product = {
  id: string;
  name: string;
  class_id: string;
  price_kobo: number;
  is_active: boolean;
};

type StockMovement = {
  id: string;
  product_id: string;
  kind: "received" | "incoming" | "incoming_received" | "adjustment" | "purchase";
  quantity: number;
  note: string | null;
  order_id: string | null;
  created_at: string;
};

type AdminData = {
  classes: ClassItem[];
  products: Product[];
  movements: StockMovement[];
};

function formatNairaKobo(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

async function adminRequest(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await fetch("/api/admin/catalogue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      typeof result.error === "string"
        ? result.error
        : "Unable to save admin data.",
    );
  }

  return result;
}

function calculateStock(movements: StockMovement[], productId: string) {
  return movements.reduce(
    (totals, movement) => {
      if (movement.product_id !== productId) return totals;

      if (
        movement.kind === "received" ||
        movement.kind === "incoming_received"
      ) {
        totals.available += movement.quantity;
      } else if (movement.kind === "incoming") {
        totals.incoming += movement.quantity;
      } else if (movement.kind === "adjustment") {
        totals.available += movement.quantity;
      } else if (movement.kind === "purchase") {
        totals.available -= movement.quantity;
      }

      return totals;
    },
    { available: 0, incoming: 0 },
  );
}

export default function Home() {
  const [data, setData] = useState<AdminData>({
    classes: [],
    products: [],
    movements: [],
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [openSection, setOpenSection] = useState<string | null>("inventory");

  const [className, setClassName] = useState("");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const classInputRef = useRef<HTMLInputElement>(null);

  const [productName, setProductName] = useState("");
  const [productClassId, setProductClassId] = useState("");
  const [price, setPrice] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const productNameInputRef = useRef<HTMLInputElement>(null);

  const [stockProductId, setStockProductId] = useState("");
  const [stockKind, setStockKind] =
    useState<"received" | "incoming" | "incoming_received" | "adjustment">(
      "received",
    );
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockNote, setStockNote] = useState("");

  const activeClasses = useMemo(
    () => data.classes.filter((item) => item.is_active),
    [data.classes],
  );

  async function loadData() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/catalogue", {
        cache: "no-store",
      });
      const result = (await response.json()) as AdminData & { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to load admin data.");
      }

      setData({
        classes: result.classes ?? [],
        products: result.products ?? [],
        movements: result.movements ?? [],
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load admin data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!editingClassId) return;

    classInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    classInputRef.current?.focus();
    classInputRef.current?.select();
  }, [editingClassId]);

  useEffect(() => {
    if (!editingProductId) return;

    productNameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    productNameInputRef.current?.focus();
    productNameInputRef.current?.select();
  }, [editingProductId]);

  async function saveClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = className.trim();

    if (!name) {
      setMessage("Enter a class name.");
      return;
    }

    try {
      const result = await adminRequest(
        editingClassId
          ? { action: "update_class", id: editingClassId, name }
          : { action: "create_class", name },
      );

      const saved = result.class as ClassItem;

      setData((current) => ({
        ...current,
        classes: editingClassId
          ? current.classes.map((item) =>
              item.id === saved.id ? saved : item,
            )
          : [...current.classes, saved].sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
      }));

      setEditingClassId(null);
      setClassName("");
      setMessage(editingClassId ? "Class updated." : "Class saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save class.");
    }
  }

  function editClass(item: ClassItem) {
    setEditingClassId(item.id);
    setClassName(item.name);
    setMessage("Editing class.");
  }

  function cancelClassEdit() {
    setEditingClassId(null);
    setClassName("");
    setMessage("Class editing cancelled.");
  }

  async function toggleClass(item: ClassItem) {
    try {
      const result = await adminRequest({
        action: "set_class_active",
        id: item.id,
        isActive: !item.is_active,
      });
      const saved = result.class as ClassItem;

      setData((current) => ({
        ...current,
        classes: current.classes.map((entry) =>
          entry.id === saved.id ? saved : entry,
        ),
      }));
      setMessage("Class status saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save class status.",
      );
    }
  }

  async function removeClass(id: string) {
    try {
      await adminRequest({ action: "delete_class", id });
      setData((current) => ({
        ...current,
        classes: current.classes.filter((item) => item.id !== id),
      }));
      setMessage("Class removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to remove class.");
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = productName.trim();
    const amountNaira = Number(price);

    if (
      !name ||
      !productClassId ||
      !Number.isFinite(amountNaira) ||
      amountNaira <= 0 ||
      !Number.isInteger(amountNaira)
    ) {
      setMessage("Enter the book name, class and a valid whole-naira price.");
      return;
    }

    const priceKobo = amountNaira * 100;

    try {
      const result = await adminRequest(
        editingProductId
          ? {
              action: "update_product",
              id: editingProductId,
              name,
              classId: productClassId,
              priceKobo,
            }
          : {
              action: "create_product",
              name,
              classId: productClassId,
              priceKobo,
            },
      );

      const saved = result.product as Product;

      setData((current) => ({
        ...current,
        products: editingProductId
          ? current.products.map((item) =>
              item.id === saved.id ? saved : item,
            )
          : [...current.products, saved].sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
      }));

      setEditingProductId(null);
      setProductName("");
      setProductClassId("");
      setPrice("");
      setMessage(editingProductId ? "Assessment book updated." : "Assessment book saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save assessment book.",
      );
    }
  }

  function editProduct(item: Product) {
    setEditingProductId(item.id);
    setProductName(item.name);
    setProductClassId(item.class_id);
    setPrice(String(item.price_kobo / 100));
    setMessage("Editing assessment book.");
  }

  function cancelProductEdit() {
    setEditingProductId(null);
    setProductName("");
    setProductClassId("");
    setPrice("");
    setMessage("Assessment-book editing cancelled.");
  }

  async function toggleProduct(item: Product) {
    try {
      const result = await adminRequest({
        action: "set_product_active",
        id: item.id,
        isActive: !item.is_active,
      });
      const saved = result.product as Product;

      setData((current) => ({
        ...current,
        products: current.products.map((entry) =>
          entry.id === saved.id ? saved : entry,
        ),
      }));
      setMessage("Assessment book status saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save assessment-book status.",
      );
    }
  }

  async function removeProduct(id: string) {
    try {
      await adminRequest({ action: "delete_product", id });
      setData((current) => ({
        ...current,
        products: current.products.filter((item) => item.id !== id),
      }));
      setMessage("Assessment book removed.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to remove assessment book.",
      );
    }
  }

  async function addStockMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quantity = Number(stockQuantity);
    const note = stockNote.trim();

    if (!stockProductId || !Number.isInteger(quantity) || quantity === 0) {
      setMessage("Select a product and enter a valid non-zero whole quantity.");
      return;
    }

    if (stockKind !== "adjustment" && quantity < 0) {
      setMessage("Stock quantities must be positive for this movement.");
      return;
    }

    if (stockKind === "adjustment" && !note) {
      setMessage("A reason is required for a stock adjustment.");
      return;
    }

    try {
      const result = await adminRequest({
        action: "record_stock",
        productId: stockProductId,
        kind: stockKind,
        quantity,
        note,
      });

      const movement = result.movement as StockMovement;

      setData((current) => ({
        ...current,
        movements: [movement, ...current.movements],
      }));

      setStockQuantity("");
      setStockNote("");
      setMessage("Stock movement saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save stock movement.",
      );
    }
  }

  function classLabel(id: string) {
    return data.classes.find((item) => item.id === id)?.name ?? "Unknown class";
  }

  function stockMovementLabel(kind: StockMovement["kind"]) {
    if (kind === "received") return "Stock Received";
    if (kind === "incoming") return "Incoming Stock";
    if (kind === "incoming_received") return "Receive Incoming";
    if (kind === "purchase") return "Verified Purchase";
    return "Stock Adjustment";
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">

      <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-5 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              PUPILS START
            </p>
            <p className="mt-1 text-xs text-slate-500">Admin Workspace</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-3" aria-label="Admin navigation">
            <a
              href="#overview"
              className="mb-1 block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Overview
            </a>

            <div className="mb-1">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === "inventory" ? null : "inventory")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <span>Inventory</span>
                <span aria-hidden="true">{openSection === "inventory" ? "−" : "+"}</span>
              </button>
              {openSection === "inventory" ? (
                <div className="ml-3 border-l border-slate-200 pl-3">
                  <a href="#inventory-stock" className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Stock</a>
                  <a href="#inventory-incoming" className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Incoming Stock</a>
                  <a href="#inventory-history" className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Stock History</a>
                </div>
              ) : null}
            </div>

            <div className="mb-1">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === "orders" ? null : "orders")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <span>Orders</span>
                <span aria-hidden="true">{openSection === "orders" ? "−" : "+"}</span>
              </button>
              {openSection === "orders" ? (
                <div className="ml-3 border-l border-slate-200 pl-3">
                  <a href="/orders" className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Orders</a>
                  <a href="/orders?filter=pending-supply" className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Pending Supply</a>
                </div>
              ) : null}
            </div>

            <div className="mb-1">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === "customers" ? null : "customers")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <span>Customers</span>
                <span aria-hidden="true">{openSection === "customers" ? "−" : "+"}</span>
              </button>
              {openSection === "customers" ? (
                <div className="ml-3 border-l border-slate-200 pl-3">
                  <span className="block rounded-md px-3 py-2 text-sm text-slate-400">Schools</span>
                  <a href="/customer-history" className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Customer History</a>
                </div>
              ) : null}
            </div>

            <div className="mb-1">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === "products" ? null : "products")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <span>Products</span>
                <span aria-hidden="true">{openSection === "products" ? "−" : "+"}</span>
              </button>
              {openSection === "products" ? (
                <div className="ml-3 border-l border-slate-200 pl-3">
                  <a href="#classes" className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Classes</a>
                  <a href="#assessment-books" className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Assessment Books</a>
                </div>
              ) : null}
            </div>

            <button type="button" className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50">
              <span>Payments</span>
            </button>

            <div className="mb-1">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === "supply" ? null : "supply")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <span>Supply</span>
                <span aria-hidden="true">{openSection === "supply" ? "−" : "+"}</span>
              </button>
              {openSection === "supply" ? (
                <div className="ml-3 border-l border-slate-200 pl-3">
                  <a href="/supply-admin" className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Supply Persons</a>
                </div>
              ) : null}
            </div>

            <button type="button" className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50">
              <span>Reports</span>
            </button>
          </nav>

          <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-400">
            Current module: Catalogue & Inventory
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div id="overview" className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              PUPILS START
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Classes & Assessment Books
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Admin catalogue and inventory data is now stored in the Supabase database.
            </p>
          </div>

          {message ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
              {message}
            </div>
          ) : null}
        </header>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
            Loading catalogue and inventory…
          </div>
        ) : (
          <>
            <section id="products" className="grid gap-6 lg:grid-cols-2">
              <div id="classes" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">Classes</h2>
                  <p className="text-sm text-slate-500">
                    Add, edit, activate, deactivate and remove business classes.
                  </p>
                </div>

                <form onSubmit={saveClass} className="flex gap-3">
                  <input
                    ref={classInputRef}
                    value={className}
                    onChange={(event) => setClassName(event.target.value)}
                    placeholder="e.g. Primary 1"
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {editingClassId ? "Update & Save" : "Add & Save"}
                  </button>
                  {editingClassId ? (
                    <button
                      type="button"
                      onClick={cancelClassEdit}
                      className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  ) : null}
                </form>

                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                  {data.classes.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">
                      No classes yet. Add the first class above.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {data.classes.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 px-4 py-3"
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-slate-500">
                              {item.is_active ? "Active" : "Inactive"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => editClass(item)}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleClass(item)}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                            >
                              {item.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeClass(item.id)}
                              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div id="assessment-books" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">Assessment Books</h2>
                  <p className="text-sm text-slate-500">
                    Create products against saved classes and set their selling price.
                  </p>
                </div>

                <form onSubmit={saveProduct} className="space-y-3">
                  <input
                    ref={productNameInputRef}
                    value={productName}
                    onChange={(event) => setProductName(event.target.value)}
                    placeholder="Assessment book name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={productClassId}
                      onChange={(event) => setProductClassId(event.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                    >
                      <option value="">Select class</option>
                      {(editingProductId ? data.classes : activeClasses).map(
                        (item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ),
                      )}
                    </select>

                    <input
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Price (₦)"
                      className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      {editingProductId ? "Update & Save" : "Add Book & Save"}
                    </button>
                    {editingProductId ? (
                      <button
                        type="button"
                        onClick={cancelProductEdit}
                        className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>

                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                  {data.products.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">
                      No assessment books yet. Add one above.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {data.products.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{item.name}</p>
                            <p className="text-xs text-slate-500">
                              {classLabel(item.class_id)} · {formatNairaKobo(item.price_kobo)}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => editProduct(item)}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleProduct(item)}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                            >
                              {item.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeProduct(item.id)}
                              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section id="inventory" className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 id="inventory-stock" className="text-lg font-semibold">Inventory</h2>
                <p className="text-sm text-slate-500">
                  Record stock movements against database-backed assessment books.
                </p>
              </div>

              {data.products.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  Add an assessment book before recording inventory.
                </p>
              ) : (
                <>
                  <form
                    onSubmit={addStockMovement}
                    className="grid gap-3 lg:grid-cols-5"
                  >
                    <select
                      value={stockProductId}
                      onChange={(event) => setStockProductId(event.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 lg:col-span-2"
                    >
                      <option value="">Select assessment book</option>
                      {data.products.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {classLabel(item.class_id)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={stockKind}
                      onChange={(event) =>
                        setStockKind(
                          event.target.value as
                            | "received"
                            | "incoming"
                            | "incoming_received"
                            | "adjustment",
                        )
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                    >
                      <option value="received">Stock Received</option>
                      <option value="incoming">Incoming Stock</option>
                      <option value="incoming_received">Receive Incoming</option>
                      <option value="adjustment">Stock Adjustment</option>
                    </select>

                    <input
                      value={stockQuantity}
                      onChange={(event) => setStockQuantity(event.target.value)}
                      type="number"
                      step="1"
                      placeholder={
                        stockKind === "adjustment" ? "Qty (+/-)" : "Quantity"
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                    />

                    <button
                      type="submit"
                      className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Save Movement
                    </button>

                    <input
                      value={stockNote}
                      onChange={(event) => setStockNote(event.target.value)}
                      placeholder={
                        stockKind === "adjustment"
                          ? "Reason (required)"
                          : "Note (optional)"
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 lg:col-span-4"
                    />
                  </form>

                  <div id="inventory-incoming" className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Assessment Book</th>
                          <th className="px-4 py-3 font-semibold">Available</th>
                          <th className="px-4 py-3 font-semibold">Incoming</th>
                          <th className="px-4 py-3 font-semibold">Projected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {data.products.map((item) => {
                          const totals = calculateStock(data.movements, item.id);
                          return (
                            <tr key={item.id}>
                              <td className="px-4 py-3">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-slate-500">
                                  {classLabel(item.class_id)}
                                </p>
                              </td>
                              <td className="px-4 py-3">{totals.available}</td>
                              <td className="px-4 py-3">{totals.incoming}</td>
                              <td className="px-4 py-3">
                                {totals.available + totals.incoming}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div id="inventory-history" className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[900px] text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Date</th>
                          <th className="px-4 py-3 font-semibold">Assessment Book</th>
                          <th className="px-4 py-3 font-semibold">Movement</th>
                          <th className="px-4 py-3 font-semibold">Quantity</th>
                          <th className="px-4 py-3 font-semibold">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {data.movements.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-slate-500"
                            >
                              No stock movements yet.
                            </td>
                          </tr>
                        ) : (
                          data.movements.map((movement) => {
                            const product = data.products.find(
                              (item) => item.id === movement.product_id,
                            );
                            return (
                              <tr key={movement.id}>
                                <td className="px-4 py-3">
                                  {new Date(movement.created_at).toLocaleString(
                                    "en-NG",
                                  )}
                                </td>
                                <td className="px-4 py-3 font-medium">
                                  {product?.name ?? "Unknown product"}
                                </td>
                                <td className="px-4 py-3">
                                  {stockMovementLabel(movement.kind)}
                                </td>
                                <td className="px-4 py-3">
                                  {movement.kind === "adjustment"
                                    ? movement.quantity > 0
                                      ? `+${movement.quantity}`
                                      : movement.quantity
                                    : movement.kind === "incoming_received"
                                      ? `-${movement.quantity} incoming / +${movement.quantity} available`
                                      : movement.kind === "purchase"
                                        ? `-${movement.quantity}`
                                        : `+${movement.quantity}`}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {movement.note || "—"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            <p className="mt-6 text-xs text-slate-500">
              Catalogue, inventory, and verified payment purchases are now database-backed.
            </p>
          </>
        )}
        </div>
      </main>
    </div>
  );
}
