type Tone = "positive" | "negative" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-foreground",
};

/**
 * The app's one recurring data treatment: a tracked label, a large tabular-mono
 * value, and a short underline tick — used for every scored judgment (Founder
 * Score, trust confidence, committee recommendation) instead of color fields or
 * gauges, so quantitative claims read the same way everywhere.
 */
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
  return (
    <div className="inline-flex flex-col items-start">
      <span className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </span>
      <span
        className={`font-data font-medium ${size === "sm" ? "text-lg" : "text-3xl"} ${TONE_CLASS[tone]}`}
      >
        {value}
        {suffix && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </span>
      <span className="mt-1 h-px w-6 bg-current opacity-30" />
    </div>
  );
}
