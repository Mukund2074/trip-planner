import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";
import { MemberModel } from "../models/Member";

export interface AuthenticatedMemberRequest extends Request {
  authenticatedMember?: {
    memberId: string;
    name: string;
    isOrganizer: boolean;
  };
}

export const requireMemberAuth = async (
  request: AuthenticatedMemberRequest,
  response: Response,
  nextStep: NextFunction,
): Promise<void> => {
  try {
    const totalMembersCount = await MemberModel.countDocuments();
    if (totalMembersCount === 0) {
      nextStep();
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      response.status(401).json({
        success: false,
        message: "Member login required to perform this action",
      });
      return;
    }

    const tokenValue = authHeader.split(" ")[1];
    const decodedPayload = jwt.verify(tokenValue, JWT_SECRET) as {
      memberId: string;
      name: string;
      isOrganizer: boolean;
    };

    const existingMember = await MemberModel.findById(decodedPayload.memberId);
    if (!existingMember) {
      response.status(401).json({
        success: false,
        message: "Invalid member session. Please log in again.",
      });
      return;
    }

    request.authenticatedMember = {
      memberId: existingMember._id.toString(),
      name: existingMember.name,
      isOrganizer: existingMember.isOrganizer,
    };

    nextStep();
  } catch (authError) {
    console.error("Member auth verification failed:", authError);
    response.status(401).json({
      success: false,
      message: "Authentication failed. Member login required.",
    });
  }
};

// Middleware: ONLY organizers can add or delete members
export const requireOrganizerAuth = async (
  request: AuthenticatedMemberRequest,
  response: Response,
  nextStep: NextFunction,
): Promise<void> => {
  try {
    const totalMembersCount = await MemberModel.countDocuments();
    // Allow initial organizer member creation when no members exist yet
    if (totalMembersCount === 0) {
      nextStep();
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      response.status(401).json({
        success: false,
        message: "Organizer login required",
      });
      return;
    }

    const tokenValue = authHeader.split(" ")[1];
    const decodedPayload = jwt.verify(tokenValue, JWT_SECRET) as {
      memberId: string;
      name: string;
      isOrganizer: boolean;
    };

    const existingMember = await MemberModel.findById(decodedPayload.memberId);
    if (!existingMember) {
      response.status(401).json({
        success: false,
        message: "Invalid member session. Please log in again.",
      });
      return;
    }

    if (!existingMember.isOrganizer) {
      response.status(403).json({
        success: false,
        message:
          "Permission denied: Only trip organizers can perform this action.",
      });
      return;
    }

    request.authenticatedMember = {
      memberId: existingMember._id.toString(),
      name: existingMember.name,
      isOrganizer: existingMember.isOrganizer,
    };

    nextStep();
  } catch (organizerAuthError) {
    console.error("Organizer auth verification failed:", organizerAuthError);
    response.status(401).json({
      success: false,
      message: "Authentication failed. Organizer login required.",
    });
  }
};

// Middleware: Either Organizer or the Member themselves editing their own profile
export const requireOrganizerOrSelfAuth = async (
  request: AuthenticatedMemberRequest,
  response: Response,
  nextStep: NextFunction,
): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      response.status(401).json({
        success: false,
        message: "Member login required to edit profile",
      });
      return;
    }

    const tokenValue = authHeader.split(" ")[1];
    const decodedPayload = jwt.verify(tokenValue, JWT_SECRET) as {
      memberId: string;
      name: string;
      isOrganizer: boolean;
    };

    const existingMember = await MemberModel.findById(decodedPayload.memberId);
    if (!existingMember) {
      response.status(401).json({
        success: false,
        message: "Invalid member session. Please log in again.",
      });
      return;
    }

    const targetMemberId = request.params.memberId;
    const isSelfEditing = existingMember._id.toString() === targetMemberId;
    const isOrganizerUser = existingMember.isOrganizer;

    if (!isSelfEditing && !isOrganizerUser) {
      response.status(403).json({
        success: false,
        message: "Permission denied: You can only edit your own profile.",
      });
      return;
    }

    // If regular member editing own profile, prevent self-promotion to organizer
    if (!isOrganizerUser && request.body && "isOrganizer" in request.body) {
      delete request.body.isOrganizer;
    }

    request.authenticatedMember = {
      memberId: existingMember._id.toString(),
      name: existingMember.name,
      isOrganizer: existingMember.isOrganizer,
    };

    nextStep();
  } catch (authError) {
    console.error("Self/Organizer auth verification failed:", authError);
    response.status(401).json({
      success: false,
      message: "Authentication failed. Please log in.",
    });
  }
};
