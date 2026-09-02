import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export type ExpenseCategory =
  | "Travel"
  | "Food"
  | "Stay"
  | "Tickets"
  | "Shopping"
  | "Activities"
  | "Other";

export interface ExpenseDocument extends MongooseDocument {
  tripId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidByMemberId: mongoose.Types.ObjectId;
  splitAmongMemberIds: mongoose.Types.ObjectId[];
  settledMemberIds: mongoose.Types.ObjectId[];
  date: Date;
  isSettled: boolean;
  notes?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<ExpenseDocument>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: [
        "Travel",
        "Food",
        "Stay",
        "Tickets",
        "Shopping",
        "Activities",
        "Other",
      ],
      default: "Food",
    },
    paidByMemberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    splitAmongMemberIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Member",
      },
    ],
    settledMemberIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Member",
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
    isSettled: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
    receiptUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const ExpenseModel = mongoose.model<ExpenseDocument>(
  "Expense",
  ExpenseSchema
);
