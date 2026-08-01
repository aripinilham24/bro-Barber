"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, LogOut, LayoutDashboard, History } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

const NAV_LINKS = [
  { href: "#layanan", label: "Layanan" },
  { href: "#tentang", label: "Tentang" },
  { href: "#jam-buka", label: "Jam Buka" },
  { href: "#testimoni", label: "Testimoni" },
];

const linkButton =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors";

export function Navbar() {
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const user = session?.user;
  const role = user?.role as string | undefined;
  const isStaff = role === "admin" || role === "kasir";

  const handleSignOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Beranda Bro Barber">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Navigasi utama">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-ink-600 transition-colors hover:text-ink-900"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-1.5 md:flex">
          {user ? (
            <>
              {isStaff && (
                <Link href="/dashboard" className={`${linkButton} text-ink-700 hover:bg-cream-100`}>
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
              )}
              <Link href="/riwayat" className={`${linkButton} text-ink-700 hover:bg-cream-100`}>
                <History size={16} /> Riwayat
              </Link>
              <Button variant="outline" size="sm" loading={signingOut} onClick={handleSignOut}>
                <LogOut size={15} /> Keluar
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={`${linkButton} text-ink-700 hover:bg-cream-100`}>
                Masuk
              </Link>
              <Link
                href="/daftar"
                className={`${linkButton} bg-ink-900 text-cream-50 hover:bg-ink-700`}
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-ink-700 hover:bg-cream-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-cream-50 px-4 py-4 md:hidden animate-fade-in-up">
          <nav className="flex flex-col gap-3" aria-label="Navigasi mobile">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm text-ink-700 hover:text-ink-900"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {user ? (
                <>
                  {isStaff && (
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full">
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <Link href="/riwayat" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      Riwayat
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={handleSignOut} loading={signingOut}>
                    Keluar
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/daftar" onClick={() => setOpen(false)}>
                    <Button variant="secondary" className="w-full">
                      Daftar
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
