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

const CLASSES_KEY = "pupils-start:classes";
const PRODUCTS_KEY = "pupils-start:products";

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

        <p className="mt-6 text-xs text-slate-500">
          This Phase 1 screen persists entries in the current browser while the
          Supabase data layer is being introduced. Business truth will move to
          the database before production use.
        </p>
      </div>
    </main>
  );
}
