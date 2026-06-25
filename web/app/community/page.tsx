import CommunityFeed from "@/components/CommunityFeed";
import type { CommunityEntry } from "@/components/CommunityFeed";

const DEMO: CommunityEntry[] = [
  { displayName: "Alex M.", shape: "Explorer", sharedAt: new Date().toISOString() },
  { displayName: "Jordan K.", shape: "Thinker", sharedAt: new Date().toISOString() },
  { displayName: "Sam R.", shape: "Maker", sharedAt: new Date().toISOString() },
];

export default function CommunityPage() {
  return (
    <main className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">Community</h1>
      <p className="text-gray-600 mb-8">Shapes shared this week — no scores, no rankings.</p>
      <CommunityFeed entries={DEMO} sharedCount={DEMO.length} />
    </main>
  );
}
