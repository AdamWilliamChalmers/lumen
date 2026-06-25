import Link from "next/link";

export default function HomePage() {
  return (
    <main className="lm-app-shell">
      <section className="lm-hero relative px-6 pt-24 pb-32 text-center">
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="lm-wordmark-marketing mb-6">Lumen</p>
          <h1 className="lm-landing-h1 mb-4">Stay sharp while using AI.</h1>
          <p className="lm-landing-subhead mb-10 max-w-lg mx-auto">
            Lumen watches how you think alongside ChatGPT, Claude, Gemini, and Grok — then shows you
            your shape each week.
          </p>
          <a href="#" className="lm-landing-cta">
            Install Chrome extension
          </a>
        </div>
      </section>

      <section className="lm-how-section max-w-4xl mx-auto px-6 py-16">
        <hr className="lm-how-divider" />
        <h2 className="lm-how-title text-center mb-10">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Step
            n={1}
            title="Extension watches"
            body="Inline signals appear under your messages as you chat."
          />
          <Step
            n={2}
            title="Signals reflect"
            body="Loop, drift, mismatch, and depth — never blocking, never judging."
          />
          <Step
            n={3}
            title="Weekly card"
            body="Your shape and trends live on lumen.so — shareable, no scores exposed."
          />
        </div>
      </section>

      <div className="lm-divider max-w-4xl mx-auto" />

      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="lm-page-title text-center mb-4">For families</h2>
        <p className="text-center text-[13px] text-[var(--lm-secondary)] mb-4 max-w-xl mx-auto leading-relaxed">
          Instead of trying to stop your teenager using AI, help them use it well. Your child shares
          their weekly card with you by choice — never your messages, never surveillance.
        </p>
        <p className="text-center text-[12px] text-[var(--lm-muted)] mb-8">
          Self-awareness lasts. Compliance doesn&apos;t.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link href="/signup" className="lm-btn lm-btn-primary">
            Create account (13+)
          </Link>
          <Link href="/family/parent" className="lm-btn">
            Parent view
          </Link>
        </div>
      </section>

      <div className="lm-divider max-w-4xl mx-auto" />

      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="lm-page-title text-center mb-4">Community</h2>
        <p className="text-center text-[13px] text-[var(--lm-secondary)] mb-8">
          Shapes, not rankings. Sample cards from people who opted in.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          {[
            { shape: "Explorer", color: "var(--lm-depth)" },
            { shape: "Thinker", color: "var(--lm-depth)" },
            { shape: "Maker", color: "var(--lm-loop)" },
          ].map(({ shape, color }) => (
            <div
              key={shape}
              className="lm-surface p-4 w-36 text-center"
            >
              <p className="lm-label mb-2">Lumen</p>
              <p className="text-[12px] font-medium" style={{ color }}>
                {shape}
              </p>
            </div>
          ))}
        </div>
        <p className="text-center mt-8">
          <Link href="/community" className="lm-link text-[12px]">
            See community feed →
          </Link>
        </p>
      </section>

      <footer className="text-center py-10 text-[11px] text-[var(--lm-muted)] border-t border-[#1a1a1a]">
        Free extension · Lumen Family £12/mo (waitlist) · Ages 13+
      </footer>
    </main>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="text-center">
      <div className="lm-step-ring">{n}</div>
      <h3 className="lm-step-title">{title}</h3>
      <p className="lm-step-body">{body}</p>
    </div>
  );
}
