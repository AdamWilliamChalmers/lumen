import { NextRequest, NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { pushFeedback } from "@/lib/feedbackMemory";

const memoryStore: Array<Record<string, unknown>> = [];

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = String(body.userId || "");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const sessionRow = {
    user_id: userId,
    session_date: body.sessionDate || new Date().toISOString().slice(0, 10),
    platform: body.platform || "unknown",
    duration_minutes: Number(body.durationMinutes) || 0,
    message_count: Number(body.messageCount) || 0,
    composite_score: Number(body.compositeScore) || 0,
    human_state: body.humanState || "none",
    depth_moments: Number(body.depthMoments) || 0,
    questions_asked: Number(body.questionsAsked) || 0,
    conscious_delegates: Number(body.consciousDelegates) || 0,
    loop_breaks_taken: Number(body.loopBreaksTaken) || 0,
    interventions_fired: Number(body.interventionsFired) || 0,
    interventions_bypassed: Number(body.interventionsBypassed) || 0,
    reflections_submitted: Number(body.reflectionsSubmitted) || 0,
    signals: body.signals || {},
    feedback: body.feedback || [],
  };

  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    memoryStore.push({ ...sessionRow, storedAt: Date.now() });
    if (Array.isArray(body.feedback) && body.feedback.length) {
      pushFeedback(
        body.feedback.map((f: unknown) => ({
          ...(f as object),
          platform: sessionRow.platform,
          sessionDate: sessionRow.session_date,
        }))
      );
    }
    return NextResponse.json({ ok: true, mode: "memory", count: memoryStore.length });
  }

  const { data: existingUser } = await supabase.from("users").select("id").eq("id", userId).maybeSingle();

  if (!existingUser) {
    await supabase.from("users").upsert({ id: userId, display_name: "Lumen user" });
  }

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: dupes } = await supabase
    .from("sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("session_date", sessionRow.session_date)
    .eq("platform", sessionRow.platform)
    .gte("created_at", fiveMinAgo)
    .limit(1);

  if (dupes?.length) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const { error } = await supabase.from("sessions").insert(sessionRow);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    supabase: isSupabaseConfigured(),
    memorySessions: memoryStore.length,
  });
}
