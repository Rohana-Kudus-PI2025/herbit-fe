"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link"; 
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft} from "lucide-react";
import { Check,  Lock, Camera, ChevronDown,  ChevronRight,  Trophy, CalendarCheck,  Users,  Zap } from "lucide-react";
import ChatbotButton from "@/components/floating-chat/ChatbotButton";

const APP_ID = "ecoenzyme-tracker-default";
const HARVEST_KEY = `ecoEnzymeHarvestDate_${APP_ID}`;
const POINTS_KEY = `ecoEnzymePoints_${APP_ID}`;
const PHOTOS_KEY = `ecoEnzymePhotos_ecoenzyme-tracker-default`;
const TIMELINE_KEY = "ecoEnzymeTimeline_ecoenzyme-tracker-default";
const FINAL_CLAIM_KEY = '__finalPointsClaimed';
const TOTAL_DAYS = 90;
const DAYS_PER_MONTH = 30;
const DAYS_PER_WEEK = 7;
const WEEKS = 13;
const POINTS_PER_MONTH = 50; 
const TOTAL_POINTS = 150; 

const checkFinalClaimConditions = (checkinsState, photosState) => {
    const isClaimed = checkinsState[FINAL_CLAIM_KEY] === true;
    
    let allCheckinsDone = true;
    for (let day = 1; day <= TOTAL_DAYS; day++) {
        
        if (!checkinsState[day] || !checkinsState[day].checked) {
            allCheckinsDone = false;
            break;
        }
    }
    
    const allPhotosUploaded = !!photosState['month1'] && !!photosState['month2'] && !!photosState['month3'];
    const isReady = allCheckinsDone && allPhotosUploaded;
    return { isReady, isClaimed, allCheckinsDone, allPhotosUploaded };
};

const placeholderData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

function startFromHarvestIso(harvestIso) {
    if (!harvestIso) return null;
    const harvest = new Date(harvestIso);
    const start = new Date(harvest);
    start.setDate(harvest.getDate() - TOTAL_DAYS);
    start.setHours(0, 0, 0, 0);
    return start;
}

function dayDateFromStart(startDate, dayIndex) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + (dayIndex - 1));
    d.setHours(0, 0, 0, 0);
    return d;
}

function dayIndexToMonth(dayIndex) {
    return Math.min(3, Math.ceil(dayIndex / DAYS_PER_MONTH)); // 1..3
}

function monthRange(month) {
    const start = (month - 1) * DAYS_PER_MONTH + 1;
    const end = Math.min(month * DAYS_PER_MONTH, TOTAL_DAYS);
    return { start, end };
}

function toLocalShort(d) {
    if (!d) return "-";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}
function toLocalFull(d) {
    if (!d) return "-";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function useToast() {
    const [toasts, setToasts] = useState([]);
    useEffect(() => {
        if (!toasts.length) return;
        const timers = toasts.map((t) =>
            setTimeout(() => {
                setToasts((prev) => prev.filter((pt) => pt.id !== t.id));
            }, t.duration || 3000)
        );
        return () => timers.forEach((t) => clearTimeout(t));
    }, [toasts]);
    const push = (msg, opts = {}) => {
        const id = Math.random().toString(36).slice(2, 9);
        setToasts((t) => [...t, { id, message: msg, ...opts }]);
    };
    const remove = (id) => setToasts((t) => t.filter((x) => x.id !== id));
    return { toasts, push, remove };
}

function ToastContainer({ toasts, remove }) {
    return (
        <div className="fixed right-4 bottom-6 z-50 flex flex-col gap-2">
            {toasts.map((t) => (
                <div key={t.id} className="bg-white shadow-lg rounded-lg px-4 py-2 border-l-4 border-purple-600 w-80">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-800">{t.message}</div>
                        <button className="text-xs text-gray-400 ml-2" onClick={() => remove(t.id)}>✕</button>
                    </div>
                </div>
            ))}
        </div>
    );
}


function getDominantMonth(startDay, endDay) {
    const monthRanges = [
        { month: 1, start: 1, end: DAYS_PER_MONTH },       // 1-30
        { month: 2, start: DAYS_PER_MONTH + 1, end: DAYS_PER_MONTH * 2 }, // 31-60
        { month: 3, start: DAYS_PER_MONTH * 2 + 1, end: TOTAL_DAYS }, // 61-90
    ];

    let maxDays = -1;
    let dominantMonth = 0;

    for (const range of monthRanges) {
        const overlapStart = Math.max(startDay, range.start);
        const overlapEnd = Math.min(endDay, range.end);
        const daysInMonth = Math.max(0, overlapEnd - overlapStart + 1);

        if (daysInMonth > maxDays) {
            maxDays = daysInMonth;
            dominantMonth = range.month;
        } else if (daysInMonth === maxDays) {
        }
    }
    return dominantMonth;
}

function DayItem({ dayData, currentDayIndex, photos, handleCheckin, handlePhotoUpload }) {
    const { dayIndex, date, label, unlocked, checked } = dayData;
    const isGasDay = dayIndex % 7 === 0; 
    const isPhotoDay = dayIndex === 30 || dayIndex === 60 || dayIndex === 90;
    
    const month = dayIndexToMonth(dayIndex);
    const monthPhotoKey = `month${month}`;
    const photoPresent = !!photos[monthPhotoKey];
    const isToday = dayIndex === currentDayIndex;
    
    let baseClass = "bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center justify-between transition-all duration-300 hover:shadow-lg";
    // Efek Pulse/Shine untuk Hari Ini (Jika belum check-in)
    if (isToday && unlocked && !checked) {
        baseClass += " border-2 border-purple-400 shadow-xl ring-2 ring-purple-200 ring-offset-2 animate-pulse-once"; // 'animate-pulse-once' butuh custom CSS
    }
    if (checked) {
        baseClass += " border-l-8 border-green-500 bg-green-50/50";
    }

    let LeftIcon;
    let iconClass = "w-6 h-6";
    let iconBgClass = "";
    
    if (checked) {
        LeftIcon = Check;
        iconClass += " text-white";
        iconBgClass = "bg-green-500";
    } else if (unlocked) {
        LeftIcon = isToday ? CalendarCheck : ChevronRight;
        iconClass += isToday ? " text-purple-600 animate-bounce" : " text-amber-500"; // Animasi pada icon hari ini
        iconBgClass = isToday ? "bg-purple-100 border border-purple-300" : "bg-amber-50 border border-amber-300";
    } else {
        LeftIcon = Lock;
        iconClass += " text-gray-400";
        iconBgClass = "bg-gray-100";
    }
    if (checked) {
        if (isPhotoDay) {
            LeftIcon = Camera;
            iconBgClass = "bg-purple-600";
            iconClass = "text-white w-6 h-6";
        } else if (isGasDay) {
            LeftIcon = Zap;
            iconBgClass = "bg-blue-500";
            iconClass = "text-white w-6 h-6";
        }
    }
    
    let StatusContent;
    
    if (isPhotoDay) {
        const photoLabel = photoPresent ? "Ganti Foto" : "Upload Foto";
        const isPhotoReady = unlocked; 

        StatusContent = (
            <label className={`cursor-pointer text-sm px-3 py-2 rounded-lg font-medium flex items-center gap-1 flex-shrink-0 transition-colors duration-300 ${isPhotoReady ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
                <Camera className="w-4 h-4" />
                <span>{photoLabel}</span>
                {isPhotoReady && (
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            handlePhotoUpload(month, file);
                        }}
                    />
                )}
            </label>
        );
    } else if (checked) {
        StatusContent = (
            <div className="flex items-center gap-2 text-green-600 flex-shrink-0 font-semibold">
                Selesai
                <Check className="w-5 h-5 animate-bounce-once"/>
            </div>
        );
    } else if (unlocked) {
        StatusContent = (
            <Button 
                onClick={() => handleCheckin(dayIndex)} 
                className={`px-4 py-2 text-sm h-auto font-semibold flex-shrink-0 transition-all duration-300 shadow-md ${isToday ? "bg-purple-600 text-white hover:bg-purple-700 ring-2 ring-purple-300 ring-offset-1" : "bg-amber-500 text-white hover:bg-amber-600"} hover:scale-[1.03] active:scale-[0.98]`} >
                Check-in
            </Button>
        );
    } else {
        StatusContent = (
            <div className="flex items-center text-xs text-gray-400 gap-1 flex-shrink-0">
                <Lock className="w-4 h-4" /> Terkunci
            </div>
        );
    }

    return (
        <div className={baseClass}>
            <div className="flex items-center gap-4">
                {/* Icon Circle yang Lebih Menonjol */}
                <div className={`w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 shadow ${iconBgClass}`}>
                    <LeftIcon className={iconClass} />
                </div>
                <div>
                    <div className="text-base font-bold text-gray-900">
                        {label}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                        {date ? toLocalShort(date) : "-"}
                    </div>
                </div>
            </div>
            {StatusContent}
        </div>
    );
}

export default function TimelinePage() {
    const [harvestIso, setHarvestIso] = useState(null);
    const [checkins, setCheckins] = useState({}); 
    const [photos, setPhotos] = useState({}); 
    const [points, setPoints] = useState(0);
    const [now, setNow] = useState(new Date());
    const [openWeeks, setOpenWeeks] = useState(() => new Set([0]));
    const toast = useToast();
    const handleFinalClaim = () => {
        const { isReady, isClaimed } = checkFinalClaimConditions(checkins, photos);
        if (isClaimed) {
            toast.push("Poin akhir sudah diklaim sebelumnya.", { duration: 3000 });
            return;
        }
        if (isReady) {
            setPoints(p => p + TOTAL_POINTS); 
            setCheckins(prev => ({
                ...prev,
                [FINAL_CLAIM_KEY]: true 
            }));
            toast.push(`🎉 Selamat! Anda mengklaim ${TOTAL_POINTS} Poin!`, { duration: 5000 });
        } else {
            toast.push("Syarat klaim belum terpenuhi. Selesaikan 90 hari check-in dan 3 foto bulanan.", { duration: 4000 });
        }
    };

    useEffect(() => {
        // Load data dari localStorage
        const h = localStorage.getItem(HARVEST_KEY);
        if (h) setHarvestIso(h);
        const t = JSON.parse(localStorage.getItem(TIMELINE_KEY) || "{}");
        setCheckins(t);
        const p = JSON.parse(localStorage.getItem(PHOTOS_KEY) || "{}");
        setPhotos(p);
        const pts = parseInt(localStorage.getItem(POINTS_KEY) || "0", 10);
        setPoints(isNaN(pts) ? 0 : pts);
        const interval = setInterval(() => setNow(new Date()), 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        localStorage.setItem(TIMELINE_KEY, JSON.stringify(checkins));
    }, [checkins]);
    useEffect(() => {
        localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
    }, [photos]);
    useEffect(() => {
        localStorage.setItem(POINTS_KEY, String(points));
    }, [points]);
    
    const startDate = useMemo(() => startFromHarvestIso(harvestIso), [harvestIso]);
    const currentDayIndex = useMemo(() => {
        if (!startDate) return 0;
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const normalizedStart = new Date(startDate);
        normalizedStart.setHours(0, 0, 0, 0);
        const diffMs = today.getTime() - normalizedStart.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 0;
        if (diffDays >= TOTAL_DAYS) return TOTAL_DAYS;
        return diffDays + 1;
    }, [startDate, now]);

    const activeWeekIndex = useMemo(() => {
        if (!currentDayIndex || currentDayIndex === 0) return 0;
        return Math.floor((currentDayIndex - 1) / DAYS_PER_WEEK);
    }, [currentDayIndex]);

    const isDayUnlocked = (dayIndex) => {
        if (!currentDayIndex) return false;
        return dayIndex <= currentDayIndex;
    };
    const harvestDate = harvestIso ? new Date(harvestIso) : null;
    
    const handleCheckin = (dayIndex) => {
        if (!isDayUnlocked(dayIndex)) {
            toast.push("Belum waktunya check-in untuk hari ini.", { duration: 2000 });
            return;
        }
        const nowIso = new Date().toISOString();
        setCheckins((prev) => {
            if (prev[dayIndex] && prev[dayIndex].checked) return prev;
            const next = { ...prev, [dayIndex]: { checked: true, at: nowIso } };
            return next;
        });
        toast.push("Check-in berhasil ✅", { duration: 2000 });
    };

    const handlePhotoUpload = (month, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            setPhotos((prev) => {
                const nextPhotos = ({ ...prev, [`month${month}`]: dataUrl });
                return nextPhotos;
            });
            toast.push(`Foto Bulanan (Bulan ${month}) tersimpan`, { duration: 2500 });
        };
        reader.readAsDataURL(file);
    };

    const resetAll = () => {
        if (!confirm("Reset semua data timeline, poin, dan foto?")) return;
        setHarvestIso(null);
        setCheckins({});
        setPhotos({});
        setPoints(0);
        localStorage.removeItem(HARVEST_KEY);
        localStorage.removeItem(TIMELINE_KEY);
        localStorage.removeItem(PHOTOS_KEY);
        localStorage.removeItem(POINTS_KEY);
        toast.push("Semua data direset", { duration: 1800 });
    };

    const weeks = [];
    for (let w = 0; w < WEEKS; w++) {
        const startDay = w * DAYS_PER_WEEK + 1;
        const days = [];
        for (let i = 0; i < DAYS_PER_WEEK; i++) {
            const dayIndex = startDay + i;
            if (dayIndex > TOTAL_DAYS) break;
            const date = startDate ? dayDateFromStart(startDate, dayIndex) : null;
            
            let label = `Hari ${dayIndex}: Check-in Rutin`;
            if (dayIndex % 7 === 0) {
                label = `Hari ${dayIndex}: Gas dikeluarkan`;
            }
            if (dayIndex === 30 || dayIndex === 60 || dayIndex === 90) {
                label = `Hari ${dayIndex}: Upload Foto Bulanan`;
            }

            const unlocked = isDayUnlocked(dayIndex);
            const checked = !!(checkins && checkins[dayIndex] && checkins[dayIndex].checked);
            days.push({ dayIndex, date, label, unlocked, checked });
        }
        weeks.push({
            weekIndex: w,
            startDay,
            endDay: Math.min(startDay + DAYS_PER_WEEK - 1, TOTAL_DAYS),
            days,
        });
    }

    const monthSummary = (month) => {
        const { start, end } = monthRange(month);
        let total = end - start + 1;
        let done = 0;
        for (let d = start; d <= end; d++) if (checkins[d] && checkins[d].checked) done++;
        return { start, end, total, done, pct: Math.round((done / total) * 100) || 0, photo: photos[`month${month}`] || null };
    };

    const totalDaysDone = Object.keys(checkins).filter((k) => /^\d+$/.test(k) && checkins[k] && checkins[k].checked).length;
    const overallPct = Math.round((totalDaysDone / TOTAL_DAYS) * 100) || 0;
    
    const { isReady: isReadyForClaim, isClaimed: isFinalClaimed, allCheckinsDone, allPhotosUploaded } = checkFinalClaimConditions(checkins, photos);

    if (!harvestIso) {
        return (
            <main className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <Card className="rounded-2xl shadow-lg border-2 border-purple-200">
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    {/* Tombol Square saat No Harvest ISO */}
                                    <Button variant="ghost" size="icon" className="rounded-lg bg-white shadow-md">
                                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                                    </Button>
                                    <h1 className="font-extrabold text-xl text-purple-600">Timeline Fermentasi</h1>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-gray-700">Timeline belum aktif karena belum ada proses fermentasi yang dimulai.</p>
                                    <p className="text-sm text-gray-500">Silakan mulai fermentasi Eco Enzyme Anda di halaman Eco Enzyme untuk mengaktifkan pelacakan 90 hari.</p>
                                    <Link href="/ecoenzyme"><Button className="bg-purple-600 text-white hover:bg-purple-700 w-full">Mulai Fermentasi Sekarang</Button></Link>
                                    <Button variant="ghost" onClick={resetAll} className="text-red-500 w-full">Reset Semua Data Local</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <ChatbotButton />
                <ToastContainer toasts={toast.toasts} remove={toast.remove} />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white-50 pb-24">
            <style jsx global>{`
                /* Tambahkan CSS untuk Animasi Sederhana */
                @keyframes pulse-once {
                    0%, 100% { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
                    50% { box-shadow: 0 10px 15px -3px rgba(168, 85, 247, 0.3), 0 4px 6px -4px rgba(168, 85, 247, 0.2); }
                }
                .animate-pulse-once {
                    animation: pulse-once 2s ease-in-out 1;
                }
                @keyframes bounce-once {
                    0%, 100% { transform: scale(1); }
                    25% { transform: scale(1.1); }
                    50% { transform: scale(0.95); }
                    75% { transform: scale(1.05); }
                }
                .animate-bounce-once {
                    animation: bounce-once 0.6s ease-out 1;
                }
            `}</style>
            <div className=""> 
                 <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
                {/* 1. HEADER & RINGKASAN POIN */}
                <div className="flex items-center gap-3">
                                    <Link href="/ecoenzyme">
                                        {/* Tombol Square pada Main Timeline */}
                                        <Button variant="ghost" size="icon" className="rounded-lg bg-white shadow-md hover:bg-gray-200 transition-transform hover:scale-[1.05]">
                                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                                        </Button>
                                    </Link>
                                    <h1 className="text-3xl font-extrabold text-gray-900">Timeline 90 Hari</h1>
                                </div>
                <Card className="rounded-2xl shadow-xl border border-gray-200 bg-white">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="space-y-1"> 
                                <div className="ml-12 space-y-1"> 
                                    <p className="text-sm text-gray-600">
                                        Mulai: <span className="font-bold text-amber-500">{toLocalFull(startDate)}</span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Panen: <span className="font-bold text-amber-500">{toLocalFull(harvestDate)}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Overall Progress Bar */}
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold text-gray-700">Progres Keseluruhan: {totalDaysDone}/{TOTAL_DAYS} Hari</span>
                                <span className="text-sm font-bold text-amber-500 transition-colors duration-500">{overallPct}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div className="h-3 bg-purple-600 transition-all duration-1000 ease-out" style={{ width: `${overallPct}%` }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                {/* 2. TIMELINE BULANAN & MINGGUAN */}
                <div className="space-y-6"> 
                    {[1, 2, 3].map((month) => {
                        const { start, end } = monthRange(month);
                        const monthWeeks = weeks.filter((w) => getDominantMonth(w.startDay, w.endDay) === month);
                        const summary = monthSummary(month);
                        
                        const accentColor = month === 1 ? 'bg-blue-600' : month === 2 ? 'bg-purple-600' : 'bg-green-600';
                        const accentLightColor = month === 1 ? 'bg-blue-50' : month === 2 ? 'bg-purple-50' : 'bg-green-50';
                        const accentTextColor = month === 1 ? 'text-blue-700' : month === 2 ? 'text-purple-700' : 'text-green-700';
                        const iconBgClass = month === 1 ? 'bg-blue-500' : month === 2 ? 'bg-purple-500' : 'bg-green-500';

                        return (
                            <section key={month}>
                                <Card className="rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                                    {/* Month Header - CardContent dengan Gradien Ringan */}
                                    <CardContent className={`p-5 ${accentLightColor} border-b-2 border-gray-100`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconBgClass} text-white font-extrabold text-xl shadow-md transition-transform duration-300 hover:rotate-6`}>
                                                    <Users className="w-7 h-7"/>
                                                </div>
                                                <div>
                                                    <div className={`text-xl font-extrabold ${accentTextColor}`}>Fase Bulan {month}</div>
                                                    <div className="text-sm text-gray-600">Hari {start} ({toLocalShort(dayDateFromStart(startDate, start))}) - {end}</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <div className="text-base font-bold text-gray-800">
                                                    {summary.done}/{summary.total} Hari
                                                </div>
                                                <div className="w-36">
                                                    <div className="w-full bg-gray-300 rounded-full h-2.5 overflow-hidden">
                                                        <div className={`h-2.5 ${accentColor} transition-all duration-1000 ease-out`} style={{ width: `${summary.pct}%` }} />
                                                    </div>
                                                    <div className="text-xs text-right text-gray-600 mt-1 font-bold">{summary.pct}%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>

                                    {/* Weeks Accordion */}
                                    <div className="p-4 bg-white space-y-3"> 
                                        {monthWeeks.map((w) => {
                                            const idx = w.weekIndex;
                                            const opened = openWeeks.has(idx);
                                            const doneCount = w.days.filter((d) => d.checked).length;
                                            const isCurrentWeek = w.weekIndex === activeWeekIndex;
                                            
                                            return (
                                                <div key={w.weekIndex} className="border border-gray-200 rounded-xl shadow-sm overflow-hidden bg-gray-50 hover:bg-white transition-all duration-300">
                                                    <div className="flex items-center justify-between">
                                                        <button
                                                            className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${opened ? 'bg-white' : ''} hover:bg-gray-100/70`}
                                                            onClick={() => {
                                                                const next = new Set(openWeeks);
                                                                if (opened) next.delete(idx);
                                                                else next.add(idx);
                                                                setOpenWeeks(next);
                                                            }}
                                                        >
                                                            {/* Weekly Number Icon */}
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm flex-shrink-0 shadow-md transition-all duration-300 ${
                                                                isCurrentWeek ? "bg-amber-500 text-white animate-pulse" : 
                                                                opened ? "bg-purple-600 text-white" : 
                                                                "bg-gray-200 text-gray-800"
                                                            }`}>
                                                                W{w.weekIndex + 1}
                                                            </div>

                                                            <div className="flex-1">
                                                                <div className="text-base font-bold text-gray-800">Minggu {w.weekIndex + 1}</div>
                                                                <div className="text-xs text-gray-500">{doneCount}/{w.days.length} hari selesai</div>
                                                            </div>
                                                            
                                                            {/* Status & Chevron */}
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-xs font-semibold text-amber-500">{isCurrentWeek ? "AKTIF" : ""}</div>
                                                                <div className={`p-1 rounded-full border bg-white transition-transform duration-300 ${opened ? 'rotate-180 border-gray-400' : 'border-gray-200'}`}>
                                                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                                                </div>
                                                            </div>
                                                        </button>
                                                    </div>

                                                    {/* Expanded Content dengan transisi sederhana */}
                                                    {/* Untuk transisi yang sebenarnya (collapse/expand), diperlukan CSS max-height atau library animasi */}
                                                    {opened && (
                                                        <div className="mt-2 ml-4 sm:ml-14 p-3 border-t border-gray-100 space-y-2 bg-white transition-all duration-500"> 
                                                            {w.days.map((d) => (
                                                                <DayItem
                                                                    key={d.dayIndex}
                                                                    dayData={d}
                                                                    currentDayIndex={currentDayIndex}
                                                                    photos={photos}
                                                                    handleCheckin={handleCheckin}
                                                                    handlePhotoUpload={handlePhotoUpload}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            </section>
                        );
                    })}
                </div>

                {/* 3. FINAL CLAIM SECTION (Poin Akhir) */}
                <div className="border-4 border-dashed border-amber-400 p-6 bg-white rounded-2xl shadow-2xl max-w-lg mx-auto mb-8 transition-all duration-500 hover:shadow-3xl">
                    <h3 className="font-extrabold text-2xl text-center text-amber-500 mb-4 flex items-center justify-center gap-2">
                        <Trophy className="w-7 h-7 fill-amber-500 text-amber-500 animate-spin-slow" /> Klaim Bonus Akhir {TOTAL_POINTS} Pts
                    </h3>
                    {isFinalClaimed ? (
                        <div className="text-center p-6 bg-green-50 border-2 border-green-500 rounded-xl animate-bounce-once">
                            <p className="font-extrabold text-green-700 text-2xl">SUKSES DIKLAIM! 🎉</p>
                            <p className="text-sm text-green-600 mt-2">Terima kasih telah menyelesaikan seluruh challenge 90 hari.</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-gray-700 mb-4 font-medium">
                                Selesaikan semua syarat di bawah ini untuk mengaktifkan tombol klaim:
                            </p>
                            <ul className="text-left mb-6 text-sm mx-auto w-fit space-y-3">
                                <li className={`flex items-center gap-2 transition-colors duration-300 ${allCheckinsDone ? 'text-green-600 font-semibold' : 'text-gray-600'}`}>
                                    {allCheckinsDone ? '✅' : '🔴'} Check-in 90 hari
                                </li>
                                <li className={`flex items-center gap-2 transition-colors duration-300 ${allPhotosUploaded ? 'text-green-600 font-semibold' : 'text-gray-600'}`}>
                                    {allPhotosUploaded ? '✅' : '🔴'} 3 Foto Bulanan (di hari 30, 60, & 90) di-upload
                                </li>
                            </ul>

                            <Button 
                                onClick={handleFinalClaim}
                                disabled={!isReadyForClaim}
                                className={`w-full py-3 text-lg font-bold transition-all duration-300 shadow-lg ${isReadyForClaim ? 'bg-purple-600 hover:bg-purple-700 hover:scale-[1.02] active:scale-[0.98]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} ${isReadyForClaim ? 'animate-pulse' : ''}`}
                            >
                                {isReadyForClaim ? `Klaim Semua ${TOTAL_POINTS} Pts Sekarang!` : `Syarat Belum Terpenuhi`}
                            </Button>
                        </div>
                    )}
                </div>

            </div>
            </div>
            <ChatbotButton />
            <ToastContainer toasts={toast.toasts} remove={toast.remove} />
        </main>
    );
}