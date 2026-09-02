import React from "react";
import { useTrip } from "../../context/TripContext";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useTrip();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toastItem) => {
        const isSuccess = toastItem.type === "success";
        const isError = toastItem.type === "error";

        return (
          <div
            key={toastItem.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in fade-in slide-in-from-top-3 duration-200 ${
              isSuccess
                ? "bg-emerald-900 text-white border-emerald-700"
                : isError
                ? "bg-rose-900 text-white border-rose-700"
                : "bg-slate-900 text-white border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {isError && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
              <span className="truncate text-xs sm:text-sm">{toastItem.message}</span>
            </div>

            <button
              onClick={() => removeToast(toastItem.id)}
              className="text-slate-300 hover:text-white p-0.5 rounded transition shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
