"use client";

import { useState } from "react";
import RewardsMilestone from "./RewardsMilestone";
import RewardVoucherCard from "./RewardVoucherCard";
import RewardHistoryList from "./RewardHistoryList";

export default function RewardsPanel({ rewards, loading }) {
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [redeemSuccess, setRedeemSuccess] = useState(null);

  if (!rewards && !loading) {
    return (
      <div className="rounded-[28px] bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
        Rewards belum tersedia.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RewardsMilestone
        milestone={rewards?.milestone}
        onClaim={() => setRedeemSuccess(rewards?.milestone)}
      />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Voucher tersedia
        </h3>
        <div className="space-y-3">
          {(rewards?.available ?? []).map((voucher) => (
            <RewardVoucherCard
              key={voucher.id}
              voucher={voucher}
              onRedeem={setSelectedVoucher}
            />
          ))}
        </div>
      </section>

      <RewardHistoryList history={rewards?.history ?? []} />

      <RedeemDialog
        voucher={selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        onConfirm={(voucher) => {
          setSelectedVoucher(null);
          setRedeemSuccess({
            ...voucher,
            redeemed_at: new Date().toISOString(),
          });
        }}
      />

      <RedeemSuccessDialog
        voucher={redeemSuccess}
        onClose={() => setRedeemSuccess(null)}
      />
    </div>
  );
}

function RedeemDialog({ voucher, onClose, onConfirm }) {
  if (!voucher) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-sm overflow-hidden rounded-[32px] bg-white shadow-2xl">
        <div className="flex items-start gap-4 px-6 py-6">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden ">
            <img
              src={voucher.image ?? "/sample-voucher.jpg"}
              alt={voucher.name ?? "Voucher"}
              className="h-16 w-16 rounded-2xl object-cover"
            />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-lg font-semibold text-gray-900">
              Voucher {voucher.name}
            </h4>
            <p className="text-sm text-gray-500">
              {voucher.description ?? "Voucher spesial untuk kamu"}
            </p>
            <p className="text-sm font-semibold text-[#F97316]">
              Poin dibutuhkan: {voucher.points_required ?? 0} poin
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-lg text-gray-500 transition hover:text-gray-700"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-2xl border border-[#FACC15]/40 bg-[#FFF3DA] px-4 py-3">
            <p className="text-sm font-semibold text-[#FEA800]">
              Syarat & Ketentuan
            </p>
            <ul className="mt-2 list-decimal space-y-1 pl-5 text-xs text-gray-600">
              <li>Voucher berlaku untuk semua produk {voucher.name}</li>
              <li>Minimal belanja Rp100.000</li>
              <li>Tidak dapat digabung promo lain</li>
              <li>Berlaku untuk 1x transaksi</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onConfirm?.(voucher)}
            className="mt-6 w-full rounded-full bg-[#4A2D8B] py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#3C2374]"
          >
            Tukar
          </button>
        </div>
      </div>
    </div>
  );
}

function RedeemSuccessDialog({ voucher, onClose }) {
  if (!voucher) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-sm overflow-hidden rounded-[32px] bg-white shadow-2xl">
        <div className="flex items-start gap-4 px-6 py-6">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white overflow-hidden ">
            <img
              src={voucher.image ?? "/sample-voucher.jpg"}
              alt={voucher.name ?? "Voucher"}
              className="h-16 w-16 rounded-2xl object-cover"
            />
          </div>

          <div className="flex-1 space-y-1">
            <h4 className="text-lg font-semibold text-gray-900">
              Voucher Berhasil ditukar!
            </h4>
            <p className="text-sm text-gray-500">Voucher {voucher.name}</p>
            <p className="text-xs font-semibold text-[#FEA800]">
              Berlaku sampai: 13 Nov 2025
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-lg text-gray-500 transition hover:text-gray-700"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div className="rounded-2xl border border-[#FACC15]/40 bg-[#FFF8EB] px-4 py-3 text-center">
            <p className="text-xs font-semibold text-[#FEA800]">Kode voucher</p>
            <div className="mt-2 rounded-xl border border-dashed border-[#FACC15] bg-white px-3 py-2 text-center text-sm font-semibold text-[#4A2D8B]">
              AVOSKIN50-XY79
            </div>
          </div>

          <div className="space-y-2 text-xs text-gray-600">
            <p className="font-semibold text-[#475467]">Cara pakai voucher:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Kunjungi toko resmi terkait</li>
              <li>Pilih produk yang kamu suka</li>
              <li>Masukkan kode voucher saat checkout</li>
              <li>Potongan langsung masuk!</li>
            </ol>
          </div>

          <button
            type="button"
            className="w-full rounded-full bg-[#4A2D8B] py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#3C2374]"
            onClick={onClose}
          >
            Belanja Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
