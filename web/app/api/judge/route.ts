import { NextResponse } from "next/server";
import { anthropicJudge, heuristicJudge, openaiJudge, type JudgeRequest } from "@/lib/judge";

export async function POST(request: Request) {
  let body: JudgeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  try {
    const verdict = anthropicKey
      ? await anthropicJudge(body, anthropicKey)
      : openaiKey
        ? await openaiJudge(body, openaiKey)
        : heuristicJudge(body);
    return NextResponse.json({ ok: true, ...verdict });
  } catch (err) {
    const fallback = heuristicJudge(body);
    return NextResponse.json({
      ok: true,
      ...fallback,
      fallback: true,
      error: err instanceof Error ? err.message : "judge failed",
    });
  }
}
