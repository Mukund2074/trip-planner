import React, { createContext, useContext, useState, useEffect } from "react";
import { Member } from "../types";
import { apiClient } from "../lib/api";

interface MemberAuthContextType {
  currentMember: Member | null;
  isMemberLoggedIn: boolean;
  isLoginModalOpen: boolean;
  isEditProfileModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openEditProfileModal: () => void;
  closeEditProfileModal: () => void;
  loginMember: (memberId: string, passwordString: string) => Promise<boolean>;
  logoutMember: () => void;
  updateCurrentMember: (updatedMemberData: Member) => void;
}

const MemberAuthContext = createContext<MemberAuthContextType | undefined>(
  undefined
);

export const MemberAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Restore session from localStorage if present
    const savedMemberData = localStorage.getItem("active_member_session");
    const savedToken = localStorage.getItem("member_token");

    if (savedMemberData && savedToken) {
      try {
        const parsedMember = JSON.parse(savedMemberData);
        setCurrentMember(parsedMember);
      } catch (parseError) {
        console.error("Failed to parse saved member session:", parseError);
        localStorage.removeItem("active_member_session");
        localStorage.removeItem("member_token");
      }
    }
  }, []);

  const loginMember = async (
    memberId: string,
    passwordString: string
  ): Promise<boolean> => {
    try {
      const responseResult = await apiClient.post("/members/login", {
        memberId,
        password: passwordString,
      });

      if (responseResult.data.success) {
        const { token, member } = responseResult.data.data;
        localStorage.setItem("member_token", token);
        localStorage.setItem("active_member_session", JSON.stringify(member));
        setCurrentMember(member);
        setIsLoginModalOpen(false);
        return true;
      }
      return false;
    } catch (loginError) {
      console.error("Member login error:", loginError);
      return false;
    }
  };

  const logoutMember = () => {
    localStorage.removeItem("member_token");
    localStorage.removeItem("active_member_session");
    setCurrentMember(null);
  };

  const updateCurrentMember = (updatedMemberData: Member) => {
    setCurrentMember(updatedMemberData);
    localStorage.setItem(
      "active_member_session",
      JSON.stringify(updatedMemberData)
    );
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const openEditProfileModal = () => {
    setIsEditProfileModalOpen(true);
  };

  const closeEditProfileModal = () => {
    setIsEditProfileModalOpen(false);
  };

  return (
    <MemberAuthContext.Provider
      value={{
        currentMember,
        isMemberLoggedIn: Boolean(currentMember),
        isLoginModalOpen,
        isEditProfileModalOpen,
        openLoginModal,
        closeLoginModal,
        openEditProfileModal,
        closeEditProfileModal,
        loginMember,
        logoutMember,
        updateCurrentMember,
      }}
    >
      {children}
    </MemberAuthContext.Provider>
  );
};

export const useMemberAuth = (): MemberAuthContextType => {
  const contextInstance = useContext(MemberAuthContext);
  if (!contextInstance) {
    throw new Error(
      "useMemberAuth must be used within a MemberAuthProvider"
    );
  }
  return contextInstance;
};
