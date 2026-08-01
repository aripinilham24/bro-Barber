"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/Badge";

interface VoucherRow {
  _id: string;
  code: string;
  discountPercent: number;
  description: string;
  isActive: boolean;
}

const EMPTY = { code: "", discountPercent: "10", description: "" };

export default function VoucherPage() {
  const [rows, setRows] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VoucherRow | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vouchers");
      if (res.ok) setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (v: VoucherRow) => {
    setEditing(v);
    setForm({ code: v.code, discountPercent: String(v.discountPercent), description: v.description });
    setError("");
    setModalOpen(true);
  };

  const save = async () => {
    setError("");
    const payload = {
      code: form.code.trim(),
      discountPercent: Number(form.discountPercent),
      description: form.description.trim(),
    };
    if (!payload.code || !Number.isFinite(payload.discountPercent) || payload.discountPercent < 1 || payload.discountPercent > 100) {
      setError("Kode wajib dan diskon harus 1–100%.");
      return;
    }
    setSaving(true);
    const res = await fetch(
      editing ? `/api/admin/vouchers/${editing._id}` : "/api/admin/vouchers",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Gagal menyimpan.");
      return;
    }
    setModalOpen(false);
    await load();
  };

  const toggle = async (v: VoucherRow) => {
    await fetch(`/api/admin/vouchers/${v._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !v.isActive }),
    });
    await load();
  };

  const remove = async (v: VoucherRow) => {
    if (!window.confirm(`Hapus voucher ${v.code}?`)) return;
    await fetch(`/api/admin/vouchers/${v._id}`, { method: "DELETE" });
    await load();
  };

  if (loading) return <PageLoader label="Memuat voucher..." />;

  return (
    <div>
      <PageHeader
        title="Voucher"
        subtitle="Voucher berlaku sekali pakai per pelanggan (transaksi pertama)."
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Tambah Voucher
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="Belum ada voucher" description="Buat voucher pertama untuk pelanggan baru." />
      ) : (
        <div className="space-y-3">
          {rows.map((v) => (
            <Card key={v._id} className="flex items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold text-ink-900">{v.code}</span>
                  <Badge tone={v.isActive ? "ok" : "neutral"}>{v.isActive ? "Aktif" : "Non-aktif"}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-ink-600">
                  Diskon {v.discountPercent}% · {v.description}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => toggle(v)}>
                  {v.isActive ? "Non-aktifkan" : "Aktifkan"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(v)}>
                  <Pencil size={15} />
                </Button>
                <Button size="sm" variant="ghost" className="text-danger-600" onClick={() => remove(v)}>
                  <Trash2 size={15} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Voucher" : "Tambah Voucher"}
      >
        <div className="space-y-4">
          <Field label="Kode" htmlFor="vc-code" required hint="Huruf besar otomatis">
            <Input
              id="vc-code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="cth: CUKURFIRST"
            />
          </Field>
          <Field label="Diskon (%)" htmlFor="vc-disc" required>
            <Input
              id="vc-disc"
              type="number"
              min={1}
              max={100}
              value={form.discountPercent}
              onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
            />
          </Field>
          <Field label="Deskripsi" htmlFor="vc-desc">
            <Input
              id="vc-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          {error && <p className="text-sm text-danger-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Batal
          </Button>
          <Button onClick={save} loading={saving}>
            {editing ? "Simpan" : "Tambah"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
