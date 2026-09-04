import React, { createContext, useContext, useState, useEffect } from "react";
import { MemberDeposit, MemberPersonalBalance } from "../types";
import { apiClient } from "../lib/api";

interface DepositContextType {
  deposits: Record<string, MemberDeposit>;
  personalBalances: Record<string, MemberPersonalBalance>;
  isLoading: boolean;
  fetchDepositAccounts: (tripId: string) => Promise<void>;
  fetchPersonalBalances: (tripId: string, memberId: string) => Promise<void>;
  createDepositAccount: (tripId: string, memberId: string, amount: number) => Promise<void>;
  deductFromDeposit: (tripId: string, memberId: string, expenseId: string, amount: number) => Promise<void>;
  getDepositBalance: (memberId: string) => number;
  getPersonalBalance: (memberId: string) => MemberPersonalBalance | null;
}

const DepositContext = createContext<DepositContextType | undefined>(undefined);

export const DepositProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deposits, setDeposits] = useState<Record<string, MemberDeposit>>({});
  const [personalBalances, setPersonalBalances] = useState<Record<string, MemberPersonalBalance>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchDepositAccounts = async (tripId: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/trips/${tripId}/deposits`);
      if (response.data.success) {
        const depositsMap: Record<string, MemberDeposit> = {};
        response.data.data.forEach((deposit: MemberDeposit) => {
          depositsMap[deposit.memberId] = deposit;
        });
        setDeposits(depositsMap);
      }
    } catch (error) {
      console.error("Failed to fetch deposit accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPersonalBalances = async (tripId: string, memberId: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/trips/${tripId}/personal-balance/${memberId}`);
      if (response.data.success) {
        setPersonalBalances((prev) => ({
          ...prev,
          [memberId]: response.data.data,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch personal balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDepositAccount = async (tripId: string, memberId: string, amount: number) => {
    try {
      const response = await apiClient.post(`/trips/${tripId}/members/${memberId}/deposit`, {
        amount,
      });
      if (response.data.success) {
        setDeposits((prev) => ({
          ...prev,
          [memberId]: response.data.data,
        }));
      }
    } catch (error) {
      console.error("Failed to create deposit account:", error);
      throw error;
    }
  };

  const deductFromDeposit = async (
    tripId: string,
    memberId: string,
    expenseId: string,
    amount: number
  ) => {
    try {
      const response = await apiClient.put(`/trips/${tripId}/members/${memberId}/deposit/deduct`, {
        expenseId,
        amount,
      });
      if (response.data.success) {
        setDeposits((prev) => ({
          ...prev,
          [memberId]: response.data.data,
        }));
      }
    } catch (error) {
      console.error("Failed to deduct from deposit:", error);
      throw error;
    }
  };

  const getDepositBalance = (memberId: string): number => {
    return deposits[memberId]?.remainingBalance || 0;
  };

  const getPersonalBalance = (memberId: string): MemberPersonalBalance | null => {
    return personalBalances[memberId] || null;
  };

  return (
    <DepositContext.Provider
      value={{
        deposits,
        personalBalances,
        isLoading,
        fetchDepositAccounts,
        fetchPersonalBalances,
        createDepositAccount,
        deductFromDeposit,
        getDepositBalance,
        getPersonalBalance,
      }}
    >
      {children}
    </DepositContext.Provider>
  );
};

export const useDeposit = () => {
  const context = useContext(DepositContext);
  if (!context) {
    throw new Error("useDeposit must be used within DepositProvider");
  }
  return context;
};
