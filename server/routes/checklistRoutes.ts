import { Router } from "express";
import {
  getChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "../controllers/checklistController";
import { requireMemberAuth } from "../middleware/memberAuth";

const checklistTripRouter = Router({ mergeParams: true });
const checklistItemRouter = Router();

// Public: View checklist
checklistTripRouter.get("/", getChecklist);

// Protected: Only members can add, check off, or delete items
checklistTripRouter.post("/", requireMemberAuth, createChecklistItem);
checklistItemRouter.put("/:itemId", requireMemberAuth, updateChecklistItem);
checklistItemRouter.delete("/:itemId", requireMemberAuth, deleteChecklistItem);

export { checklistTripRouter, checklistItemRouter };
