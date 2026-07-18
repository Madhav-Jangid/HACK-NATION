import { VerdictRule } from "@/components/ui/verdict-rule";

const partners = [
  { name: "Technical Partner", note: "Open-source activity, no revenue signal yet" },
  { name: "Founder Partner", note: "Second-time founder, prior exit" },
  { name: "Market Partner", note: "TAM thin at seed, timing favorable" },
  { name: "Risk Partner", note: "No cap table disclosed" },
];

/**
 * A static example of committee output — the same VerdictRule treatment used
 * on a real founder profile, shown once and calmly rather than animated.
 */
export function VerdictPreview() {
  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Example output
        </span>
        <span className="font-data text-xs text-muted-foreground">Seed · AI infra</span>
      </div>

      <ul className="mt-4 space-y-2.5 border-b border-border pb-4">
        {partners.map((p) => (
          <li key={p.name} className="flex items-start justify-between gap-4 text-sm">
            <span className="font-medium">{p.name}</span>
            <span className="text-right text-xs text-muted-foreground">{p.note}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-end justify-between">
        <VerdictRule label="Founder Score" value="82" suffix="medium confidence" tone="positive" />
        <VerdictRule
          label="Managing Partner"
          value="INVEST"
          suffix="78% conf."
          tone="positive"
          size="sm"
        />
      </div>
    </div>
  );
}
