"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/auth-client";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callback = searchParams.get("callback") || "/booking";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);
    const { error: err } = await authClient.signUp.email({
      name,
      email,
      password,
      phone,
    } as unknown as Parameters<typeof authClient.signUp.email>[0]);
    setLoading(false);

    if (err) {
      setError("Gagal mendaftar. Mungkin email sudah terpakai.");
      return;
    }
    router.push(callback);
    router.refresh();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-900">
        Buat akunmu di sini.
      </h1>
      <p className="mt-2 text-sm text-ink-600">
        Gratis. Tanpa drama. Cukup untuk booking yang makin gampang.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field label="Nama" htmlFor="name" required>
          <Input
            id="name"
            placeholder="Nama panggilanmu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
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
        <Field label="Nomor WhatsApp" htmlFor="phone" hint="Opsional, untuk keperluan konfirmasi">
          <Input
            id="phone"
            type="tel"
            placeholder="0812-xxxx-xxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="Ulangi Password" htmlFor="confirm" required>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </Field>
        </div>

        {error && (
          <p className="rounded-xl border border-danger-100 bg-danger-100 px-4 py-3 text-sm text-danger-800">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" loading={loading}>
          Daftar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600">
        Sudah punya akun?{" "}
        <Link
          href={`/login${callback !== "/booking" ? `?callback=${encodeURIComponent(callback)}` : ""}`}
          className="font-medium text-bronze-600 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
