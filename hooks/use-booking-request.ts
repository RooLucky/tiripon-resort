"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type {
  BookingRequestPayload,
  BookingResponse,
} from "@/lib/booking-types";

type BookingRequestState = {
  data: BookingResponse | null;
  error: string | null;
  isLoading: boolean;
};

export function useBookingRequest() {
  const [state, setState] = useState<BookingRequestState>({
    data: null,
    error: null,
    isLoading: false,
  });

  const createBooking = useCallback(async (payload: BookingRequestPayload) => {
    setState({ data: null, error: null, isLoading: true });

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");
      const result = isJson
        ? ((await response.json()) as BookingResponse | { error?: string })
        : null;

      if (!response.ok) {
        const message = result && "error" in result
          ? result.error
          : `Booking request failed (HTTP ${response.status}).`;

        if (response.status === 409) {
          toast.error("Cottage already taken", {
            description:
              message ??
              "A selected cottage has already been reserved for that date.",
          });
        }

        throw new Error(message ?? "Booking request failed.");
      }

      if (!result) {
        throw new Error("Server returned an invalid response format.");
      }

      setState({
        data: result as BookingResponse,
        error: null,
        isLoading: false,
      });

      return result as BookingResponse;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Booking request failed.";

      setState({
        data: null,
        error: message,
        isLoading: false,
      });

      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return {
    ...state,
    createBooking,
    reset,
  };
}
