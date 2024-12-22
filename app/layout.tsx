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
  // Use Zustand hook to track sidebar visibility
  const isSidebarVisible = useStore((state) => state.isSidebarVisible);

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <SideNav />

          {/* Main Content */}
          <div
            className={`transition-all duration-300 ease-in-out`}
            style={{
              marginLeft: isSidebarVisible ? "16rem" : "0", // Adjust margin-left based on sidebar visibility
              width: isSidebarVisible ? "calc(100% - 16rem)" : "100%", // Shrink width when sidebar is open
              transition: "width 0.3s ease-in-out, margin-left 0.3s ease-in-out",
            }}
          >
            <QueryProvider>
              <div
                className="h-full"
                style={{
                  minHeight: "100vh",
                }}
              >
                {children}
              </div>
            </QueryProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
