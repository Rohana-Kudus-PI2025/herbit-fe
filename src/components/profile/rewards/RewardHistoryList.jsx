"use client";

import Image from "next/image";

const MAX_ITEMS = 3;

export default function RewardHistoryList({ history = [] }) {
  const items = Array.isArray(history) ? history.slice(0, MAX_ITEMS) : [];

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Riwayat Redeem</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <HistoryCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function HistoryCard({ item }) {
  const dateLabel = item.redeemed_at
    ? formatDateLabel(item.redeemed_at)
    : "Tanggal tidak diketahui";
  const pointsLabel =
    typeof item.points === "number" && item.points > 0
      ? `-${item.points} poin`
      : null;

  return (
    <div className="flex items-center rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
      <div className="mr-3 h-10 w-10 overflow-hidden rounded-2xl">
        <Image
          src={item.image ?? "/icons/gift.svg"}
          alt={item.name ?? "Voucher"}
          width={40}
          height={40}
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">
          {item.name ?? "Voucher"}
        </p>
        <p className="text-xs text-gray-500">{dateLabel}</p>
      </div>

      {pointsLabel && (
        <span className="ml-3 whitespace-nowrap text-sm font-semibold text-rose-600">
          {pointsLabel}
        </span>
      )}
    </div>
  );
}

function formatDateLabel(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
