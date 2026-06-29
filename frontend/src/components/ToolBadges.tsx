"use client";

interface ToolBadgesProps {
  tools: string[];
}

const TOOL_LABELS: Record<string, string> = {
  identify_material: "Material ID",
  explain_peaks: "Peak Explanation",
  assign_functional_groups: "Functional Groups",
  match_library_topk: "Library Match",
  search_public_results: "Public Search",
};

const TOOL_COLORS: Record<string, string> = {
  identify_material: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  explain_peaks: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  assign_functional_groups: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  match_library_topk: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  search_public_results: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
};

export default function ToolBadges({ tools }: ToolBadgesProps) {
  if (!tools.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Tools Used by Agent
      </h4>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${TOOL_COLORS[tool] || "bg-slate-500/15 text-slate-300 border-slate-500/30"}`}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60" />
            {TOOL_LABELS[tool] || tool}
          </span>
        ))}
      </div>
    </div>
  );
}
