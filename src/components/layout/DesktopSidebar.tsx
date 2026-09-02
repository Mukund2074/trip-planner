import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useMemberAuth } from "../../context/MemberAuthContext";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Luggage,
  ExternalLink,
  FolderOpen,
  Lock,
} from "lucide-react";

interface SidebarNavItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItemsList: SidebarNavItem[] = [
  {
    title: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Members",
    path: "/members",
    icon: Users,
  },
  {
    title: "Expenses",
    path: "/expenses",
    icon: Receipt,
  },
  {
    title: "Checklist",
    path: "/checklist",
    icon: Luggage,
  },
];

export const DesktopSidebar: React.FC = () => {
  const currentPath = useLocation().pathname;
  const { isMemberLoggedIn } = useMemberAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200/80 bg-white min-h-[calc(100vh-61px)] p-4 select-none">
      {/* Route Navigation List */}
      <div className="space-y-1.5">
        <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Trip Menu
        </p>

        {navItemsList.map((navigationItem) => {
          const IconComponent = navigationItem.icon;
          const isItemActive =
            navigationItem.path === "/"
              ? currentPath === "/"
              : currentPath.startsWith(navigationItem.path);

          return (
            <NavLink
              key={navigationItem.path}
              to={navigationItem.path}
              className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium transition-all group ${
                isItemActive
                  ? "bg-emerald-50 text-emerald-900 font-bold shadow-sm shadow-emerald-500/10 border border-emerald-200/60"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <IconComponent
                  className={`w-5 h-5 transition-colors ${
                    isItemActive
                      ? "text-emerald-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>{navigationItem.title}</span>
              </div>
            </NavLink>
          );
        })}

        {/* Google Drive Link - ONLY visible to logged-in members */}
        {isMemberLoggedIn && (
          <a
            href={
              import.meta.env.VITE_GOOGLE_DRIVE_URL || "https://drive.google.com"
            }
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-900 transition-all group"
          >
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
              <span>Google Drive</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
          </a>
        )}
      </div>

      {/* Summary Card */}
      <div className="mt-auto pt-6">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-50 to-teal-50/80 border border-emerald-200/60">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">🏔️</span>
            <span className="text-xs font-bold text-emerald-900">
              Group Trip Planner
            </span>
          </div>
          <p className="text-[11px] text-emerald-800/90 leading-relaxed">
            {isMemberLoggedIn
              ? "You have full member access to add members, log expenses, and update checklists."
              : "Guest mode: You can view all trip plans and expenses. Login to make changes."}
          </p>
        </div>
      </div>
    </aside>
  );
};
