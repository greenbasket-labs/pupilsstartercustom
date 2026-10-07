"use client";

import { FormEvent, useCallback, useMemo, useState, useSyncExternalStore } from "react";

type ClassItem = {
  id: string;
  name: string;
  active: boolean;
};

type Product = {
  id: string;
  name: string;
  classId: string;
  price: number;
  active: boolean;
};

type StockMovementKind =
  | "received"
  | "incoming"
  | "incoming_received"
  | "adjustment";

type StockMovement = {
  id: string;
  productId: string;
  kind: StockMovementKind;
  quantity: number;
  note: string;
  createdAt: string;
};

const CLASSES_KEY = "pupils-start:classes";
const PRODUCTS_KEY = "pupils-start:products";
const STOCK_MOVEMENTS_KEY = "pupils-start:stock-movements";

type StateUpdater<T> = T | ((current: T) => T);

function subscribeToLocalStorage(key: string, callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === key) callback();
  };

  const handleLocalChange = (event: Event) => {
    if ((event as CustomEvent<string>).detail === key) callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener("pupils-start:local-storage", handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("pupils-start:local-storage", handleLocalChange);
  };
}

function useLocalStorageState<T>(key: string, initialValue: T) {
  const subscribe = useCallback(
    (callback: () => void) => subscribeToLocalStorage(key, callback),
    [key],
  );

  const getSnapshot = useCallback(
    () => window.localStorage.getItem(key),
    [key],
  );

  const getServerSnapshot = useCallback(() => null, []);

  const rawValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const value = useMemo(() => {
    if (!rawValue) return initialValue;

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return initialValue;
    }
  }, [initialValue, rawValue]);

  const setValue = useCallback(
    (nextValue: StateUpdater<T>) => {
      let currentValue = initialValue;
      const savedValue = window.localStorage.getItem(key);

      if (savedValue) {
        try {
          currentValue = JSON.parse(savedValue) as T;
        } catch {
          currentValue = initialValue;
        }
      }

      const valueToSave =
        typeof nextValue === "function"
          ? (nextValue as (current: T) => T)(currentValue)
          : nextValue;

      window.localStorage.setItem(key, JSON.stringify(valueToSave));

      window.dispatchEvent(
        new CustomEvent("pupils-start:local-storage", {
          detail: key,
        }),
      );
    },
    [initialValue, key],
  );

  return [value, setValue] as const;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Home() {
  const [classes, setClasses] = useLocalStorageState<ClassItem[]>(
    CLASSES_KEY,
    [],
  );

  const [products, setProducts] = useLocalStorageState<Product[]>(
    PRODUCTS_KEY,
    [],
  );

  const [stockMovements, setStockMovements] =
    useLocalStorageState<StockMovement[]>(STOCK_MOVEMENTS_KEY, []);

  const [stockProductId, setStockProductId] = useState("");
  const [stockKind, setStockKind] =
    useState<StockMovementKind>("received");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockNote, setStockNote] = useState("");

  const [className, setClassName] = useState("");
  const [productName, setProductName] = useState("");
  const [productClassId, setProductClassId] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const activeClasses = useMemo(
    () => classes.filter((item) => item.active),
    [classes],
  );

  function addClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = className.trim();

    if (editingClassId) {
      if (!name) {
        setMessage("Enter a class name.");
        return;
      }

      if (
        classes.some(
          (item) =>
            item.id !== editingClassId &&
            item.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        setMessage("That class already exists.");
        return;
      }

      setClasses((current) =>
        current.map((item) =>
          item.id === editingClassId ? { ...item, name } : item,
        ),
      );
      setEditingClassId(null);
      setClassName("");
      setMessage("Class updated.");
      return;
    }

    if (!name) {
      setMessage("Enter a class name.");
      return;
    }

    if (
      classes.some((item) => item.name.toLowerCase() === name.toLowerCase())
    ) {
      setMessage("That class already exists.");
      return;
    }

    setClasses((current) => [
      ...current,
      { id: makeId("class"), name, active: true },
    ]);

    setClassName("");
    setMessage(`Class “${name}” saved.`);
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

  function toggleClass(id: string) {
    setClasses((current) =>
      current.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item,
      ),
    );

    setMessage("Class status saved.");
  }

  function removeClass(id: string) {
    if (products.some((product) => product.classId === id)) {
      setMessage("Remove or reassign the products under this class first.");
      return;
    }

    setClasses((current) => current.filter((item) => item.id !== id));
    setMessage("Class removed.");
  }

  function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = productName.trim();
    const amount = Number(price);

    if (editingProductId) {
      if (
        !name ||
        !productClassId ||
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        setMessage("Enter the book name, class and a valid price.");
        return;
      }

      if (!classes.some((item) => item.id === productClassId)) {
        setMessage("Select a saved class.");
        return;
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === editingProductId
            ? { ...item, name, classId: productClassId, price: amount }
            : item,
        ),
      );
      setEditingProductId(null);
      setProductName("");
      setProductClassId("");
      setPrice("");
      setMessage("Assessment book updated.");
      return;
    }

    if (!name || !productClassId || !Number.isFinite(amount) || amount < 0) {
      setMessage("Enter the book name, class and a valid price.");
      return;
    }

    setProducts((current) => [
      ...current,
      {
        id: makeId("product"),
        name,
        classId: productClassId,
        price: amount,
        active: true,
      },
    ]);

    setProductName("");
    setPrice("");
    setMessage(`Assessment book “${name}” saved.`);
  }

  function editProduct(item: Product) {
    setEditingProductId(item.id);
    setProductName(item.name);
    setProductClassId(item.classId);
    setPrice(String(item.price));
    setMessage("Editing assessment book.");
  }

  function cancelProductEdit() {
    setEditingProductId(null);
    setProductName("");
    setProductClassId("");
    setPrice("");
    setMessage("Assessment-book editing cancelled.");
  }

  function toggleProduct(id: string) {
    setProducts((current) =>
      current.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item,
      ),
    );

    setMessage("Assessment book status saved.");
  }

  function removeProduct(id: string) {
    setProducts((current) => current.filter((item) => item.id !== id));
    setMessage("Assessment book removed.");
  }

  function classLabel(id: string) {
    return classes.find((item) => item.id === id)?.name ?? "Unknown class";
  }

  function stockTotals(productId: string) {
    return stockMovements.reduce(
      (totals, movement) => {
        if (movement.productId !== productId) return totals;

        if (movement.kind === "received") {
          totals.available += movement.quantity;
        } else if (movement.kind === "incoming") {
          totals.incoming += movement.quantity;
        } else if (movement.kind === "incoming_received") {
          totals.incoming -= movement.quantity;
          totals.available += movement.quantity;
        } else {
          totals.available += movement.quantity;
        }

        return totals;
      },
      { available: 0, incoming: 0 },
    );
  }

  function addStockMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quantity = Number(stockQuantity);
    const note = stockNote.trim();

    if (!stockProductId || !Number.isFinite(quantity) || quantity === 0) {
      setMessage("Select a product and enter a valid non-zero quantity.");
      return;
    }

    if (stockKind !== "adjustment" && quantity < 0) {
      setMessage("Stock quantities must be positive for this movement.");
      return;
    }

    const current = stockTotals(stockProductId);

    if (stockKind === "adjustment" && current.available + quantity < 0) {
      setMessage("This adjustment cannot reduce available stock below zero.");
      return;
    }

    if (
      stockKind === "incoming_received" &&
      current.incoming - quantity < 0
    ) {
      setMessage("You cannot receive more incoming stock than is recorded.");
      return;
    }

    setStockMovements((currentMovements) => [
      ...currentMovements,
      {
        id: makeId("movement"),
        productId: stockProductId,
        kind: stockKind,
        quantity,
        note,
        createdAt: new Date().toISOString(),
      },
    ]);

    setStockQuantity("");
    setStockNote("");
    setMessage("Stock movement saved.");
  }

  function stockMovementLabel(kind: StockMovementKind) {
    if (kind === "received") return "Stock Received";
    if (kind === "incoming") return "Incoming Stock";
    if (kind === "incoming_received") return "Receive Incoming";
    return "Stock Adjustment";
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              PUPILS START
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Classes & Assessment Books
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Add the business classes and assessment books here. Nothing is
              fixed in the code.
            </p>
          </div>

          {message ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
              {message}
            </div>
          ) : null}
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Classes</h2>

              <p className="text-sm text-slate-500">
                The admin can add, activate and remove classes as the business
                changes.
              </p>
            </div>

            <form onSubmit={addClass} className="flex gap-3">
              <input
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
              {classes.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  No classes yet. Add the first class above.
                </p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {classes.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>

                        <p className="text-xs text-slate-500">
                          {item.active ? "Active" : "Inactive"}
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
                          onClick={() => toggleClass(item.id)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                        >
                          {item.active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeClass(item.id)}
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

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Assessment Books</h2>

              <p className="text-sm text-slate-500">
                Create products against the classes already saved above and
                set their selling price.
              </p>
            </div>

            <form onSubmit={addProduct} className="space-y-3">
              <input
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

                  {(editingProductId ? classes : activeClasses).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  type="number"
                  min="0"
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
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              {products.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  No assessment books yet. Add one above.
                </p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {products.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>

                        <p className="text-xs text-slate-500">
                          {classLabel(item.classId)} · {formatNaira(item.price)}
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
                          onClick={() => toggleProduct(item.id)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                        >
                          {item.active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeProduct(item.id)}
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

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Inventory</h2>
            <p className="text-sm text-slate-500">
              Record stock movements against saved assessment books. Available
              and incoming stock are calculated from the movement ledger.
            </p>
          </div>

          {products.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
              Add an assessment book before recording inventory.
            </p>
          ) : (
            <>
              <form onSubmit={addStockMovement} className="grid gap-3 lg:grid-cols-5">
                <select
                  value={stockProductId}
                  onChange={(event) => setStockProductId(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 lg:col-span-2"
                >
                  <option value="">Select assessment book</option>
                  {products.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {classLabel(item.classId)}
                    </option>
                  ))}
                </select>

                <select
                  value={stockKind}
                  onChange={(event) =>
                    setStockKind(event.target.value as StockMovementKind)
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
                  placeholder={stockKind === "adjustment" ? "Qty (+/-)" : "Quantity"}
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
                  placeholder="Note (optional)"
                  className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 lg:col-span-4"
                />
              </form>

              <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
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
                    {products.map((item) => {
                      const totals = stockTotals(item.id);
                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-slate-500">{classLabel(item.classId)}</p>
                          </td>
                          <td className="px-4 py-3">{totals.available}</td>
                          <td className="px-4 py-3">{totals.incoming}</td>
                          <td className="px-4 py-3">{totals.available + totals.incoming}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
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
                    {stockMovements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No stock movements yet.
                        </td>
                      </tr>
                    ) : (
                      [...stockMovements].reverse().map((movement) => {
                        const product = products.find(
                          (item) => item.id === movement.productId,
                        );
                        return (
                          <tr key={movement.id}>
                            <td className="px-4 py-3">
                              {new Date(movement.createdAt).toLocaleString("en-NG")}
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
                                  ? "+" + movement.quantity
                                  : movement.quantity
                                : movement.kind === "incoming_received"
                                  ? "-" + movement.quantity + " incoming / +" + movement.quantity + " available"
                                  : "+" + movement.quantity}
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
          This Phase 1 screen persists entries in the current browser while the
          Supabase data layer is being introduced. Business truth will move to
          the database before production use.
        </p>
      </div>
    </main>
  );
}
