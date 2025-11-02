"use client";

import Link from "next/link";
import ProgressCardTracker from "@/components/tracker/progressCardTracker";
import DailyTasks from "@/components/tracker/taskTracker";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import WeeklyProgress from "@/components/tracker/weeklyProgress";

export default function Tracker() {
  return (
    <main className="min-h-screen space-y-3 pb-6bg-white-50 pb-24">
        
        {/* Header */}
        <div className="mx-4 flex flex-col gap-2 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg w-10 h-10 bg-white shadow-md hover:bg-gray-50 p-0 transition-transform duration-150 active:scale-95"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <h1 className="text-3xl font-bold text-gray-900">Tantangan Hari Ini</h1>
          </div>
          </div>

        <div className="mx-4 mt-4 flex items-center justify-between flex-wrap gap-2">

        {/* Tanggal di kiri */}
        <p className="text-[#FEA800] font-semibold text-sm">
        {(() => {
            const d = new Date();
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        })()}
        </p>


        {/* Tombol di kanan */}
        <Link href="/tracker/tree" >
            <Button className="bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center shadow-md transition-transform duration-150 active:scale-95 w-full sm:w-auto">
            Lihat Pohonmu
            <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
        </Link>
        </div>


          <p className="text-base text-amber-700 text-center font-medium mt-1">
            Yuk Ikuti Tantangan dan Hijaukan Pohonmu!
          </p>
        

        {/* Konten utama */}
        <div className="mt-6 space-y-4">
          <ProgressCardTracker />
          <DailyTasks />
          <WeeklyProgress />
        </div>
    </main>
  );
}
