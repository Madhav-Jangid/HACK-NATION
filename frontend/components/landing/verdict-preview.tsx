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
    <div className="w-full max-w-md rounded-lg border border-border/80 bg-white/95 p-8 shadow-[0_20px_50px_rgba(156,90,60,0.06)] backdrop-blur-md">
      <div className="flex items-baseline justify-between border-b border-border/60 pb-4">
        <span className="text-[10px] font-bold tracking-[0.15em] text-primary uppercase">
          Live Committee Demo
        </span>
        <span className="font-semibold text-xs text-muted-foreground/90 bg-secondary/50 px-2.5 py-1 rounded-full">Seed · AI infra</span>
      </div>

      <ul className="mt-6 space-y-3.5 border-b border-border/60 pb-5">
        {partners.map((p) => (
          <li key={p.name} className="flex items-start justify-between gap-4 text-xs">
            <span className="font-bold text-foreground/80">{p.name}</span>
            <span className="text-right text-[11px] text-muted-foreground font-medium">{p.note}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-end justify-between">
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
