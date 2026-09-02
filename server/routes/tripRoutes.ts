import { Router } from "express";
import {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
} from "../controllers/tripController";

const tripRouter = Router();

tripRouter.get("/", getTrips);
tripRouter.post("/", createTrip);
tripRouter.get("/:tripId", getTripById);
tripRouter.put("/:tripId", updateTrip);
tripRouter.delete("/:tripId", deleteTrip);

export { tripRouter };
