"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { adminLogout, useAdminToken } from "@/lib/adminAuth";

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAdminToken();

  useEffect(() => {
    if (token === null) {
      router.replace("/admin/login");
    }
  }, [token, router]);

  // Block render until the localStorage check has run on the client. Without
  // this we briefly render the protected UI for unauthenticated users before
  // the redirect lands.
  if (token === null) {
    return null;
  }

  function handleLogout() {
    adminLogout();
    router.replace("/admin/login");
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-[#fbf8ff] font-['Inter',sans-serif] text-[#1a1b22]">
      <nav className="flex items-center justify-between bg-white px-4 py-3 sm:px-8">
        <div className="flex gap-4 text-sm sm:gap-6">
          <Link
            href="/admin/pages"
            className={
              isActive("/admin/pages")
                ? "font-semibold text-[#1a1b22]"
                : "text-[#454652] hover:text-[#1a1b22]"
            }
          >
            Pages
          </Link>
          <Link
            href="/admin/benefits"
            className={
              isActive("/admin/benefits")
                ? "font-semibold text-[#1a1b22]"
                : "text-[#454652] hover:text-[#1a1b22]"
            }
          >
            Benefits
          </Link>
          <Link
            href="/admin/tabs"
            className={
              isActive("/admin/tabs")
                ? "font-semibold text-[#1a1b22]"
                : "text-[#454652] hover:text-[#1a1b22]"
            }
          >
            Tabs
          </Link>
          <Link
            href="/admin/popular-queries"
            className={
              isActive("/admin/popular-queries")
                ? "font-semibold text-[#1a1b22]"
                : "text-[#454652] hover:text-[#1a1b22]"
            }
          >
            Searches
          </Link>
          <Link
            href="/admin/dashboard"
            className={
              isActive("/admin/dashboard")
                ? "font-semibold text-[#1a1b22]"
                : "text-[#454652] hover:text-[#1a1b22]"
            }
          >
            Dashboard
          </Link>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs text-[#454652] hover:text-[#1a1b22]"
        >
          Log out
        </button>
      </nav>

      {children}
    </div>
  );
}
