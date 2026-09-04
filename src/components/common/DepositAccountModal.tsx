import React, { useState } from "react";
import { Loader2, X, CreditCard, Plus } from "lucide-react";

interface DepositAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDeposit: (amount: number) => Promise<void>;
  memberName: string;
  currentBalance?: number;
}

export const DepositAccountModal: React.FC<DepositAccountModalProps> = ({
  isOpen,
  onClose,
  onCreateDeposit,
  memberName,
  currentBalance = 0,
}) => {
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError("Please enter a valid deposit amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateDeposit(parseFloat(depositAmount));
      setDepositAmount("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create deposit account");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>Create Deposit Account</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-2xl bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-800">
            <strong>{memberName}</strong> will have a deposit account. When they're selected in expenses with "Use Deposit Account" enabled, their share will be auto-deducted.
          </p>
        </div>

        {currentBalance > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="text-xs font-semibold text-emerald-800 mb-1">Current Balance</div>
            <div className="text-xl font-bold text-emerald-700">
              ₹{currentBalance.toLocaleString("en-IN")}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Deposit Amount (₹ INR) *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 5000"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold focus:border-emerald-500 transition text-sm"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Deposit</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};