import React from "react";
import { NavLink } from "react-router-dom";
import { useMemberAuth } from "../../context/MemberAuthContext";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Luggage,
  FolderOpen,
} from "lucide-react";

export const MobileBottomNav: React.FC = () => {
  const { isMemberLoggedIn } = useMemberAuth();

  const navigationItems = [
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
      {navigationItems.map((navigationItem) => {
        const IconComponent = navigationItem.icon;

        return (
          <NavLink
            key={navigationItem.path}
            to={navigationItem.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-medium transition ${
                isActive
                  ? "text-emerald-600 font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`
            }
          >
            <IconComponent className="w-5 h-5 mb-0.5" />
            <span>{navigationItem.title}</span>
          </NavLink>
        );
      })}

      {/* Drive link: ONLY visible to logged-in members */}
      {isMemberLoggedIn && (
        <a
          href={
            import.meta.env.VITE_GOOGLE_DRIVE_URL || "https://drive.google.com"
          }
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-medium text-indigo-600 hover:text-indigo-800 transition"
        >
          <FolderOpen className="w-5 h-5 mb-0.5" />
          <span>Drive</span>
        </a>
      )}
    </nav>
  );
};
