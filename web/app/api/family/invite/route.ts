import { NextRequest, NextResponse } from "next/server";
import {
  getSharesForChild,
  inviteParent,
  revokeShare,
} from "@/lib/familyMemory";

export async function GET(req: NextRequest) {
  const childUserId = req.nextUrl.searchParams.get("childUserId");
  if (!childUserId) {
    return NextResponse.json({ error: "childUserId required" }, { status: 400 });
  }

  const shares = getSharesForChild(childUserId).map((s) => ({
    id: s.id,
    parentEmail: s.parentEmail,
    status: s.status,
    createdAt: s.createdAt,
  }));

  return NextResponse.json({ ok: true, shares, maxParents: 2 });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const childUserId = String(body.childUserId || "");
  const childDisplayName = String(body.childDisplayName || "Your child");
  const parentEmail = String(body.parentEmail || "");

  if (!childUserId) {
    return NextResponse.json({ error: "childUserId required" }, { status: 400 });
  }

  const { share, error } = inviteParent({ childUserId, childDisplayName, parentEmail });
  if (error || !share) {
    return NextResponse.json({ error: error || "Invite failed" }, { status: 400 });
  }

  const acceptUrl = `${req.nextUrl.origin}/family/parent?shareId=${share.id}&token=${share.inviteToken}`;

  return NextResponse.json({
    ok: true,
    share: {
      id: share.id,
      parentEmail: share.parentEmail,
      status: share.status,
    },
    acceptUrl,
    message:
      "Invitation created. Share this link with your parent — they must accept before seeing your weekly card.",
  });
}

export async function DELETE(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const childUserId = String(body.childUserId || "");
  const shareId = String(body.shareId || "");

  if (!childUserId || !shareId) {
    return NextResponse.json({ error: "childUserId and shareId required" }, { status: 400 });
  }

  const ok = revokeShare(childUserId, shareId);
  if (!ok) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    message: "Sharing revoked immediately. Your parent no longer has access.",
  });
}
