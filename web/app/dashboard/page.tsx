"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import FamilySharePanel from "@/components/FamilySharePanel";
import WeeklyCard from "@/components/WeeklyCard";
import SparklineChart from "@/components/SparklineChart";
import SelfComparison from "@/components/SelfComparison";
import type { Shape } from "@/lib/shapes";

function DashboardContent() {
  const params = useSearchParams();
  const userId = params.get("userId") || "demo-user";
  const [card, setCard] = useState<Record<string, unknown> | null>(null);
  const [scores, setScores] = useState<number[]>([]);

  useEffect(() => {
    fetch(`/api/card?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then(setCard)
      .catch(() => setCard(null));
  }, [userId]);

  if (!card) {
    return <p className="text-[var(--lm-secondary)]">Loading dashboard…</p>;
  }

  const shape = (card.shape as Shape) || "Balanced";
  const weekStart = String(card.weekStart || new Date().toISOString().slice(0, 10));

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <WeeklyCard
        displayName="You"
        weekLabel={`Week of ${weekStart}`}
        shape={shape}
        depthMoments={Number(card.depth_moments) || 0}
        questionsAsked={Number(card.questions_asked) || 0}
        consciousDelegates={Number(card.conscious_delegates) || 0}
        loopBreaks={0}
        intentionalPct={Number(card.intentional_pct) || 50}
        questionCommandRatio={Number(card.questionCommandRatio) || 0.3}
        depthDeltaLabel="Depth rate vs last week"
        insightLine={String(card.insightLine || "")}
        userId={userId}
        weekStart={weekStart}
      />
      <div className="space-y-6">
        <div className="lm-surface p-4">
          <p className="lm-label mb-3">Score history</p>
          <SparklineChart scores={scores} />
        </div>
        <SelfComparison
          thisWeek={{
            intentional_pct: Number(card.intentional_pct) || 0,
            questions_asked: Number(card.questions_asked) || 0,
            depth_moments: Number(card.depth_moments) || 0,
          }}
        />
        <FamilySharePanel childUserId={userId} childDisplayName="You" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="lm-app-shell max-w-5xl mx-auto px-6 py-12">
      <p className="lm-wordmark-product text-[11px] mb-2">Lumen</p>
      <h1 className="lm-page-title mb-8">Dashboard</h1>
      <Suspense fallback={<p className="text-[var(--lm-secondary)]">Loading…</p>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}
