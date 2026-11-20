"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen bg-[#0b0d13] text-[#f5efe6] flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-light tracking-tight text-[#d4af37] mb-2">
            AJZ 2026
          </h1>
          <p className="text-xs tracking-[0.5em] uppercase text-gray-400">
            Admin Login
          </p>
        </div>

        <div className="bg-[#161520] border border-gray-800 rounded-xl p-8 shadow-[0_0_40px_rgba(212,175,55,0.1)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs tracking-widest uppercase text-gray-400 mb-3">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-gray-700 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#d4af37] transition-colors placeholder-gray-500"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4af37] hover:bg-[#c49a2a] disabled:bg-gray-700 text-[#0b0d13] font-medium tracking-widest uppercase text-xs py-4 rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Enter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
