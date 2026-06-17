"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import { Menu, X } from "lucide-react";

import useStore from "@/app/store";

const SideNav = () => {
  const { isSidebarVisible, toggleSidebar } = useStore();
  const pathname = usePathname();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const handleToggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isActive = (path: string) => (pathname.startsWith(path) ? "bg-gray-200" : "");

  const sections = [
    {
      title: "Getting Started",
      links: [{ name: "Installation", path: "/Scope" }],
    },
    {
      title: "Drawings",
      links: [{ name: "Manage Drawings", path: "/FileUploader" }],
    },
    {
      title: "Weld Data",
      links: [{ name: "Joint & Inch Dia Editor", path: "/AddJointsDetail" }],
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-50 inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-950"
        aria-label={isSidebarVisible ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarVisible ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <div
        className={`bg-gray-100 h-screen shadow-md p-2 overflow-y-auto transition-all duration-300 
        ${isSidebarVisible ? "w-64" : "w-0 overflow-hidden"}
        fixed top-0 left-0`}
      >
        <div className="mt-12">
          {sections.map((section) => (
            <div key={section.title} className="mb-4">
              <button
                onClick={() => handleToggleSection(section.title)}
                className="w-full text-left font-semibold py-2 px-3 flex justify-between items-center hover:bg-gray-200 rounded"
              >
                {section.title}
                <span>
                  {openSections[section.title] ? (
                    <FaChevronDown size={14} className="transition-transform" />
                  ) : (
                    <FaChevronRight size={14} className="transition-transform" />
                  )}
                </span>
              </button>

              {openSections[section.title] && (
                <ul className="pl-4">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.path}
                        className={`block py-1 px-2 rounded hover:bg-gray-200 ${isActive(link.path)}`}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SideNav;
