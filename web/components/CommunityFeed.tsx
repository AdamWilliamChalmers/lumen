import ShapeBadge from "./ShapeBadge";
import type { Shape } from "@/lib/shapes";
import { SHAPE_DESCRIPTIONS } from "@/lib/shapes";

export interface CommunityEntry {
  displayName: string;
  shape: Shape;
  sharedAt: string;
}

interface CommunityFeedProps {
  entries: CommunityEntry[];
  sharedCount: number;
}

export default function CommunityFeed({ entries, sharedCount }: CommunityFeedProps) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{sharedCount} cards shared this week</p>
      <div className="space-y-3">
        {entries.map((e, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
              {initials(e.displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{e.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{SHAPE_DESCRIPTIONS[e.shape]}</p>
            </div>
            <ShapeBadge shape={e.shape} />
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-sm text-gray-400">No shared cards yet this week.</p>
        )}
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
