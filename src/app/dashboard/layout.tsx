import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export const metadata = { title: "Dashboard" };

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?callback=/dashboard");
  if (session.role !== "admin" && session.role !== "kasir") {
    redirect("/");
  }

  return (
    <div className="min-h-[100svh] bg-cream-50 lg:flex">
      <DashboardSidebar role={session.role} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
