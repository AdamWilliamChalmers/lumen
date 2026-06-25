import type { Shape } from "./shapes";

/** Curated conversation-starters for parent weekly email — from lumen_family.md */
export const FAMILY_CONVERSATION_STARTERS: Record<Shape, string> = {
  Explorer:
    "What's the most interesting thing you found out this week — something you looked up or asked about?",
  Thinker:
    "Was there a moment this week where you figured something out yourself before asking AI? What was it?",
  Maker:
    "You delegated a lot this week — what was the most important thing you kept doing yourself?",
  Delegator:
    "What would you have done differently if AI hadn't been available for one of those tasks?",
  Balanced:
    "Looking back at your AI conversations this week — which one felt most like a collaboration?",
};

export function getFamilyConversationStarter(shape: Shape): string {
  return FAMILY_CONVERSATION_STARTERS[shape] || FAMILY_CONVERSATION_STARTERS.Balanced;
}

export const FAMILY_LIMITS = {
  minAge: 13,
  maxParentEmails: 2,
  freeHistoryWeeks: 4,
  familyHistoryWeeks: null as number | null, // unlimited
};

export function requiresParentalConsent(birthYear: number, now = new Date()): boolean {
  const age = now.getFullYear() - birthYear;
  return age >= FAMILY_LIMITS.minAge && age <= 17;
}

export function isBelowMinimumAge(birthYear: number, now = new Date()): boolean {
  return now.getFullYear() - birthYear < FAMILY_LIMITS.minAge;
}
