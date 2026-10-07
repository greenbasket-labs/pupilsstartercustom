import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";

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

type StockMovement = {
  id: string;
  productId: string;
  kind: "received" | "incoming" | "incoming_received" | "adjustment";
  quantity: number;
  note: string;
  createdAt: string;
};

type OrderItem = {
  productId: string;
  productName: string;
  className: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type CustomerOrder = {
  id: string;
  reference: string;
  schoolName: string;
  contactName: string;
  phone: string;
  email: string;
  items: OrderItem[];
  total: number;
  paymentStatus: "Pending";
  supplyStatus: "Pending Supply";
  createdAt: string;
};

const CLASSES_KEY = "pupils-start:classes";
const PRODUCTS_KEY = "pupils-start:products";
const STOCK_MOVEMENTS_KEY = "pupils-start:stock-movements";
const ORDERS_KEY = "pupils-start:orders";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function subscribeToStorage(callback: () => void) {
  const handleStorage = () => callback();
  window.addEventListener("storage", handleStorage);
  window.addEventListener("pupils-start-local-change", handleStorage);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("pupils-start-local-change", handleStorage);
  };
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeOrderReference() {
  const stamp = Date.now().toString().slice(-7);
  const random = Math.floor(100 + Math.random() * 900);
  return `PS-${stamp}-${random}`;
}

function formatNaira(value: number) {
  return `₦${value.toLocaleString("en-NG")}`;
}

function stockTotals(productId: string, movements: StockMovement[]) {
  return movements.reduce(
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

export default function CustomerOrderPage() {
  const classes = useSyncExternalStore(
    subscribeToStorage,
    () => readStorage<ClassItem[]>(CLASSES_KEY, []),
    () => [],
  );
  const products = useSyncExternalStore(
    subscribeToStorage,
    () => readStorage<Product[]>(PRODUCTS_KEY, []),
    () => [],
  );
  const stockMovements = useSyncExternalStore(
    subscribeToStorage,
    () => readStorage<StockMovement[]>(STOCK_MOVEMENTS_KEY, []),
    () => [],
  );

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submittedOrder, setSubmittedOrder] = useState<CustomerOrder | null>(null);

  const activeProducts = useMemo(
    () =>
      products.filter((product) => {
        const classItem = classes.find((item) => item.id === product.classId);
        return product.active && classItem?.active;
      }),
    [classes, products],
  );

  const selectedProduct = activeProducts.find(
    (product) => product.id === selectedProductId,
  );

  const cartTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProduct) {
      setMessage("Select an assessment book.");
      return;
    }

    const requestedQuantity = Number(quantity);
    const available = stockTotals(selectedProduct.id, stockMovements).available;

    if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
      setMessage("Enter a valid quantity.");
      return;
    }

    const existingQuantity = items.find(
      (item) => item.productId === selectedProduct.id,
    )?.quantity ?? 0;

    if (existingQuantity + requestedQuantity > available) {
      setMessage(
        `Only ${available.toLocaleString("en-NG")} unit(s) are currently available for this book.`,
      );
      return;
    }

    const className =
      classes.find((item) => item.id === selectedProduct.classId)?.name ??
      "Unknown class";

    setItems((current) => {
      const existing = current.find(
        (item) => item.productId === selectedProduct.id,
      );

      if (!existing) {
        return [
          ...current,
          {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            className,
            quantity: requestedQuantity,
            unitPrice: selectedProduct.price,
            lineTotal: requestedQuantity * selectedProduct.price,
          },
        ];
      }

      return current.map((item) =>
        item.productId === selectedProduct.id
          ? {
              ...item,
              quantity: item.quantity + requestedQuantity,
              lineTotal: (item.quantity + requestedQuantity) * item.unitPrice,
            }
          : item,
      );
    });

    setQuantity("1");
    setMessage("Book added to order.");
  }

  function removeItem(productId: string) {
    setItems((current) => current.filter((item) => item.productId !== productId));
    setMessage("Book removed from order.");
  }

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length === 0) {
      setMessage("Add at least one assessment book to the order.");
      return;
    }

    if (!schoolName.trim() || !contactName.trim() || !phone.trim()) {
      setMessage("Enter the school name, contact name, and phone number.");
      return;
    }

    const order: CustomerOrder = {
      id: makeId("order"),
      reference: makeOrderReference(),
      schoolName: schoolName.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      items,
      total: cartTotal,
      paymentStatus: "Pending",
      supplyStatus: "Pending Supply",
      createdAt: new Date().toISOString(),
    };

    const currentOrders = readStorage<CustomerOrder[]>(ORDERS_KEY, []);
    window.localStorage.setItem(
      ORDERS_KEY,
      JSON.stringify([...currentOrders, order]),
    );
    window.dispatchEvent(
      new CustomEvent("pupils-start-local-change", { detail: ORDERS_KEY }),
    );

    setSubmittedOrder(order);
    setItems([]);
    setSelectedProductId("");
    setQuantity("1");
    setSchoolName("");
    setContactName("");
    setPhone("");
    setEmail("");
    setMessage("");
  }

  if (submittedOrder) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              PUPILS START
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Order received
            </h1>
            <p className="mt-3 text-slate-600">
              Your order has been recorded. Payment has not been made yet.
            </p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Order reference
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {submittedOrder.reference}
              </p>
              <p className="mt-4 text-sm text-slate-600">
                Payment: <strong>Pending</strong>
              </p>
              <p className="text-sm text-slate-600">
                Supply: <strong>Pending Supply</strong>
              </p>
              <p className="mt-4 text-lg font-semibold">
                {formatNaira(submittedOrder.total)}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {submittedOrder.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-slate-500">
                      {item.className} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">{formatNaira(item.lineTotal)}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs text-slate-500">
              This development ordering screen does not process payment or
              reduce stock. Verified payment will control stock reduction in
              the later payment flow.
            </p>

            <button
              type="button"
              onClick={() => setSubmittedOrder(null)}
              className="mt-6 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Place another order
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            PUPILS START
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Assessment Books
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Select the assessment books your school needs and submit an order.
            No customer account is required.
          </p>
        </header>

        {message ? (
          <div className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Select Books</h2>
            <p className="mt-1 text-sm text-slate-500">
              Only active classes and assessment books are available for ordering.
            </p>

            {activeProducts.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No assessment books are currently available for ordering.
              </p>
            ) : (
              <form onSubmit={addItem} className="mt-5 grid gap-3 sm:grid-cols-[1fr_150px_auto]">
                <select
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                >
                  <option value="">Select assessment book</option>
                  {activeProducts.map((product) => {
                    const className =
                      classes.find((item) => item.id === product.classId)?.name ??
                      "Unknown class";
                    const available = stockTotals(product.id, stockMovements).available;

                    return (
                      <option key={product.id} value={product.id}>
                        {product.name} · {className} · {formatNaira(product.price)} · Stock {available}
                      </option>
                    );
                  })}
                </select>

                <input
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Quantity"
                  className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                />

                <button
                  type="submit"
                  className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Add
                </button>
              </form>
            )}

            <div className="mt-6 space-y-3">
              {activeProducts.map((product) => {
                const className =
                  classes.find((item) => item.id === product.classId)?.name ??
                  "Unknown class";
                const available = stockTotals(product.id, stockMovements).available;

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-slate-500">
                        {className} · {formatNaira(product.price)}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {available > 0
                        ? `${available.toLocaleString("en-NG")} available`
                        : "Currently unavailable"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Your Order</h2>

            {items.length === 0 ? (
              <p className="mt-5 text-sm text-slate-500">
                No books added yet.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-slate-500">
                        Qty {item.quantity} · {formatNaira(item.unitPrice)} each
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatNaira(item.lineTotal)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="mt-1 text-xs font-medium text-red-700 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-semibold">
                    {formatNaira(cartTotal)}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={submitOrder} className="mt-7 space-y-3">
              <h3 className="text-sm font-semibold">School & Contact</h3>

              <input
                value={schoolName}
                onChange={(event) => setSchoolName(event.target.value)}
                placeholder="School name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              />
              <input
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                placeholder="Contact person"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone number"
                type="tel"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address (optional)"
                type="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              />

              <button
                type="submit"
                disabled={items.length === 0}
                className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Submit Order
              </button>
            </form>
          </section>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Phase 3 development screen: orders persist in the current browser as
          a temporary bridge. Payment is not processed here, and creating an
          order does not reduce inventory.
        </p>
      </div>
    </main>
  );
}
