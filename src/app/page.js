"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Onboarding from "@/components/splash/Onboarding";
import HomePage from "./(features)/page";
import FeaturesLayout from "./(features)/layout";

const SEEN_KEY = "herbit_onboarding_v1";
const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

export default function Root() {
  const router = useRouter();
  const [stage, setStage] = useState("decide"); // decide | onboarding | home

  useEffect(() => {
    let cancelled = false;

    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((r) => {
        if (cancelled) return;
        if (r.ok) setStage("home");
        else {
          const seen = localStorage.getItem(SEEN_KEY) === "1";
          if (!seen) setStage("onboarding");
          else router.replace("/login");
        }
      })
      .catch(() => {
        const seen = localStorage.getItem(SEEN_KEY) === "1";
        if (!seen) setStage("onboarding");
        else router.replace("/login");
      });

    return () => { cancelled = true; };
  }, [router]);

  if (stage === "decide") return null;

  if (stage === "onboarding") {
    return (
      <Onboarding
        onStart={() => { localStorage.setItem(SEEN_KEY, "1"); router.replace("/login"); }}
        onSkip={() => { localStorage.setItem(SEEN_KEY, "1"); router.replace("/login"); }}
      />
    );
  }

  return (
    <FeaturesLayout>
      <HomePage />
    </FeaturesLayout>
  );
}
