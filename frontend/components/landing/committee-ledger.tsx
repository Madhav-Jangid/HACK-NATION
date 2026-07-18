"use client";

import { motion, useReducedMotion } from "framer-motion";
import { IBM_Plex_Mono } from "next/font/google";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ledger",
});

type Partner = {
  name: string;
  score: number;
  trend: "up" | "down" | "flat";
  citations: number;
};

const partners: Partner[] = [
  { name: "Technical Partner", score: 87, trend: "up", citations: 6 },
  { name: "Founder Partner", score: 91, trend: "flat", citations: 5 },
  { name: "Market Partner", score: 74, trend: "up", citations: 4 },
  { name: "Risk Partner", score: 62, trend: "down", citations: 7 },
];

const trendGlyph = { up: "↑", down: "↓", flat: "→" };

export function CommitteeLedger() {
  const reduceMotion = useReducedMotion();

  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: reduceMotion
        ? { duration: 0 }
        : { delay: 0.25 + i * 0.18, duration: 0.4, ease: "easeOut" as const },
    }),
  };

  const stampDelay = 0.25 + partners.length * 0.18 + 0.3;

  return (
    <div
      className={`${plexMono.variable} w-full max-w-md rounded-sm border border-[var(--vcb-parchment-line)] bg-[var(--vcb-parchment)] p-6 text-[var(--vcb-ink)] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.6)]`}
    >
      <div className="mb-4 flex items-baseline justify-between border-b border-[var(--vcb-parchment-line)] pb-3">
        <span className="text-[11px] font-medium tracking-[0.18em] text-[var(--vcb-brass-deep)] uppercase">
          Investment Committee
        </span>
        <span
          className="text-[11px] text-[var(--vcb-ink)]/50"
          style={{ fontFamily: "var(--font-ledger)" }}
        >
          Q3 · Series Seed
        </span>
      </div>

      <ul className="space-y-3">
        {partners.map((p, i) => (
          <motion.li
            key={p.name}
            custom={i}
            initial="hidden"
            animate="show"
            variants={rowVariants}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-[var(--vcb-ink)]/80">{p.name}</span>
            <span
              className="flex items-center gap-2 tabular-nums"
              style={{ fontFamily: "var(--font-ledger)" }}
            >
              <span className="text-[var(--vcb-ink)]/40">
                [{p.citations} cites]
              </span>
              <span
                className={
                  p.trend === "down"
                    ? "text-[var(--vcb-neg)]"
                    : "text-[var(--vcb-pos)]"
                }
              >
                {p.score} {trendGlyph[p.trend]}
              </span>
            </span>
          </motion.li>
        ))}
      </ul>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, rotate: -2 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { delay: stampDelay, duration: 0.35, ease: "backOut" }
        }
        className="mt-5 flex items-center justify-between rounded-sm border-2 border-[var(--vcb-brass-deep)] px-3 py-2"
      >
        <span className="text-sm font-semibold tracking-wide text-[var(--vcb-brass-deep)]">
          Managing Partner — INVEST
        </span>
        <span
          className="text-sm text-[var(--vcb-brass-deep)] tabular-nums"
          style={{ fontFamily: "var(--font-ledger)" }}
        >
          92% conf.
        </span>
      </motion.div>
    </div>
  );
}
