"use client";

import { useState } from "react";
import { downloadReport, downloadAsFile } from "@/src/lib/api";

interface ReportDownloadProps {
  sessionId: string;
  disabled?: boolean;
}

export default function ReportDownload({ sessionId, disabled }: ReportDownloadProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const markdown = await downloadReport(sessionId);
      downloadAsFile(markdown, `ftir-analysis-${sessionId.slice(0, 8)}.md`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Download failed.";
      alert(msg);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || downloading}
      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {downloading ? "Downloading..." : "Download Report (Markdown)"}
    </button>
  );
}
