import { Router } from "express";
import {
  getExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense,
  toggleMemberExpenseSettlement,
} from "../controllers/expenseController";
import {
  requireMemberAuth,
  requireOrganizerAuth,
} from "../middleware/memberAuth";

const expenseTripRouter = Router({ mergeParams: true });
const expenseItemRouter = Router();

// Public: View all expenses and summary
expenseTripRouter.get("/", getExpenses);
expenseTripRouter.get("/summary", getExpenseSummary);

// Protected: Only members can record or modify expenses
expenseTripRouter.post("/", requireMemberAuth, createExpense);
expenseItemRouter.put("/:expenseId", requireMemberAuth, updateExpense);
expenseItemRouter.delete("/:expenseId", requireMemberAuth, deleteExpense);

// Creator or Organizer: Mark/unmark a SPECIFIC individual person as paid for this expense
expenseItemRouter.put(
  "/:expenseId/settle-member/:memberId",
  requireMemberAuth,
  toggleMemberExpenseSettlement
);

export { expenseTripRouter, expenseItemRouter };
