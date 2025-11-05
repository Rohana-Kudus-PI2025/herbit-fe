"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchProjects,
  fetchUploadsByProject,
  createProject,
  createUpload,
  claimPoints
} from "@/lib/ecoEnzyme";

const TOTAL_FERMENTATION_DAYS = 90;

/**
 * Custom hook untuk manage Eco Enzyme project & uploads
 * @param {string} userId - User ID dari auth session
 */
export default function useEcoEnzymeAPI(userId) {
  const [project, setProject] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setProject(null);
      setUploads([]);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const projects = await fetchProjects();
      const arr = Array.isArray(projects) ? projects : [];
      const latest = arr
        .slice()
        .sort((a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0))[0];
      const active = latest && (latest.status === "ongoing" || latest.started || latest.status === "not_started") ? latest : null;
      if (active) {
        setProject(active);
        const ups = await fetchUploadsByProject(active._id);
        setUploads(Array.isArray(ups) ? ups : []);
      } else {
        setProject(null);
        setUploads([]);
      }
    } catch (err) {
      console.error("useEcoEnzymeAPI.loadData error:", err);
      setError(err);
      setProject(null);
      setUploads([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  const startFermentation = async (totalWeightKg) => {
    if (!userId) throw new Error("userId required");
    const now = new Date();
    const endDate = new Date(now.getTime() + TOTAL_FERMENTATION_DAYS * 24 * 60 * 60 * 1000);
    try {
      const res = await createProject({
        organicWasteWeight: totalWeightKg,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
      });

      const proj = res?.project || res;
      setProject(proj);
      setUploads([]);
      return proj._id;
    } catch (err) {
      console.error("startFermentation error:", err);
      throw err;
    }
  };

  const resetAll = async () => {
    if (!project?._id) return;
    try {
      setProject(null);
      setUploads([]);
    } catch (err) {
      console.error("resetAll error:", err);
      throw err;
    }
  };

  const addUpload = async (weightKg) => {
    try {
      let projId = project?._id;
      if (!projId) {
        projId = await startFermentation(weightKg);
      }

      const res = await createUpload({
        ecoenzimProjectId: projId,
        uploadedDate: new Date().toISOString(),
        monthNumber: null,
        photoUrl: null
      });

      const upload = res?.upload || res;
      setUploads(prev => [upload, ...prev]);
      await loadData();
      return upload;
    } catch (err) {
      console.error("addUpload error:", err);
      throw err;
    }
  };

  const addUploadWithPhoto = async (photoUrl, monthNumber) => {
    try {
      let projId = project?._id;
      if (!projId) {
        throw new Error("No active project");
      }

      const res = await createUpload({
        ecoenzimProjectId: projId,
        monthNumber,
        photoUrl,
        uploadedDate: new Date().toISOString(),
      });

      const upload = res?.upload || res;
      setUploads(prev => [upload, ...prev]);
      await loadData();
      return upload;
    } catch (err) {
      console.error("addUploadWithPhoto error:", err);
      throw err;
    }
  };

  const handleClaimPoints = async () => {
    if (!project?._id) throw new Error("Project not found");
    
    try {
      const res = await claimPoints(project._id);
      setProject(prev => prev ? ({
        ...prev,
        status: "completed",
        isClaimed: true,
        points: res.points || prev.points,
        claimedAt: new Date().toISOString()
      }) : prev);
      
      return res;
    } catch (err) {
      console.error("handleClaimPoints error:", err);
      throw err;
    }
  };

  const status = project?.status || (project?.started ? "ongoing" : "not_started");
  const isFermentationActive = status === "ongoing";
  const isClaimed = status === "completed" || Boolean(project?.isClaimed);
  const canClaim = Boolean(project?.canClaim);
  const harvestDate = project?.endDate ? new Date(project.endDate) : null;
  const safeHarvestDate = harvestDate && !Number.isNaN(harvestDate.getTime()) ? harvestDate : null;
  const daysRemaining = safeHarvestDate 
    ? Math.max(0, Math.floor((safeHarvestDate - new Date()) / (1000 * 60 * 60 * 24))) 
    : TOTAL_FERMENTATION_DAYS;
  
  const daysCompleted = TOTAL_FERMENTATION_DAYS - daysRemaining;
  const progressPct = Math.min(100, Math.round((daysCompleted / TOTAL_FERMENTATION_DAYS) * 100));
  const totalWeightKg = Number(project?.organicWasteWeight || 0);
  const totalPrePoints = Number(project?.prePointsEarned || 0);
  const gula = Number(totalWeightKg > 0 ? (totalWeightKg / 3).toFixed(2) : "0.00");
  const air = Number(totalWeightKg > 0 ? (((totalWeightKg / 3) * 10).toFixed(2)) : "0.00");
  return {
    project,
    uploads,
    loading,
    error,
    status,
    isFermentationActive,
    isClaimed,
    canClaim,
    totalWeightKg,
    gula,
    air,
    daysRemaining,
    daysCompleted,
    progressPct,
    harvestDate: safeHarvestDate,
    totalPrePoints,
    startFermentation,
    addUpload,
    addUploadWithPhoto,
    handleClaimPoints,
    resetAll,
    refetch: loadData
  };
}