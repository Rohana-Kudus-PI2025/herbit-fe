"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getLeaves, getFruits, claimFruit, getTree } from "@/lib/dailytracker";

export default function Tree() {
  const [leaves, setLeaves] = useState([]);
  const [fruits, setFruits] = useState([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTreeData();
  }, []);

  const fetchTreeData = async () => {
    try {
      const [leafRes, fruitRes, treeRes] = await Promise.all([
        getLeaves(),
        getFruits(),
        getTree(),
      ]);

      const leafData = leafRes.data.leaves || [];
      const fruitData = fruitRes.data.fruits || [];
      const tracker = treeRes.data.tracker || {};

      const totalPoints = (tracker.totalFruitsHarvested || 0) * 10;

      const mappedLeaves = leafData.map((leaf) => ({
        id: leaf._id,
        checklistId: leaf.dailyTaskChecklistId,
        status: leaf.status,
      }));

      const uniqueLeaves = mappedLeaves.filter(
        (leaf, index, self) =>
          index === self.findIndex((l) => l.checklistId === leaf.checklistId)
      );

      const mappedFruits = fruitData.map((fruit) => ({
        id: fruit._id,
        isClaimed: fruit.isClaimed,
        pointsAwarded: fruit.pointsAwarded,
        harvestReadyDate: fruit.harvestReadyDate,
      }));

      setLeaves(uniqueLeaves);
      setFruits(mappedFruits);
      setPoints(totalPoints);
    } catch (err) {
      console.error("Error fetching tree data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimFruit = async (fruitId) => {
    try {
      const res = await claimFruit(fruitId);
      const awarded = res.data.pointsAwarded || 0;

      // ambil ulang totalFruitsHarvested setelah panen
      const treeRes = await getTree();
      const tracker = treeRes.data.tracker || {};
      const totalPoints = (tracker.totalFruitsHarvested || 0) * 10;

      setFruits((prev) =>
        prev.map((f) =>
          f.id === fruitId ? { ...f, isClaimed: true, pointsAwarded: awarded } : f
        )
      );

      setPoints(totalPoints);
      setMessage(`🎉 Kamu dapat 10 poin!`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error claiming fruit:", err);
      setMessage("❌ Gagal klaim buah");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading tree...</p>;

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "sans-serif",
        padding: "2rem",
        marginBottom: "3rem",
      }}
    >
      <h1>🌳 My Tree</h1>

      {/* Total poin dari totalFruitsHarvested x 10 */}
      <div
        style={{
          backgroundColor: "#F5F5F5",
          padding: "0.5rem 1rem",
          borderRadius: "10px",
          marginBottom: "1rem",
          fontSize: "1rem",
        }}
      >
        ⭐ Total Poin: <strong>{points}</strong>
      </div>

      {message && (
        <div
          style={{
            backgroundColor: "#E6FFE6",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            color: "#2E7D32",
            marginBottom: "1rem",
            fontWeight: "bold",
          }}
        >
          {message}
        </div>
      )}

      {/* Tampilan pohon */}
      <div
        style={{
          position: "relative",
          width: "300px",
          height: "400px",
          backgroundImage: "url('/tree-base.png')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        {leaves.map((leaf, i) => (
          <Image
            key={leaf.id}
            src={
              leaf.status === "green"
                ? "/tree-assets/daun-hijau.png"
                : "/tree-assets/daun-kuning.png"
            }
            alt={`${leaf.status} leaf`}
            width={40}
            height={40}
            style={{
              position: "absolute",
              top: 80 + (i % 3) * 60,
              left: 100 + (i * 30) % 100,
            }}
          />
        ))}

        {fruits.map((fruit, i) => (
          <Image
            key={fruit.id}
            src={
              fruit.isClaimed
                ? "/tree-assets/buah-claimed.png"
                : "/tree-assets/buah.png"
            }
            alt={`fruit-${fruit.id}`}
            width={45}
            height={45}
            onClick={() => !fruit.isClaimed && handleClaimFruit(fruit.id)}
            style={{
              position: "absolute",
              top: 250 + (i % 2) * 60,
              left: 120 + (i * 40) % 100,
              cursor: fruit.isClaimed ? "default" : "pointer",
              opacity: fruit.isClaimed ? 0.5 : 1,
              transition: "transform 0.2s ease",
            }}
          />
        ))}
      </div>

      <button
        onClick={fetchTreeData}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#4CAF50",
          color: "white",
          cursor: "pointer",
        }}
      >
        🔄 Refresh Tree
      </button>
    </main>
  );
}
