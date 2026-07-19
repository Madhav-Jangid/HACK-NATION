import { cn } from "@/lib/utils";

type Tone = "positive" | "negative" | "neutral";

export function VerdictRule({
  label,
  value,
  suffix,
  tone = "neutral",
  size = "default",
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: Tone;
  size?: "default" | "sm";
}) {
  const isPositive = tone === "positive";
  const isNegative = tone === "negative";

  return (
    <div
      className={cn(
        "inline-flex flex-col rounded-lg border p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] min-w-[120px]",
        isPositive
          ? "bg-emerald-50/40 border-emerald-100/60 text-emerald-800"
          : isNegative
            ? "bg-rose-50/40 border-rose-100/60 text-rose-800"
            : "bg-[#fffefe] border-border/80 text-foreground"
      )}
    >
      <span className="text-[9px] font-extrabold tracking-[0.16em] text-muted-foreground uppercase leading-none mb-1.5">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-extrabold leading-none",
            size === "sm" ? "text-xl" : "text-3xl",
            isPositive ? "text-emerald-700" : isNegative ? "text-rose-700" : "text-foreground"
          )}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-[10px] font-semibold text-muted-foreground/80 leading-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
