"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  FilePlus2,
  FileText,
  Menu,
  Table2,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type SideNavProps = {
  isOpen: boolean;
  onToggle: () => void;
};

type NavLink = {
  name: string;
  path: string;
  icon: LucideIcon;
};

const SideNav = ({ isOpen, onToggle }: SideNavProps) => {
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const links: NavLink[] = [
    { name: "Manage Drawings", path: "/FileUploader", icon: FileText },
    { name: "Weld Summary", path: "/", icon: BarChart3 },
    { name: "Add New Project", path: "/AddNewProject", icon: FilePlus2 },
    { name: "Weld Joints Scope", path: "/AddJointsDetail", icon: Table2 },
    { name: "Progress Register", path: "/ProgressRegister", icon: ClipboardList },
    { name: "Progress Dashboard", path: "/ProgressDashboard", icon: TrendingUp },
  ];

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="fixed left-2 top-2 z-50 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <div
        className={cn(
          "fixed left-0 top-0 h-screen overflow-y-auto border-r border-slate-200 bg-white shadow-[8px_0_28px_rgba(15,23,42,0.07)] transition-all duration-300",
          isOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
        )}
      >
        <nav className="mt-14 space-y-1 px-3">
          {links.map((link) => (
            <NavItem key={link.name} link={link} isActive={isActive(link.path)} />
          ))}
        </nav>
      </div>
    </div>
  );
};

function NavItem({ link, isActive }: { link: NavLink; isActive: boolean }) {
  const Icon = link.icon;

  return (
    <Link
      href={link.path}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition",
        isActive
          ? "bg-slate-950 text-white shadow-sm"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition",
          isActive ? "text-white" : "text-slate-500 group-hover:text-slate-800"
        )}
      />
      <span className="truncate">{link.name}</span>
    </Link>
  );
}

export default SideNav;
