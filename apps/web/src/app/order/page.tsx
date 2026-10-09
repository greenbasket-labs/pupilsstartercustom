"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type CatalogueProduct = {
  id: string;
  name: string;
  className: string;
  priceKobo: number;
  available: number;
};

type OrderItem = {
  productId: string;
  productName: string;
  className: string;
  quantity: number;
  unitPriceKobo: number;
  lineTotalKobo: number;
};

type SubmittedOrder = {
  orderId: string;
  reference: string;
  totalKobo: number;
  paymentStatus: "Pending";
  supplyStatus: "Pending Supply";
  email: string;
};

function formatNairaKobo(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CustomerOrderPage() {
  const [catalogue, setCatalogue] = useState<CatalogueProduct[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<SubmittedOrder | null>(null);
  const [startingPayment, setStartingPayment] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalogue() {
      try {
        const response = await fetch("/api/order", { cache: "no-store" });
        const body = (await response.json()) as {
          products?: CatalogueProduct[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(body.error ?? "Unable to load the catalogue.");
        }

        if (!cancelled) {
          setCatalogue(body.products ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load the catalogue.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCatalogue(false);
        }
      }
    }

    void loadCatalogue();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProduct = catalogue.find(
    (product) => product.id === selectedProductId,
  );

  const cartTotalKobo = useMemo(
    () => items.reduce((sum, item) => sum + item.lineTotalKobo, 0),
    [items],
  );

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProduct) {
      setMessage("Select an assessment book.");
      return;
    }

    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
      setMessage("Enter a valid quantity.");
      return;
    }

    const existingQuantity =
      items.find((item) => item.productId === selectedProduct.id)?.quantity ?? 0;

    if (existingQuantity + requestedQuantity > selectedProduct.available) {
      setMessage(
        `Only ${selectedProduct.available.toLocaleString("en-NG")} unit(s) are currently available for this book.`,
      );
      return;
    }

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
            className: selectedProduct.className,
            quantity: requestedQuantity,
            unitPriceKobo: selectedProduct.priceKobo,
            lineTotalKobo: requestedQuantity * selectedProduct.priceKobo,
          },
        ];
      }

      return current.map((item) =>
        item.productId === selectedProduct.id
          ? {
              ...item,
              quantity: item.quantity + requestedQuantity,
              lineTotalKobo:
                (item.quantity + requestedQuantity) * item.unitPriceKobo,
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

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length === 0) {
      setMessage("Add at least one assessment book to the order.");
      return;
    }

    if (!schoolName.trim() || !contactName.trim() || !phone.trim() || !email.trim()) {
      setMessage("Enter the school name, contact name, phone number, and email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName,
          contactName,
          phone,
          email,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const body = (await response.json()) as {
        orderId?: string;
        reference?: string;
        totalKobo?: number;
        paymentStatus?: "Pending";
        supplyStatus?: "Pending Supply";
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to create the order.");
      }

      if (
        !body.orderId ||
        !body.reference ||
        !body.totalKobo ||
        body.paymentStatus !== "Pending" ||
        body.supplyStatus !== "Pending Supply"
      ) {
        throw new Error("The server returned an invalid order confirmation.");
      }

      setSubmittedOrder({
        orderId: body.orderId,
        reference: body.reference,
        totalKobo: body.totalKobo,
        paymentStatus: body.paymentStatus,
        supplyStatus: body.supplyStatus,
        email: email.trim().toLowerCase(),
      });
      setItems([]);
      setSelectedProductId("");
      setQuantity("1");
      setSchoolName("");
      setContactName("");
      setPhone("");
      setEmail("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create the order.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function startPayment() {
    if (!submittedOrder) return;

    setStartingPayment(true);
    setMessage("");

    try {
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: submittedOrder.orderId,
          email: submittedOrder.email,
        }),
      });

      const body = (await response.json()) as {
        authorizationUrl?: string;
        error?: string;
      };

      if (!response.ok || !body.authorizationUrl) {
        throw new Error(body.error ?? "Unable to start payment.");
      }

      window.location.assign(body.authorizationUrl);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to start payment.",
      );
      setStartingPayment(false);
    }
  }

  if (submittedOrder) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              PUPIL'S STARTER ASSESSMENT BOOKS
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
                Payment: <strong>{submittedOrder.paymentStatus}</strong>
              </p>
              <p className="text-sm text-slate-600">
                Supply: <strong>{submittedOrder.supplyStatus}</strong>
              </p>
              <p className="mt-4 text-lg font-semibold">
                {formatNairaKobo(submittedOrder.totalKobo)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void startPayment()}
              disabled={startingPayment}
              className="mt-6 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {startingPayment ? "Starting payment..." : "Pay Now"}
            </button>

            <button
              type="button"
              onClick={() => setSubmittedOrder(null)}
              className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
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
            PUPIL'S STARTER ASSESSMENT BOOKS
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Assessment Books
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
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
            </p>

            {loadingCatalogue ? (
              <p className="mt-6 text-sm text-slate-500">Loading catalogue...</p>
            ) : catalogue.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No assessment books are currently available for ordering.
              </p>
            ) : (
              <>
                <form
                  onSubmit={addItem}
                  className="mt-5 grid gap-3 sm:grid-cols-[1fr_150px_auto]"
                >
                  <select
                    value={selectedProductId}
                    onChange={(event) => setSelectedProductId(event.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  >
                    <option value="">Select assessment book</option>
                    {catalogue.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} · {product.className} ·{" "}
                        {formatNairaKobo(product.priceKobo)} · Stock{" "}
                        {product.available}
                      </option>
                    ))}
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

                <div className="mt-6 space-y-3">
                  {catalogue.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-slate-500">
                          {product.className} · {formatNairaKobo(product.priceKobo)}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {product.available > 0
                          ? `${product.available.toLocaleString("en-NG")} available`
                          : "Currently unavailable"}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Your Order</h2>

            {items.length === 0 ? (
              <p className="mt-5 text-sm text-slate-500">No books added yet.</p>
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
                        Qty {item.quantity} ·{" "}
                        {formatNairaKobo(item.unitPriceKobo)} each
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatNairaKobo(item.lineTotalKobo)}
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
                    {formatNairaKobo(cartTotalKobo)}
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
                placeholder="Email address"
                type="email"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              />

              <button
                type="submit"
                disabled={items.length === 0 || submitting}
                className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Submitting..." : "Submit Order"}
              </button>
            </form>
          </section>
        </div>

        <p className="mt-6 text-xs text-slate-500">
        </p>
      </div>
    </main>
  );
}
