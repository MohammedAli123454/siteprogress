"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-providee";
import SideNav from "./NavBar1/page"; // Sidebar component
import useStore from "./store"; // Zustand hook

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Use the Zustand hook with type safety
  const isSidebarVisible = useStore((state) => state.isSidebarVisible);

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Sidebar */}
        <SideNav />

        {/* Main Content */}
        <div
          className={`transition-transform duration-300 ease-in-out p-4 ${
            isSidebarVisible ? "transform translate-x-64" : "transform translate-x-0"
          }`}
        >
          <QueryProvider>{children}</QueryProvider>
        </div>
      </body>
    </html>
  );
}


