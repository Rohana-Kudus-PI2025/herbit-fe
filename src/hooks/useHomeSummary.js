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
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? err.message
        : err instanceof Error
        ? err.message
        : "Unknown error";
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
