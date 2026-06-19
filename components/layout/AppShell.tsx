"use client";

import { useState } from "react";

import { QueryProvider } from "@/providers/query-provider";

import SideNav from "./SideNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const toggleSidebar = () => setIsSidebarVisible((isVisible) => !isVisible);

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <SideNav isOpen={isSidebarVisible} onToggle={toggleSidebar} />

      <main
        className="min-w-0 overflow-x-hidden transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isSidebarVisible ? "16rem" : "0",
          width: isSidebarVisible ? "calc(100% - 16rem)" : "100%",
          transition: "width 0.3s ease-in-out, margin-left 0.3s ease-in-out",
          "--page-left-offset": isSidebarVisible ? "1rem" : "2.75rem",
          "--summary-card-min-height": isSidebarVisible ? "255px" : "268px",
        } as React.CSSProperties}
      >
        <QueryProvider>
          <div className="h-full min-h-screen min-w-0 overflow-x-hidden">{children}</div>
        </QueryProvider>
      </main>
    </div>
  );
}
