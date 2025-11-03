// src/hooks/useEcoEnzymeAPI.js - FINAL VERSION
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

  // Load data dari backend
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
      const projects = await fetchProjects(`?userId=${encodeURIComponent(userId)}`);
      const arr = Array.isArray(projects) ? projects : [];

      // Ambil project terbaru yang masih aktif (ongoing/not_started)
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

  // Load data saat mount atau userId berubah
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==================== PROJECT ACTIONS ====================

  /**
   * Mulai fermentasi (buat project baru)
   */
  const startFermentation = async (totalWeightKg) => {
    if (!userId) throw new Error("userId required");

    const now = new Date();
    const endDate = new Date(now.getTime() + TOTAL_FERMENTATION_DAYS * 24 * 60 * 60 * 1000);

    try {
      const res = await createProject({
        userId,
        organicWasteWeight: totalWeightKg,
        started: true,
        startedAt: now.toISOString(),
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        status: "ongoing",
        canClaim: false,
        prePointsEarned: 0,
        points: 0,
        isClaimed: false
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

  /**
   * Reset project (delete dan clear state)
   */
  const resetAll = async () => {
    if (!project?._id) return;
    
    try {
      // Optional: call delete API if you have one
      // await deleteProject(project._id);
      
      setProject(null);
      setUploads([]);
    } catch (err) {
      console.error("resetAll error:", err);
      throw err;
    }
  };

  // ==================== UPLOAD ACTIONS ====================

  /**
   * Tambah upload sampah organik (daily entry)
   */
  const addUpload = async (weightKg) => {
    try {
      let projId = project?._id;
      if (!projId) {
        projId = await startFermentation(weightKg);
      }

      const res = await createUpload({
        ecoenzimProjectId: projId,
        userId,
        uploadedDate: new Date().toISOString(),
        prePointsEarned: Math.max(1, Math.round(weightKg * 10)),
        monthNumber: null,
        photoUrl: null
      });

      const upload = res?.upload || res;
      setUploads(prev => [upload, ...prev]);
      
      // Refresh project data
      await loadData();
      
      return upload;
    } catch (err) {
      console.error("addUpload error:", err);
      throw err;
    }
  };

  /**
   * Upload foto bulanan dengan photo URL
   */
  const addUploadWithPhoto = async (weightKg, photoUrl, monthNumber) => {
    try {
      let projId = project?._id;
      if (!projId) {
        projId = await startFermentation(weightKg);
      }

      const res = await createUpload({
        ecoenzimProjectId: projId,
        userId,
        monthNumber,
        photoUrl,
        uploadedDate: new Date().toISOString(),
        prePointsEarned: 50
      });

      const upload = res?.upload || res;
      setUploads(prev => [upload, ...prev]);
      
      // Refresh project data
      await loadData();
      
      return upload;
    } catch (err) {
      console.error("addUploadWithPhoto error:", err);
      throw err;
    }
  };

  // ==================== CLAIM ACTIONS ====================

  /**
   * Claim poin akhir (untuk Timeline page)
   */
  const handleClaimPoints = async () => {
    if (!project?._id) throw new Error("Project not found");
    
    try {
      const res = await claimPoints(project._id);
      
      // Update local state
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

  // ==================== COMPUTED VALUES ====================

  const status = project?.status || (project?.started ? "ongoing" : "not_started");
  const isFermentationActive = status === "ongoing";
  const isClaimed = status === "completed" || Boolean(project?.isClaimed);
  const canClaim = Boolean(project?.canClaim);

  // Calculate harvest date
  const harvestDate = project?.endDate ? new Date(project.endDate) : null;
  const safeHarvestDate = harvestDate && !Number.isNaN(harvestDate.getTime()) ? harvestDate : null;
  
  // Calculate days remaining
  const daysRemaining = safeHarvestDate 
    ? Math.max(0, Math.floor((safeHarvestDate - new Date()) / (1000 * 60 * 60 * 24))) 
    : TOTAL_FERMENTATION_DAYS;
  
  const daysCompleted = TOTAL_FERMENTATION_DAYS - daysRemaining;
  const progressPct = Math.min(100, Math.round((daysCompleted / TOTAL_FERMENTATION_DAYS) * 100));

  // Calculate totals from uploads (only count daily uploads, not monthly photos)
  const dailyUploads = uploads.filter(u => !u.monthNumber);
  const totalPrePoints = dailyUploads.reduce((s, u) => s + (Number(u.prePointsEarned) || 0), 0);
  const totalWeightKg = dailyUploads.reduce((s, u) => s + ((Number(u.prePointsEarned) || 0) / 10), 0);

  // Calculate recipe (3:1:10 ratio)
  const gula = Number(totalWeightKg > 0 ? (totalWeightKg / 3).toFixed(2) : "0.00");
  const air = Number(totalWeightKg > 0 ? (((totalWeightKg / 3) * 10).toFixed(2)) : "0.00");

  // ==================== RETURN VALUES ====================

  return {
    // State
    project,
    uploads,
    loading,
    error,
    
    // Status
    status,
    isFermentationActive,
    isClaimed,
    canClaim,
    
    // Calculations
    totalWeightKg,
    gula,
    air,
    daysRemaining,
    daysCompleted,
    progressPct,
    harvestDate: safeHarvestDate,
    totalPrePoints,
    
    // Actions
    startFermentation,
    addUpload,
    addUploadWithPhoto,
    handleClaimPoints,
    resetAll,
    refetch: loadData
  };
}