import React from "react";
import { MemberPersonalBalance } from "../types";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";

interface PersonalBalanceCardProps {
  balance: MemberPersonalBalance | null;
  isLoading: boolean;
}

export const PersonalBalanceCard: React.FC<PersonalBalanceCardProps> = ({ balance, isLoading }) => {
  if (isLoading) {
    return (
      <div className="rounded-3xl p-6 bg-white border border-slate-200/80 shadow-xs animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-32 mb-3"></div>
        <div className="h-8 bg-slate-200 rounded w-24 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 rounded w-full"></div>
          <div className="h-3 bg-slate-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  const netBalanceIsPositive = balance.netBalance > 0;
  const netBalanceColor = netBalanceIsPositive
    ? "text-emerald-700 bg-emerald-50"
    : balance.netBalance < 0
    ? "text-rose-700 bg-rose-50"
    : "text-slate-700 bg-slate-50";

  const netBalanceIcon = netBalanceIsPositive ? (
    <TrendingUp className="w-4 h-4" />
  ) : balance.netBalance < 0 ? (
    <TrendingDown className="w-4 h-4" />
  ) : (
    <Wallet className="w-4 h-4" />
  );

  return (
    <div className="rounded-3xl p-6 bg-white border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Your Balance Summary
        </span>
        <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
          <Wallet className="w-4 h-4" />
        </span>
      </div>

      {/* Net Balance - Prominent Display */}
      <div className={`rounded-2xl p-4 mb-4 ${netBalanceColor}`}>
        <div className="text-xs font-semibold mb-1 flex items-center gap-1">
          {netBalanceIcon}
          <span>{netBalanceIsPositive ? "You Are Owed" : balance.netBalance < 0 ? "You Owe" : "Settled"}</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold">
          ₹{Math.abs(balance.netBalance).toLocaleString("en-IN")}
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">
            <strong>Total to Pay:</strong> Others have paid for expenses you're in
          </span>
          <span className="font-bold text-rose-600">₹{balance.totalToPay.toLocaleString("en-IN")}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">
            <strong>Total to Receive:</strong> You paid for others' shares
          </span>
          <span className="font-bold text-emerald-600">₹{balance.totalToReceive.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Deposit Account Info */}
      {balance.depositAccount.totalDeposited > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-700 mb-2">Deposit Account</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Deposited:</span>
              <span className="font-bold">₹{balance.depositAccount.totalDeposited.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Deducted:</span>
              <span className="font-bold text-amber-600">
                ₹{balance.depositAccount.deductedAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
              <span className="text-slate-700 font-semibold">Remaining:</span>
              <span className="font-bold text-emerald-600">
                ₹{balance.depositAccount.remainingBalance.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
