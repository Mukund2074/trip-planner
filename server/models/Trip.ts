import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { DEMO_TRIP_DEFAULTS } from "../constants/demoTrip";

export interface TripDocument extends MongooseDocument {
  title: string;
  subtitle: string;
  origin: string;
  destinations: string[];
  startDate: Date;
  endDate: Date;
  coverImage: string;
  coverPublicId?: string;
  status: "planning" | "ongoing" | "completed";
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<TripDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: DEMO_TRIP_DEFAULTS.title,
    },
    subtitle: {
      type: String,
      required: true,
      trim: true,
      default: DEMO_TRIP_DEFAULTS.subtitle,
    },
    origin: {
      type: String,
      required: true,
      default: DEMO_TRIP_DEFAULTS.origin,
    },
    destinations: {
      type: [String],
      default: [...DEMO_TRIP_DEFAULTS.destinations],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    coverImage: {
      type: String,
      default: DEMO_TRIP_DEFAULTS.coverImage,
    },
    coverPublicId: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["planning", "ongoing", "completed"],
      default: "planning",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const TripModel = mongoose.model<TripDocument>("Trip", TripSchema);
