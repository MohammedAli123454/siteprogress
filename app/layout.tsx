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
        {/* Sidebar */}
        <SideNav />

        {/* Main Content */}
        <div
          className="transition-all duration-300 ease-in-out p-0 flex min-h-screen"
          style={{
            // Adjust the margin-left based on sidebar visibility
            marginLeft: isSidebarVisible ? "16rem" : "0", // Move content to the right when sidebar is open
            transition: "margin-left 0.3s ease-in-out", // Smooth transition for margin
          }}
        >
          {/* Content wrapper to center content */}
          <div
            className="flex justify-center items-center"
            style={{
              minHeight: '100vh', // Ensure minimum height
              minWidth: '100vw', // Ensure minimum width
              overflow: 'hidden', // Optionally hide overflowing content
            }}
          >
            {/* Scaling applied directly to the QueryProvider */}
            <div
              className="transition-all duration-300 ease-in-out"
              style={{
                transform: isSidebarVisible ? 'scale(0.81)' : 'scale(1)', // Apply scaling when sidebar is visible
                transformOrigin: '0 0', // Scale from the top-left corner
                transition: 'transform 0.3s ease-in-out',
              }}
            >
              <QueryProvider>{children}</QueryProvider>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

