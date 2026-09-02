import React from "react";
import { Link } from "react-router-dom";
import { useTrip } from "../../context/TripContext";
import { useMemberAuth } from "../../context/MemberAuthContext";
import { Compass, Plus, LogIn, LogOut, ShieldCheck, Crown, Edit3 } from "lucide-react";

export const AppHeader: React.FC = () => {
  const { currentTrip } = useTrip();
  const {
    currentMember,
    isMemberLoggedIn,
    openLoginModal,
    openEditProfileModal,
    logoutMember,
  } = useMemberAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Trip branding */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0 p-1.5"
          >
            <img src="/favicon.svg" alt="Trip Logo" className="w-full h-full object-contain" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {currentTrip ? currentTrip.title : "Group Trip Planner"}
              </h1>
              {isMemberLoggedIn ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Member Access</span>
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  👁️ View Only Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1">
              <Compass className="w-3 h-3 text-emerald-600 inline shrink-0" />
              <span>
                {currentTrip?.subtitle || "Plan routes, expenses, and checkpoints together"}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Member Login / Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isMemberLoggedIn ? (
            <>
              <Link
                to="/expenses"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Expense</span>
              </Link>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {/* Clickable Profile Card to Edit Profile */}
                <button
                  type="button"
                  onClick={openEditProfileModal}
                  title="Edit Your Profile"
                  className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-100 transition group text-left"
                >
                  <div className="relative">
                    <img
                      src={
                        currentMember?.avatarUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          currentMember?.name || "Member"
                        )}`
                      }
                      alt={currentMember?.name || "Member"}
                      className="w-8 h-8 rounded-full border border-slate-200 bg-white object-cover shrink-0 group-hover:scale-105 transition"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-600 rounded-full flex items-center justify-center text-white border border-white">
                      <Edit3 className="w-2 h-2" />
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[100px] group-hover:text-emerald-700 transition">
                        {currentMember?.name}
                      </span>
                      {currentMember?.isOrganizer && (
                        <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 group-hover:text-emerald-600 transition">
                      Edit Profile
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={logoutMember}
                  title="Log out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Member Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
