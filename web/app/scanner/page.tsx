"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import DarkVeil from "@/components/DarkVeil";

type FlaggedSample = {
  line: number;
  reason: string;
  severity: "low" | "medium" | "high";
  preview: string;
  score?: number;
};

type ScanResult = {
  total_lines: number;
  flagged_count: number;
  reason_counts: Record<string, number>;
  flagged_samples: FlaggedSample[];
  raw_lines: string[];
  flagged_line_reasons: Record<string, string[]>;
};

const LABELS: Record<string, string> = {
  invalid_json: "Invalid JSON",
  missing_text: "Missing text",
  possible_prompt_injection: "Possible Prompt Injection",
  semantic_outlier: "Semantic Outlier",
  duplicate: "Duplicate",
  empty_line: "Empty line",
  low_quality_text: "Low quality text",
};

const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

const REASON_BADGES: Record<string, string> = {
  possible_prompt_injection:
    "bg-red-500/15 text-red-200 ring-1 ring-red-500/25",
  invalid_json: "bg-red-500/15 text-red-200 ring-1 ring-red-500/25",
  missing_text: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25",
  low_quality_text: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25",
  semantic_outlier: "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/25",
  duplicate: "bg-slate-500/15 text-slate-200 ring-1 ring-slate-500/25",
  empty_line: "bg-slate-500/15 text-slate-200 ring-1 ring-slate-500/25",
};

const SEVERITY_BADGES: Record<string, string> = {
  high: "bg-red-500/15 text-red-200 ring-1 ring-red-500/25",
  medium: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25",
  low: "bg-slate-500/15 text-slate-200 ring-1 ring-slate-500/25",
};

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md hover:bg-white/15 transition-colors">
      <div className="text-xs font-medium text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

export default function Scanner() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [reasonFilter, setReasonFilter] = useState<string>("all");

  const [exclude, setExclude] = useState<Record<string, boolean>>({
    invalid_json: true,
    missing_text: true,
    possible_prompt_injection: true,
    low_quality_text: true,
    semantic_outlier: false,
    duplicate: false,
    empty_line: false,
  });

  const reasons = useMemo(() => {
    if (!result?.reason_counts) return [];
    return Object.keys(result.reason_counts).sort();
  }, [result]);

  const filteredSamples = useMemo(() => {
    if (!result) return [];
    const base =
      reasonFilter === "all"
        ? result.flagged_samples
        : result.flagged_samples.filter((s) => s.reason === reasonFilter);

    return [...base].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [result, reasonFilter]);

  async function onScan() {
    if (!file) return;

    setLoading(true);
    setResult(null);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("http://127.0.0.1:8000/scan", {
      method: "POST",
      body: form,
    });

    const data = (await res.json()) as ScanResult;
    setResult(data);
    setReasonFilter("all");
    setLoading(false);
  }

  const cleanedJsonl = useMemo(() => {
    if (!result) return "";

    const shouldDropLine = (lineNum: number) => {
      const reasons = result.flagged_line_reasons[String(lineNum)] || [];
      return reasons.some((r) => exclude[r]);
    };

    const kept = result.raw_lines.filter((line, idx) => {
      const lineNum = idx + 1;
      if (!line.trim()) return false;
      return !shouldDropLine(lineNum);
    });

    return kept.join("\n") + (kept.length ? "\n" : "");
  }, [result, exclude]);

  function downloadCleaned() {
    if (!result) return;

    const blob = new Blob([cleanedJsonl], { type: "application/jsonl" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "cleaned.jsonl";
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* DarkVeil Background */}
      <div className="fixed inset-0 z-0">
        <DarkVeil
          hueShift={200}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={1}
          scanlineFrequency={0}
          warpAmount={0}
          resolutionScale={0.99}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight bg-gradient-to-br from-white via-blue-100 to-slate-300 bg-clip-text text-transparent">
            PoisonLens Scanner
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Scan JSONL datasets for quality issues, anomalies, and security risks.
            Clean and export your data with intelligent remediation rules.
          </p>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          {/* Upload section */}
          <div className="rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-md">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-white mb-3">Dataset</label>
                <input
                  type="file"
                  accept=".jsonl,.txt,.json"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-xl file:border-0 file:bg-white/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/30 transition-colors file:cursor-pointer"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Upload a JSONL file to begin scanning
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onScan}
                  disabled={!file || loading}
                  className={cx(
                    "rounded-xl px-6 py-2.5 text-sm font-semibold transition-all",
                    !file || loading
                      ? "bg-white/10 text-slate-400 cursor-not-allowed"
                      : "bg-white/20 text-white hover:bg-white/30 border border-white/20"
                  )}
                >
                  {loading ? "Scanning…" : "Scan"}
                </button>

                <button
                  onClick={downloadCleaned}
                  disabled={!result}
                  className={cx(
                    "rounded-xl px-6 py-2.5 text-sm font-semibold transition-all border",
                    !result
                      ? "border-white/10 bg-white/5 text-slate-400 cursor-not-allowed"
                      : "border-white/20 bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  Download
                </button>
              </div>
            </div>
          </div>

          {/* Empty state */}
          {!result && (
            <div className="rounded-3xl border border-white/20 bg-white/10 p-12 text-center backdrop-blur-md">
              <p className="text-slate-300">Upload and scan a dataset to begin</p>
            </div>
          )}

          {/* Dashboard */}
          {result && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Total lines" value={result.total_lines} />
                <MetricCard label="Flagged" value={result.flagged_count} />
                <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
                  <label className="block text-xs font-medium text-slate-400 mb-3">Filter</label>
                  <select
                    value={reasonFilter}
                    onChange={(e) => setReasonFilter(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  >
                    <option value="all">All reasons</option>
                    {reasons.map((r) => (
                      <option key={r} value={r}>
                        {LABELS[r] ?? r} ({result.reason_counts[r]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cleaning rules */}
              <div className="rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-md">
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-white">Cleaning rules</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Toggle categories to exclude from exported dataset
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {Object.keys(exclude).map((k) => (
                    <label
                      key={k}
                      className={cx(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all cursor-pointer",
                        exclude[k]
                          ? "border-white/30 bg-white/15"
                          : "border-white/15 bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={exclude[k]}
                        onChange={(e) =>
                          setExclude((prev) => ({
                            ...prev,
                            [k]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-white/30 accent-white"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{LABELS[k] ?? k}</div>
                        <div className="text-xs text-slate-400">
                          {k === "possible_prompt_injection" && "Security pattern"}
                          {k === "semantic_outlier" && "Anomaly"}
                          {k === "low_quality_text" && "Low quality"}
                          {k === "invalid_json" && "Malformed"}
                          {k === "missing_text" && "Incomplete"}
                          {k === "duplicate" && "Duplicate"}
                          {k === "empty_line" && "Empty"}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {result.flagged_count === 0 && (
                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 backdrop-blur-md text-center text-sm text-emerald-100">
                  No issues detected. Your dataset looks clean.
                </div>
              )}

              {/* Flagged samples table */}
              {result.flagged_count > 0 && (
                <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md overflow-hidden">
                  <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
                    <h2 className="text-sm font-semibold text-white">
                      Flagged samples ({filteredSamples.length})
                    </h2>
                    <p className="text-xs text-slate-400">Sorted by score</p>
                  </div>

                  <div className="max-h-[600px] overflow-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-white/5 backdrop-blur">
                        <tr className="border-b border-white/10">
                          <th className="px-8 py-3 font-semibold text-slate-300 w-16">Line</th>
                          <th className="px-8 py-3 font-semibold text-slate-300 w-48">Reason</th>
                          <th className="px-8 py-3 font-semibold text-slate-300 w-24">Severity</th>
                          <th className="px-8 py-3 font-semibold text-slate-300 w-20">Score</th>
                          <th className="px-8 py-3 font-semibold text-slate-300">Preview</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredSamples.map((s, idx) => (
                          <tr
                            key={`${s.line}-${idx}`}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="px-8 py-3 text-slate-200">{s.line}</td>
                            <td className="px-8 py-3">
                              <span
                                className={cx(
                                  "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                  REASON_BADGES[s.reason] ??
                                    "bg-white/10 text-slate-200"
                                )}
                              >
                                {LABELS[s.reason] ?? s.reason}
                              </span>
                            </td>
                            <td className="px-8 py-3">
                              <span
                                className={cx(
                                  "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                  SEVERITY_BADGES[s.severity]
                                )}
                              >
                                {s.severity}
                              </span>
                            </td>
                            <td className="px-8 py-3 text-slate-200 tabular-nums">
                              {typeof s.score === "number"
                                ? s.score.toFixed(3)
                                : "—"}
                            </td>
                            <td className="px-8 py-3 text-slate-300 font-mono text-xs max-w-md">
                              <div className="line-clamp-2 hover:line-clamp-none whitespace-pre-wrap break-words">
                                {s.preview || "—"}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredSamples.length === 0 && (
                          <tr>
                            <td className="px-8 py-6 text-center text-slate-400" colSpan={5}>
                              No samples match this filter
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
