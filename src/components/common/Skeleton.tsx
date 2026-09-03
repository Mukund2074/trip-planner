import React from "react";

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-2xl ${className}`}
    />
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return (
    <div
      className={`p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 animate-pulse ${className}`}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-36 rounded-xl" />
      <Skeleton className="h-3.5 w-24 rounded-md" />
    </div>
  );
};

export const ExpenseItemSkeleton: React.FC = () => {
  return (
    <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5 flex-1">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-44 rounded-lg" />
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-32 rounded-md" />
          </div>
        </div>
        <div className="space-y-1.5 text-right">
          <Skeleton className="h-6 w-20 rounded-lg ml-auto" />
          <Skeleton className="h-3.5 w-14 rounded-md ml-auto" />
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
        <Skeleton className="h-7 w-28 rounded-xl" />
        <Skeleton className="h-7 w-28 rounded-xl" />
        <Skeleton className="h-7 w-28 rounded-xl" />
      </div>
    </div>
  );
};

export const MemberCardSkeleton: React.FC = () => {
  return (
    <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-4 animate-pulse">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-32 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 rounded-xl" />
    </div>
  );
};

export const ChecklistItemSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 animate-pulse">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="w-5 h-5 rounded-lg shrink-0" />
        <Skeleton className="h-4 w-48 rounded-lg" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
};
