import express from "express";
import cors from "cors";
import { CLIENT_URL } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { tripRouter } from "./routes/tripRoutes";
import { memberTripRouter, memberItemRouter } from "./routes/memberRoutes";
import { expenseTripRouter, expenseItemRouter } from "./routes/expenseRoutes";
import { checklistTripRouter, checklistItemRouter } from "./routes/checklistRoutes";

export const createApp = (): express.Application => {
  const app = express();

  app.use(
    cors({
      origin: CLIENT_URL,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_request, response) => {
    response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "Trip Planner API",
    });
  });

  app.use("/api/trips", tripRouter);
  app.use("/api/trips/:tripId/members", memberTripRouter);
  app.use("/api/members", memberItemRouter);
  app.use("/api/trips/:tripId/expenses", expenseTripRouter);
  app.use("/api/expenses", expenseItemRouter);
  app.use("/api/trips/:tripId/checklist", checklistTripRouter);
  app.use("/api/checklist", checklistItemRouter);

  app.use(errorHandler);

  return app;
};
