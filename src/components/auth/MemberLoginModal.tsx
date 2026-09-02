import React, { useState, useEffect } from "react";
import { useMemberAuth } from "../../context/MemberAuthContext";
import { useTrip } from "../../context/TripContext";
import { apiClient } from "../../lib/api";
import { Member } from "../../types";
import { Lock, LogIn, X, Loader2, KeyRound } from "lucide-react";

export const MemberLoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, loginMember } = useMemberAuth();
  const { currentTrip, showToast } = useTrip();
  const [memberList, setMemberList] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!isLoginModalOpen || !currentTrip) return;

    const fetchTripMembers = async () => {
      try {
        const responseResult = await apiClient.get(
          `/trips/${currentTrip._id}/members`
        );
        if (responseResult.data.success) {
          const members = responseResult.data.data;
          setMemberList(members);
          if (members.length > 0) {
            setSelectedMemberId(members[0]._id);
          }
        }
      } catch (fetchError) {
        console.error("Failed to load members for login:", fetchError);
      }
    };

    fetchTripMembers();
    setPasswordInput("");
    setErrorMessage("");
  }, [isLoginModalOpen, currentTrip]);

  if (!isLoginModalOpen) return null;

  const handleLoginSubmit = async (eventObject: React.FormEvent) => {
    eventObject.preventDefault();
    if (!selectedMemberId) {
      setErrorMessage("Please select your member profile");
      return;
    }

    if (!passwordInput.trim()) {
      setErrorMessage("Please enter your member password");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const loginSuccess = await loginMember(selectedMemberId, passwordInput);
      if (loginSuccess) {
        const selectedMember = memberList.find(
          (member) => member._id === selectedMemberId
        );
        showToast(
          `Logged in as ${selectedMember?.name || "Member"}!`,
          "success"
        );
      } else {
        setErrorMessage("Incorrect member password. Please try again.");
      }
    } catch (submitError) {
      console.error("Login attempt failed:", submitError);
      setErrorMessage("Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={closeLoginModal}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Member Access Login
              </h3>
              <p className="text-xs text-slate-500">
                Log in to edit trip data and unlock Google Drive
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeLoginModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {memberList.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <p className="text-xs text-slate-600">
              No members are in this trip yet.
            </p>
            <p className="text-xs text-emerald-700 font-semibold">
              You can add the first trip organizer without logging in!
            </p>
            <button
              onClick={closeLoginModal}
              className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
            >
              Okay
            </button>
          </div>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Your Name *
              </label>
              <select
                value={selectedMemberId}
                onChange={(changeEvent) =>
                  setSelectedMemberId(changeEvent.target.value)
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-semibold outline-none"
              >
                {memberList.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name} {member.isOrganizer ? "👑 (Organizer)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Member Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter member password"
                  value={passwordInput}
                  onChange={(changeEvent) =>
                    setPasswordInput(changeEvent.target.value)
                  }
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
              🔒 <strong className="text-slate-700">Access Control:</strong> Only authenticated trip members can modify trip expenses and open the 5 TB Google Drive. Trip members can only be managed by organizers.
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={closeLoginModal}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Log In as Member</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
