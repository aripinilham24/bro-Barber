import { MapPin, Phone, AtSign } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { SiteContentShape } from "@/lib/types";
import { Card } from "@/components/ui/Card";

const DAY_NAMES: Record<string, string> = {
  "1": "Senin",
  "2": "Selasa",
  "3": "Rabu",
  "4": "Kamis",
  "5": "Jumat",
  "6": "Sabtu",
  "7": "Minggu",
};

export function HoursContact({ content }: { content: SiteContentShape }) {
  const { hours, contact } = content;
  const days = Object.entries(hours.days ?? {}).sort(
    ([a], [b]) => Number(a) - Number(b)
  );

  return (
    <section id="jam-buka" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bronze-600">
            Jam Buka & Lokasi
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Siapkan kursinya, kamu tinggal datang.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold text-ink-900">
              Jam Buka
            </h3>
            <ul className="mt-4 divide-y divide-line">
              {days.map(([key, d]) => {
                const open = Boolean(d.open && d.close);
                return (
                  <li
                    key={key}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <span className={open ? "text-ink-900" : "text-ink-400"}>
                      {DAY_NAMES[key] ?? key}
                    </span>
                    <span className={open ? "font-medium text-ink-700" : "text-ink-400"}>
                      {open ? (
                        <>
                          {formatTime(d.open)} – {formatTime(d.close)}
                        </>
                      ) : (
                        "Tutup"
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="flex flex-col p-6">
            <h3 className="font-display text-lg font-semibold text-ink-900">Hubungi Kami</h3>
            <div className="mt-4 flex flex-1 flex-col gap-4">
              <a
                href={contact.mapsUrl || "#jam-buka"}
                className="flex items-start gap-3 text-sm text-ink-700"
                {...(contact.mapsUrl ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                <MapPin size={18} className="mt-0.5 shrink-0 text-bronze-600" />
                {contact.address}
              </a>
              <a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-sm text-ink-700">
                <Phone size={18} className="shrink-0 text-bronze-600" />
                {contact.phone}
              </a>
              <a
                href={contact.instagram ? `https://instagram.com/${contact.instagram.replace("@", "")}` : "#jam-buka"}
                className="flex items-center gap-3 text-sm text-ink-700"
                {...(contact.instagram ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                <AtSign size={18} className="shrink-0 text-bronze-600" />
                {contact.instagram}
              </a>
            </div>
            <div className="mt-6 rounded-2xl bg-cream-100 p-4 text-sm leading-relaxed text-ink-600">
              <strong className="text-ink-900">Catatan:</strong> satu layanan
              berdurasi {hours.slotDurationMinutes} menit. Pastikan kamu datang
              {hours.slotDurationMinutes > 30 ? " 10" : " 5"} menit sebelum
              jadwal biar cukurmu makin santai.
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
