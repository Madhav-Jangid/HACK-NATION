"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/app/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { MoreHorizontal, Bookmark, Heart, X, Loader2 } from "lucide-react";

type Action = "interested" | "skip" | "save";

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
      {error && <span className="text-xs text-rose-400 mr-2">{error}</span>}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          disabled={pending !== null}
        >
          <span className="sr-only">Open menu</span>
          {pending !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px] bg-white border border-border text-foreground rounded-xl shadow-md p-1">
          <DropdownMenuItem
            onClick={() => handleClick("interested")}
            className="cursor-pointer hover:bg-secondary/40 focus:bg-secondary/40 text-xs py-2 rounded-lg"
          >
            <Heart className={`mr-2 h-3.5 w-3.5 ${active === "interested" ? "text-rose-500 fill-rose-500" : ""}`} />
            <span>Interested</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleClick("save")}
            className="cursor-pointer hover:bg-secondary/40 focus:bg-secondary/40 text-xs py-2 rounded-lg"
          >
            <Bookmark className={`mr-2 h-3.5 w-3.5 ${active === "save" ? "text-primary fill-primary" : ""}`} />
            <span>{active === "save" ? "Saved" : "Save for later"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleClick("skip")}
            className="cursor-pointer hover:bg-rose-50 focus:bg-rose-50 text-rose-600 text-xs py-2 rounded-lg"
          >
            <X className="mr-2 h-3.5 w-3.5" />
            <span>Skip</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
