"use client";

import { useEffect, useState } from "react";

type VerificationResult = {
  reference?: string;
  status?: string;
  paymentStatus?: string;
  inventoryReduced?: boolean;
  error?: string;
};

export default function PaymentCallbackPage() {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get("reference");

    if (!reference) {
      setResult({ error: "No Paystack payment reference was returned." });
      setLoading(false);
      return;
    }

    async function verify() {
      try {
        const response = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });

        const body = (await response.json()) as VerificationResult;

        if (!response.ok) {
          throw new Error(body.error ?? "Unable to verify payment.");
        }

        setResult(body);
      } catch (error) {
        setResult({
          error:
            error instanceof Error
              ? error.message
              : "Unable to verify payment.",
        });
      } finally {
        setLoading(false);
      }
    }

    void verify();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            PUPILS START
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Payment result
          </h1>

          {loading ? (
            <p className="mt-6 text-slate-600">
              Verifying your payment with Paystack...
            </p>
          ) : result?.error ? (
            <>
              <p className="mt-6 text-red-700">{result.error}</p>
              <a
                href="/order"
                className="mt-6 inline-block rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Return to orders
              </a>
            </>
          ) : (
            <>
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-600">
                  Payment:{" "}
                  <strong>{result?.paymentStatus ?? "Pending"}</strong>
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Paystack status:{" "}
                  <strong>{result?.status ?? "Unknown"}</strong>
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Stock reduction: <strong>No</strong>
                </p>
              </div>

              <p className="mt-5 text-sm text-slate-500">
                This payment verification step does not change inventory.
                Inventory reduction will only happen in the later protected
                verified-payment fulfillment step.
              </p>

              <a
                href="/order"
                className="mt-6 inline-block rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Return to orders
              </a>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
