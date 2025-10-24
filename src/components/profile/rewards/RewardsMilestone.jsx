"use client";

import { clampNumber } from "@/lib/utils";

export default function RewardsMilestone({ milestone, onClaim }) {
  if (!milestone) {
    return null;
  }

  const rawTarget = milestone.daysTarget ?? milestone.progress?.target ?? 30;
  const target = clampNumber(rawTarget, 1, Infinity);
  const rawCurrent = milestone.daysCurrent ?? milestone.progress?.current ?? 0;
  const current = clampNumber(rawCurrent, 0, target);
  const percent = clampNumber((current / target) * 100);
  const isCompleted = current >= target;
  const isClaimed = Boolean(milestone.claimed);
  const pointsLabel =
    typeof milestone.ctaPoints === "number"
      ? `+${milestone.ctaPoints} point`
      : null;

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-[#FACC15] bg-white px-4 py-4 text-gray-900 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[#FACC15]/40 bg-white p-1.5">
          <img
            src={milestone.image ?? "/robot.svg"}
            alt="Maskot Herbit"
            className="h-full w-full object-contain"
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9A6A2F]">
            {milestone.title ?? "Selamat"}
          </p>
          <h2 className="text-xl font-extrabold text-[#3D1B0F]">
            {milestone.subtitle ?? "Ibu Keren!"}
          </h2>
          <p className="text-xs text-gray-700/80">
            {milestone.description ??
              "30 hari berturut-turut menyelesaikan minimal satu task. Reward spesial ini hanya untuk Ibu!"}
          </p>
        </div>
      </div>

      <ProgressBar current={current} target={target} percent={percent} />

      {isClaimed ? (
        <div className="mt-4 rounded-xl border border-dashed border-[#FACC15] bg-white/80 px-4 py-2.5 text-center text-xs font-semibold text-[#9A6A2F]">
          Reward bulan ini sudah diklaim. Sampai jumpa di tantangan berikutnya!
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onClaim?.()}
          disabled={!isCompleted}
          className={`relative mt-4 inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
            isCompleted
              ? "bg-[#4A2D8B] hover:bg-[#3C2374]"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          {isCompleted ? "Klaim reward" : "Belum bisa diklaim"}
          {pointsLabel && (
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {pointsLabel}
            </span>
          )}
        </button>
      )}
    </section>
  );
}

function ProgressBar({ current, target, percent }) {
  const label = `${Math.min(current, target)}/${target} hari`;

  return (
    <div className="mt-4 space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-700">
        <span>{label}</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="relative flex items-center gap-2.5">
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#FFF7E0]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#FEA800] transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <img
          src="/icons/chest.svg"
          alt="Chest icon"
          className="h-7 w-7 shrink-0"
        />
      </div>
    </div>
  );
}
