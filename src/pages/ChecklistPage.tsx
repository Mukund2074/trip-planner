import React, { useEffect, useState } from "react";
import { useTrip } from "../context/TripContext";
import { useMemberAuth } from "../context/MemberAuthContext";
import { apiClient } from "../lib/api";
import { ChecklistItem, ChecklistResponse } from "../types";
import {
  ChecklistItemSkeleton,
  Skeleton,
} from "../components/common/Skeleton";
import {
  CustomSelect,
  CustomSelectOption,
} from "../components/common/CustomSelect";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Filter,
  Loader2,
  BookmarkPlus,
  Lock,
  LogIn,
} from "lucide-react";

export const ChecklistPage: React.FC = () => {
  const { currentTrip, showToast } = useTrip();
  const { isMemberLoggedIn, openLoginModal } = useMemberAuth();
  const [checklistData, setChecklistData] =
    useState<ChecklistResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFilterCategory, setSelectedFilterCategory] =
    useState<string>("All");

  // Modal and form states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newItemText, setNewItemText] = useState<string>("");
  const [newItemCategory, setNewItemCategory] = useState<string>(
    "Places & Viewpoints"
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const categoriesOptions = [
    "Travel & Bookings",
    "Places & Viewpoints",
    "Adventure & Rides",
    "Hotels & Stays",
    "Food & Dhabas",
    "Essentials & Travel Items",
  ];

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case "Travel & Bookings":
        return "🚆";
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
              ? Math.round(
                  (nextCompletedCount / previousData.totalCount) * 100
                )
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
      const serverMsg =
        createError?.response?.data?.message || "Failed to add item";
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-2">
            <span>🗺️</span>
            <span>Checkpoints & Itinerary Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trip Checkpoints
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Essential places to visit, hotels, adventure rides, and trip items.
          </p>
        </div>

        {/* Action Button */}
        {isMemberLoggedIn ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Checklist</span>
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
              <strong>View-only Mode:</strong> You can view all trip
              checkpoints. Log in as a member to check off items or add new
              ones.
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

      {/* Progress Bar Card with Skeleton Loader */}
      {isLoading ? (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Checklist Completion
              </span>
              <div className="text-lg font-extrabold text-slate-800 mt-0.5">
                {checklistData?.completedCount || 0} of{" "}
                {checklistData?.totalCount || 0} Items Done
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {checklistData?.progressPercentage || 0}%
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${checklistData?.progressPercentage || 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          <span>Category:</span>
        </span>
        <button
          onClick={() => setSelectedFilterCategory("All")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer ${
            selectedFilterCategory === "All"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Items
        </button>
        {categoriesOptions.map((catOption) => (
          <button
            key={catOption}
            onClick={() => setSelectedFilterCategory(catOption)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer ${
              selectedFilterCategory === catOption
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {getCategoryIcon(catOption)} {catOption}
          </button>
        ))}
      </div>

      {/* Checklist Items Groups with Skeleton Loader */}
      {isLoading ? (
        <div className="space-y-3">
          <ChecklistItemSkeleton />
          <ChecklistItemSkeleton />
          <ChecklistItemSkeleton />
          <ChecklistItemSkeleton />
        </div>
      ) : !checklistData || checklistData.items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
            🗺️
          </div>
          <h3 className="font-bold text-slate-800 text-base">
            No checkpoints added yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add key spots to visit in Lonavala (Tiger Point, Bhushi Dam) or
            Imagicaa rides.
          </p>
          {isMemberLoggedIn ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Checkpoint</span>
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
        <div className="space-y-6">
          {categoryKeys.map((categoryGroup) => {
            const items = categoriesMap[categoryGroup];
            return (
              <div key={categoryGroup} className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 px-1">
                  <span>{getCategoryIcon(categoryGroup)}</span>
                  <span>{categoryGroup}</span>
                  <span className="text-slate-400 font-normal">
                    ({items.filter((itemCandidate) => itemCandidate.isCompleted).length}
                    /{items.length})
                  </span>
                </h3>

                <div className="space-y-2">
                  {items.map((checklistItem) => {
                    const isDone = checklistItem.isCompleted;

                    return (
                      <div
                        key={checklistItem._id}
                        onClick={() => handleToggleChecklist(checklistItem)}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer group ${
                          isDone
                            ? "bg-slate-50 border-slate-200 text-slate-400 line-through"
                            : "bg-white border-slate-200 hover:border-emerald-300 shadow-xs text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            className="shrink-0 transition"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                            )}
                          </button>

                          <span className="text-xs sm:text-sm font-medium truncate">
                            {checklistItem.itemText}
                          </span>
                        </div>

                        {/* Delete Button (Members Only) */}
                        {isMemberLoggedIn && (
                          <button
                            type="button"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              handleDeleteItem(checklistItem._id);
                            }}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add Checklist Item Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BookmarkPlus className="w-5 h-5 text-emerald-600" />
              <span>Add Trip Checkpoint</span>
            </h3>

            <form onSubmit={handleAddItem} className="space-y-3.5 text-sm">
              <div>
                <CustomSelect
                  label="Category *"
                  value={newItemCategory}
                  onChange={setNewItemCategory}
                  options={categoriesOptions.map((catOption) => ({
                    value: catOption,
                    label: catOption,
                    icon: <span>{getCategoryIcon(catOption)}</span>,
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Checkpoint / Item Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tiger Point sunset / Deep space ride / Power bank"
                  value={newItemText}
                  onChange={(changeEvent) =>
                    setNewItemText(changeEvent.target.value)
                  }
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-xs sm:text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Item"
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
