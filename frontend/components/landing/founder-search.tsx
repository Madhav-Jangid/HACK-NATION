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
        className="h-10"
      />
      <Button type="submit" size="lg" className="h-10 shrink-0">
        Run the committee
      </Button>
    </form>
  );
}
