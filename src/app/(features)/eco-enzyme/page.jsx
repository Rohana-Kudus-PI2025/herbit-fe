"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Plus, Trash2, Info, CheckCircle, Lock, Wind, Utensils, Droplet, Archive, ChevronRight } from "lucide-react"; 
import ChatbotButton from "@/components/floating-chat/ChatbotButton";
import Link from 'next/link';

const APP_ID = "ecoenzyme-shadcn";
const JOURNAL_KEY = `ecoEnzymeJournal_${APP_ID}`;
const HARVEST_KEY = `ecoEnzymeHarvestDate_${APP_ID}`;

export default function EcoEnzymePage() {
    const [journalEntries, setJournalEntries] = useState([]);
    const [newEntry, setNewEntry] = useState("");
    const [totalWeight, setTotalWeight] = useState(0);
    const [harvestDate, setHarvestDate] = useState(null);
    const [now, setNow] = useState(Date.now());
    
    // --- Hooks & Logic ---
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem(JOURNAL_KEY) || "[]");
        setJournalEntries(saved);
        setTotalWeight(saved.reduce((s, e) => s + (e.weight || 0), 0));
        const h = localStorage.getItem(HARVEST_KEY);
        if (h) setHarvestDate(new Date(h));
    }, []);
    useEffect(() => {
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(journalEntries));
        setTotalWeight(journalEntries.reduce((s, e) => s + (e.weight || 0), 0));
    }, [journalEntries]);
    useEffect(() => {
        if (harvestDate) localStorage.setItem(HARVEST_KEY, harvestDate.toISOString());
        else localStorage.removeItem(HARVEST_KEY);
    }, [harvestDate]);
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(t);
    }, []);

    const addEntry = (e) => {
        e.preventDefault();
        const val_kg = parseFloat(newEntry);
        if (isNaN(val_kg) || val_kg <= 0) return alert("Masukkan angka > 0");

        const weight_gram = val_kg * 1000;

        const entry = {
            id: Date.now(),
            date: new Date().toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
            weight: Number(weight_gram.toFixed(0)),
        };

        setJournalEntries((s) => [entry, ...s]);
        setNewEntry("");
    };

    const removeEntry = (id) => {
        if (!confirm("Hapus entri ini?")) return;
        setJournalEntries((s) => s.filter((x) => x.id !== id));
    };

    const startFermentation = () => {
        if (totalWeight <= 0) return alert("Tambahkan sampah dulu sebelum memulai fermentasi.");
        const h = new Date();
        h.setDate(h.getDate() + 90);
        setHarvestDate(h);
    };

    const resetAll = () => {
        if (!confirm("Reset semua data?")) return;
        setHarvestDate(null);
        setJournalEntries([]);
        localStorage.removeItem(JOURNAL_KEY);
        localStorage.removeItem(HARVEST_KEY);
    };

    const totalFermentationDays = 90;
    
    // Hari Tersisa: Selalu minimal 0
    const daysRemaining = useMemo(() => {
        if (!harvestDate) return null;
        const diff = harvestDate.getTime() - now;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }, [harvestDate, now]);

    const isFermentationActive = !!harvestDate;
    
    // Hari Selesai: Selalu minimal 0
    const daysCompleted = isFermentationActive 
        ? Math.max(0, totalFermentationDays - (daysRemaining ?? totalFermentationDays)) 
        : 0;
    
    // Progress Persentase
    const progressPct = isFermentationActive
        ? Math.round((daysCompleted / totalFermentationDays) * 100) 
        : 0;

    const totalWeightKg = totalWeight / 1000;
    const gula = totalWeight > 0 ? (totalWeightKg / 3).toFixed(2) : "0.00";
    const air = totalWeight > 0 ? ((totalWeightKg / 3) * 10).toFixed(2) : "0.00";
    
    const steps = [
        { icon: <Archive className="text-yellow-600" />, title: "Siapkan Wadah", desc: "Gunakan wadah plastik kedap udara (3/5 penuh). Hindari kaca karena akan menghasilkan gas." },
        { icon: <Droplet className="text-blue-500" />, title: "Campur Gula & Air", desc: "Masukkan air dan gula merah sesuai takaran (rasio 10:1). Lalu aduk hingga rata." },
        { icon: <Utensils className="text-green-600" />, title: "Masukkan Sampah", desc: "Tambahkan sisa buah/sayur mentah. (Rasio 3:1 terhadap gula). Hindari yang sudah dimasak atau berminyak." },
        { icon: <Lock className="text-orange-500" />, title: "Tutup & Simpan", desc: "Tutup rapat, beri label tanggal dan simpan di tempat yang sejuk dan gelap." },
        { icon: <Wind className="text-gray-500" />, title: "Lepas Gas", desc: "Pada minggu pertama, buka tutup wadah setiap hari untuk melepas gas fermentasi." },
        { icon: <CheckCircle className="text-purple-600" />, title: "Panen!", desc: "Setelah 90 hari (3 bulan) Eco Enzyme Anda siap digunakan!" },
    ];

    // --- JSX RENDER ---

    return (
        <main className="min-h-screen bg-white-50 pb-24">
            <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
                
                {/* Header */}
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-lg w-10 h-10 bg-white shadow-md hover:bg-gray-50 p-0 transition-transform duration-150 active:scale-95" 
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Eco Enzyme</h1>
                </div>

                {/* Tombol Lihat Timeline */}
                <div className="flex justify-start pt-1"> 
                    <Link href="eco-enzyme/timeline" passHref>
                        <Button 
                            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center shadow-md transition-transform duration-150 active:scale-95"
                        >
                            Lihat Timeline
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {/* Tagline */}
                <p className="text-sm text-amber-700 font-medium pt-2">
                    Yuk Ubah Sampah Dapur Jadi Cairan Ajaib 🌱
                </p>

                {/* Card progress fermentasi (SVG Ring) */}
                <Card className="bg-amber-100 shadow-lg border border-amber-200 mt-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                    <CardContent className="pt-5 pb-6 px-4">
                        <div className="flex items-center gap-5">

                            {/* 1. Kiri: Lingkaran Persentase (Progress Ring SVG) */}
                            <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                    {/* Background Circle */}
                                    <path
                                        className="text-amber-300"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3.8"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    {/* Progress Circle - Animasi Transisi */}
                                    <path
                                        className="text-gray-800 transition-all duration-1000 ease-out" 
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3.8"
                                        strokeDasharray={`${progressPct}, 100`}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                {/* Teks Persentase di Tengah */}
                                <span className="absolute text-xl font-bold text-gray-800">
                                    {progressPct}%
                                </span>
                            </div>

                            {/* 2. Kanan: Teks Status dan Hari */}
                            <div>
                                <h2 className="font-bold text-gray-900 text-2xl flex items-center gap-1">
                                    {isFermentationActive ? "Fermentasi Berjalan" : "Siap Fermentasi"} 
                                    {isFermentationActive && <span className="animate-bounce inline-block" role="img" aria-label="fire">🔥</span>} 
                                </h2>
                                <p className="text-base text-gray-700 mt-1">
                                    {isFermentationActive
                                        ? `Telah berjalan ${daysCompleted} hari dari 90 hari`
                                        : `Terkumpul: ${totalWeightKg.toFixed(2)} Kg sampah organik`
                                    }
                                </p>
                            </div>

                        </div>
                    </CardContent>
                </Card>

                {/* Journal + Calculator + Timer (3 Kolom Grid) */}
                <div className="grid lg:grid-cols-3 gap-6 mt-6">
                    
                    {/* 1. Jurnal Sampah Organik (Kolom 1) */}
                    <Card className="lg:col-span-1 transition-shadow duration-300 hover:shadow-xl hover:scale-[1.02]">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold mb-2 text-gray-800 text-center">Jurnal Sampah Organik</h3>
                            <p className="text-sm text-gray-500 mb-4 text-center">
                                Catat sampah organikmu
                            </p>

                            {isFermentationActive ? (
                             
                                <div className="p-3 bg-amber-100 border border-amber-200 text-amber-800 rounded-lg mb-4 text-sm flex items-start gap-2">
                                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span className="flex-grow">
                                        Fermentasi sudah berjalan. Tidak bisa menambah sampah baru.
                                    </span>
                                </div>
                            ) : (
                          
                                <form onSubmit={addEntry} className="grid grid-cols-2 gap-3 mb-4 items-center">
                                    
                                    {/* Kolom 1: Input Berat */}
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="new-entry" className="text-sm text-gray-700 font-medium">
                                            Berat hari ini (Kg)
                                        </label>
                                        <Input
                                            id="new-entry"
                                            type="number"
                                            step="0.01"
                                            value={newEntry}
                                            onChange={(e) => setNewEntry(e.target.value)}
                                            placeholder="0.00"
                                            className="border-amber-300 focus:ring-amber-500"
                                        />
                                    </div>
                                    
                                    {/* Kolom 2: Tombol Tambah (Sempit dan Rata Kanan) */}
                                    <div className="flex justify-end self-end"> 
                                        <Button 
                                            type="submit" 
                                            className="bg-amber-500 hover:bg-amber-600 text-white h-10 shadow-md transition-transform duration-150 active:scale-95"
                                        >
                                            <Plus className="w-4 h-4 mr-1" /> Tambah
                                        </Button>
                                    </div>
                                </form>
                            )}
                            
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm text-gray-600">
                                    Total terkumpul: <b>{totalWeightKg.toFixed()} Kg</b>
                                </p>
                                <Button onClick={resetAll} variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                                    <Trash2 className="w-4 h-4 mr-1"/> Reset
                                </Button>
                            </div>
                            
                            {/* Riwayat Jurnal (dengan scroll) */}
                            <ul className="divide-y max-h-48 overflow-y-auto border rounded-md">
                                {journalEntries.map((e) => (
                                    <li key={e.id} className="py-2 px-3 flex justify-between items-center hover:bg-gray-50">
                                        <span className="text-gray-700 text-sm">
                                            {e.date}:
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <b className="text-sm">{((e.weight || 0) / 1000).toFixed()} Kg</b>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* 2. Kebutuhan Resep (Kolom 2) */}
                    <Card className="lg:col-span-1 transition-shadow duration-300 hover:shadow-xl hover:scale-[1.02]">
                        <CardContent className="p-6 h-full flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold mb-4 text-gray-800 text-center">Kebutuhan Resep (1:3:10)</h3>
                                <div className="grid grid-cols-3 text-center gap-4 border p-4 rounded-lg bg-gray-50">
                                    <div>
                                        <p className="text-sm text-gray-500">Sampah</p>
                                        <p className="text-xl font-bold text-gray-800">{totalWeightKg.toFixed()} Kg</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Gula</p>
                                        <p className="text-xl font-bold text-gray-800">{gula} Kg</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Air</p>
                                        <p className="text-xl font-bold text-gray-800">{air} L</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Tombol Mulai Fermentasi */}
                            {!isFermentationActive && totalWeight > 0 && (
                                <Button
                                    onClick={startFermentation}
                                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 mt-4 shadow-md transition-transform duration-150 active:scale-95"
                                >
                                    Mulai Fermentasi
                                </Button>
                            )}

                        </CardContent>
                    </Card>
                    
                    {/* 3. Fermentation Timer (Kolom 3) */}
                    <Card className="lg:col-span-1 transition-shadow duration-300 hover:shadow-xl hover:scale-[1.02]">
                        <CardContent className="p-6 text-center h-full flex flex-col justify-center">
                            {harvestDate ? (
                                <div className="py-4">
                                    <h3 className="font-bold text-gray-800 text-lg mb-2">Fermentasi Sedang Berjalan</h3>
                                    <p className="text-5xl font-extrabold text-amber-600">{daysRemaining}</p>
                                    <p className="text-base text-gray-500 mb-3">Hari Tersisa</p>
                                    <p className="text-sm text-gray-700">
                                        Target Panen:{" "}
                                        {harvestDate.toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                    {/* Tombol Reset Sempit dan Tengah */}
                                    <div className="flex justify-center">
                                        <Button
                                            onClick={resetAll}
                                            className="mt-4 bg-red-500 hover:bg-red-600 text-white transition-transform duration-150 active:scale-95"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1"/> Reset Data
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 py-6">
                                    Tekan 'Mulai Fermentasi' di kolom resep setelah sampah terkumpul.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                 {/* Langkah Pembuatan Eco Enzyme (Daftar Vertikal Card) */}
                <div className="mt-8">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold mb-6 text-gray-900 text-center">
                                Langkah Pembuatan Eco Enzyme
                            </h3>
                            
                            <div className="space-y-4"> 
                                {steps.map((s, i) => (
                                    
                                    <div key={i} className="flex gap-4 items-start p-4 bg-white border border-gray-200 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.01] cursor-pointer group">
                                        
                                        {/* 1. Kiri: Ikon Besar - Animasi Hover */}
                                        <div className="text-4xl flex-shrink-0 pt-1 transition-transform duration-300 group-hover:scale-110">
                                            {s.icon} 
                                        </div>

                                        {/* 2. Kanan: Judul dan Deskripsi */}
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800">
                                                {i + 1}. {s.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 mt-0.5">
                                                {s.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <ChatbotButton />
            </div>
        </main>
    );
}