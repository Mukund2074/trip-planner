import serverless from "serverless-http";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { bootstrapDatabase } from "../../server/bootstrap";
import { createApp } from "../../server/app";

let apiHandler: ReturnType<typeof serverless> | null = null;

const normalizeEventPath = (event: HandlerEvent): HandlerEvent => {
  const querySuffix = event.rawQuery ? `?${event.rawQuery}` : "";

  if (event.path.startsWith("/.netlify/functions/api")) {
    const restoredPath =
      event.path.replace("/.netlify/functions/api", "/api") || "/api";
    return { ...event, path: `${restoredPath}${querySuffix}` };
  }

  if (event.rawUrl?.startsWith("/api")) {
    const rawPath = event.rawUrl.split("?")[0];
    return { ...event, path: `${rawPath}${querySuffix}` };
  }

  return event;
};

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!apiHandler) {
    await import("../../server/config/env");
    await bootstrapDatabase();
    apiHandler = serverless(createApp());
  }

  const normalizedEvent = normalizeEventPath(event);
  return apiHandler(normalizedEvent, context) as ReturnType<Handler>;
};
