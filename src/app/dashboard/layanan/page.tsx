"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/Badge";

interface ServiceRow {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
  sortOrder: number;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  duration: "45",
  sortOrder: "0",
};

export default function LayananPage() {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services");
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
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (s: ServiceRow) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description,
      price: String(s.price),
      duration: String(s.duration),
      sortOrder: String(s.sortOrder),
    });
    setError("");
    setModalOpen(true);
  };

  const save = async () => {
    setError("");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      duration: Number(form.duration),
      sortOrder: Number(form.sortOrder || 0),
    };
    if (!payload.name || !Number.isFinite(payload.price) || payload.price < 0) {
      setError("Nama wajib dan harga harus angka valid.");
      return;
    }
    setSaving(true);
    const res = await fetch(
      editing ? `/api/admin/services/${editing._id}` : "/api/admin/services",
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

  const toggleActive = async (s: ServiceRow) => {
    await fetch(`/api/admin/services/${s._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    await load();
  };

  const remove = async (s: ServiceRow) => {
    if (!window.confirm(`Hapus layanan "${s.name}"?`)) return;
    await fetch(`/api/admin/services/${s._id}`, { method: "DELETE" });
    await load();
  };

  if (loading) return <PageLoader label="Memuat layanan..." />;

  return (
    <div>
      <PageHeader
        title="Layanan"
        subtitle="Kelola daftar layanan yang tampil di landing & booking."
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Tambah Layanan
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="Belum ada layanan" description="Tambahkan layanan pertama." />
      ) : (
        <div className="space-y-3">
          {rows.map((s) => (
            <Card key={s._id} className="flex items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-ink-900">{s.name}</p>
                  {!s.isActive && <Badge tone="neutral">Non-aktif</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-ink-600">
                  {formatRupiah(s.price)} · {s.duration} menit · urutan {s.sortOrder}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => toggleActive(s)}>
                  {s.isActive ? "Non-aktifkan" : "Aktifkan"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`}>
                  <Pencil size={15} />
                </Button>
                <Button size="sm" variant="ghost" className="text-danger-600" onClick={() => remove(s)} aria-label={`Hapus ${s.name}`}>
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
        title={editing ? "Edit Layanan" : "Tambah Layanan"}
      >
        <div className="space-y-4">
          <Field label="Nama" htmlFor="sv-name" required>
            <Input
              id="sv-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="cth: Cukur Khas Bro Barber"
            />
          </Field>
          <Field label="Deskripsi" htmlFor="sv-desc">
            <Textarea
              id="sv-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Harga (Rp)" htmlFor="sv-price" required>
              <Input
                id="sv-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Field>
            <Field label="Durasi (menit)" htmlFor="sv-dur" required>
              <Input
                id="sv-dur"
                type="number"
                min={5}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </Field>
            <Field label="Urutan" htmlFor="sv-order">
              <Input
                id="sv-order"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </Field>
          </div>
          {error && <p className="text-sm text-danger-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Batal
          </Button>
          <Button onClick={save} loading={saving}>
            {editing ? "Simpan Perubahan" : "Tambah"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
