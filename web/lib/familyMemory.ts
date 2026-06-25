export type FamilyShareStatus = "pending" | "active" | "revoked";

export interface FamilyShare {
  id: string;
  childUserId: string;
  childDisplayName: string;
  parentEmail: string;
  inviteToken: string;
  status: FamilyShareStatus;
  createdAt: string;
  revokedAt?: string;
}

export interface PendingConsent {
  childUserId: string;
  childEmail: string;
  parentEmail: string;
  consentToken: string;
  birthYear: number;
  createdAt: string;
}

const shares: FamilyShare[] = [];
const pendingConsents: PendingConsent[] = [];

function id() {
  return crypto.randomUUID();
}

export function createPendingConsent(input: {
  childUserId: string;
  childEmail: string;
  parentEmail: string;
  birthYear: number;
}): PendingConsent {
  const existing = pendingConsents.find(
    (p) => p.childUserId === input.childUserId && p.parentEmail === input.parentEmail
  );
  if (existing) return existing;

  const row: PendingConsent = {
    ...input,
    consentToken: id(),
    createdAt: new Date().toISOString(),
  };
  pendingConsents.push(row);
  return row;
}

export function confirmConsent(token: string): PendingConsent | null {
  const idx = pendingConsents.findIndex((p) => p.consentToken === token);
  if (idx === -1) return null;
  const [row] = pendingConsents.splice(idx, 1);
  return row;
}

export function getSharesForChild(childUserId: string): FamilyShare[] {
  return shares.filter((s) => s.childUserId === childUserId && s.status !== "revoked");
}

export function getActiveSharesForParent(parentEmail: string): FamilyShare[] {
  const email = parentEmail.toLowerCase();
  return shares.filter(
    (s) => s.parentEmail.toLowerCase() === email && s.status === "active"
  );
}

export function inviteParent(input: {
  childUserId: string;
  childDisplayName: string;
  parentEmail: string;
}): { share: FamilyShare; error?: string } {
  const email = input.parentEmail.toLowerCase().trim();
  if (!email.includes("@")) return { share: null as unknown as FamilyShare, error: "Invalid email" };

  const active = getSharesForChild(input.childUserId);
  if (active.length >= 2) {
    return { share: null as unknown as FamilyShare, error: "Maximum 2 parent/guardian emails" };
  }
  if (active.some((s) => s.parentEmail.toLowerCase() === email)) {
    return { share: null as unknown as FamilyShare, error: "Already sharing with this email" };
  }

  const share: FamilyShare = {
    id: id(),
    childUserId: input.childUserId,
    childDisplayName: input.childDisplayName,
    parentEmail: email,
    inviteToken: id(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  shares.push(share);
  return { share };
}

export function activateShare(shareId: string, inviteToken: string): FamilyShare | null {
  const share = shares.find((s) => s.id === shareId && s.inviteToken === inviteToken);
  if (!share) return null;
  share.status = "active";
  return share;
}

export function revokeShare(childUserId: string, shareId: string): boolean {
  const share = shares.find((s) => s.id === shareId && s.childUserId === childUserId);
  if (!share) return false;
  share.status = "revoked";
  share.revokedAt = new Date().toISOString();
  return true;
}

export function getShareById(shareId: string): FamilyShare | undefined {
  return shares.find((s) => s.id === shareId);
}

export function getAllActiveShares(): FamilyShare[] {
  return shares.filter((s) => s.status === "active");
}
