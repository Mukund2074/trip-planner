import React, { useEffect, useState } from "react";
import { useTrip } from "../context/TripContext";
import { useMemberAuth } from "../context/MemberAuthContext";
import { apiClient } from "../lib/api";
import { Member } from "../types";
import { MemberCardSkeleton } from "../components/common/Skeleton";
import {
  Users,
  Plus,
  Trash2,
  Phone,
  Mail,
  Crown,
  UserPlus,
  Loader2,
  Lock,
  LogIn,
  ShieldAlert,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

export const MembersPage: React.FC = () => {
  const { currentTrip, showToast } = useTrip();
  const {
    currentMember,
    isMemberLoggedIn,
    openLoginModal,
    openEditProfileModal,
    updateCurrentMember,
  } = useMemberAuth();
  const [memberList, setMemberList] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Add Member Form states
  const [nameInput, setNameInput] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [isOrganizerInput, setIsOrganizerInput] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Password visibility map for organizer view
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, string>
  >({});
  const [fetchingPasswordId, setFetchingPasswordId] = useState<string | null>(
    null
  );

  // Edit Member Modal state (For Organizer editing another member)
  const [editingTargetMember, setEditingTargetMember] =
    useState<Member | null>(null);
  const [editNameInput, setEditNameInput] = useState<string>("");
  const [editPhoneInput, setEditPhoneInput] = useState<string>("");
  const [editEmailInput, setEditEmailInput] = useState<string>("");
  const [editPasswordInput, setEditPasswordInput] = useState<string>("");
  const [editCurrentPassword, setEditCurrentPassword] = useState<string>("");
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);
  const [editIsOrganizer, setEditIsOrganizer] = useState<boolean>(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState<boolean>(false);

  // Check if current user is an Organizer (or if no members exist yet)
  const isOrganizerLoggedIn =
    isMemberLoggedIn && Boolean(currentMember?.isOrganizer);
  const canManageMembers = isOrganizerLoggedIn || memberList.length === 0;

  const fetchMembers = async () => {
    if (!currentTrip) return;

    setIsLoading(true);
    try {
      const responseResult = await apiClient.get(
        `/trips/${currentTrip._id}/members`
      );
      if (responseResult.data.success) {
        setMemberList(responseResult.data.data);
      }
    } catch (fetchError) {
      console.error("Failed to load members:", fetchError);
      showToast("Unable to load members list", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentTrip]);

  const toggleMemberPassword = async (
    targetMemberId: string,
    clickEvent: React.MouseEvent
  ) => {
    clickEvent.stopPropagation();

    // If already visible, toggle to hidden
    if (visiblePasswords[targetMemberId]) {
      const updatedVisible = { ...visiblePasswords };
      delete updatedVisible[targetMemberId];
      setVisiblePasswords(updatedVisible);
      return;
    }

    setFetchingPasswordId(targetMemberId);
    try {
      const passResponse = await apiClient.get(
        `/members/${targetMemberId}/password`
      );
      if (passResponse.data.success) {
        setVisiblePasswords((previousMap) => ({
          ...previousMap,
          [targetMemberId]: passResponse.data.password,
        }));
      }
    } catch (fetchPassError) {
      console.error("Failed to load member password:", fetchPassError);
      showToast("Unable to fetch password", "error");
    } finally {
      setFetchingPasswordId(null);
    }
  };

  const handleAddMember = async (eventObject: React.FormEvent) => {
    eventObject.preventDefault();
    if (!nameInput.trim()) {
      showToast("Member name is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const createResponse = await apiClient.post(
        `/trips/${currentTrip?._id}/members`,
        {
          name: nameInput.trim(),
          phone: phoneInput.trim(),
          email: emailInput.trim(),
          password: passwordInput.trim() ? passwordInput.trim() : undefined,
          isOrganizer: isOrganizerInput,
        }
      );

      if (createResponse.data.success) {
        setMemberList((previousMembers) => [
          ...previousMembers,
          createResponse.data.data,
        ]);
        showToast(`Added ${nameInput.trim()} to trip members!`, "success");
        setIsAddModalOpen(false);
        setNameInput("");
        setPhoneInput("");
        setEmailInput("");
        setPasswordInput("");
        setIsOrganizerInput(false);
      }
    } catch (createError: any) {
      console.error("Failed to add member:", createError);
      const serverMsg =
        createError?.response?.data?.message || "Failed to add member";
      showToast(serverMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = async (targetMember: Member) => {
    if (currentMember?._id === targetMember._id) {
      openEditProfileModal();
      return;
    }

    if (isOrganizerLoggedIn) {
      setEditingTargetMember(targetMember);
      setEditNameInput(targetMember.name);
      setEditPhoneInput(targetMember.phone || "");
      setEditEmailInput(targetMember.email || "");
      setEditPasswordInput("");
      setEditCurrentPassword("");
      setShowEditPassword(false);
      setEditIsOrganizer(targetMember.isOrganizer);

      // Fetch current password for this member
      try {
        const passRes = await apiClient.get(
          `/members/${targetMember._id}/password`
        );
        if (passRes.data.success) {
          setEditCurrentPassword(passRes.data.password);
        }
      } catch (passErr) {
        console.error("Error fetching password:", passErr);
      }
    }
  };

  const handleSaveMemberEdit = async (eventObject: React.FormEvent) => {
    eventObject.preventDefault();
    if (!editingTargetMember) return;

    if (!editNameInput.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }

    setIsEditSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: editNameInput.trim(),
        phone: editPhoneInput.trim(),
        email: editEmailInput.trim(),
        isOrganizer: editIsOrganizer,
      };

      if (editPasswordInput.trim()) {
        payload.password = editPasswordInput.trim();
      }

      const updateResponse = await apiClient.put(
        `/members/${editingTargetMember._id}`,
        payload
      );

      if (updateResponse.data.success) {
        const updatedData = updateResponse.data.data;
        setMemberList((previousMembers) =>
          previousMembers.map((memberCandidate) =>
            memberCandidate._id === updatedData._id
              ? updatedData
              : memberCandidate
          )
        );

        if (currentMember?._id === updatedData._id) {
          updateCurrentMember(updatedData);
        }

        showToast("Member updated successfully!", "success");
        setEditingTargetMember(null);
      }
    } catch (updateError: any) {
      console.error("Failed to update member:", updateError);
      const serverMsg =
        updateError?.response?.data?.message || "Failed to update member";
      showToast(serverMsg, "error");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!canManageMembers) {
      showToast("Only trip organizers can delete members", "error");
      return;
    }

    try {
      await apiClient.delete(`/members/${memberId}`);
      setMemberList((previousMembers) =>
        previousMembers.filter(
          (currentMemberItem) => currentMemberItem._id !== memberId
        )
      );
      showToast("Member removed from trip", "info");
    } catch (deleteError: any) {
      console.error("Failed to delete member:", deleteError);
      const serverMsg =
        deleteError?.response?.data?.message || "Failed to delete member";
      showToast(serverMsg, "error");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Group Travel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trip Members
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isOrganizerLoggedIn
              ? "Organizer Control: Manage companions, view member passwords, or update credentials"
              : isMemberLoggedIn
              ? "Member View: Edit your profile or view companions"
              : "Guest View: Log in as a member to view private links or edit profile"}
          </p>
        </div>

        {/* Action Button */}
        {canManageMembers ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        ) : !isMemberLoggedIn ? (
          <button
            onClick={openLoginModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition self-start sm:self-auto cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Organizer Login</span>
          </button>
        ) : (
          <button
            onClick={openEditProfileModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition self-start sm:self-auto cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit My Profile</span>
          </button>
        )}
      </div>

      {/* Organizer Only Notification Banner for non-organizer members */}
      {isMemberLoggedIn && !isOrganizerLoggedIn && memberList.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between gap-2.5 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              <strong>Member Mode:</strong> You can edit your own profile by
              clicking on your card or the header. Only organizers can view
              other member credentials or modify the roster.
            </span>
          </div>
          <button
            onClick={openEditProfileModal}
            className="font-bold underline text-emerald-700 shrink-0 cursor-pointer"
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* Guest Mode Notification Banner */}
      {!isMemberLoggedIn && memberList.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>View-only Mode:</strong> Viewing trip members. Member
              login is required to edit profiles or access private links.
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

      {/* Members Grid with Skeleton Loader */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
        </div>
      ) : memberList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
            👥
          </div>
          <h3 className="font-bold text-slate-800 text-base">
            No members added yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add the trip organizer to initialize the trip!
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Member (Organizer)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {memberList.map((memberItem) => {
            const isSelf = currentMember?._id === memberItem._id;
            const canEditThisMember = isOrganizerLoggedIn || isSelf;
            const isThisPassLoading = fetchingPasswordId === memberItem._id;
            const displayedPassword = visiblePasswords[memberItem._id];

            return (
              <div
                key={memberItem._id}
                className={`p-5 rounded-3xl bg-white border shadow-xs hover:shadow-md transition flex flex-col justify-between gap-4 ${
                  isSelf
                    ? "border-emerald-300 ring-1 ring-emerald-400/30"
                    : "border-slate-200/80"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={
                        memberItem.avatarUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          memberItem.name
                        )}`
                      }
                      alt={memberItem.name}
                      className="w-12 h-12 rounded-2xl border border-slate-200 object-cover bg-slate-100 shrink-0"
                    />

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                          {memberItem.name}
                        </h3>
                        {memberItem.isOrganizer && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5 fill-amber-500" />
                            <span>Organizer</span>
                          </span>
                        )}
                        {isSelf && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            You
                          </span>
                        )}
                      </div>

                      {memberItem.phone && (
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{memberItem.phone}</span>
                        </div>
                      )}

                      {memberItem.email && (
                        <div className="text-xs text-slate-400 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{memberItem.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Edit button: for self or organizer */}
                    {canEditThisMember && (
                      <button
                        onClick={() => handleOpenEdit(memberItem)}
                        className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                        title={isSelf ? "Edit your profile" : "Edit member"}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete button: ONLY visible to organizers */}
                    {canManageMembers && (
                      <button
                        onClick={() => handleDeleteMember(memberItem._id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Organizer Password Visibility Box */}
                {isOrganizerLoggedIn && (
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-medium text-slate-500">
                        Password:
                      </span>
                      <span className="font-mono font-bold text-slate-800 text-xs truncate">
                        {displayedPassword || "••••••••"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(clickEvent) =>
                        toggleMemberPassword(memberItem._id, clickEvent)
                      }
                      disabled={isThisPassLoading}
                      className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1 ml-2 shrink-0 cursor-pointer"
                    >
                      {isThisPassLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : displayedPassword ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Show</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal (Organizer only) */}
      {isAddModalOpen && canManageMembers && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <span>Add Trip Member</span>
            </h3>

            <form onSubmit={handleAddMember} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={nameInput}
                  onChange={(changeEvent) =>
                    setNameInput(changeEvent.target.value)
                  }
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phoneInput}
                  onChange={(changeEvent) =>
                    setPhoneInput(changeEvent.target.value)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. rahul@gmail.com"
                  value={emailInput}
                  onChange={(changeEvent) =>
                    setEmailInput(changeEvent.target.value)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Leave empty to use server default"
                  value={passwordInput}
                  onChange={(changeEvent) =>
                    setPasswordInput(changeEvent.target.value)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="organizerCheck"
                  checked={isOrganizerInput}
                  onChange={(changeEvent) =>
                    setIsOrganizerInput(changeEvent.target.checked)
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="organizerCheck"
                  className="text-xs text-slate-700 select-none font-medium"
                >
                  Mark as Trip Organizer / Lead
                </label>
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
                    "Save Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal (For Organizer editing another member) */}
      {editingTargetMember && isOrganizerLoggedIn && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setEditingTargetMember(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-emerald-600" />
              <span>Edit Member: {editingTargetMember.name}</span>
            </h3>

            <form
              onSubmit={handleSaveMemberEdit}
              className="space-y-3.5 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editNameInput}
                  onChange={(changeEvent) =>
                    setEditNameInput(changeEvent.target.value)
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhoneInput}
                  onChange={(changeEvent) =>
                    setEditPhoneInput(changeEvent.target.value)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmailInput}
                  onChange={(changeEvent) =>
                    setEditEmailInput(changeEvent.target.value)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm"
                />
              </div>

              {/* View Current Password (Organizer Only) */}
              {editCurrentPassword && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Member Password:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showEditPassword ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Show Password</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80">
                    {showEditPassword
                      ? editCurrentPassword
                      : "••••••••••••"}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Change Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Leave empty to keep unchanged"
                  value={editPasswordInput}
                  onChange={(changeEvent) =>
                    setEditPasswordInput(changeEvent.target.value)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editOrganizerCheck"
                  checked={editIsOrganizer}
                  onChange={(changeEvent) =>
                    setEditIsOrganizer(changeEvent.target.checked)
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="editOrganizerCheck"
                  className="text-xs text-slate-700 select-none font-medium"
                >
                  Trip Organizer / Lead
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTargetMember(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isEditSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Changes"
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
