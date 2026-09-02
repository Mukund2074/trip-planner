import React, { useState, useEffect } from "react";
import { useMemberAuth } from "../../context/MemberAuthContext";
import { useTrip } from "../../context/TripContext";
import { apiClient } from "../../lib/api";
import { User, Phone, Mail, Lock, X, Loader2, Save, Eye, EyeOff, KeyRound } from "lucide-react";

export const EditProfileModal: React.FC = () => {
  const {
    currentMember,
    isEditProfileModalOpen,
    closeEditProfileModal,
    updateCurrentMember,
  } = useMemberAuth();
  const { showToast } = useTrip();

  const [nameInput, setNameInput] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [currentPasswordString, setCurrentPasswordString] = useState<string>("");
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (currentMember && isEditProfileModalOpen) {
      setNameInput(currentMember.name || "");
      setPhoneInput(currentMember.phone || "");
      setEmailInput(currentMember.email || "");
      setAvatarUrlInput(currentMember.avatarUrl || "");
      setPasswordInput("");
      setShowCurrentPassword(false);

      // Fetch current password for this member
      apiClient
        .get(`/members/${currentMember._id}/password`)
        .then((responseResult) => {
          if (responseResult.data.success) {
            setCurrentPasswordString(responseResult.data.password);
          }
        })
        .catch((fetchError) => {
          console.error("Failed to fetch password:", fetchError);
        });
    }
  }, [currentMember, isEditProfileModalOpen]);

  if (!isEditProfileModalOpen || !currentMember) return null;

  const handleProfileSubmit = async (eventObject: React.FormEvent) => {
    eventObject.preventDefault();
    if (!nameInput.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: nameInput.trim(),
        phone: phoneInput.trim(),
        email: emailInput.trim(),
        avatarUrl:
          avatarUrlInput.trim() ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            nameInput.trim()
          )}`,
      };

      if (passwordInput.trim()) {
        payload.password = passwordInput.trim();
      }

      const updateResponse = await apiClient.put(
        `/members/${currentMember._id}`,
        payload
      );

      if (updateResponse.data.success) {
        updateCurrentMember(updateResponse.data.data);
        showToast("Profile updated successfully!", "success");
        closeEditProfileModal();
      }
    } catch (saveError: any) {
      console.error("Failed to update profile:", saveError);
      const serverMsg =
        saveError?.response?.data?.message || "Failed to update profile";
      showToast(serverMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={closeEditProfileModal}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Edit Member Profile
              </h3>
              <p className="text-xs text-slate-500">
                Update your contact details or change password
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeEditProfileModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-3.5 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Your full name"
                value={nameInput}
                onChange={(changeEvent) => setNameInput(changeEvent.target.value)}
                required
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phoneInput}
                onChange={(changeEvent) => setPhoneInput(changeEvent.target.value)}
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="your.email@example.com"
                value={emailInput}
                onChange={(changeEvent) => setEmailInput(changeEvent.target.value)}
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Current Password View */}
          {currentPasswordString && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Current Password:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                >
                  {showCurrentPassword ? (
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
                {showCurrentPassword ? currentPasswordString : "••••••••••••"}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Change Password (Optional)
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Leave blank to keep unchanged"
                value={passwordInput}
                onChange={(changeEvent) => setPasswordInput(changeEvent.target.value)}
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={closeEditProfileModal}
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
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
