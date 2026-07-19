import type { InvestmentThesis } from "@/lib/thesis/types";
import type { Founder, FounderScore } from "./types";

export type MatchResult = { percent: number; reasons: string[]; excluded: boolean };

/**
 * Phase 12: a heuristic "thesis fit" score. Deliberately not a precise sector/
 * geography match — founders aren't sector-tagged in the schema yet (a data-
 * model gap, not hidden here), so this blends what's objectively available:
 * Founder Score, track-record/cold-start status vs. the thesis's stated risk
 * appetite, and an excluded-industries text check.
 */
export function computeMatch(
  founder: Founder,
  latestScore: FounderScore | null,
  thesis: InvestmentThesis,
): MatchResult {
  const reasons: string[] = [];
  const companyText = (founder.company_name ?? "").toLowerCase();

  const excludedHit = thesis.excluded_industries.find(
    (industry) => industry.trim() && companyText.includes(industry.trim().toLowerCase()),
  );
  if (excludedHit) {
    return {
      percent: 0,
      reasons: [`Company name mentions "${excludedHit}", excluded by your thesis.`],
      excluded: true,
    };
  }

  let percent = 30;

  if (latestScore) {
    percent += Math.round((latestScore.score / 100) * 40);
    reasons.push(`Founder Score ${latestScore.score} (${latestScore.confidence} confidence).`);
  } else {
    reasons.push("No Founder Score yet — research may still be running.");
  }

  const riskText = (thesis.risk_appetite ?? "").toLowerCase();
  const wantsEarly =
    riskText.includes("early") || riskText.includes("pre-track") || riskText.includes("first-time");

  if (founder.is_cold_start) {
    if (wantsEarly) {
      percent += 20;
      reasons.push("Cold-start founder — matches your stated appetite for early bets.");
    } else {
      percent += 5;
      reasons.push("Cold-start founder (no prior track record) — scored on public footprint only.");
    }
  } else {
    percent += 15;
    reasons.push("Has a documented public track record.");
  }

  reasons.push(
    founder.source === "inbound"
      ? "Came in through an application (deck + company name)."
      : "Surfaced through outbound sourcing.",
  );

  return { percent: Math.max(0, Math.min(100, percent)), reasons, excluded: false };
}
