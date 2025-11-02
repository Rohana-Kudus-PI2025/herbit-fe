"use client";

import Link from "next/link";
import Tree from "@/components/tracker/tree";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function YourTree() {
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


        {/* Konten utama */}
        <div className="mt-6 space-y-4">
          <Tree />
        </div>
    </main>
  );
}
