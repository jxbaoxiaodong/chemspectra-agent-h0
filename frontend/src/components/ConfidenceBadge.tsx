"use client";

interface ConfidenceBadgeProps {
  confidence: number;
  size?: "sm" | "md" | "lg";
}

export default function ConfidenceBadge({ confidence, size = "md" }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);
  const level = confidence >= 0.85 ? "high" : confidence >= 0.7 ? "medium" : "low";

  const colors = {
    high: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    low: "bg-red-500/15 text-red-300 border-red-500/30",
  };

  const dots = {
    high: "bg-emerald-400",
    medium: "bg-amber-400",
    low: "bg-red-400",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const labels = {
    high: "High Confidence",
    medium: "Medium Confidence",
    low: "Low Confidence",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colors[level]} ${sizeClasses[size]}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${dots[level]}`} />
      {labels[level]}
      <span className="opacity-70 ml-0.5">({pct}%)</span>
    </span>
  );
}
