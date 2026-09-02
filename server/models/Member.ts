import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface MemberDocument extends MongooseDocument {
  tripId: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
  isOrganizer: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<MemberDocument>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      select: false, // Never return password in regular member queries
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    isOrganizer: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const MemberModel = mongoose.model<MemberDocument>("Member", MemberSchema);
