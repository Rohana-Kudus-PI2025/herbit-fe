"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const DEFAULT_SUMMARY = {
  user: null,
  progress: null,
  ecoenzym: null,
  rewardsBanners: [],
  habitsToday: [],
};

export function useHomeSummary(username) {
  const [data, setData] = useState(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (username) {
        params.set("username", username);
      }
      const response = await axios.get(
        `/api/summary/home${params.toString() ? `?${params.toString()}` : ""}`,
        {
          headers: { "Cache-Control": "no-cache" },
        }
      );
      setData({ ...DEFAULT_SUMMARY, ...response.data });
      setError(null);
    } catch (err) {
      let message = "Unknown error";
      if (axios.isAxiosError(err)) {
        const dataError = err.response?.data?.error;
        if (typeof dataError === "string") {
          message = dataError;
        } else if (typeof dataError?.details === "string") {
          message = dataError.details;
        } else if (typeof dataError?.message === "string") {
          message = dataError.message;
        } else if (err.message) {
          message = err.message;
        }
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const value = useMemo(
    () => ({
      summary: data,
      loading,
      error,
      refetch: fetchSummary,
    }),
    [data, loading, error, fetchSummary]
  );

  return value;
}

export default useHomeSummary;
