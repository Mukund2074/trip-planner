import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Trip } from "../types";
import { apiClient } from "../lib/api";

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "info" | "error";
}

interface TripContextType {
  currentTrip: Trip | null;
  tripList: Trip[];
  isLoadingTrip: boolean;
  refreshTrip: () => Promise<void>;
  toasts: ToastMessage[];
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  removeToast: (toastId: string) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [tripList, setTripList] = useState<Trip[]>([]);
  const [isLoadingTrip, setIsLoadingTrip] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: "success" | "info" | "error" = "success") => {
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((previousToasts) => [...previousToasts, { id: uniqueId, message, type }]);

      setTimeout(() => {
        setToasts((currentToasts) =>
          currentToasts.filter((toastItem) => toastItem.id !== uniqueId)
        );
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((toastId: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toastItem) => toastItem.id !== toastId)
    );
  }, []);

  const fetchTrips = useCallback(async () => {
    setIsLoadingTrip(true);
    try {
      const responseResult = await apiClient.get("/trips");
      if (responseResult.data.success && responseResult.data.data.length > 0) {
        const fetchedTrips = responseResult.data.data;
        setTripList(fetchedTrips);
        setCurrentTrip(fetchedTrips[0]);
      }
    } catch (fetchError) {
      console.error("Failed to load trips:", fetchError);
      showToast("Unable to connect to trip server", "error");
    } finally {
      setIsLoadingTrip(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  return (
    <TripContext.Provider
      value={{
        currentTrip,
        tripList,
        isLoadingTrip,
        refreshTrip: fetchTrips,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = (): TripContextType => {
  const tripContext = useContext(TripContext);
  if (!tripContext) {
    throw new Error("useTrip must be used within a TripProvider");
  }
  return tripContext;
};
