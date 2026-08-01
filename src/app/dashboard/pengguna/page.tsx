"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/Badge";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: "client" | "kasir" | "admin";
  phone?: string;
  createdAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  client: "Pelanggan",
  kasir: "Kasir",
  admin: "Admin",
};

export default function PenggunaPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (userId: string, role: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      window.alert(body.error ?? "Gagal mengubah role.");
    }
    await load();
  };

  if (loading) return <PageLoader label="Memuat pengguna..." />;

  return (
    <div>
      <PageHeader title="Pengguna" subtitle="Kelola role akses: pelanggan, kasir, atau admin." />

      {rows.length === 0 ? (
        <EmptyState title="Belum ada pengguna" />
      ) : (
        <div className="space-y-3">
          {rows.map((u) => (
            <Card key={u._id} className="flex flex-wrap items-center gap-4 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-cream-50">
                {(u.name || "U").slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900">{u.name}</p>
                <p className="truncate text-sm text-ink-600">
                  {u.email} {u.phone ? `· ${u.phone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={u.role === "admin" ? "bronze" : u.role === "kasir" ? "info" : "neutral"}>
                  {ROLE_LABEL[u.role] ?? u.role}
                </Badge>
                <Select
                  value={u.role}
                  onChange={(e) => changeRole(u._id, e.target.value)}
                  className="h-9 w-40 text-xs"
                  aria-label={`Ubah role ${u.name}`}
                >
                  <option value="client">Pelanggan</option>
                  <option value="kasir">Kasir</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
