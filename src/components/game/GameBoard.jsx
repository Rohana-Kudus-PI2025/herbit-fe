"use client";

import Image from "next/image";
import kitchen from "@/assets/kitchen.jpg";
import trashData from "@/data/trash";
import { List, Share2 } from "lucide-react";
import CongratsModal from "./CongratsModal";

import {
  DndContext,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GAME_KEY, ITEM_H_REM, FLOOR_CLEAR_REM } from "@/constants/game";
import { ymd } from "@/lib/date";
import { safeLoad, safeSave } from "@/lib/storage";
import { rngFromSeed } from "@/lib/random";
import useAudioPool from "@/hooks/useAudioPool";
import useDailyStreak from "@/hooks/useDailyStreak";
import useFunFact from "@/hooks/useFunFact";
import useSharePayload from "@/hooks/useSharePayload";

import Trash from "./Trash";
import Bin from "./Bin";
import ShareSheet from "./ShareSheet";
import HintsOverlay from "./HintsOverlay";

function initRandomTrash(seed = ymd()) {
  const rand = rngFromSeed(seed);
  return trashData.map((t) => {
    const x = 6 + rand() * 88;
    const y = 100 + rand() * 5;
    return {
      ...t,
      x: `${x}%`,
      y: `calc(${y}% - ${ITEM_H_REM + FLOOR_CLEAR_REM}rem)`,
    };
  });
}

export default function GameBoard() {
  const [trash, setTrash] = useState([]);
  const [shakeBin, setShakeBin] = useState(null);
  const [shakeItemId, setShakeItemId] = useState(null);
  const [openHints, setOpenHints] = useState(false);
  const [today, setToday] = useState(ymd());
  const [openCongrats, setOpenCongrats] = useState(false);
  const [resetSalt, setResetSalt] = useState(0);
  const { streak, setStreak, bumpIfNewDay } = useDailyStreak();
  const { factData, fetchFunFact, loading } = useFunFact();

  const { soundOn, setSoundOn, audioUnlocked, unlockOnce, playOk, playMiss } =
    useAudioPool({});
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const {
    openShare,
    setOpenShare,
    setSharePayload,
    openShareSheet,
    shareTwitter,
    shareWhatsApp,
    shareTelegram,
    copyText,
  } = useSharePayload({ streak, factData });
  const makeSeed = (day, salt = 0) => `${day}#${salt}`;

  const refreshForNewDay = useCallback((dayStr, salt = 0) => {
    const init = initRandomTrash(makeSeed(dayStr, salt));
    setTrash(init);
    setResetSalt(salt);
    safeSave(GAME_KEY, { day: dayStr, trash: init, resetSalt: salt });
  }, []);

  const handleToolbarShare = () => {
    const pageUrl = window.location.href;
    const payload = {
      line1: `Aku sudah konsisten memilah & membuang sampah ${streak} hari beruntun di GreenCycle.`,
      combined: `Aku sudah konsisten memilah & membuang sampah ${streak} hari beruntun di GreenCycle.\n\n${pageUrl}`,
      tweet: `Aku sudah konsisten memilah & membuang sampah ${streak} hari beruntun di GreenCycle.`,
      pageUrl,
    };
    setSharePayload(payload);
    setOpenShare(true);
  };

  useEffect(() => {
    const d = ymd();
    setToday(d);
    const saved = safeLoad(GAME_KEY);
    if (saved?.day === d && saved?.trash) setTrash(saved.trash);
    else refreshForNewDay(d);
    if (saved?.day === d && saved?.trash) {
      setTrash(saved.trash);
      setResetSalt(saved.resetSalt ?? 0);
    } else {
      refreshForNewDay(d, 0);
    }
  }, [refreshForNewDay]);

  useEffect(() => {
    if (!trash) return;
    safeSave(GAME_KEY, { day: today, trash, resetSalt });
  }, [trash, today, resetSalt]);

  useEffect(() => {
    const tick = () => {
      const now = ymd();
      if (now !== today) {
        setToday(now);
        refreshForNewDay(now, 0);
      }
    };
    const id = setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    window.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
      window.removeEventListener("visibilitychange", tick);
    };
  }, [today, refreshForNewDay]);

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;
    const target = over.id;
    const cat = active?.data?.current?.category;

    if (cat === target) {
      playOk();
      setTrash((prev) => {
        const next = prev.filter((t) => t.id !== active.id);
        bumpIfNewDay();

        if (next.length === 0) {
          fetchFunFact();
          setOpenCongrats(true);
        }
        return next;
      });
    } else {
      playMiss();
      setShakeBin(target);
      setShakeItemId(active.id);
      setTimeout(() => {
        setShakeBin(null);
        setShakeItemId(null);
      }, 350);
    }
  };

  const resetAll = () => {
    const d = ymd();
    const nextSalt = resetSalt + 1;
    const init = initRandomTrash(makeSeed(d, nextSalt));
    setTrash(init);
    setResetSalt(nextSalt);
    safeSave(GAME_KEY, { day: d, trash: init, resetSalt: nextSalt });
  };

  const handleOpenShareFromCongrats = async () => {
    const payload = await (async () => {
      const p = await (async () => {
        const pageUrl = window.location.href;
        const line1 = `Aku sudah konsisten memilah & membuang sampah ${streak} hari beruntun di GreenCycle.`;
        const line2 = `Fun fact: ${factData.fact}`;
        const line3 = `— ${factData.source}`;
        const combined = [line1, line2, line3, "", pageUrl].join("\n");
        const tweet = `${line1}\n${line2}\n${line3}`;
        return { line1, line2, line3, combined, tweet, pageUrl };
      })();
      return p;
    })();
    setSharePayload(payload);
    setOpenShare(true);
    setOpenCongrats(false);
  };

  return (
    <div
      className="fixed inset-0 h-dvh w-dvw overflow-hidden"
      onPointerDown={unlockOnce}
    >
      <Image
        src={kitchen}
        alt="kitchen"
        fill
        priority
        className="object-cover object-bottom"
        draggable={false}
      />

      <div className="absolute inset-0 z-10 flex flex-col items-center gap-3">
        <div className="mt-2 w-full">
          <div className="relative h-14 rounded px-3">
            <div className="absolute left-4 top-1/2 -translate-y-6 z-20 flex flex-col gap-3 ">
              <button
                onClick={() => setOpenHints((v) => !v)}
                aria-label="Buka Hints"
                className="inline-flex items-center justify-center w-10 h-10 cursor-pointer rounded-full bg-amber-100 border border-amber-300 text-stone-700 shadow hover:bg-amber-200 active:scale-95 transition"
              >
                <List className="w-5 h-5" />
              </button>

              <button
                onClick={handleToolbarShare}
                className="inline-flex items-center justify-center w-10 h-10 cursor-pointer rounded-full bg-blue-100 border border-blue-300 text-blue-700 shadow hover:bg-blue-200 active:scale-95 transition"
              >
                <Share2 />
              </button>

              <button
                onClick={() => setSoundOn((v) => !v)}
                aria-label="Toggle sound"
                title={soundOn ? "Sound ON" : "Sound OFF"}
                className="inline-flex items-center justify-center w-10 h-10 cursor-pointer rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 shadow hover:bg-emerald-200 active:scale-95 transition"
              >
                {soundOn ? "🔊" : "🔇"}
              </button>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="pixel text-white pixel-bg">
                🔥 Streak: {streak}
              </span>
            </div>

            <div className="flex items-center justify-between h-full">
              <div className="w-12 sm:w-36" />
              <button
                onClick={resetAll}
                className="pixel pixel-btn blue cursor-pointer rounded px-3 py-1 text-xs md:text-base bg-white/20 hover:bg-white/30"
              >
                Play!
              </button>
            </div>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragEnd={handleDragEnd}
        >
          <div className="relative w-[92vw] max-w-[900px] h-[82vh] sm:h-[78vh] md:h-[80vh] select-none touch-none">
            {/* BINS */}
            <div className="absolute inset-x-0 bottom-3 sm:bottom-4 z-10 flex items-end justify-center gap-3 sm:gap-4 md:gap-6">
              <Bin
                id="red"
                src="/bins/red.png"
                label="Merah"
                isShaking={shakeBin === "red"}
              />
              <Bin
                id="green"
                src="/bins/green.png"
                label="Hijau"
                isShaking={shakeBin === "green"}
              />
              <Bin
                id="yellow"
                src="/bins/yellow.png"
                label="Kuning"
                isShaking={shakeBin === "yellow"}
              />
              <Bin
                id="blue"
                src="/bins/blue.png"
                label="Biru"
                isShaking={shakeBin === "blue"}
              />
            </div>

            {/* TRASH */}
            {trash.map((t) => (
              <Trash
                key={t.id}
                item={t}
                style={{ left: t.x, top: t.y }}
                isShaking={shakeItemId === t.id}
              />
            ))}
          </div>
        </DndContext>
      </div>

      <HintsOverlay open={openHints} onClose={() => setOpenHints(false)} />

      <ShareSheet
        open={openShare}
        onClose={() => setOpenShare(false)}
        onTwitter={shareTwitter}
        onWhatsApp={shareWhatsApp}
        onTelegram={shareTelegram}
        onCopy={copyText}
      />

      {openCongrats && (
        <CongratsModal
          streak={streak}
          factData={factData}
          loading={loading}
          onClose={() => setOpenCongrats(false)}
          onShare={handleOpenShareFromCongrats}
          onNext={() => {
            setOpenCongrats(false);
            const d = ymd();
            const nextSalt = resetSalt + 1;
            const init = initRandomTrash(makeSeed(d, nextSalt));
            setTrash(init);
            setResetSalt(nextSalt);
            safeSave(GAME_KEY, { day: d, trash: init, resetSalt: nextSalt });
          }}
        />
      )}
    </div>
  );
}
