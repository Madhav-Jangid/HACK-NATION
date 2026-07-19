"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

export function FounderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(
      trimmed ? `/signup?founder=${encodeURIComponent(trimmed)}` : "/signup",
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a founder, startup, or GitHub URL"
        className="h-11 rounded-full px-5 border-border/80 bg-white/90 text-sm shadow-sm focus-visible:ring-primary/25 focus-visible:border-primary/80"
      />
      <Button type="submit" size="lg" className="h-11 shrink-0 rounded-full bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-[0_4px_12px_rgba(156,90,60,0.2)] hover:shadow-[0_4px_18px_rgba(156,90,60,0.35)] hover:scale-[1.01] transition-all">
        Run the committee
      </Button>
    </form>
  );
}
