"use client";

import { useState } from "react";
import { FAMILY_LIMITS } from "@/lib/familyQuestions";

interface ShareRow {
  id: string;
  parentEmail: string;
  status: string;
}

interface Props {
  childUserId: string;
  childDisplayName?: string;
}

export default function FamilySharePanel({ childUserId, childDisplayName = "You" }: Props) {
  const [parentEmail, setParentEmail] = useState("");
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [message, setMessage] = useState("");
  const [acceptUrl, setAcceptUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadShares() {
    const res = await fetch(`/api/family/invite?childUserId=${encodeURIComponent(childUserId)}`);
    const data = await res.json();
    if (data.shares) setShares(data.shares);
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setAcceptUrl("");
    try {
      const res = await fetch("/api/family/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childUserId, childDisplayName, parentEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not send invite");
        return;
      }
      setMessage(data.message);
      setAcceptUrl(data.acceptUrl || "");
      setParentEmail("");
      await loadShares();
    } finally {
      setLoading(false);
    }
  }

  async function revoke(shareId: string) {
    await fetch("/api/family/invite", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childUserId, shareId }),
    });
    setMessage("Sharing turned off — your parent no longer has access.");
    await loadShares();
  }

  return (
    <div className="lm-surface p-5">
      <p className="lm-label mb-1">Share with family</p>
      <p className="text-[11px] text-[var(--lm-secondary)] mb-4 leading-relaxed">
        You choose who sees your weekly card. Parents see your shape and counts only — never your
        messages or session logs. Revoke anytime.
      </p>

      <form onSubmit={invite} className="flex gap-2 mb-4">
        <input
          type="email"
          value={parentEmail}
          onChange={(e) => setParentEmail(e.target.value)}
          placeholder="Parent or guardian email"
          className="flex-1 lm-input"
          disabled={shares.length >= FAMILY_LIMITS.maxParentEmails}
        />
        <button
          type="submit"
          disabled={loading || shares.length >= FAMILY_LIMITS.maxParentEmails}
          className="lm-btn lm-btn-primary disabled:opacity-40"
        >
          Invite
        </button>
      </form>

      {message && <p className="text-[11px] text-[var(--lm-secondary)] mb-2">{message}</p>}
      {acceptUrl && (
        <p className="text-[11px] text-[var(--lm-primary)] mb-3 break-all opacity-80">
          Parent accept link: {acceptUrl}
        </p>
      )}

      <ul className="space-y-2">
        {shares.map((s) => (
          <li key={s.id} className="flex justify-between items-center text-sm border-t pt-2">
            <span>
              {s.parentEmail}{" "}
            <span className="text-[11px] text-[var(--lm-muted)]">({s.status})</span>
            </span>
            {s.status !== "revoked" && (
              <button
                type="button"
                onClick={() => revoke(s.id)}
                className="text-[11px] text-[var(--lm-secondary)] hover:text-[var(--lm-primary)]"
              >
                Stop sharing
              </button>
            )}
          </li>
        ))}
        {shares.length === 0 && (
          <li className="text-[11px] text-[var(--lm-muted)]">Not sharing with anyone yet.</li>
        )}
      </ul>

      <button
        type="button"
        onClick={loadShares}
        className="mt-3 text-[11px] text-[var(--lm-muted)] lm-link"
      >
        Refresh list
      </button>
    </div>
  );
}
