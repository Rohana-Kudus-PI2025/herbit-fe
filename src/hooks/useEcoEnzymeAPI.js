"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchProjects,
  fetchUploadsByProject,
  createProject as createProjectLib,
  createUpload,
  claimPoints,
  startProject,
  deleteProject
} from "@/lib/ecoEnzyme";

const TOTAL_FERMENTATION_DAYS = 90;

export default function useEcoEnzymeAPI(userId) {
  const [project, setProject] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshStatus = useCallback(async (projId) => {
    try {
      // Update status if needed - this is optional
      console.log("Refreshing status for project:", projId);
    } catch (e) {
      console.warn("Status update failed (may not be due yet)");
    }
  }, []);

  const loadData = useCallback(async () => {
    console.log("🔄 [loadData] Starting data load for user:", userId);
    if (!userId) {
      console.log("[loadData] No user ID, clearing data.");
      setProject(null);
      setUploads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[loadData] Fetching projects...");
      const projects = await fetchProjects();
      const arr = Array.isArray(projects) ? projects : [];
      console.log(`[loadData] Found ${arr.length} projects.`);

      const latest = arr
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      const active =
        latest &&
        ["not_started", "ongoing", "completed"].includes(latest.status)
          ? latest
          : null;
      
      console.log("[loadData] Active project:", active ? active._id : "None");

      if (active) {
        await refreshStatus(active._id);
        console.log(`[loadData] Fetching uploads for project ${active._id}...`);
        const uploadsRes = await fetchUploadsByProject(active._id);
        const uploadsArr = Array.isArray(uploadsRes) ? uploadsRes : [];
        console.log(`[loadData] Found ${uploadsArr.length} uploads.`);

        setProject(active);
        setUploads(uploadsArr);
      } else {
        console.log("[loadData] No active project found. Clearing data.");
        setProject(null);
        setUploads([]);
      }
    } catch (err) {
      console.error("🔥 [loadData] Error:", err);
      setError(err);
      setProject(null);
      setUploads([]);
    } finally {
      console.log("[loadData] Finished data load.");
      setLoading(false);
    }
  }, [userId, refreshStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startFermentation = async () => {
    if (!project?._id) throw new Error("No project found");

    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + TOTAL_FERMENTATION_DAYS);

    try {
      const res = await startProject(project._id, { 
        startDate, 
        endDate: endDate.toISOString() 
      });

      await loadData();
      return res.project?._id || res._id;
    } catch (err) {
      console.error("🔥 startFermentation API Error:", err.response?.data || err);
      throw err;
    }
  };

  const calculateMonthNumber = () => {
    if (!project?.startDate) return 1;
    const start = new Date(project.startDate);
    const now = new Date();
    const diffDays = Math.floor((now - start) / 86400000);
    return Math.min(3, Math.floor(diffDays / 30) + 1);
  };

  const addUpload = async () => {
    if (!project?._id) throw new Error("Project not found");

    const res = await createUpload({
      ecoenzimProjectId: project._id,
      monthNumber: calculateMonthNumber(), // ✅ fix
      uploadedDate: new Date().toISOString(),
    });

    await loadData();
    return res?.upload || res;
  };

  const addUploadWithPhoto = async (photoUrl) => {
    if (!project?._id) throw new Error("Project not found");

    const res = await createUpload({
      ecoenzimProjectId: project._id,
      monthNumber: calculateMonthNumber(), // ✅ fix
      photoUrl,
      uploadedDate: new Date().toISOString(),
    });

    await loadData();
    return res?.upload || res;
  };

  const handleClaimPoints = async () => {
    if (!project?._id) throw new Error("Project not found");
    if (!project.canClaim) throw new Error("Upload belum lengkap untuk klaim");

    const res = await claimPoints(project._id);

    await loadData();
    return res;
  };

  const status = project?.status || "not_started";
  const isFermentationActive = status === "ongoing";
  const isClaimed = Boolean(project?.isClaimed);
  const canClaim = Boolean(project?.canClaim);

  const safeHarvestDate = project?.endDate ? new Date(project.endDate) : null;
  const daysRemaining = safeHarvestDate
    ? Math.max(0, Math.floor((safeHarvestDate - new Date()) / 86400000))
    : TOTAL_FERMENTATION_DAYS;

  const daysCompleted = TOTAL_FERMENTATION_DAYS - daysRemaining;
  const progressPct = Math.min(
    100,
    Math.round((daysCompleted / TOTAL_FERMENTATION_DAYS) * 100)
  );

  const totalWeightKg = Number(project?.organicWasteWeight || 0);
  const gula = Number(totalWeightKg > 0 ? (totalWeightKg / 3).toFixed(2) : 0);
  const air = Number(totalWeightKg > 0 ? (gula * 10).toFixed(2) : 0);

  const createProject = async (projectData) => {
    if (!userId) throw new Error("User not authenticated");
  
    const res = await createProjectLib({
      ...projectData,
      userId: userId
    });
  
    await loadData();
    return res;
  };

  const resetAll = async () => {
    if (!project?._id) {
      console.warn("[resetAll] No project to delete.");
      return;
    }

    console.log(`[resetAll] Attempting to delete project ${project._id}`);
    try {
      await deleteProject(project._id);
      console.log(`[resetAll] Project ${project._id} deleted successfully.`);
      await loadData();
    } catch (err) {
      console.error("🔥 [resetAll] API Error:", err.response?.data || err);
      throw err;
    }
  };

  return {
    project,
    uploads,
    loading,
    error,
    status,
    isFermentationActive,
    isClaimed,
    canClaim,
    progressPct,
    daysCompleted,
    daysRemaining,
    harvestDate: safeHarvestDate,
    totalWeightKg,
    gula,
    air,
    createProject,
    startFermentation,
    addUpload,
    addUploadWithPhoto,
    handleClaimPoints,
    resetAll, // Export the new function
    refetch: loadData
  };
}

