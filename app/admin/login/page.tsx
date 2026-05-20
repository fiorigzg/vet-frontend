"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminLogin, useAdminToken } from "@/lib/adminAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const token = useAdminToken();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) router.replace("/admin/dashboard");
  }, [token, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminLogin(username, password);
      router.replace("/admin/dashboard");
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fbf8ff] px-4 py-8 font-['Inter',sans-serif]">
      <p className="mb-10 text-center text-[11px] uppercase tracking-[0.25em] text-[#454652]">
        System Authentication
      </p>

      <div className="w-full max-w-[360px] rounded-md bg-white p-6 sm:p-8">
        <form onSubmit={handleSubmit}>
          <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-[#454652]">
            Username
          </label>
          <input
            type="text"
            placeholder="enter_user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-5 w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm outline-none focus:bg-[#e3e1ea]"
          />

          <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-[#454652]">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-6 w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm outline-none focus:bg-[#e3e1ea]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md py-2.5 text-xs font-semibold uppercase tracking-widest text-white"
            style={{ background: "linear-gradient(135deg, #24389c, #3f51b5)" }}
          >
            {loading ? "..." : "Initialize Login"}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-center text-xs text-[#ba1a1a]">{error}</p>
        )}
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-[10px] text-[#454652]">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500"></span>
        SSL Encryption Active
      </p>
    </div>
  );
}
