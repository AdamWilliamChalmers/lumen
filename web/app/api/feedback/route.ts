import { NextResponse } from "next/server";
import { getFeedbackAggregate } from "@/lib/feedbackMemory";

export async function GET() {
  const aggregate = getFeedbackAggregate();
  return NextResponse.json({ ok: true, ...aggregate });
}
