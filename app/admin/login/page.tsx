"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Lock, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        document.cookie = `admin_token=${data.token}; path=/; max-age=3600; secure=${window.location.protocol === "https:"}; samesite=lax`;
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0d13] px-4 py-10 text-[#f5efe6] bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.12),transparent_45%)]">
      <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-[#d4af37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#d4af37]/[0.06] blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4af37]/25 bg-[#d4af37]/10 text-[#d4af37] shadow-[0_0_40px_rgba(212,175,55,0.12)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-serif text-4xl font-light tracking-[0.08em] text-[#d4af37]">AJZ 2026</h1>
          <p className="mt-3 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.4em] text-white/40">
            <span className="h-px w-8 bg-white/15" />
            Admin console
            <span className="h-px w-8 bg-white/15" />
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#1a1923] to-[#14131b] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-9">
          <h2 className="font-serif text-2xl font-light">Welcome back</h2>
          <p className="mt-2 text-xs leading-relaxed text-white/40">
            Sign in to manage guests, invitations and event details.
          </p>

          <form onSubmit={handleSubmit} className="mt-7">
            <label htmlFor="admin-password" className="mb-3 block text-[10px] uppercase tracking-[0.22em] text-white/45">
              Admin password
            </label>
            <div className="group relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 transition group-focus-within:text-[#d4af37]" />
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#11111a] py-4 pl-11 pr-4 text-sm text-[#f5efe6] outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-[#d4af37]/70 focus:ring-2 focus:ring-[#d4af37]/10"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-xs text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0b0d13] transition hover:bg-[#e7c65a] hover:shadow-[0_0_28px_rgba(212,175,55,0.25)] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Enter console
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 flex items-center justify-center gap-2 border-t border-white/[0.06] pt-5 text-[10px] uppercase tracking-[0.16em] text-white/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            Authorized access only
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="mx-auto mt-7 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/35 transition hover:text-[#d4af37]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to invitation
        </button>
      </div>
    </div>
  );
}
