"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/app/components/ui/button";

type Action = "interested" | "skip" | "save";

/**
 * Phase 11/12: Interested / Skip / Save on a founder. Persists via
 * `founder_actions` (owner-scoped RLS) — "save" is what feeds the dashboard's
 * Watchlist widget and the recommendation feed's saved state.
 */
export function FounderActions({
  founderId,
  onAction,
}: {
  founderId: string;
  onAction?: (action: Action) => void;
}) {
  const [active, setActive] = useState<Action | null>(null);
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase
      .from("founder_actions")
      .select("action")
      .eq("founder_id", founderId)
      .then(({ data }) => {
        if (cancelled || !data || data.length === 0) return;
        setActive(data[0].action as Action);
      });

    return () => {
      cancelled = true;
    };
  }, [founderId]);

  async function handleClick(action: Action) {
    setPending(action);
    setError(null);

    const isUnsave = action === "save" && active === "save";
    const res = await fetch(`/api/founders/${founderId}/actions`, {
      method: isUnsave ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Couldn't record that.");
    } else {
      setActive(isUnsave ? null : action);
      onAction?.(action);
    }
    setPending(null);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={active === "interested" ? "secondary" : "outline"}
        onClick={() => handleClick("interested")}
        disabled={pending !== null}
      >
        Interested
      </Button>
      <Button
        size="sm"
        variant={active === "save" ? "secondary" : "outline"}
        onClick={() => handleClick("save")}
        disabled={pending !== null}
      >
        {active === "save" ? "Saved" : "Save"}
      </Button>
      <Button
        size="sm"
        variant={active === "skip" ? "secondary" : "outline"}
        onClick={() => handleClick("skip")}
        disabled={pending !== null}
      >
        Skip
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
