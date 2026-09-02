export const DEMO_TRIP_DEFAULTS = {
  title: "Weekend Getaway",
  subtitle: "Home City → Stopover → Destination → Home City",
  origin: "Home City",
  destinations: ["Stopover", "Destination"],
  startDate: new Date("2026-06-01T00:00:00.000Z"),
  endDate: new Date("2026-06-04T00:00:00.000Z"),
  coverImage:
    "https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=1600&q=80",
} as const;
