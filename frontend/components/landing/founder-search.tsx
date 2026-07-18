"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FounderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(
      trimmed
        ? `/signup?founder=${encodeURIComponent(trimmed)}`
        : "/signup",
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex items-center gap-2 rounded-sm border border-[var(--vcb-ink-line)] bg-[var(--vcb-ink-soft)] px-4 py-3 focus-within:border-[var(--vcb-brass)]">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a founder, startup, or GitHub URL"
          className="w-full bg-transparent text-sm text-[var(--vcb-text)] placeholder:text-[var(--vcb-muted)] focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-sm bg-[var(--vcb-brass)] px-4 py-2 text-sm font-medium text-[var(--vcb-ink)] transition-colors hover:bg-[var(--vcb-brass-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vcb-brass)]"
        >
          Run the committee
        </button>
      </div>
    </form>
  );
}
