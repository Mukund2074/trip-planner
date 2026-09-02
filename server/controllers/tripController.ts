import { Request, Response } from "express";
import { DEMO_TRIP_DEFAULTS } from "../constants/demoTrip";
import { TripModel } from "../models/Trip";

export const getTrips = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const tripList = await TripModel.find().sort({ createdAt: -1 });

    response.json({
      success: true,
      data: tripList,
    });
  } catch (fetchError) {
    console.error("Error fetching trips:", fetchError);
    response.status(500).json({
      success: false,
      message: "Failed to fetch trips",
    });
  }
};

export const getTripById = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { tripId } = request.params;

    const foundTrip = await TripModel.findById(tripId);
    if (!foundTrip) {
      response.status(404).json({
        success: false,
        message: "Trip not found",
      });
      return;
    }

    response.json({
      success: true,
      data: foundTrip,
    });
  } catch (fetchError) {
    console.error("Error fetching trip by ID:", fetchError);
    response.status(500).json({
      success: false,
      message: "Failed to fetch trip details",
    });
  }
};

export const createTrip = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const {
      title,
      subtitle,
      origin,
      destinations,
      startDate,
      endDate,
      coverImage,
    } = request.body;

    const newTrip = await TripModel.create({
      title: title || DEMO_TRIP_DEFAULTS.title,
      subtitle: subtitle || DEMO_TRIP_DEFAULTS.subtitle,
      origin: origin || DEMO_TRIP_DEFAULTS.origin,
      destinations: destinations || [...DEMO_TRIP_DEFAULTS.destinations],
      startDate: startDate ? new Date(startDate) : DEMO_TRIP_DEFAULTS.startDate,
      endDate: endDate ? new Date(endDate) : DEMO_TRIP_DEFAULTS.endDate,
      coverImage: coverImage || DEMO_TRIP_DEFAULTS.coverImage,
    });

    response.status(201).json({
      success: true,
      data: newTrip,
    });
  } catch (createError) {
    console.error("Error creating trip:", createError);
    response.status(500).json({
      success: false,
      message: "Failed to create trip",
    });
  }
};

export const updateTrip = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { tripId } = request.params;

    const updatedTrip = await TripModel.findByIdAndUpdate(
      tripId,
      { $set: request.body },
      { new: true, runValidators: true }
    );

    if (!updatedTrip) {
      response.status(404).json({
        success: false,
        message: "Trip not found",
      });
      return;
    }

    response.json({
      success: true,
      data: updatedTrip,
    });
  } catch (updateError) {
    console.error("Error updating trip:", updateError);
    response.status(500).json({
      success: false,
      message: "Failed to update trip",
    });
  }
};

export const deleteTrip = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { tripId } = request.params;

    const deletedTrip = await TripModel.findByIdAndDelete(tripId);
    if (!deletedTrip) {
      response.status(404).json({
        success: false,
        message: "Trip not found",
      });
      return;
    }

    response.json({
      success: true,
      message: "Trip deleted successfully",
    });
  } catch (deleteError) {
    console.error("Error deleting trip:", deleteError);
    response.status(500).json({
      success: false,
      message: "Failed to delete trip",
    });
  }
};
