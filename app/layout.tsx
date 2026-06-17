"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-providee";
import SideNav from "@/components/SideNav";
import useStore from "./store";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isSidebarVisible = useStore((state) => state.isSidebarVisible);

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <SideNav />

          <div
            className={`transition-all duration-300 ease-in-out`}
            style={{
              marginLeft: isSidebarVisible ? "16rem" : "0",
              width: isSidebarVisible ? "calc(100% - 16rem)" : "100%",
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
