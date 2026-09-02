import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface ChecklistItemDocument extends MongooseDocument {
  tripId: mongoose.Types.ObjectId;
  category: string;
  itemText: string;
  isCompleted: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema<ChecklistItemDocument>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    category: {
      type: String,
      default: "General",
    },
    itemText: {
      type: String,
      required: true,
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    orderIndex: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const ChecklistItemModel = mongoose.model<ChecklistItemDocument>(
  "ChecklistItem",
  ChecklistItemSchema
);
