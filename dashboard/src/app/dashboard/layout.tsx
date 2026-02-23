"use client";

import { SessionProvider } from "next-auth/react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1">
          <header className="flex h-14 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              <span className="text-sm font-medium text-muted-foreground">
                SparkSage Dashboard
              </span>
            </div>
            <ModeToggle />
          </header>
          <div className="p-6">{children}</div>
        </main>
      </SidebarProvider>
    </SessionProvider>
  );
}
