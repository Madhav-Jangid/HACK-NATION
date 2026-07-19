"use client";

import type { Founder, FounderMemory } from "@/lib/founders/types";

// Tavily's scraped LinkedIn titles are typically "Name - Headline - Company |
// LinkedIn" -- split that back into a name + headline instead of showing the
// raw title string in the persona card.
function parseLinkedInHeadline(title: string, fallbackName: string): { name: string; headline: string | null } {
  const cleaned = title.replace(/\s*\|\s*LinkedIn\s*$/i, "").trim();
  const parts = cleaned.split(" - ").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { name: fallbackName, headline: null };
  const [name, ...rest] = parts;
  return { name: name || fallbackName, headline: rest.length ? rest.join(" · ") : null };
}

function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Avatar({ founder }: { founder: Founder }) {
  if (founder.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable-host avatar; next/image would need a remote-pattern allowlist per source
      <img
        src={founder.avatar_url}
        alt={founder.name}
        className="h-14 w-14 shrink-0 rounded-full border border-border/60 object-cover shadow-sm"
      />
    );
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
      {initialsFor(founder.name)}
    </div>
  );
}

// A source-specific identity card: LinkedIn's own blue + "in" badge when the
// person was actually found there, a GitHub-styled card when sourced from
// GitHub, and a neutral generic card otherwise -- rather than one generic
// header treating every source the same way.
export function PersonaCard({ founder, memory }: { founder: Founder; memory: FounderMemory[] }) {
  const linkedin = memory.find((m) => m.source_type === "linkedin");

  if (linkedin) {
    const { name, headline } = parseLinkedInHeadline(linkedin.payload.title || founder.name, founder.name);
    return (
      <div className="flex items-center gap-4 rounded-lg border border-[#0a66c2]/25 bg-[#0a66c2]/5 p-4">
        <Avatar founder={founder} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-[#0a66c2] text-[9px] font-black text-white">
              in
            </span>
            <p className="truncate text-sm font-bold text-foreground font-elsie">{name}</p>
          </div>
          {headline && <p className="mt-0.5 truncate text-xs text-muted-foreground font-medium">{headline}</p>}
          {linkedin.source_url && (
            <a
              href={linkedin.source_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-[11px] font-semibold text-[#0a66c2] hover:underline"
            >
              View LinkedIn profile ↗
            </a>
          )}
        </div>
      </div>
    );
  }

  if (founder.github_url) {
    return (
      <div className="flex items-center gap-4 rounded-lg border border-[#24292f]/20 bg-[#24292f]/[0.04] p-4">
        <Avatar founder={founder} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#24292f]">{"</>"}</span>
            <p className="truncate text-sm font-bold text-foreground font-elsie">{founder.name}</p>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground font-medium">
            {founder.company_name ?? "GitHub profile"}
          </p>
          <a
            href={founder.github_url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-[11px] font-semibold text-foreground/70 hover:underline"
          >
            View GitHub profile ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-[#faf5f3]/40 p-4">
      <Avatar founder={founder} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground font-elsie">{founder.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground font-medium">
          {founder.company_name ?? `${founder.source_channel ?? founder.source} sourced`}
        </p>
      </div>
    </div>
  );
}
