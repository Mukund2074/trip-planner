import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import { useMemberAuth } from "../context/MemberAuthContext";
import { apiClient } from "../lib/api";
import {
  Users,
  Receipt,
  Luggage,
  ExternalLink,
  Calendar,
  Compass,
  ArrowRight,
  Sparkles,
  Plus,
  FolderOpen,
  Lock,
} from "lucide-react";

interface DashboardStats {
  memberCount: number;
  totalExpenses: number;
  checklistTotal: number;
  checklistCompleted: number;
  checklistPercentage: number;
}

export const DashboardPage: React.FC = () => {
  const { currentTrip } = useTrip();
  const { isMemberLoggedIn, openLoginModal } = useMemberAuth();
  const [stats, setStats] = useState<DashboardStats>({
    memberCount: 0,
    totalExpenses: 0,
    checklistTotal: 0,
    checklistCompleted: 0,
    checklistPercentage: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentTrip) return;

      try {
        const [membersRes, expenseRes, checklistRes] = await Promise.all([
          apiClient.get(`/trips/${currentTrip._id}/members`),
          apiClient.get(`/trips/${currentTrip._id}/expenses/summary`),
          apiClient.get(`/trips/${currentTrip._id}/checklist`),
        ]);

        const memberCount = membersRes.data.success ? membersRes.data.data.length : 0;
        const totalExpenses = expenseRes.data.success ? expenseRes.data.data.grandTotal : 0;
        const checklistTotal = checklistRes.data.success ? checklistRes.data.data.totalCount : 0;
        const checklistCompleted = checklistRes.data.success ? checklistRes.data.data.completedCount : 0;
        const checklistPercentage = checklistRes.data.success ? checklistRes.data.data.progressPercentage : 0;

        setStats({
          memberCount,
          totalExpenses,
          checklistTotal,
          checklistCompleted,
          checklistPercentage,
        });
      } catch (errorInstance) {
        console.warn("Failed to fetch dashboard stats:", errorInstance);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [currentTrip]);

  const formatTripDateRange = (start?: string, end?: string): string => {
    if (!start || !end) return "Trip dates TBD";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return `${startDate.toLocaleDateString("en-US", dateOptions)} — ${endDate.toLocaleDateString("en-US", dateOptions)}`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Hero Banner Card */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-900 text-white min-h-[280px] flex flex-col justify-end p-6 sm:p-10">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 scale-105"
          style={{
            backgroundImage: `url(${
              currentTrip?.coverImage ||
              "https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=1600&q=80"
            })`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Group Trip Portal</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            {currentTrip?.title || "Weekend Getaway"}
          </h1>

          <p className="text-sm sm:text-base text-slate-200/90 font-medium max-w-2xl drop-shadow">
            {currentTrip?.subtitle || "Home City → Stopover → Destination → Home City"}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {formatTripDateRange(currentTrip?.startDate, currentTrip?.endDate)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Starting from {currentTrip?.origin || "Home City"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Cards: Members, Expenses, Checklist, and Google Drive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Members Stat */}
        <Link
          to="/members"
          className="rounded-3xl p-5 bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Trip Members
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.memberCount} {stats.memberCount === 1 ? "Member" : "Members"}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>View trip companions</span>
              <ArrowRight className="w-3 h-3 text-emerald-600 inline" />
            </p>
          </div>
        </Link>

        {/* Expenses Stat */}
        <Link
          to="/expenses"
          className="rounded-3xl p-5 bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-sky-300 transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Expenses
            </span>
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-110 transition">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">
              ₹{stats.totalExpenses.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>View split & balances</span>
              <ArrowRight className="w-3 h-3 text-sky-600 inline" />
            </p>
          </div>
        </Link>

        {/* Checklist Stat */}
        <Link
          to="/checklist"
          className="rounded-3xl p-5 bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Trip Checklist
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition">
              <Luggage className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.checklistCompleted} / {stats.checklistTotal} Done
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>{stats.checklistPercentage}% completed</span>
              <ArrowRight className="w-3 h-3 text-amber-600 inline" />
            </p>
          </div>
        </Link>

        {/* Google Drive Photos & Videos Card (Accessible only to logged-in members) */}
        {isMemberLoggedIn ? (
          <a
            href={
              import.meta.env.VITE_GOOGLE_DRIVE_URL || "https://drive.google.com"
            }
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl p-5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Photos & Videos
              </span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                <FolderOpen className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>5 TB Google Drive</span>
                <ExternalLink className="w-4 h-4 text-indigo-600 inline" />
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Direct upload link for full-res trip videos & pictures
              </p>
            </div>
          </a>
        ) : (
          <button
            type="button"
            onClick={openLoginModal}
            className="rounded-3xl p-5 bg-slate-100/70 border border-dashed border-slate-300/80 shadow-xs hover:bg-slate-100 transition flex flex-col justify-between text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Photos & Videos
              </span>
              <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center group-hover:scale-105 transition">
                <Lock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-base font-bold text-slate-700 flex items-center gap-1.5">
                <span>5 TB Google Drive</span>
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                🔒 Login as member to unlock Drive link
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>⚡</span>
              <span>Quick Actions</span>
            </h2>
            <p className="text-xs text-slate-500">
              {isMemberLoggedIn
                ? "Jump directly into adding members, logging expenses, or packing"
                : "Guest mode: You can view all trip data. Log in as a member to add or modify records."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/members"
            className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 transition flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                {isMemberLoggedIn ? "Add Member" : "View Members"}
              </div>
              <div className="text-xs text-slate-500">Trip companions list</div>
            </div>
          </Link>

          <Link
            to="/expenses"
            className="p-4 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 transition flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                {isMemberLoggedIn ? "Record Expense" : "View Expenses"}
              </div>
              <div className="text-xs text-slate-500">Fuel, food, stay, passes</div>
            </div>
          </Link>

          <Link
            to="/checklist"
            className="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-300 transition flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                {isMemberLoggedIn ? "Checklist Checkpoints" : "View Checklist"}
              </div>
              <div className="text-xs text-slate-500">Places, rides & essentials</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
