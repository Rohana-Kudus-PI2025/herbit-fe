// src/app/eco-enzyme/page.jsx - WITH AUTH PROTECTION
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useEcoEnzymeAPI from "@/hooks/useEcoEnzymeAPI";
import useAuth from "@/hooks/useAuth";
import EcoEnzymeCalculator from "@/components/ecoenzyme/EcoEnzymeCalculator";
import EcoEnzymeProgress from "@/components/ecoenzyme/EcoEnzymeProgress";
import EcoEnzymeSteps from "@/components/ecoenzyme/EcoEnzymeSteps";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ChatButton from "@/components/floating-chat/ChatButton";
import Link from "next/link";

export default function EcoEnzymePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const api = useEcoEnzymeAPI(user?._id || user?.id);
  const [newEntry, setNewEntry] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const handleAddEntry = (e) => {
    e.preventDefault();
    const weight = parseFloat(newEntry);
    if (isNaN(weight) || weight <= 0) {
      alert("Masukkan berat > 0");
      return;
    }

    api.addUpload(weight)
      .then(() => setNewEntry(""))
      .catch(err => alert("Gagal simpan data: " + (err?.message || err)));
  };

  const handleStartFermentation = async () => {
    if (api.totalWeightKg <= 0) {
      alert("Tambahkan sampah dulu!");
      return;
    }
    try {
      await api.startFermentation(api.totalWeightKg);
      // refetch to sync UI
      await api.refetch();
    } catch (err) {
      alert("Gagal mulai fermentasi: " + (err?.message || err));
    }
  };

  const tracker = React.useMemo(() => ({
    journalEntries: (api.uploads || []).map(u => ({
      id: u._id,
      date: new Date(u.uploadedDate).toLocaleDateString("id-ID"),
      weight: (u.prePointsEarned || 0) / 10 * 1000 // grams
    })),
    totalWeightKg: Number(api.totalWeightKg || 0),
    gula: api.gula,
    air: api.air,
    isFermentationActive: api.isFermentationActive,
    daysRemaining: api.daysRemaining,
    harvestDate: api.harvestDate,
    daysCompleted: api.daysCompleted,
    progressPct: api.progressPct,
    totalWeight: (api.totalWeightKg || 0) * 1000,
    totalFermentationDays: 90,
    newEntry,
    setNewEntry,
    addEntry: handleAddEntry,
    startFermentation: handleStartFermentation,
    resetAll: api.resetAll
  }), [api, newEntry]);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Memeriksa autentikasi...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Data loading state
  if (api.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Memuat data...</p>
      </div>
    );
  }

  // Error state
  if (api.error) {
    console.error("EcoEnzymePage error:", api.error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {(api.error && api.error.message) || String(api.error)}</p>
          <Button onClick={() => api.refetch()}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white p-2 sm:p-4 lg:p-6 pb-24">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col gap-2 sm:gap-3 pb-4 sm:pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => window.history.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Eco Enzyme</h1>
          </div>
          {api.isFermentationActive && (
            <Link href="/eco-enzyme/timeline" className="ml-8 sm:ml-14 mt-1">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white w-full sm:w-auto text-sm sm:text-base">
                Lihat Timeline <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
          <p className="text-xs sm:text-base text-amber-700 font-medium ml-8 sm:ml-14 mt-1">
            Yuk Ubah Sampah Dapur Jadi Cairan Ajaib 🌱
          </p>
        </div>

        <EcoEnzymeProgress {...tracker} />

        <div className="mt-4 sm:mt-6">
          <EcoEnzymeCalculator tracker={tracker} />
        </div>
        
        <div className="mt-6">
          <EcoEnzymeSteps />
        </div>
        
        <ChatButton />
      </div>
    </main>
  );
}