export interface Trip {
  _id: string;
  title: string;
  subtitle: string;
  origin: string;
  destinations: string[];
  startDate: string;
  endDate: string;
  coverImage: string;
  status: "planning" | "ongoing" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  _id: string;
  tripId: string;
  name: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  isOrganizer: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | "Travel"
  | "Food"
  | "Stay"
  | "Tickets"
  | "Shopping"
  | "Activities"
  | "Other";

export interface Expense {
  _id: string;
  tripId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidByMemberId: {
    _id: string;
    name: string;
    avatarUrl?: string;
    phone?: string;
  } | string;
  splitAmongMemberIds: Array<{
    _id: string;
    name: string;
    avatarUrl?: string;
  }> | string[];
  settledMemberIds?: Array<{
    _id: string;
    name: string;
    avatarUrl?: string;
  }> | string[];
  date: string;
  isSettled: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummary {
  grandTotal: number;
  settledTotal: number;
  pendingTotal: number;
  totalExpensesCount: number;
  settledCount: number;
  pendingCount: number;
  categoryBreakdown: Record<string, number>;
}

export interface ChecklistItem {
  _id: string;
  tripId: string;
  category: string;
  itemText: string;
  isCompleted: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistResponse {
  items: ChecklistItem[];
  totalCount: number;
  completedCount: number;
  progressPercentage: number;
}
