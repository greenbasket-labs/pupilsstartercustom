"use client";

import { FormEvent, useState } from "react";

type Method = "phone" | "email";

export default function LoginPage() {
  const [method, setMethod] = useState<Method>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"identity" | "otp">("identity");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const identity = method === "email" ? email : phone;

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, phone, email }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(result.error ?? "Unable to send OTP.");
        return;
      }

      setStep("otp");
      setMessage(
        method === "email"
          ? "OTP sent. Check your email and enter the code."
          : "OTP sent. Enter the code received on your phone.",
      );
    } catch {
      setMessage("Unable to contact the sign-in service.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, phone, email, token: otp }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(result.error ?? "Unable to verify OTP.");
        return;
      }

      window.location.href = "/";
    } catch {
      setMessage("Unable to complete sign-in.");
    } finally {
      setBusy(false);
    }
  }

  function switchMethod(nextMethod: Method) {
    setMethod(nextMethod);
    setStep("identity");
    setOtp("");
    setMessage("");
  }

  function useAnotherIdentity() {
    setStep("identity");
    setOtp("");
    setMessage("");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">PUPILS START</p>
        <h1 className="mt-2 text-2xl font-semibold">Admin sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use an authorized administrator phone number or email address.
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => switchMethod("phone")}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${method === "phone" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}
          >
            Phone
          </button>
          <button
            type="button"
            onClick={() => switchMethod("email")}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${method === "email" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}
          >
            Email
          </button>
        </div>

        {step === "identity" ? (
          <form onSubmit={requestOtp} className="mt-6 space-y-4">
            {method === "phone" ? (
              <label className="block text-sm font-medium">
                Phone number
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+2348012345678"
                  inputMode="tel"
                  autoComplete="tel"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500"
                  required
                />
              </label>
            ) : (
              <label className="block text-sm font-medium">
                Email address
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.com"
                  inputMode="email"
                  autoComplete="email"
                  type="email"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500"
                  required
                />
              </label>
            )}

            <button
              disabled={busy}
              className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Sending OTP…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <p className="text-sm text-slate-600">
              Code sent to <span className="font-medium text-slate-900">{identity}</span>.
            </p>
            <label className="block text-sm font-medium">
              OTP code
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter OTP"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500"
                required
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Verifying…" : "Verify & Continue"}
            </button>
            <button
              type="button"
              onClick={useAnotherIdentity}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              Use another {method}
            </button>
          </form>
        )}

        {message ? (
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}
