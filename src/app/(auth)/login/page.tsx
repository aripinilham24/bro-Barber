"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/auth-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callback = searchParams.get("callback") || "/booking";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (err) {
      setError("Email atau password salah. Coba lagi ya.");
      return;
    }
    router.push(callback);
    router.refresh();
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
            required
          />
        </Field>

        {error && (
          <p className="rounded-xl border border-danger-100 bg-danger-100 px-4 py-3 text-sm text-danger-800">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" loading={loading}>
          Masuk
        </Button>
      </form>

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
