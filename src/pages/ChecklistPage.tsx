import React, { useEffect, useState } from "react";
import { useTrip } from "../context/TripContext";
import { useMemberAuth } from "../context/MemberAuthContext";
import { apiClient } from "../lib/api";
import { ChecklistItem, ChecklistResponse } from "../types";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Compass,
  Filter,
  Loader2,
  BookmarkPlus,
  Lock,
  LogIn,
} from "lucide-react";

export const ChecklistPage: React.FC = () => {
  const { currentTrip, showToast } = useTrip();
  const { isMemberLoggedIn, openLoginModal } = useMemberAuth();
  const [checklistData, setChecklistData] = useState<ChecklistResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>("All");

  // Modal and form states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newItemText, setNewItemText] = useState<string>("");
  const [newItemCategory, setNewItemCategory] = useState<string>("Places & Viewpoints");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const categoriesOptions = [
    "Places & Viewpoints",
    "Adventure & Rides",
    "Hotels & Stays",
    "Food & Dhabas",
    "Essentials & Travel Items",
  ];

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case "Places & Viewpoints":
        return "🏔️";
      case "Adventure & Rides":
        return "🎢";
      case "Hotels & Stays":
        return "🏨";
      case "Food & Dhabas":
        return "🍽️";
      case "Essentials & Travel Items":
        return "🎒";
      default:
        return "📍";
    }
  };

  const fetchChecklist = async () => {
    if (!currentTrip) return;

    setIsLoading(true);
    try {
      const responseResult = await apiClient.get(
        `/trips/${currentTrip._id}/checklist`
      );
      if (responseResult.data.success) {
        setChecklistData(responseResult.data.data);
      }
    } catch (fetchError) {
      console.error("Failed to load checklist:", fetchError);
      showToast("Unable to load checklist", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklist();
  }, [currentTrip]);

  const handleToggleChecklist = async (targetItem: ChecklistItem) => {
    if (!isMemberLoggedIn) {
      showToast("Member login required to check off items", "info");
      openLoginModal();
      return;
    }

    const nextCompleted = !targetItem.isCompleted;

    try {
      await apiClient.put(`/checklist/${targetItem._id}`, {
        isCompleted: nextCompleted,
      });

      setChecklistData((previousData) => {
        if (!previousData) return null;
        const updatedItems = previousData.items.map((currentItem) =>
          currentItem._id === targetItem._id
            ? { ...currentItem, isCompleted: nextCompleted }
            : currentItem
        );
        const nextCompletedCount = updatedItems.filter(
          (itemCandidate) => itemCandidate.isCompleted
        ).length;

        return {
          ...previousData,
          items: updatedItems,
          completedCount: nextCompletedCount,
          progressPercentage:
            previousData.totalCount > 0
              ? Math.round((nextCompletedCount / previousData.totalCount) * 100)
              : 0,
        };
      });

      showToast(
        nextCompleted
          ? `Marked "${targetItem.itemText}" as done!`
          : `Unchecked "${targetItem.itemText}"`,
        "success"
      );
    } catch (toggleError) {
      console.error("Failed to toggle checklist item:", toggleError);
      showToast("Failed to update item", "error");
    }
  };

  const handleAddItem = async (eventObject: React.FormEvent) => {
    eventObject.preventDefault();
    if (!isMemberLoggedIn) {
      openLoginModal();
      return;
    }

    if (!newItemText.trim() || !currentTrip) {
      showToast("Please enter a title or description", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const createResponse = await apiClient.post(
        `/trips/${currentTrip._id}/checklist`,
        {
          itemText: newItemText.trim(),
          category: newItemCategory,
        }
      );

      if (createResponse.data.success) {
        showToast("Added to checklist!", "success");
        setNewItemText("");
        setIsAddModalOpen(false);
        await fetchChecklist();
      }
    } catch (createError: any) {
      console.error("Failed to add checklist item:", createError);
      const serverMsg = createError?.response?.data?.message || "Failed to add item";
      showToast(serverMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!isMemberLoggedIn) {
      openLoginModal();
      return;
    }

    try {
      await apiClient.delete(`/checklist/${itemId}`);
      showToast("Item removed", "info");
      await fetchChecklist();
    } catch (deleteError) {
      console.error("Failed to delete checklist item:", deleteError);
      showToast("Failed to delete item", "error");
    }
  };

  // Group items by category
  const categoriesMap: Record<string, ChecklistItem[]> = {};
  if (checklistData) {
    checklistData.items.forEach((checklistItem) => {
      if (
        selectedFilterCategory !== "All" &&
        checklistItem.category !== selectedFilterCategory
      ) {
        return;
      }

      const categoryName = checklistItem.category || "Places & Viewpoints";
      if (!categoriesMap[categoryName]) {
        categoriesMap[categoryName] = [];
      }
      categoriesMap[categoryName].push(checklistItem);
    });
  }

  const categoryKeys = Object.keys(categoriesMap);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Places, Stays & Adventure Checkpoints</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trip Checklist
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isMemberLoggedIn
              ? "Track must-visit places, thrill rides, hotels, dhaba stops, and key travel items"
              : "Guest View: View all checkpoints. Member login required to check off or add items."}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Completion Counter Banner */}
          <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Progress
              </div>
              <div className="text-sm sm:text-base font-extrabold text-emerald-700">
                {checklistData
                  ? `${checklistData.completedCount} / ${checklistData.totalCount}`
                  : "0 / 0"}
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold text-xs flex items-center justify-center">
              {checklistData ? `${checklistData.progressPercentage}%` : "0%"}
            </div>
          </div>

          {/* Add to Checklist Button (Opens Modal) */}
          {isMemberLoggedIn ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Checklist</span>
            </button>
          ) : (
            <button
              onClick={openLoginModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>Member Login to Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Guest Mode Notification Banner */}
      {!isMemberLoggedIn && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>View-only Mode:</strong> You can view all checklist items. Log in as a member to check off items or add new checkpoints.
            </span>
          </div>
          <button
            onClick={openLoginModal}
            className="font-bold underline text-amber-900 hover:text-amber-700 shrink-0"
          >
            Log In
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
        <div
          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
          style={{
            width: `${checklistData ? checklistData.progressPercentage : 0}%`,
          }}
        />
      </div>

      {/* Quick Inline Add Form (Member-only) */}
      {isMemberLoggedIn && (
        <form
          onSubmit={handleAddItem}
          className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Quick add: place, ride, hotel, or item (e.g. Tiger Point sunset, Nitro roller coaster)..."
              value={newItemText}
              onChange={(changeEvent) => setNewItemText(changeEvent.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
            />
          </div>

          <select
            value={newItemCategory}
            onChange={(changeEvent) => setNewItemCategory(changeEvent.target.value)}
            className="w-full sm:w-60 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold outline-none text-slate-800"
          >
            {categoriesOptions.map((categoryOption) => (
              <option key={categoryOption} value={categoryOption}>
                {getCategoryIcon(categoryOption)} {categoryOption}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          <span>Filter:</span>
        </span>
        {["All", ...categoriesOptions].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setSelectedFilterCategory(filterOption)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 ${
              selectedFilterCategory === filterOption
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {filterOption !== "All" && `${getCategoryIcon(filterOption)} `}
            {filterOption}
          </button>
        ))}
      </div>

      {/* Categorized Checklist Sections or Empty State */}
      {categoryKeys.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
            🏔️
          </div>
          <h3 className="font-bold text-slate-800 text-base">Checklist is empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add viewpoints, activities, hotel check-ins, or dining stops.
          </p>
          {isMemberLoggedIn ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Checklist</span>
            </button>
          ) : (
            <button
              onClick={openLoginModal}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>Member Login to Add</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categoryKeys.map((categoryName) => {
            const categoryItems = categoriesMap[categoryName];
            const completedCategoryCount = categoryItems.filter(
              (categoryItem) => categoryItem.isCompleted
            ).length;

            return (
              <div
                key={categoryName}
                className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm space-y-3"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="text-base">{getCategoryIcon(categoryName)}</span>
                    <span>{categoryName}</span>
                  </h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {completedCategoryCount} / {categoryItems.length}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  {categoryItems.map((checklistItem) => {
                    return (
                      <div
                        key={checklistItem._id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                          checklistItem.isCompleted
                            ? "bg-slate-50/80 border-slate-200"
                            : "bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50/50 shadow-xs"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleChecklist(checklistItem)}
                          className="flex items-center gap-3 min-w-0 text-left flex-1 select-none"
                        >
                          {checklistItem.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-emerald-500 shrink-0" />
                          )}
                          <span
                            className={`text-xs sm:text-sm font-medium truncate ${
                              checklistItem.isCompleted
                                ? "line-through text-slate-400"
                                : "text-slate-800 font-semibold"
                            }`}
                          >
                            {checklistItem.itemText}
                          </span>
                        </button>

                        {/* Delete button: ONLY for members */}
                        {isMemberLoggedIn && (
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(checklistItem._id)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 rounded-xl transition shrink-0"
                            title="Delete item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add to Checklist Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <BookmarkPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add to Checklist
                </h3>
                <p className="text-xs text-slate-500">
                  Places, thrill rides, hotels, food, or luggage
                </p>
              </div>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={newItemCategory}
                  onChange={(changeEvent) => setNewItemCategory(changeEvent.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold outline-none text-slate-800"
                >
                  {categoriesOptions.map((categoryOption) => (
                    <option key={categoryOption} value={categoryOption}>
                      {getCategoryIcon(categoryOption)} {categoryOption}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item / Checkpoint Description *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tiger Point sunset / Nitro roller coaster / Hotel check-in"
                  value={newItemText}
                  onChange={(changeEvent) => setNewItemText(changeEvent.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newItemText.trim()}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save to Checklist"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
