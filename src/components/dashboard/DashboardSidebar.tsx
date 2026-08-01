"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Scissors,
  Settings,
  TicketPercent,
  Users,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export function DashboardSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = role === "admin";

  const items = [
    { href: "/dashboard", label: "Jadwal Hari Ini", icon: LayoutDashboard },
    { href: "/dashboard/reservasi", label: "Semua Reservasi", icon: ClipboardList },
    { href: "/dashboard/slot", label: "Kelola Slot", icon: CalendarRange },
    ...(isAdmin
      ? ([
          { href: "/dashboard/layanan", label: "Layanan", icon: Scissors },
          { href: "/dashboard/konten", label: "Konten Website", icon: Settings },
          { href: "/dashboard/ulasan", label: "Ulasan", icon: MessageSquare },
          { href: "/dashboard/voucher", label: "Voucher", icon: TicketPercent },
          { href: "/dashboard/pengguna", label: "Pengguna", icon: Users },
        ] as const)
      : []),
  ];

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-line bg-white lg:sticky lg:top-0 lg:h-[100svh] lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex h-16 items-center justify-between px-4 lg:justify-start lg:px-5">
        <Link href="/">
          <Logo compact={false} />
        </Link>
        <span className="text-xs lg:hidden">Menu</span>
      </div>

      <nav className="nice-scroll flex gap-1 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-4">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-ink-900 text-cream-50"
                  : "text-ink-600 hover:bg-cream-100 hover:text-ink-900"
              )}
            >
              <Icon size={17} />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-line px-4 py-4 lg:block">
        <Link
          href="/"
          className="mb-2 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-ink-600 hover:bg-cream-100"
        >
          <CalendarDays size={17} /> Lihat Website
        </Link>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-600 hover:bg-cream-100 hover:text-ink-900"
        >
          <LogOut size={17} /> Keluar
        </button>
      </div>
    </aside>
  );
}
