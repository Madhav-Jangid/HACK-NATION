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
    <Card id="investment-memo" className="print:border-none print:shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4 print:hidden">
        <div>
          <CardTitle className="text-base">Investment Memo</CardTitle>
          <CardDescription>
            Generated from the committee&apos;s findings — evidence-backed, gated
            on the Managing Partner&apos;s synthesis.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadMarkdown(founderName, memo.content)}
          >
            Export .md
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Markdown content={memo.content} />
      </CardContent>
    </Card>
  );
}
