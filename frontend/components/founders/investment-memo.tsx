"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Markdown } from "@/components/founders/markdown";
import type { InvestmentMemo as InvestmentMemoType } from "@/lib/founders/types";

function downloadMarkdown(founderName: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${founderName.replace(/\s+/g, "-").toLowerCase()}-investment-memo.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Phase 10: renders the latest generated memo (produced as the last step of a
 * committee run) with Markdown export (file download) and PDF export (native
 * browser print-to-PDF, scoped to just this card via `print:` utilities — no
 * PDF-rendering dependency needed).
 */
export function InvestmentMemoPanel({
  founderId,
  founderName,
}: {
  founderId: string;
  founderName: string;
}) {
  const [memo, setMemo] = useState<InvestmentMemoType | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase
      .from("investment_memos")
      .select("*")
      .eq("founder_id", founderId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setMemo((data as InvestmentMemoType | null) ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [founderId]);

  if (!memo) return null;

  return (
    <Card id="investment-memo" className="rounded-[2.25rem] border border-border/80 bg-[#fffdfd] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_12px_35px_rgba(156,90,60,0.03)] print:border-none print:shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4 border-b border-border/40 print:hidden">
        <div>
          <CardTitle className="text-base font-bold font-elsie">Investment Memo</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Generated from the committee&apos;s findings — evidence-backed, gated
            on the Managing Partner&apos;s synthesis.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadMarkdown(founderName, memo.content)}
            className="rounded-full text-xs font-semibold px-4 border border-border hover:bg-secondary/40"
          >
            Export .md
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()} className="rounded-full text-xs font-semibold px-4 border border-border hover:bg-secondary/40">
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Markdown content={memo.content} />
      </CardContent>
    </Card>
  );
}
