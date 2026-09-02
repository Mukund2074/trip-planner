import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { DEFAULT_MEMBER_PASSWORD, JWT_SECRET } from "../config/env";
import { MemberModel, MemberDocument } from "../models/Member";
import { ExpenseModel } from "../models/Expense";

const toPublicMember = (memberRecord: MemberDocument) => ({
  _id: memberRecord._id,
  tripId: memberRecord.tripId,
  name: memberRecord.name,
  phone: memberRecord.phone,
  email: memberRecord.email,
  avatarUrl: memberRecord.avatarUrl,
  isOrganizer: memberRecord.isOrganizer,
  createdAt: memberRecord.createdAt,
  updatedAt: memberRecord.updatedAt,
});

export const getMembers = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { tripId } = request.params;

    const memberList = await MemberModel.find({ tripId }).sort({
      isOrganizer: -1,
      name: 1,
    });

    response.json({
      success: true,
      data: memberList,
    });
  } catch (fetchError) {
    console.error("Error fetching trip members:", fetchError);
    response.status(500).json({
      success: false,
      message: "Failed to fetch trip members",
    });
  }
};

export const loginMember = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { memberId, password } = request.body;

    if (!memberId || !password) {
      response.status(400).json({
        success: false,
        message: "Please select a member and enter the password",
      });
      return;
    }

    // Select password explicitly since select: false is on schema
    const foundMember = await MemberModel.findById(memberId).select("+password");
    if (!foundMember) {
      response.status(404).json({
        success: false,
        message: "Member not found",
      });
      return;
    }

    const memberPassword = foundMember.password ?? DEFAULT_MEMBER_PASSWORD;

    if (memberPassword !== password.trim()) {
      response.status(401).json({
        success: false,
        message: "Incorrect member password",
      });
      return;
    }

    const tokenValue = jwt.sign(
      {
        memberId: foundMember._id.toString(),
        name: foundMember.name,
        isOrganizer: foundMember.isOrganizer,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    response.json({
      success: true,
      data: {
        token: tokenValue,
        member: {
          _id: foundMember._id,
          name: foundMember.name,
          phone: foundMember.phone,
          email: foundMember.email,
          avatarUrl: foundMember.avatarUrl,
          isOrganizer: foundMember.isOrganizer,
        },
      },
    });
  } catch (loginError) {
    console.error("Error during member login:", loginError);
    response.status(500).json({
      success: false,
      message: "Member login failed",
    });
  }
};

export const createMember = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { tripId } = request.params;
    const { name, phone, email, password, isOrganizer, avatarUrl } = request.body;

    if (!name || !name.trim()) {
      response.status(400).json({
        success: false,
        message: "Member name is required",
      });
      return;
    }

    const totalExistingMembers = await MemberModel.countDocuments();
    // If this is the very first member, automatically make them Organizer
    const willBeOrganizer =
      totalExistingMembers === 0 ? true : Boolean(isOrganizer);

    const generatedAvatar =
      avatarUrl ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`;

    const assignedPassword =
      password && password.trim() ? password.trim() : DEFAULT_MEMBER_PASSWORD;

    const newMember = await MemberModel.create({
      tripId,
      name: name.trim(),
      phone: phone?.trim() || "",
      email: email?.trim() || "",
      password: assignedPassword,
      avatarUrl: generatedAvatar,
      isOrganizer: willBeOrganizer,
    });

    const responseMemberData = {
      _id: newMember._id,
      tripId: newMember.tripId,
      name: newMember.name,
      phone: newMember.phone,
      email: newMember.email,
      avatarUrl: newMember.avatarUrl,
      isOrganizer: newMember.isOrganizer,
      createdAt: newMember.createdAt,
      updatedAt: newMember.updatedAt,
    };

    response.status(201).json({
      success: true,
      data: responseMemberData,
    });
  } catch (createError) {
    console.error("Error adding member:", createError);
    response.status(500).json({
      success: false,
      message: "Failed to add member",
    });
  }
};

export const updateMember = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { memberId } = request.params;

    const updateFields = { ...request.body };
    if (!updateFields.password || !updateFields.password.trim()) {
      delete updateFields.password;
    }

    const updatedMember = await MemberModel.findByIdAndUpdate(
      memberId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      response.status(404).json({
        success: false,
        message: "Member not found",
      });
      return;
    }

    response.json({
      success: true,
      data: toPublicMember(updatedMember),
    });
  } catch (updateError) {
    console.error("Error updating member:", updateError);
    response.status(500).json({
      success: false,
      message: "Failed to update member",
    });
  }
};

export const deleteMember = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { memberId } = request.params;

    const deletedMember = await MemberModel.findByIdAndDelete(memberId);
    if (!deletedMember) {
      response.status(404).json({
        success: false,
        message: "Member not found",
      });
      return;
    }

    // Pull deleted member from any expense splits
    await ExpenseModel.updateMany(
      { splitAmongMemberIds: memberId },
      { $pull: { splitAmongMemberIds: memberId } }
    );

    response.json({
      success: true,
      message: "Member removed from trip",
    });
  } catch (deleteError) {
    console.error("Error deleting member:", deleteError);
    response.status(500).json({
      success: false,
      message: "Failed to remove member",
    });
  }
};

export const getMemberPassword = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { memberId } = request.params;
    const memberRecord = await MemberModel.findById(memberId).select("+password");
    if (!memberRecord) {
      response.status(404).json({
        success: false,
        message: "Member not found",
      });
      return;
    }

    response.json({
      success: true,
      password: memberRecord.password || "",
    });
  } catch (fetchError) {
    console.error("Error fetching member password:", fetchError);
    response.status(500).json({
      success: false,
      message: "Failed to fetch member password",
    });
  }
};

