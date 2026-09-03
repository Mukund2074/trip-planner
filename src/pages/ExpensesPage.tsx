import React, { useEffect, useState, useMemo } from "react";
import { useTrip } from "../context/TripContext";
import { useMemberAuth } from "../context/MemberAuthContext";
import { apiClient } from "../lib/api";
import { Expense, ExpenseSummary, Member, ExpenseCategory } from "../types";
import {
  CardSkeleton,
  ExpenseItemSkeleton,
} from "../components/common/Skeleton";
import {
  CustomSelect,
  CustomSelectOption,
} from "../components/common/CustomSelect";
import { CustomMultiSelect } from "../components/common/CustomMultiSelect";
import {
  Receipt,
  Plus,
  Trash2,
  Filter,
  Loader2,
  HandCoins,
  Edit3,
  Lock,
  LogIn,
  CheckCircle2,
  Clock,
  Check,
  Search,
  X,
  Zap,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

type SortOption =
  | "date_desc"
  | "date_asc"
  | "amount_desc"
  | "amount_asc"
  | "unsettled_first"
  | "title_asc";

type PresetFilter =
  | "all"
  | "my_unpaid"
  | "my_collections"
  | "unsettled"
  | "settled";

export const ExpensesPage: React.FC = () => {
  const { currentTrip, showToast } = useTrip();
  const { currentMember, isMemberLoggedIn, openLoginModal } = useMemberAuth();
  const [expenseList, setExpenseList] = useState<Expense[]>([]);
  const [summaryData, setSummaryData] = useState<ExpenseSummary | null>(null);
  const [memberList, setMemberList] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter & Search & Sort states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [presetFilter, setPresetFilter] = useState<PresetFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPayerId, setSelectedPayerId] = useState<string>("all");
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("date_desc");
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] =
    useState<boolean>(false);

  // Expense Modal state (Add or Edit)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form states for Expense Modal
  const [titleInput, setTitleInput] = useState<string>("");
  const [amountInput, setAmountInput] = useState<string>("");
  const [categoryInput, setCategoryInput] = useState<ExpenseCategory>("Food");
  const [paidByMemberId, setPaidByMemberId] = useState<string>("");
  const [splitAmongMemberIds, setSplitAmongMemberIds] = useState<string[]>([]);
  const [notesInput, setNotesInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [settlingKey, setSettlingKey] = useState<string | null>(null);

  const isOrganizerLoggedIn =
    isMemberLoggedIn && Boolean(currentMember?.isOrganizer);

  const fetchExpensesAndMembers = async () => {
    if (!currentTrip) return;

    setIsLoading(true);
    try {
      const [expensesRes, summaryRes, membersRes] = await Promise.all([
        apiClient.get(`/trips/${currentTrip._id}/expenses`),
        apiClient.get(`/trips/${currentTrip._id}/expenses/summary`),
        apiClient.get(`/trips/${currentTrip._id}/members`),
      ]);

      if (expensesRes.data.success) {
        setExpenseList(expensesRes.data.data);
      }
      if (summaryRes.data.success) {
        setSummaryData(summaryRes.data.data);
      }
      if (membersRes.data.success) {
        const members = membersRes.data.data;
        setMemberList(members);
        if (members.length > 0 && !paidByMemberId) {
          setPaidByMemberId(members[0]._id);
        }
      }
    } catch (fetchError) {
      console.error("Failed to load expenses:", fetchError);
      showToast("Unable to load expenses", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesAndMembers();
  }, [currentTrip]);

  // Open modal for NEW expense
  const handleOpenAddExpense = () => {
    if (!isMemberLoggedIn) {
      openLoginModal();
      return;
    }

    setEditingExpense(null);
    setTitleInput("");
    setAmountInput("");
    setCategoryInput("Food");
    setSplitAmongMemberIds(memberList.map((member) => member._id));
    setNotesInput("");
    if (memberList.length > 0) {
      setPaidByMemberId(memberList[0]._id);
    }
    setIsExpenseModalOpen(true);
  };

  // Open modal for VIEWING / EDITING existing expense
  const handleOpenEditExpense = (expenseEntry: Expense) => {
    setEditingExpense(expenseEntry);
    setTitleInput(expenseEntry.title);
    setAmountInput(expenseEntry.amount.toString());
    setCategoryInput(expenseEntry.category);

    const payerId =
      typeof expenseEntry.paidByMemberId === "object"
        ? expenseEntry.paidByMemberId._id
        : expenseEntry.paidByMemberId;
    setPaidByMemberId(payerId);

    const splitIds = (expenseEntry.splitAmongMemberIds || []).map(
      (participant) =>
        typeof participant === "object" ? participant._id : participant
    );

    if (splitIds.length === 0) {
      setSplitAmongMemberIds(memberList.map((member) => member._id));
    } else {
      setSplitAmongMemberIds(splitIds);
    }

    setNotesInput(expenseEntry.notes || "");
    setIsExpenseModalOpen(true);
  };

  // Save (Create or Update) Expense
  const handleSaveExpense = async (eventObject: React.FormEvent) => {
    eventObject.preventDefault();
    if (!isMemberLoggedIn) {
      openLoginModal();
      return;
    }

    if (!titleInput.trim() || !amountInput || !paidByMemberId) {
      showToast("Title, amount, and payer are required", "error");
      return;
    }

    const numericalAmount = parseFloat(amountInput);
    if (isNaN(numericalAmount) || numericalAmount <= 0) {
      showToast("Please enter a valid expense amount", "error");
      return;
    }

    if (splitAmongMemberIds.length === 0) {
      showToast("Please select at least 1 person in the split", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: titleInput.trim(),
        amount: numericalAmount,
        category: categoryInput,
        paidByMemberId,
        splitAmongMemberIds,
        notes: notesInput.trim(),
      };

      if (editingExpense) {
        await apiClient.put(`/expenses/${editingExpense._id}`, payload);
        showToast("Expense updated successfully!", "success");
      } else {
        await apiClient.post(`/trips/${currentTrip?._id}/expenses`, payload);
        showToast("Expense recorded successfully!", "success");
      }

      setIsExpenseModalOpen(false);
      await fetchExpensesAndMembers();
    } catch (saveError: any) {
      console.error("Failed to save expense:", saveError);
      const serverMsg =
        saveError?.response?.data?.message || "Failed to save expense";
      showToast(serverMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Settle / Paid for a SPECIFIC individual member on an expense (Creator or Organizer)
  const handleToggleMemberSettlement = async (
    targetExpense: Expense,
    targetMemberId: string,
    eventObject?: React.MouseEvent
  ) => {
    if (eventObject) {
      eventObject.stopPropagation();
    }

    const payerId =
      typeof targetExpense.paidByMemberId === "object"
        ? targetExpense.paidByMemberId._id
        : targetExpense.paidByMemberId;

    const isCurrentMemberPayer = currentMember?._id === payerId;
    const canSettle = isOrganizerLoggedIn || isCurrentMemberPayer;

    if (!canSettle) {
      showToast(
        "Only the person who paid this expense or an organizer can confirm payment",
        "error"
      );
      return;
    }

    const callKey = `${targetExpense._id}_${targetMemberId}`;
    setSettlingKey(callKey);

    try {
      const settleResponse = await apiClient.put(
        `/expenses/${targetExpense._id}/settle-member/${targetMemberId}`
      );

      if (settleResponse.data.success) {
        const updatedExpense = settleResponse.data.data;
        setExpenseList((previousList) =>
          previousList.map((expenseItem) =>
            expenseItem._id === targetExpense._id ? updatedExpense : expenseItem
          )
        );

        if (editingExpense && editingExpense._id === targetExpense._id) {
          setEditingExpense(updatedExpense);
        }

        showToast(settleResponse.data.message, "success");

        // Refresh summary metrics
        const summaryRes = await apiClient.get(
          `/trips/${currentTrip?._id}/expenses/summary`
        );
        if (summaryRes.data.success) {
          setSummaryData(summaryRes.data.data);
        }
      }
    } catch (settleError: any) {
      console.error("Failed to toggle member settlement:", settleError);
      const serverMsg =
        settleError?.response?.data?.message ||
        "Failed to update settlement status";
      showToast(serverMsg, "error");
    } finally {
      setSettlingKey(null);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!isMemberLoggedIn) {
      openLoginModal();
      return;
    }

    try {
      await apiClient.delete(`/expenses/${expenseId}`);
      showToast("Expense deleted", "info");
      if (editingExpense && editingExpense._id === expenseId) {
        setIsExpenseModalOpen(false);
      }
      await fetchExpensesAndMembers();
    } catch (deleteError) {
      console.error("Failed to delete expense:", deleteError);
      showToast("Failed to delete expense", "error");
    }
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setPresetFilter("all");
    setSelectedCategory("All");
    setSelectedPayerId("all");
    setSelectedParticipantIds([]);
    setSelectedStatus("all");
    setSortOption("date_desc");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    presetFilter !== "all" ||
    selectedCategory !== "All" ||
    selectedPayerId !== "all" ||
    selectedParticipantIds.length > 0 ||
    selectedStatus !== "all" ||
    sortOption !== "date_desc";

  // Filtered & Sorted Expenses computation
  const processedExpenses = useMemo(() => {
    return expenseList
      .filter((expenseEntry) => {
        const payerId =
          typeof expenseEntry.paidByMemberId === "object"
            ? expenseEntry.paidByMemberId._id
            : expenseEntry.paidByMemberId;

        const splitIds = (expenseEntry.splitAmongMemberIds || []).map(
          (participantItem) =>
            typeof participantItem === "object"
              ? participantItem._id
              : participantItem
        );

        const settledIds = (expenseEntry.settledMemberIds || []).map(
          (settledCandidate) =>
            typeof settledCandidate === "object"
              ? settledCandidate._id
              : settledCandidate
        );

        // 1. Text Search Filter (title & notes)
        if (searchQuery.trim()) {
          const lowerQuery = searchQuery.toLowerCase().trim();
          const matchesTitle = expenseEntry.title
            .toLowerCase()
            .includes(lowerQuery);
          const matchesNotes = (expenseEntry.notes || "")
            .toLowerCase()
            .includes(lowerQuery);
          if (!matchesTitle && !matchesNotes) {
            return false;
          }
        }

        // 2. Preset Filter
        if (presetFilter === "my_unpaid" && currentMember) {
          const isParticipant = splitIds.includes(currentMember._id);
          const isPayer = payerId === currentMember._id;
          const hasPaid = settledIds.includes(currentMember._id);
          if (!isParticipant || isPayer || hasPaid) {
            return false;
          }
        } else if (presetFilter === "my_collections" && currentMember) {
          const isPayer = payerId === currentMember._id;
          if (!isPayer || expenseEntry.isSettled) {
            return false;
          }
        } else if (presetFilter === "unsettled") {
          if (expenseEntry.isSettled) return false;
        } else if (presetFilter === "settled") {
          if (!expenseEntry.isSettled) return false;
        }

        // 3. Category Filter
        if (
          selectedCategory !== "All" &&
          expenseEntry.category !== selectedCategory
        ) {
          return false;
        }

        // 4. Paid By Filter
        if (selectedPayerId !== "all" && payerId !== selectedPayerId) {
          return false;
        }

        // 5. Multi-select Participant Filter (Must contain all or any selected participant)
        if (selectedParticipantIds.length > 0) {
          const matchesAnySelected = selectedParticipantIds.some(
            (selectedId) => splitIds.includes(selectedId)
          );
          if (!matchesAnySelected) {
            return false;
          }
        }

        // 6. Status Filter
        if (selectedStatus === "pending" && expenseEntry.isSettled) {
          return false;
        }
        if (selectedStatus === "settled" && !expenseEntry.isSettled) {
          return false;
        }

        return true;
      })
      .sort((expenseA, expenseB) => {
        if (sortOption === "date_desc") {
          return (
            new Date(expenseB.date).getTime() -
            new Date(expenseA.date).getTime()
          );
        }
        if (sortOption === "date_asc") {
          return (
            new Date(expenseA.date).getTime() -
            new Date(expenseB.date).getTime()
          );
        }
        if (sortOption === "amount_desc") {
          return expenseB.amount - expenseA.amount;
        }
        if (sortOption === "amount_asc") {
          return expenseA.amount - expenseB.amount;
        }
        if (sortOption === "unsettled_first") {
          if (expenseA.isSettled === expenseB.isSettled) {
            return (
              new Date(expenseB.date).getTime() -
              new Date(expenseA.date).getTime()
            );
          }
          return expenseA.isSettled ? 1 : -1;
        }
        if (sortOption === "title_asc") {
          return expenseA.title.localeCompare(expenseB.title);
        }
        return 0;
      });
  }, [
    expenseList,
    searchQuery,
    presetFilter,
    selectedCategory,
    selectedPayerId,
    selectedParticipantIds,
    selectedStatus,
    sortOption,
    currentMember,
  ]);

  // Compute stats for currently filtered expenses
  const filteredStats = useMemo(() => {
    let filteredTotal = 0;
    let filteredPendingTotal = 0;
    let filteredSettledTotal = 0;

    processedExpenses.forEach((expenseEntry) => {
      filteredTotal += expenseEntry.amount;
      if (expenseEntry.isSettled) {
        filteredSettledTotal += expenseEntry.amount;
      } else {
        filteredPendingTotal += expenseEntry.amount;
      }
    });

    return {
      filteredTotal,
      filteredPendingTotal,
      filteredSettledTotal,
      count: processedExpenses.length,
    };
  }, [processedExpenses]);

  const categories: (ExpenseCategory | "All")[] = [
    "All",
    "Food",
    "Travel",
    "Stay",
    "Tickets",
    "Activities",
    "Shopping",
    "Other",
  ];

  // Options for Dropdowns
  const sortDropdownOptions: CustomSelectOption[] = [
    { value: "date_desc", label: "Date: Newest First" },
    { value: "date_asc", label: "Date: Oldest First" },
    { value: "amount_desc", label: "Amount: High to Low" },
    { value: "amount_asc", label: "Amount: Low to High" },
    { value: "unsettled_first", label: "Unsettled First" },
    { value: "title_asc", label: "Title: A → Z" },
  ];

  const statusDropdownOptions: CustomSelectOption[] = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "⏳ Pending Settlement" },
    { value: "settled", label: "✅ Fully Settled" },
  ];

  const payerFilterOptions: CustomSelectOption[] = [
    { value: "all", label: "Anyone" },
    ...memberList.map((member) => ({
      value: member._id,
      label: member.name,
      icon: (
        <img
          src={
            member.avatarUrl ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
              member.name
            )}`
          }
          alt={member.name}
          className="w-4 h-4 rounded-full object-cover"
        />
      ),
      badge: member.isOrganizer ? "Organizer" : undefined,
    })),
  ];

  const participantMultiOptions: CustomSelectOption[] = memberList.map(
    (member) => ({
      value: member._id,
      label: member.name,
      icon: (
        <img
          src={
            member.avatarUrl ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
              member.name
            )}`
          }
          alt={member.name}
          className="w-4 h-4 rounded-full object-cover"
        />
      ),
      badge: member.isOrganizer ? "Organizer" : undefined,
    })
  );

  const categoryModalOptions: CustomSelectOption[] = [
    { value: "Food", label: "Food & Dining", icon: <span>🍽️</span> },
    { value: "Travel", label: "Travel & Fuel", icon: <span>🚗</span> },
    { value: "Stay", label: "Hotel / Stay", icon: <span>🏨</span> },
    { value: "Tickets", label: "Entry Tickets", icon: <span>🎟️</span> },
    {
      value: "Activities",
      label: "Activities & Rides",
      icon: <span>🎢</span>,
    },
    { value: "Shopping", label: "Shopping", icon: <span>🛍️</span> },
    { value: "Other", label: "Other", icon: <span>💵</span> },
  ];

  const payerModalOptions: CustomSelectOption[] = memberList.map((member) => ({
    value: member._id,
    label: member.name,
    icon: (
      <img
        src={
          member.avatarUrl ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            member.name
          )}`
        }
        alt={member.name}
        className="w-5 h-5 rounded-full object-cover"
      />
    ),
    badge: member.isOrganizer ? "Organizer" : undefined,
  }));

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold mb-2">
            <Receipt className="w-3.5 h-3.5" />
            <span>Trip Expenses & Person-wise Settlements</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trip Expenses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track shared costs. Payer and trip organizers can confirm when
            individual members have paid their share.
          </p>
        </div>

        {/* Action Button */}
        {isMemberLoggedIn ? (
          <button
            onClick={handleOpenAddExpense}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        ) : (
          <button
            onClick={openLoginModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition self-start sm:self-auto cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Member Login to Add</span>
          </button>
        )}
      </div>

      {/* Guest Mode Notification Banner */}
      {!isMemberLoggedIn && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>View-only Mode:</strong> You can view all trip expenses
              and settlement statuses. Log in as a member to record expenses.
            </span>
          </div>
          <button
            onClick={openLoginModal}
            className="font-bold underline text-amber-900 hover:text-amber-700 shrink-0 cursor-pointer"
          >
            Log In
          </button>
        </div>
      )}

      {/* Summary Cards with Skeleton Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Grand Total */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/10">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total Trip Spend
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold">
              ₹
              {summaryData
                ? summaryData.grandTotal.toLocaleString("en-IN")
                : "0"}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {summaryData?.totalExpensesCount || 0} recorded expenses
            </p>
          </div>

          {/* Settled / Paid Amount */}
          <div className="rounded-3xl p-6 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Fully Settled Expenses
              </span>
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 my-1">
              ₹
              {summaryData
                ? summaryData.settledTotal.toLocaleString("en-IN")
                : "0"}
            </div>
            <p className="text-xs text-slate-500">
              {summaryData?.settledCount || 0} expenses 100% paid by everyone
            </p>
          </div>

          {/* Pending Settlement Amount */}
          <div className="rounded-3xl p-6 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Pending Collections
              </span>
              <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xs">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 my-1">
              ₹
              {summaryData
                ? summaryData.pendingTotal.toLocaleString("en-IN")
                : "0"}
            </div>
            <p className="text-xs text-slate-500">
              {summaryData?.pendingCount || 0} expenses with unpaid shares
            </p>
          </div>
        </div>
      )}

      {/* Control Bar: Search, Quick Presets, Custom Dropdown Sort, and Multi-Select Filters */}
      <div className="space-y-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        {/* Top Controls: Search Input & Custom Sort Dropdown & Filter Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search expenses by title or notes..."
              value={searchQuery}
              onChange={(changeEvent) =>
                setSearchQuery(changeEvent.target.value)
              }
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm outline-none focus:bg-white focus:border-emerald-500 transition font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector using CustomSelect */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-48 sm:w-52">
              <CustomSelect
                value={sortOption}
                onChange={(newSort) => setSortOption(newSort as SortOption)}
                options={sortDropdownOptions}
              />
            </div>

            {/* Toggle Advanced Filters */}
            <button
              type="button"
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isAdvancedFilterOpen ||
                selectedPayerId !== "all" ||
                selectedParticipantIds.length > 0 ||
                selectedStatus !== "all"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Filters</span>
              {(selectedPayerId !== "all" ||
                selectedParticipantIds.length > 0 ||
                selectedStatus !== "all") && (
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              )}
            </button>
          </div>
        </div>

        {/* 1-Click Quick Preset Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Presets:</span>
          </span>

          <button
            type="button"
            onClick={() => setPresetFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer ${
              presetFilter === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Expenses
          </button>

          {isMemberLoggedIn && (
            <button
              type="button"
              onClick={() => setPresetFilter("my_unpaid")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 flex items-center gap-1 cursor-pointer ${
                presetFilter === "my_unpaid"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>⚡ My Unpaid Dues</span>
            </button>
          )}

          {isMemberLoggedIn && (
            <button
              type="button"
              onClick={() => setPresetFilter("my_collections")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 flex items-center gap-1 cursor-pointer ${
                presetFilter === "my_collections"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <HandCoins className="w-3 h-3" />
              <span>💵 My Pending Collections</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setPresetFilter("unsettled")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 flex items-center gap-1 cursor-pointer ${
              presetFilter === "unsettled"
                ? "bg-sky-600 text-white"
                : "bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100"
            }`}
          >
            <span>⏳ All Unsettled</span>
          </button>

          <button
            type="button"
            onClick={() => setPresetFilter("settled")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 flex items-center gap-1 cursor-pointer ${
              presetFilter === "settled"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>✅ Fully Settled</span>
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <span>Category:</span>
          </span>
          {categories.map((catOption) => (
            <button
              key={catOption}
              type="button"
              onClick={() => setSelectedCategory(catOption)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer ${
                selectedCategory === catOption
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {catOption}
            </button>
          ))}
        </div>

        {/* Collapsible Advanced Filters Drawer with Custom Selects */}
        {isAdvancedFilterOpen && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
            {/* Filter by Payer */}
            <div>
              <CustomSelect
                label="Paid By (Payer)"
                value={selectedPayerId}
                onChange={setSelectedPayerId}
                options={payerFilterOptions}
                placeholder="Anyone"
              />
            </div>

            {/* Filter by Split Participants (MULTI-SELECT) */}
            <div>
              <CustomMultiSelect
                label="Included in Split (Multi-Select)"
                values={selectedParticipantIds}
                onChange={setSelectedParticipantIds}
                options={participantMultiOptions}
                placeholder="Filter by split companions..."
              />
            </div>

            {/* Filter by Settlement Status */}
            <div>
              <CustomSelect
                label="Settlement Status"
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={statusDropdownOptions}
              />
            </div>
          </div>
        )}

        {/* Live Filter Summary & Reset Bar */}
        {hasActiveFilters && (
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                Showing {filteredStats.count} of {expenseList.length} expenses
              </span>
              <span className="text-slate-300">•</span>
              <span>
                Filtered Total:{" "}
                <strong className="text-slate-900">
                  ₹{filteredStats.filteredTotal.toLocaleString("en-IN")}
                </strong>
              </span>
              {filteredStats.filteredPendingTotal > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-amber-700 font-semibold">
                    ₹
                    {filteredStats.filteredPendingTotal.toLocaleString(
                      "en-IN"
                    )}{" "}
                    Pending
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Expenses List */}
      {isLoading ? (
        <div className="space-y-4">
          <ExpenseItemSkeleton />
          <ExpenseItemSkeleton />
          <ExpenseItemSkeleton />
        </div>
      ) : processedExpenses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto text-2xl">
            💳
          </div>
          <h3 className="font-bold text-slate-800 text-base">
            {hasActiveFilters
              ? "No expenses match your filters"
              : "No expenses recorded yet"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try adjusting your search query, multi-select companions, or reset filters."
              : "Record travel fuel, hotel deposits, highway food, or Imagicaa tickets."}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          ) : isMemberLoggedIn ? (
            <button
              onClick={handleOpenAddExpense}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Expense</span>
            </button>
          ) : (
            <button
              onClick={openLoginModal}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Member Login to Add</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 px-1">
            💡 The member who paid for an expense (or the trip organizer) can
            confirm individual repayments below. Other members cannot settle
            themselves.
          </p>

          {processedExpenses.map((expenseEntry) => {
            const payerId =
              typeof expenseEntry.paidByMemberId === "object"
                ? expenseEntry.paidByMemberId._id
                : expenseEntry.paidByMemberId;

            const payerName =
              typeof expenseEntry.paidByMemberId === "object"
                ? expenseEntry.paidByMemberId?.name
                : "Member";

            const isCurrentMemberPayer = currentMember?._id === payerId;
            const canManageThisSettlement =
              isOrganizerLoggedIn || isCurrentMemberPayer;

            const splitMembersList = (
              expenseEntry.splitAmongMemberIds || []
            ).map((participantItem) => {
              if (typeof participantItem === "object") {
                return participantItem;
              }
              const found = memberList.find((m) => m._id === participantItem);
              return found || { _id: participantItem, name: "Member" };
            });

            const splitCount =
              splitMembersList.length > 0 ? splitMembersList.length : 1;
            const shareAmount = Math.round(expenseEntry.amount / splitCount);

            const settledIdsList = (expenseEntry.settledMemberIds || []).map(
              (settledCandidate) =>
                typeof settledCandidate === "object"
                  ? settledCandidate._id
                  : settledCandidate
            );

            // Count how many non-payer members have paid
            const otherSplitMembers = splitMembersList.filter(
              (participant) => participant._id !== payerId
            );
            const otherPaidCount = otherSplitMembers.filter((participant) =>
              settledIdsList.includes(participant._id)
            ).length;

            const isFullySettled =
              otherSplitMembers.length === 0 ||
              otherPaidCount === otherSplitMembers.length;

            return (
              <div
                key={expenseEntry._id}
                onClick={() => handleOpenEditExpense(expenseEntry)}
                className={`p-5 rounded-3xl bg-white border transition flex flex-col gap-4 cursor-pointer group hover:shadow-md ${
                  isFullySettled
                    ? "border-emerald-200/80 bg-emerald-50/15"
                    : "border-slate-200/80 hover:border-sky-300"
                }`}
              >
                {/* Top Row: Category, Title, Amount & Actions */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition">
                      {expenseEntry.category === "Food" && "🍽️"}
                      {expenseEntry.category === "Travel" && "🚗"}
                      {expenseEntry.category === "Stay" && "🏨"}
                      {expenseEntry.category === "Tickets" && "🎟️"}
                      {expenseEntry.category === "Shopping" && "🛍️"}
                      {expenseEntry.category === "Activities" && "🎢"}
                      {expenseEntry.category === "Other" && "💵"}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                          {expenseEntry.title}
                        </h4>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          {expenseEntry.category}
                        </span>

                        {isFullySettled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>All Settled ✓</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>
                              {otherPaidCount} / {otherSplitMembers.length} Paid
                            </span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500">
                        Paid by{" "}
                        <span className="font-semibold text-slate-800">
                          {payerName} {isCurrentMemberPayer ? "(You)" : ""}
                        </span>{" "}
                        • {new Date(expenseEntry.date).toLocaleDateString()}
                        {expenseEntry.notes && (
                          <span className="text-slate-400 italic ml-1">
                            — "{expenseEntry.notes}"
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-base sm:text-xl font-extrabold text-slate-900">
                        ₹{expenseEntry.amount.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ₹{shareAmount.toLocaleString("en-IN")} / person
                      </div>
                    </div>

                    {isMemberLoggedIn && (
                      <button
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          handleDeleteExpense(expenseEntry._id);
                        }}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Individual Person-by-Person Split & Settlement Status */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span>
                      Split Among {splitMembersList.length} Members (₹
                      {shareAmount}/person):
                    </span>
                    {canManageThisSettlement ? (
                      <span className="text-[10px] text-emerald-700 font-semibold normal-case">
                        {isCurrentMemberPayer
                          ? "You paid: Mark members as paid when they repay you"
                          : "Organizer: You can mark members as paid"}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium normal-case">
                        Only {payerName} or Organizer can confirm payments
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {splitMembersList.map((participant) => {
                      const isPayer = participant._id === payerId;
                      const hasPaid =
                        isPayer || settledIdsList.includes(participant._id);
                      const keyString = `${expenseEntry._id}_${participant._id}`;
                      const isThisSettling = settlingKey === keyString;

                      return (
                        <div
                          key={participant._id}
                          className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition ${
                            hasPaid
                              ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-950"
                              : "bg-slate-50 border-slate-200/80 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={
                                participant.avatarUrl ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                  participant.name
                                )}`
                              }
                              alt={participant.name}
                              className="w-7 h-7 rounded-full border border-slate-200 bg-white object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">
                                {participant.name}{" "}
                                {currentMember?._id === participant._id
                                  ? "(You)"
                                  : ""}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {isPayer
                                  ? "Payer (₹" + expenseEntry.amount + ")"
                                  : "Share: ₹" + shareAmount}
                              </div>
                            </div>
                          </div>

                          {/* Individual Status / Action Button */}
                          <div className="shrink-0">
                            {isPayer ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                                <Check className="w-3 h-3 text-slate-700" />
                                <span>Payer</span>
                              </span>
                            ) : canManageThisSettlement ? (
                              <button
                                type="button"
                                onClick={(clickEvent) =>
                                  handleToggleMemberSettlement(
                                    expenseEntry,
                                    participant._id,
                                    clickEvent
                                  )
                                }
                                disabled={isThisSettling}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer ${
                                  hasPaid
                                    ? "bg-white border border-emerald-300 text-emerald-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                                }`}
                                title={
                                  hasPaid
                                    ? "Click to unmark as paid"
                                    : `Confirm ${participant.name} paid ₹${shareAmount}`
                                }
                              >
                                {isThisSettling ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : hasPaid ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Paid ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <HandCoins className="w-3 h-3" />
                                    <span>Mark Paid</span>
                                  </>
                                )}
                              </button>
                            ) : hasPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Paid</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Unpaid</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit / View Expense Modal */}
      {isExpenseModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsExpenseModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>
                  {isMemberLoggedIn
                    ? editingExpense
                      ? "Edit Expense Details"
                      : "Record Trip Expense"
                    : "Expense Details (View Only)"}
                </span>
              </h3>

              {isMemberLoggedIn && editingExpense && (
                <button
                  type="button"
                  onClick={() => handleDeleteExpense(editingExpense._id)}
                  className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            {/* Individual Person-by-Person Settlement List inside modal */}
            {editingExpense && (
              <div className="mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                {(() => {
                  const modalPayerId =
                    typeof editingExpense.paidByMemberId === "object"
                      ? editingExpense.paidByMemberId._id
                      : editingExpense.paidByMemberId;
                  const modalCanSettle =
                    isOrganizerLoggedIn || currentMember?._id === modalPayerId;

                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Participant Repayment Status:
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Share: ₹
                          {Math.round(
                            editingExpense.amount /
                              (editingExpense.splitAmongMemberIds?.length || 1)
                          ).toLocaleString("en-IN")}{" "}
                          each
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {(editingExpense.splitAmongMemberIds || []).map(
                          (participantItem) => {
                            const participantId =
                              typeof participantItem === "object"
                                ? participantItem._id
                                : participantItem;

                            const participantMember =
                              typeof participantItem === "object"
                                ? participantItem
                                : memberList.find(
                                    (m) => m._id === participantId
                                  ) || {
                                    _id: participantId,
                                    name: "Member",
                                  };

                            const isPayer = participantId === modalPayerId;

                            const settledList = (
                              editingExpense.settledMemberIds || []
                            ).map((sc) =>
                              typeof sc === "object" ? sc._id : sc
                            );

                            const hasPaid =
                              isPayer || settledList.includes(participantId);
                            const keyString = `${editingExpense._id}_${participantId}`;
                            const isThisSettling = settlingKey === keyString;

                            return (
                              <div
                                key={participantId}
                                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-800">
                                    {participantMember.name}
                                  </span>
                                  {isPayer && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                                      Payer
                                    </span>
                                  )}
                                </div>

                                <div>
                                  {isPayer ? (
                                    <span className="text-xs font-bold text-slate-500">
                                      Paid (Payer)
                                    </span>
                                  ) : modalCanSettle ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleMemberSettlement(
                                          editingExpense,
                                          participantId
                                        )
                                      }
                                      disabled={isThisSettling}
                                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                        hasPaid
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                      }`}
                                    >
                                      {isThisSettling ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : hasPaid ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-600" />
                                          <span>Paid ✓</span>
                                        </>
                                      ) : (
                                        <>
                                          <HandCoins className="w-3 h-3" />
                                          <span>Mark Paid</span>
                                        </>
                                      )}
                                    </button>
                                  ) : hasPaid ? (
                                    <span className="text-emerald-700 font-bold">
                                      Paid ✓
                                    </span>
                                  ) : (
                                    <span className="text-amber-700 font-bold">
                                      Unpaid
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Highway Fuel & Toll / Imagicaa Tickets / Resort Stay"
                  value={titleInput}
                  onChange={(changeEvent) =>
                    setTitleInput(changeEvent.target.value)
                  }
                  required
                  disabled={!isMemberLoggedIn}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none disabled:bg-slate-100 disabled:text-slate-700 text-xs sm:text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 2400"
                    value={amountInput}
                    onChange={(changeEvent) =>
                      setAmountInput(changeEvent.target.value)
                    }
                    required
                    disabled={!isMemberLoggedIn}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold disabled:bg-slate-100 disabled:text-slate-700 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Category"
                    value={categoryInput}
                    onChange={(newCat) =>
                      setCategoryInput(newCat as ExpenseCategory)
                    }
                    options={categoryModalOptions}
                    disabled={!isMemberLoggedIn}
                  />
                </div>
              </div>

              <div>
                <CustomSelect
                  label="Paid By (Member) *"
                  value={paidByMemberId}
                  onChange={setPaidByMemberId}
                  options={payerModalOptions}
                  disabled={!isMemberLoggedIn}
                  placeholder="Select who paid..."
                />
              </div>

              <div>
                <CustomMultiSelect
                  label="Split Among (Multi-Select) *"
                  values={splitAmongMemberIds}
                  onChange={setSplitAmongMemberIds}
                  options={participantMultiOptions}
                  disabled={!isMemberLoggedIn}
                  placeholder="Select split companions..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  placeholder="Optional notes or bill details..."
                  value={notesInput}
                  onChange={(changeEvent) =>
                    setNotesInput(changeEvent.target.value)
                  }
                  rows={2}
                  disabled={!isMemberLoggedIn}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none disabled:bg-slate-100 disabled:text-slate-700 text-xs sm:text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
                {isMemberLoggedIn ? (
                  <button
                    type="submit"
                    disabled={isSubmitting || memberList.length === 0}
                    className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingExpense ? (
                      "Save Changes"
                    ) : (
                      "Save Expense"
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpenseModalOpen(false);
                      openLoginModal();
                    }}
                    className="w-1/2 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Member Login</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
