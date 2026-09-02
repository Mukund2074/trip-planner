import { Router } from "express";
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  loginMember,
  getMemberPassword,
} from "../controllers/memberController";
import {
  requireOrganizerAuth,
  requireOrganizerOrSelfAuth,
} from "../middleware/memberAuth";

const memberTripRouter = Router({ mergeParams: true });
const memberItemRouter = Router();

// Public: Anyone can view the list of members
memberTripRouter.get("/", getMembers);

// Organizer Only: Only organizers can add members (bypassed if 0 members exist in DB)
memberTripRouter.post("/", requireOrganizerAuth, createMember);

// Member login route
memberItemRouter.post("/login", loginMember);

// Organizer or Self: Members can view their own password; Organizers can view any member's password
memberItemRouter.get("/:memberId/password", requireOrganizerOrSelfAuth, getMemberPassword);

// Organizer or Self: Members can edit their own profile; Organizers can edit any member
memberItemRouter.put("/:memberId", requireOrganizerOrSelfAuth, updateMember);

// Organizer Only: Only organizers can remove members
memberItemRouter.delete("/:memberId", requireOrganizerAuth, deleteMember);

export { memberTripRouter, memberItemRouter };
