import { Request, Response } from "express";
import { ExpenseModel } from "../models/Expense";
import { MemberModel } from "../models/Member";
import { AuthenticatedMemberRequest } from "../middleware/memberAuth";

export const getExpenses = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { tripId } = request.params;
    const { category } = request.query;

    const filterQuery: Record<string, unknown> = { tripId };
    if (category && category !== "All") {
      filterQuery.category = category;
    }

    const expenseList = await ExpenseModel.find(filterQuery)
      .populate("paidByMemberId", "name avatarUrl phone")
      .populate("splitAmongMemberIds", "name avatarUrl")
      .populate("settledMemberIds", "name avatarUrl")
      .sort({ date: -1, createdAt: -1 });

    response.json({
      success: true,
      data: expenseList,
    });
  } catch (fetchError) {
    console.error("Error fetching expenses:", fetchError);
    response.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
    });
  }
};

export const getExpenseSummary = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { tripId } = request.params;

    const allExpenses = await ExpenseModel.find({ tripId });

    let grandTotal = 0;
    let settledTotal = 0;
    let pendingTotal = 0;
    let fullySettledCount = 0;
    let pendingCount = 0;
    const categoryBreakdown: Record<string, number> = {};

    allExpenses.forEach((expenseEntry) => {
      grandTotal += expenseEntry.amount;

      if (expenseEntry.isSettled) {
        settledTotal += expenseEntry.amount;
        fullySettledCount += 1;
      } else {
        pendingTotal += expenseEntry.amount;
        pendingCount += 1;
      }

      const categoryKey = expenseEntry.category;
      categoryBreakdown[categoryKey] =
        (categoryBreakdown[categoryKey] || 0) + expenseEntry.amount;
    });

    response.json({
      success: true,
      data: {
        grandTotal,
        settledTotal,
        pendingTotal,
        totalExpensesCount: allExpenses.length,
        settledCount: fullySettledCount,
        pendingCount,
        categoryBreakdown,
      },
    });
  } catch (summaryError) {
    console.error("Error calculating expense summary:", summaryError);
    response.status(500).json({
      success: false,
      message: "Failed to calculate expense summary",
    });
  }
};

export const createExpense = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { tripId } = request.params;
    const {
      title,
      amount,
      category,
      paidByMemberId,
      splitAmongMemberIds,
      date,
      notes,
    } = request.body;

    if (!title || !title.trim()) {
      response.status(400).json({
        success: false,
        message: "Expense title is required",
      });
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      response.status(400).json({
        success: false,
        message: "Valid positive amount is required",
      });
      return;
    }

    if (!paidByMemberId) {
      response.status(400).json({
        success: false,
        message: "Payer member ID is required",
      });
      return;
    }

    // Default split among all trip members if empty
    let finalSplitMembers = splitAmongMemberIds;
    if (!finalSplitMembers || finalSplitMembers.length === 0) {
      const allMembers = await MemberModel.find({ tripId });
      finalSplitMembers = allMembers.map((memberCandidate) =>
        memberCandidate._id
      );
    }

    // Payer is marked as settled by default for their own share
    const initialSettledMembers = [paidByMemberId];

    // If split has only the payer, then whole expense is settled
    const otherMembersInSplit = finalSplitMembers.filter(
      (participantId: any) =>
        participantId.toString() !== paidByMemberId.toString()
    );
    const isFullySettled = otherMembersInSplit.length === 0;

    const newExpense = await ExpenseModel.create({
      tripId,
      title: title.trim(),
      amount: Number(amount),
      category: category || "Food",
      paidByMemberId,
      splitAmongMemberIds: finalSplitMembers,
      settledMemberIds: initialSettledMembers,
      isSettled: isFullySettled,
      date: date ? new Date(date) : new Date(),
      notes: notes?.trim() || "",
    });

    const populatedExpense = await ExpenseModel.findById(newExpense._id)
      .populate("paidByMemberId", "name avatarUrl phone")
      .populate("splitAmongMemberIds", "name avatarUrl")
      .populate("settledMemberIds", "name avatarUrl");

    response.status(201).json({
      success: true,
      data: populatedExpense,
    });
  } catch (createError) {
    console.error("Error creating expense:", createError);
    response.status(500).json({
      success: false,
      message: "Failed to create expense",
    });
  }
};

export const updateExpense = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { expenseId } = request.params;

    const updatedExpense = await ExpenseModel.findByIdAndUpdate(
      expenseId,
      { $set: request.body },
      { new: true, runValidators: true }
    )
      .populate("paidByMemberId", "name avatarUrl phone")
      .populate("splitAmongMemberIds", "name avatarUrl")
      .populate("settledMemberIds", "name avatarUrl");

    if (!updatedExpense) {
      response.status(404).json({
        success: false,
        message: "Expense not found",
      });
      return;
    }

    response.json({
      success: true,
      data: updatedExpense,
    });
  } catch (updateError) {
    console.error("Error updating expense:", updateError);
    response.status(500).json({
      success: false,
      message: "Failed to update expense",
    });
  }
};

// Toggle settlement for a SPECIFIC individual member on an expense (Organizer only)
export const toggleMemberExpenseSettlement = async (
  request: AuthenticatedMemberRequest,
  response: Response
): Promise<void> => {
  try {
    const { expenseId, memberId } = request.params;

    const existingExpense = await ExpenseModel.findById(expenseId);
    if (!existingExpense) {
      response.status(404).json({
        success: false,
        message: "Expense not found",
      });
      return;
    }

    const isOrganizerUser = Boolean(request.authenticatedMember?.isOrganizer);
    const isExpensePayer =
      existingExpense.paidByMemberId.toString() ===
      request.authenticatedMember?.memberId;

    if (!isOrganizerUser && !isExpensePayer) {
      response.status(403).json({
        success: false,
        message:
          "Permission denied: Only the expense creator (who paid) or a trip organizer can mark payments as settled.",
      });
      return;
    }

    const currentSettledStrings = (existingExpense.settledMemberIds || []).map(
      (objectId) => objectId.toString()
    );

    let nextSettledStrings: string[];
    let isMemberNowSettled: boolean;

    if (currentSettledStrings.includes(memberId)) {
      // Remove member from settled list
      nextSettledStrings = currentSettledStrings.filter(
        (idString) => idString !== memberId
      );
      isMemberNowSettled = false;
    } else {
      // Add member to settled list
      nextSettledStrings = [...currentSettledStrings, memberId];
      isMemberNowSettled = true;
    }

    existingExpense.settledMemberIds = nextSettledStrings as any;

    // Check if all split members who are not the payer have paid
    const payerIdString = existingExpense.paidByMemberId.toString();
    const otherSplitMembers = (existingExpense.splitAmongMemberIds || []).filter(
      (splitId) => splitId.toString() !== payerIdString
    );

    const allOthersSettled = otherSplitMembers.every((splitId) =>
      nextSettledStrings.includes(splitId.toString())
    );

    existingExpense.isSettled = allOthersSettled;

    await existingExpense.save();

    const populatedExpense = await ExpenseModel.findById(expenseId)
      .populate("paidByMemberId", "name avatarUrl phone")
      .populate("splitAmongMemberIds", "name avatarUrl")
      .populate("settledMemberIds", "name avatarUrl");

    const targetMember = await MemberModel.findById(memberId);
    const memberName = targetMember?.name || "Member";

    response.json({
      success: true,
      data: populatedExpense,
      message: isMemberNowSettled
        ? `Marked ${memberName} as paid for this expense`
        : `Marked ${memberName} as unpaid for this expense`,
    });
  } catch (settleError) {
    console.error("Error toggling member expense settlement:", settleError);
    response.status(500).json({
      success: false,
      message: "Failed to update member settlement status",
    });
  }
};

export const deleteExpense = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { expenseId } = request.params;

    const deletedExpense = await ExpenseModel.findByIdAndDelete(expenseId);
    if (!deletedExpense) {
      response.status(404).json({
        success: false,
        message: "Expense not found",
      });
      return;
    }

    response.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (deleteError) {
    console.error("Error deleting expense:", deleteError);
    response.status(500).json({
      success: false,
      message: "Failed to delete expense",
    });
  }
};
