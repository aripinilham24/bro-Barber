/** Utility umum aplikasi Bro Barber */

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Format angka ke Rupiah, mis. 50.000 → "Rp 50.000" */
export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format tanggal "2026-08-01" → "Sabtu, 1 Agustus 2026" */
export function formatDate(dateString: string, withDay = true) {
  const d = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat("id-ID", {
    ...(withDay ? { weekday: "long" as const } : {}),
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Format tanggal pendek "2026-08-01" → "1 Agt 2026" */
export function formatDateShort(dateString: string) {
  const d = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Format jam "14:30" → "14.30" (gaya Indonesia) */
export function formatTime(time: string) {
  return time.replace(":", ".");
}

/** Format datetime ISO → "1 Agustus 2026, 14.30" */
export function formatDateTime(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Tambah hari ke tanggal string YYYY-MM-DD */
export function addDays(dateString: string, days: number) {
  const d = new Date(`${dateString}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Tanggal hari ini dalam format YYYY-MM-DD (waktu lokal) */
export function todayISO() {
  const now = new Date();
  const off = now.getTimezoneOffset();
  return new Date(now.getTime() - off * 60000).toISOString().slice(0, 10);
}

/** Slug sederhana dari nama layanan */
export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
