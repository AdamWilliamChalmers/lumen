"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import WeeklyCard from "@/components/WeeklyCard";
import type { Shape } from "@/lib/shapes";

function ParentView() {
  const params = useSearchParams();
  const shareId = params.get("shareId");
  const token = params.get("token");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareId || !token) {
      setError("Use the invitation link from your child.");
      return;
    }
    fetch(`/api/family/parent?shareId=${shareId}&token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      });
  }, [shareId, token]);

  if (error) {
    return <p className="text-gray-600 p-8">{error}</p>;
  }
  if (!data?.card) {
    return <p className="text-gray-500 p-8">Loading…</p>;
  }

  const card = data.card as Record<string, unknown>;
  const shape = (card.shape as Shape) || "Balanced";
  const weekStart = String(card.weekStart || new Date().toISOString().slice(0, 10));

  return (
    <div className="max-w-lg mx-auto p-8 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-500">Family view — read only</p>
        <h1 className="text-xl font-bold mt-1">
          {String(data.childDisplayName)}&apos;s week
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Weekly card only. No message content, session logs, or raw scores.
        </p>
      </div>

      <WeeklyCard
        displayName={String(data.childDisplayName)}
        weekLabel={`Week of ${weekStart}`}
        shape={shape}
        depthMoments={Number(card.depth_moments) || 0}
        questionsAsked={Number(card.questions_asked) || 0}
        consciousDelegates={Number(card.conscious_delegates) || 0}
        loopBreaks={Number(card.loop_breaks_taken) || 0}
        intentionalPct={Number(card.intentional_pct) || 50}
        questionCommandRatio={Number(card.questionCommandRatio) || 0.3}
        depthDeltaLabel=""
        insightLine={String(card.insightLine || "")}
        userId={String((card as { userId?: string }).userId || "")}
        weekStart={weekStart}
      />

      <div className="rounded-xl bg-sky-50 border border-sky-100 p-4">
        <p className="text-xs font-semibold text-sky-900 mb-2">Conversation starter</p>
        <p className="text-sm text-sky-950 italic">{String(data.conversationStarter)}</p>
        <p className="text-xs text-sky-700 mt-3">
          Ask to understand, not to judge. Your teen has the context — you have the question.
        </p>
      </div>
    </div>
  );
}

export default function ParentFamilyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={<p className="p-8">Loading…</p>}>
        <ParentView />
      </Suspense>
    </main>
  );
}
