import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import { useMemberAuth } from "../context/MemberAuthContext";
import { apiClient } from "../lib/api";
import { CardSkeleton, Skeleton } from "../components/common/Skeleton";
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

      setIsLoading(true);
      try {
        const [membersRes, expenseRes, checklistRes] = await Promise.all([
          apiClient.get(`/trips/${currentTrip._id}/members`),
          apiClient.get(`/trips/${currentTrip._id}/expenses/summary`),
          apiClient.get(`/trips/${currentTrip._id}/checklist`),
        ]);

        const memberCount = membersRes.data.success
          ? membersRes.data.data.length
          : 0;
        const totalExpenses = expenseRes.data.success
          ? expenseRes.data.data.grandTotal
          : 0;
        const checklistTotal = checklistRes.data.success
          ? checklistRes.data.data.totalCount
          : 0;
        const checklistCompleted = checklistRes.data.success
          ? checklistRes.data.data.completedCount
          : 0;
        const checklistPercentage = checklistRes.data.success
          ? checklistRes.data.data.progressPercentage
          : 0;

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
    if (!start || !end) return "Thu Night, Sep 3 — Sun Night, Sep 6";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return `${startDate.toLocaleDateString(
      "en-US",
      dateOptions
    )} — ${endDate.toLocaleDateString("en-US", dateOptions)}`;
  };

  const googleDriveUrl =
    (import.meta.env.VITE_GOOGLE_DRIVE_URL as string) ||
    "https://drive.google.com";

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
            {currentTrip?.title || "Lonavala + Imagicaa Trip"}
          </h1>

          <p className="text-sm sm:text-base text-slate-200/90 font-medium max-w-2xl drop-shadow">
            {currentTrip?.subtitle ||
              "Ahmedabad → Mumbai → Lonavala → Imagicaa → Mumbai → Ahmedabad"}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {formatTripDateRange(
                  currentTrip?.startDate,
                  currentTrip?.endDate
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Starting from {currentTrip?.origin || "Ahmedabad"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Cards: Members, Expenses, Checklist, and Google Drive */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Members Stat */}
          <Link
            to="/members"
            className="rounded-3xl p-5 bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between group"
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
                {stats.memberCount}{" "}
                {stats.memberCount === 1 ? "Member" : "Members"}
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
            className="rounded-3xl p-5 bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-300 transition flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Spend
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
                <span>Shared costs & settlements</span>
                <ArrowRight className="w-3 h-3 text-sky-600 inline" />
              </p>
            </div>
          </Link>

          {/* Checklist Stat */}
          <Link
            to="/checklist"
            className="rounded-3xl p-5 bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Checkpoints
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition">
                <Luggage className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">
                {stats.checklistCompleted} / {stats.checklistTotal} Items
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.checklistPercentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
                <span>{stats.checklistPercentage}% Completed</span>
                <ArrowRight className="w-3 h-3 text-amber-600 inline" />
              </p>
            </div>
          </Link>

          {/* Cloud Storage / Google Drive Button (Members Only) */}
          {isMemberLoggedIn ? (
            <a
              href={googleDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-3xl p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Cloud Media
                </span>
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-white flex items-center gap-1.5">
                  <span>Google Drive</span>
                  <ExternalLink className="w-4 h-4 text-emerald-200" />
                </div>
                <p className="text-xs text-emerald-100/90 mt-1">
                  Upload photos & 4K videos directly to drive
                </p>
              </div>
            </a>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              className="rounded-3xl p-5 bg-slate-900 text-white shadow-md hover:bg-slate-800 transition flex flex-col justify-between text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Cloud Media
                </span>
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Members Drive</span>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Member login required to access full photo storage
                </p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <span>⚡ Quick Trip Shortcuts</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/expenses"
            className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80 hover:bg-emerald-50 hover:border-emerald-200 transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                  Record Expense
                </div>
                <div className="text-[11px] text-slate-500">
                  Log fuel, stay, or ticket costs
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
          </Link>

          <Link
            to="/checklist"
            className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80 hover:bg-amber-50 hover:border-amber-200 transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Luggage className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800">
                  View Checkpoints
                </div>
                <div className="text-[11px] text-slate-500">
                  Places, hotels, and packing items
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
          </Link>

          <Link
            to="/members"
            className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80 hover:bg-sky-50 hover:border-sky-200 transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-sky-800">
                  Manage Roster
                </div>
                <div className="text-[11px] text-slate-500">
                  Companions and organizer settings
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
          </Link>
        </div>
      </div>
    </div>
  );
};
