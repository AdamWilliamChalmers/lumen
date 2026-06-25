"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import WeeklyCard from "@/components/WeeklyCard";
import type { Shape } from "@/lib/shapes";

function CardContent() {
  const params = useParams();
  const search = useSearchParams();
  const userId = String(params.userId);
  const week = search.get("week") || new Date().toISOString().slice(0, 10);
  const [card, setCard] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/card?userId=${encodeURIComponent(userId)}&week=${week}`)
      .then((r) => r.json())
      .then(setCard);
  }, [userId, week]);

  if (!card) return <p className="text-gray-500 p-8">Loading card…</p>;

  return (
    <div className="flex justify-center p-8">
      <WeeklyCard
        displayName="Lumen user"
        weekLabel={`Week of ${week}`}
        shape={(card.shape as Shape) || "Balanced"}
        depthMoments={Number(card.depth_moments) || 0}
        questionsAsked={Number(card.questions_asked) || 0}
        consciousDelegates={Number(card.conscious_delegates) || 0}
        loopBreaks={0}
        intentionalPct={Number(card.intentional_pct) || 50}
        questionCommandRatio={Number(card.questionCommandRatio) || 0.3}
        depthDeltaLabel=""
        insightLine={String(card.insightLine || "")}
        userId={userId}
        weekStart={week}
      />
    </div>
  );
}

export default function PublicCardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={<p className="p-8">Loading…</p>}>
        <CardContent />
      </Suspense>
    </main>
  );
}
