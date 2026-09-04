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

export interface MemberDeposit {
  _id: string;
  tripId: string;
  memberId: string;
  totalDeposit: number;
  remainingBalance: number;
  deductedAmount: number;
  transactions: DepositTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface DepositTransaction {
  _id: string;
  expenseId: string;
  amount: number;
  type: "deduction" | "refund" | "deposit";
  description: string;
  timestamp: string;
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
  useDepositAccount?: boolean;
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

export interface MemberPersonalBalance {
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  totalToPay: number;
  totalToReceive: number;
  netBalance: number;
  depositAccount: {
    totalDeposited: number;
    remainingBalance: number;
    deductedAmount: number;
  };
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
