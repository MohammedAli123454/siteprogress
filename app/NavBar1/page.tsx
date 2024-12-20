"use client";

import { useState } from "react";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes, FaChevronRight, FaChevronDown } from "react-icons/fa";
import { LuPanelLeftClose, LuPanelRightClose } from "react-icons/lu";

{/* <Button onClick={() => router.push('/Scope')} variant='secondary' className={buttonClasses}>Scope</Button> */}
import useStore from '../store'; // Import the useStore hook

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
      links: [
        { name: "Installation", path: "/Scope" },
        { name: "Project Structure", path: "/getting-started/project-structure" },
      ],
    },
    {
      title: "Building Your Application",
      links: [
        { name: "Routing", path: "/building/routing" },
        { name: "Data Fetching", path: "/building/data-fetching" },
        { name: "Optimization and Caching", path: "/building/optimization" },
      ],
    },
    {
      title: "API Reference",
      links: [
        { name: "Components", path: "/api/components" },
        { name: "File Convention", path: "/api/file-convention" },
        { name: "Functions", path: "/api/functions" },
      ],
    },
    {
      title: "Architecture",
      links: [
        { name: "Accessibility", path: "/architecture/accessibility" },
        { name: "Fast Refresh", path: "/architecture/fast-refresh" },
        { name: "Supported Browsers", path: "/architecture/browsers" },
      ],
      
    },
    {
      title: "Operating System",
      links: [
        { name: "Windwows", path: "/architecture/accessibility" },
        { name: "Linus", path: "/architecture/fast-refresh" },
        { name: "Mac os", path: "/architecture/browsers" },
      ],
      
    },
    {
      title: "Joint Detail",
      links: [
        { name: "Joints By MOC", path: "/JointsByMoc" },
        { name: "Inch Dia By MOC", path: "/InchDiaByMoc" },
        { name: "Overall Summary", path: "/OverallJoints" },
      ],
      
    },
  ];

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
  onClick={toggleSidebar}
  className="fixed top-0 left-4 z-50 p-2 hover:text-gray-700 transition-all"
>
  {isSidebarVisible ? <LuPanelLeftClose size={30} /> : <LuPanelRightClose size={30} />}
</button>

      {/* Sidebar */}
      <div
        className={`bg-gray-100 h-screen shadow-md p-2 overflow-y-auto transition-all duration-300 
        ${isSidebarVisible ? "w-64" : "w-0 overflow-hidden"}
        fixed top-0 left-0`}
      >
        {/* Sidebar Content */}
        <div className="mt-12">
          {sections.map((section) => (
            <div key={section.title} className="mb-4">
              {/* Section Header */}
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

              {/* Section Links */}
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