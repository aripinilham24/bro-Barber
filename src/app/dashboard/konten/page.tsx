"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PageLoader } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/dashboard/PageHeader";

const DAYS: Array<[string, string]> = [
  ["1", "Senin"],
  ["2", "Selasa"],
  ["3", "Rabu"],
  ["4", "Kamis"],
  ["5", "Jumat"],
  ["6", "Sabtu"],
  ["7", "Minggu"],
];

interface ContentShape {
  businessName: string;
  tagline: string;
  hero: { eyebrow: string; title: string; subtitle: string; ctaText: string; ctaSecondaryText: string; image: string };
  about: { title: string; text: string; image: string };
  hours: { slotDurationMinutes: number; slotGapMinutes: number; days: Record<string, { open: string; close: string }> };
  contact: { address: string; phone: string; instagram: string; mapsUrl: string };
  gallery: string[];
  footerText: string;
}

export default function KontenPage() {
  const [content, setContent] = useState<ContentShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content");
      if (res.ok) setContent(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (patch: Partial<ContentShape>) => {
    setContent((c) => (c ? { ...c, ...patch } : c));
    setSaved(false);
  };

  const save = async () => {
    if (!content) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setContent(await res.json());
    } else {
      setError("Gagal menyimpan konten.");
    }
  };

  if (loading) return <PageLoader label="Memuat konten..." />;
  if (!content) return <div>Konten belum tersedia. Jalankan seed terlebih dahulu.</div>;

  return (
    <div>
      <PageHeader
        title="Konten Website"
        subtitle="Ubah teks landing page langsung dari sini — tanpa menyentuh kode."
        action={
          <Button onClick={save} loading={saving}>
            <Save size={16} /> Simpan Perubahan
          </Button>
        }
      />

      {saved && <p className="mb-4 text-sm text-ok-800">✓ Perubahan tersimpan.</p>}
      {error && <p className="mb-4 text-sm text-danger-600">{error}</p>}

      <div className="space-y-5">
        <Section title="Identitas">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Bisnis">
              <Input value={content.businessName} onChange={(e) => set({ businessName: e.target.value })} />
            </Field>
            <Field label="Tagline">
              <Input value={content.tagline} onChange={(e) => set({ tagline: e.target.value })} />
            </Field>
          </div>
          <Field label="Teks Footer">
            <Input value={content.footerText} onChange={(e) => set({ footerText: e.target.value })} />
          </Field>
        </Section>

        <Section title="Hero">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Eyebrow">
              <Input value={content.hero.eyebrow} onChange={(e) => set({ hero: { ...content.hero, eyebrow: e.target.value } })} />
            </Field>
            <Field label="Judul Utama">
              <Input value={content.hero.title} onChange={(e) => set({ hero: { ...content.hero, title: e.target.value } })} />
            </Field>
            <Field label="Sub-judul" className="sm:col-span-2">
              <Textarea rows={2} value={content.hero.subtitle} onChange={(e) => set({ hero: { ...content.hero, subtitle: e.target.value } })} />
            </Field>
            <Field label="Teks Tombol Utama">
              <Input value={content.hero.ctaText} onChange={(e) => set({ hero: { ...content.hero, ctaText: e.target.value } })} />
            </Field>
            <Field label="Teks Tombol Kedua">
              <Input value={content.hero.ctaSecondaryText} onChange={(e) => set({ hero: { ...content.hero, ctaSecondaryText: e.target.value } })} />
            </Field>
          </div>
        </Section>

        <Section title="Tentang">
          <Field label="Judul">
            <Input value={content.about.title} onChange={(e) => set({ about: { ...content.about, title: e.target.value } })} />
          </Field>
          <Field label="Isi" className="mt-4">
            <Textarea rows={4} value={content.about.text} onChange={(e) => set({ about: { ...content.about, text: e.target.value } })} />
          </Field>
        </Section>

        <Section title="Jam Buka & Durasi Slot">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Durasi per slot (menit)">
              <Input
                type="number"
                min={5}
                value={content.hours.slotDurationMinutes}
                onChange={(e) => set({ hours: { ...content.hours, slotDurationMinutes: Number(e.target.value) } })}
              />
            </Field>
            <Field label="Jeda antar slot (menit)">
              <Input
                type="number"
                min={0}
                value={content.hours.slotGapMinutes}
                onChange={(e) => set({ hours: { ...content.hours, slotGapMinutes: Number(e.target.value) } })}
              />
            </Field>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {DAYS.map(([key, label]) => {
              const d = content.hours.days[key] ?? { open: "", close: "" };
              return (
                <div key={key} className="flex items-end gap-2">
                  <span className="w-16 shrink-0 pb-2.5 text-sm text-ink-700">{label}</span>
                  <Field label="Buka">
                    <Input
                      type="time"
                      value={d.open}
                      onChange={(e) =>
                        set({ hours: { ...content.hours, days: { ...content.hours.days, [key]: { ...d, open: e.target.value } } } })
                      }
                    />
                  </Field>
                  <Field label="Tutup">
                    <Input
                      type="time"
                      value={d.close}
                      onChange={(e) =>
                        set({ hours: { ...content.hours, days: { ...content.hours.days, [key]: { ...d, close: e.target.value } } } })
                      }
                    />
                  </Field>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink-400">
            Kosongkan buka & tutup untuk menandai hari libur. Slot dibuat ulang otomatis.
          </p>
        </Section>

        <Section title="Kontak">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Alamat" className="sm:col-span-2">
              <Input value={content.contact.address} onChange={(e) => set({ contact: { ...content.contact, address: e.target.value } })} />
            </Field>
            <Field label="No. WhatsApp">
              <Input value={content.contact.phone} onChange={(e) => set({ contact: { ...content.contact, phone: e.target.value } })} />
            </Field>
            <Field label="Instagram">
              <Input value={content.contact.instagram} onChange={(e) => set({ contact: { ...content.contact, instagram: e.target.value } })} />
            </Field>
            <Field label="Link Google Maps" className="sm:col-span-2">
              <Input value={content.contact.mapsUrl} onChange={(e) => set({ contact: { ...content.contact, mapsUrl: e.target.value } })} />
            </Field>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </Card>
  );
}
