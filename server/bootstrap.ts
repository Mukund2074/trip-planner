import { connectDatabase } from "./config/database";
import { DEMO_TRIP_DEFAULTS } from "./constants/demoTrip";
import { TripModel } from "./models/Trip";

let isBootstrapped = false;

export const bootstrapDatabase = async (): Promise<void> => {
  if (isBootstrapped) {
    return;
  }

  await connectDatabase();

  const existingTripsCount = await TripModel.countDocuments();
  if (existingTripsCount === 0) {
    await TripModel.create({
      title: DEMO_TRIP_DEFAULTS.title,
      subtitle: DEMO_TRIP_DEFAULTS.subtitle,
      origin: DEMO_TRIP_DEFAULTS.origin,
      destinations: [...DEMO_TRIP_DEFAULTS.destinations],
      startDate: DEMO_TRIP_DEFAULTS.startDate,
      endDate: DEMO_TRIP_DEFAULTS.endDate,
      coverImage: DEMO_TRIP_DEFAULTS.coverImage,
      status: "planning",
    });
    console.log("Initialized demo trip shell (no default members or expenses).");
  }

  isBootstrapped = true;
};
