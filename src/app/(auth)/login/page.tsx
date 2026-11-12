"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Calculator, Scissors, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/**
 * Akun demo mengikuti data dari `npm run seed`.
 * Satu klik akan mengisi form lalu langsung masuk.
 */
const DEMO_ACCOUNTS = [
  {
    role: "admin",
    label: "Admin",
    description: "Kelola semua",
    email: "admin@brobarber.id",
    password: "BroBarber123!",
    icon: ShieldCheck,
  },
  {
    role: "kasir",
    label: "Kasir",
    description: "Jadwal & kasir",
    email: "kasir@brobarber.id",
    password: "BroBarber123!",
    icon: Calculator,
  },
  {
    role: "client",
    label: "Client",
    description: "Booking & riwayat",
    email: "client@brobarber.id",
    password: "BroBarber123!",
    icon: Scissors,
  },
] as const;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callback = searchParams.get("callback") || "/booking";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const busy = loading || demoLoading !== null;

  const goAfterLogin = (role?: string) => {
    // Admin & kasir selalu masuk dashboard; client kembali ke halaman asal.
    const destination =
      role === "admin" || role === "kasir" ? "/dashboard" : callback;
    router.push(destination);
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: err } = await authClient.signIn.email({
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError("Email atau password salah. Coba lagi ya.");
      return;
    }
    goAfterLogin((data?.user as { role?: string } | undefined)?.role);
  };

  const handleDemoLogin = async (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setError("");
    setEmail(account.email);
    setPassword(account.password);
    setDemoLoading(account.role);

    const { data, error: err } = await authClient.signIn.email({
      email: account.email,
      password: account.password,
    });
    setDemoLoading(null);

    if (err) {
      setError(
        `Akun demo ${account.label} belum tersedia. Jalankan seed data lalu coba lagi.`
      );
      return;
    }
    goAfterLogin(
      (data?.user as { role?: string } | undefined)?.role ?? account.role
    );
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-900">Masuk dulu, Bro.</h1>
      <p className="mt-2 text-sm text-ink-600">
        Biar kamu bisa langsung amankan slot cukurmu.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field label="Email" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="kamu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            required
          />
        </Field>
        <Field label="Password" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            required
          />
        </Field>

        {error && (
          <p className="rounded-xl border border-danger-100 bg-danger-100 px-4 py-3 text-sm text-danger-800">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" loading={loading} disabled={busy}>
          Masuk
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <span className="w-full border-t border-line" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-cream-50 px-3 text-xs font-medium uppercase tracking-wider text-ink-400">
              Coba akun demo
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            const isThis = demoLoading === account.role;
            return (
              <button
                key={account.role}
                type="button"
                onClick={() => handleDemoLogin(account)}
                disabled={busy}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border border-line-dark bg-white px-2 py-3 text-center transition-colors",
                  "hover:border-bronze-500 hover:bg-bronze-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze-200",
                  "disabled:pointer-events-none disabled:opacity-50",
                  isThis && "border-bronze-500 bg-bronze-100"
                )}
              >
                {isThis ? (
                  <span
                    aria-hidden
                    className="size-4 animate-spin rounded-full border-2 border-bronze-600 border-t-transparent"
                  />
                ) : (
                  <Icon size={18} className="text-bronze-600" />
                )}
                <span className="text-sm font-medium text-ink-900">
                  {account.label}
                </span>
                <span className="text-[10px] leading-tight text-ink-400">
                  {account.description}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-center text-xs text-ink-400">
          Satu klik langsung masuk sebagai role tersebut.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-ink-600">
        Belum punya akun?{" "}
        <Link
          href={`/daftar${callback !== "/booking" ? `?callback=${encodeURIComponent(callback)}` : ""}`}
          className="font-medium text-bronze-600 hover:underline"
        >
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
