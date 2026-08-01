"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Camera, Check, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { formatDateTime, formatRupiah, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { PageLoader } from "@/components/ui/Spinner";
import { StarRating } from "@/components/ui/StarRating";
import {
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUS_TONE,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
} from "@/lib/status";
import type { ReservationDetail } from "@/components/booking/types";

export function ReservationDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [data, setData] = useState<{
    reservation: ReservationDetail;
    payments: Array<{ _id: string; type: string; amount: number; status: string; method: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form ulasan
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace(`/login?callback=/reservasi/${id}`);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/reservations/${id}`);
        if (res.status === 404) setNotFound(true);
        else if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, [isPending, session, router, id]);

  const uploadPhoto = useCallback(async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (res.ok) setPhotoUrl(data.url);
    else throw new Error(data.error);
  }, []);

  const submitReview = async () => {
    setFormError("");
    if (!comment.trim()) {
      setFormError("Tulis dulu kesanmu, Bro.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservationId: id,
        rating,
        comment: comment.trim(),
        photoUrl,
      }),
    });
    const body = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      setFormError(body.error ?? "Gagal mengirim ulasan.");
    }
  };

  if (isPending || loading) return <PageLoader label="Memuat detail..." />;
  if (!session) return null;

  if (notFound || !data) {
    return (
      <div className="text-center">
        <p className="text-ink-600">Reservasi tidak ditemukan.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/riwayat")}>
          Kembali ke Riwayat
        </Button>
      </div>
    );
  }

  const r = data.reservation;
  const canReview = r.status === "COMPLETED" && !submitted;
  const reviewExists = submitted;

  return (
    <div>
      <button
        onClick={() => router.push("/riwayat")}
        className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={16} /> Kembali ke Riwayat
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink-900">
          {r.service?.name ?? "Reservasi"}
        </h1>
        <Badge tone={RESERVATION_STATUS_TONE[r.status] ?? "neutral"} dot>
          {RESERVATION_STATUS_LABEL[r.status] ?? r.status}
        </Badge>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Ringkasan */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">Ringkasan</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">Tanggal</dt>
              <dd className="font-medium text-ink-900">{r.date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Jam</dt>
              <dd className="font-medium text-ink-900">
                {formatTime(r.timeSlot?.startTime ?? r.startTime)}
              </dd>
            </div>
            {r.createdAt && (
              <div className="flex justify-between">
                <dt className="text-ink-600">Dibuat</dt>
                <dd className="text-ink-900">{formatDateTime(r.createdAt)}</dd>
              </div>
            )}
            {r.notes && (
              <div className="rounded-xl bg-cream-100 px-3 py-2 text-ink-600">
                <strong className="text-ink-900">Catatan:</strong> {r.notes}
              </div>
            )}
          </dl>

          <div className="mt-5 border-t border-line pt-5">
            <h3 className="text-sm font-semibold text-ink-700">Rincian Biaya</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-ink-600">
                <dt>Subtotal</dt>
                <dd>{formatRupiah(r.subtotal)}</dd>
              </div>
              {r.discountAmount > 0 && (
                <div className="flex justify-between text-ok-800">
                  <dt>Diskon voucher {r.voucherCode}</dt>
                  <dd>-{formatRupiah(r.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between font-medium text-ink-900">
                <dt>Total</dt>
                <dd>{formatRupiah(r.total)}</dd>
              </div>
              <div className="flex justify-between text-ok-800">
                <dt>DP dibayar</dt>
                <dd>-{formatRupiah(r.dpAmount)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-medium text-ink-900">
                <dt>Sisa tagihan</dt>
                <dd>{formatRupiah(r.remainingAmount)}</dd>
              </div>
            </dl>
          </div>
        </Card>

        {/* Pembayaran */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">Pembayaran</h2>
          {data.payments.length === 0 ? (
            <p className="mt-4 text-sm text-ink-400">Belum ada pembayaran tercatat.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {data.payments.map((p) => (
                <li key={p._id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-ink-900">
                      {p.type === "DP"
                        ? "DP via QRIS"
                        : p.type === "REMAINING"
                          ? "Pelunasan di tempat"
                          : "Pembayaran"}
                    </p>
                    <p className="text-xs text-ink-400">
                      {p.method} · {formatDateTime(p.paidAt ?? new Date())}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-ink-900">{formatRupiah(p.amount)}</p>
                    <Badge tone={PAYMENT_STATUS_TONE[p.status] ?? "neutral"}>
                      {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Ulasan */}
      {(canReview || reviewExists) && (
        <Card className="mt-6 p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Beri ulasan untuk hasil cukurmu
          </h2>
          {reviewExists ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-ok-800">
              <Check size={18} /> Terima kasih! Ulasanmu sudah terkirim dan menunggu
              moderasi admin.
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm font-medium text-ink-700">Rating</p>
                <div className="mt-2">
                  <StarRating rating={rating} size={28} />
                  <div className="mt-2 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-label={`Rating ${n}`}
                        onClick={() => setRating(n)}
                        className="h-8 w-8 rounded-lg border border-line bg-white text-xs font-semibold text-ink-700 transition-colors hover:border-ink-400"
                        style={{ opacity: rating === n ? 1 : 0.4 }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Field label="Komentar" htmlFor="review-comment" required>
                <Textarea
                  id="review-comment"
                  rows={3}
                  placeholder="Ceritakan pengalamanmu di Bro Barber..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </Field>

              <div>
                <p className="text-sm font-medium text-ink-700">Foto hasil (opsional)</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        await uploadPhoto(file);
                      } catch (err) {
                        setFormError((err as Error).message);
                      }
                    }
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border border-dashed border-line-dark px-4 py-3 text-sm text-ink-600 transition-colors hover:border-ink-400"
                >
                  {uploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Camera size={16} />
                  )}
                  {photoUrl ? "Ganti foto" : "Upload foto"}
                </button>
                {photoUrl && (
                  <div className="mt-3">
                    <Image
                      src={photoUrl}
                      alt="Foto hasil cukur"
                      width={160}
                      height={120}
                      className="h-24 w-32 rounded-lg border border-line object-cover"
                    />
                  </div>
                )}
              </div>

              {formError && (
                <p className="text-sm text-danger-600">{formError}</p>
              )}

              <Button onClick={submitReview} loading={submitting}>
                Kirim Ulasan
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
