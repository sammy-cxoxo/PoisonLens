"use client";

import { useMemo, useState } from "react";

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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

export default function Home() {
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-120px] h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-[260px] h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7.5xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">PoisonLens</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Scan JSONL fine-tuning datasets for poisoning indicators, low-quality
              samples, and semantic outliers. Export a cleaned dataset using
              deterministic remediation rules.
            </p>
          </div>

        </div>

        <div className="mt-8 space-y-6">
          {/* Upload + Actions */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium text-slate-200">Dataset</div>
                <input
                  type="file"
                  accept=".jsonl,.txt,.json"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-100 hover:file:bg-white/15"
                />
                <div className="text-xs text-slate-400">
                  Upload a JSONL file (one JSON object per line). Run a scan to see
                  flagged rows and export a cleaned dataset.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onScan}
                  disabled={!file || loading}
                  className={cx(
                    "rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm transition",
                    !file || loading
                      ? "bg-white/10 text-slate-400"
                      : "bg-white text-slate-900 hover:bg-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_12px_30px_rgba(0,0,0,0.35)]"
                  )}
                >
                  {loading ? "Scanning…" : "Run scan"}
                </button>

                <button
                  onClick={downloadCleaned}
                  disabled={!result}
                  className={cx(
                    "rounded-xl border px-5 py-2.5 text-sm font-medium transition",
                    !result
                      ? "border-white/10 bg-white/5 text-slate-400"
                      : "border-white/15 bg-slate-950/30 text-slate-100 hover:bg-slate-950/60"
                  )}
                >
                  Download cleaned.jsonl
                </button>
              </div>
            </div>
          </div>

          {/* Empty state */}
          {!result && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-sm backdrop-blur">
              <div className="text-sm font-medium text-slate-200">
                Upload a dataset to begin
              </div>
              <div className="mt-2 text-sm text-slate-400">
                Run a scan to populate metrics, remediation toggles, and flagged
                samples.
              </div>
            </div>
          )}

          {/* Dashboard */}
          {result && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Total lines" value={result.total_lines} />
                <MetricCard label="Flagged" value={result.flagged_count} />

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur">
                  <div className="text-xs text-slate-400">Filter</div>
                  <select
                    value={reasonFilter}
                    onChange={(e) => setReasonFilter(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 p-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-white/10"
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
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium text-slate-200">
                    Cleaning rules
                  </div>
                  <div className="text-xs text-slate-400">
                    These toggles affect the exported dataset only. Flagged samples
                    remain visible for review.
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {Object.keys(exclude).map((k) => (
                    <label
                      key={k}
                      className={cx(
                        "flex items-center justify-between rounded-xl border px-4 py-3 transition",
                        exclude[k]
                          ? "border-white/15 bg-white/10"
                          : "border-white/10 bg-slate-950/30 hover:bg-slate-950/40"
                      )}                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-200">{LABELS[k] ?? k}</span>
                        <span className="text-xs text-slate-400">
                          {k === "possible_prompt_injection" && "High-risk security pattern"}
                          {k === "semantic_outlier" && "Embedding distance anomaly"}
                          {k === "low_quality_text" && "Noise / non-language samples"}
                          {k === "invalid_json" && "Malformed JSONL row"}
                          {k === "missing_text" && "Missing instruction/output"}
                          {k === "duplicate" && "Repeated content"}
                          {k === "empty_line" && "Blank row"}
                        </span>
                        <input
                          type="checkbox"
                          checked={exclude[k]}
                          onChange={(e) =>
                            setExclude((prev) => ({
                              ...prev,
                              [k]: e.target.checked,
                            }))
                          }
                          className="h-5 w-5 accent-white"
                        />
                        <div className="text-sm text-slate-200"></div>
                      </div>

                    </label>
                  ))}
                </div>

                <div className="mt-3 text-xs text-slate-400">
                  Export updates instantly based on these selections.
                </div>
              </div>

              {result.flagged_count === 0 && (
                <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  No anomalies detected. Your dataset looks clean under the current rule set.
                </div>
              )}

              {/* Flagged samples table */}
              <div className="rounded-2xl border border-white/10 bg-white/5 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-1 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm font-medium text-slate-200">
                    Flagged samples ({filteredSamples.length})
                  </div>
                  <div className="text-xs text-slate-400">
                    Sorted by score (highest first). Rule-based flags may have no
                    score.
                  </div>
                </div>

                <div className="max-h-[520px] overflow-auto border-t border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-950/80 backdrop-blur">
                      <tr className="text-xs text-slate-400">
                        <th className="px-5 py-3 w-16">Line</th>
                        <th className="px-5 py-3 w-56">Reason</th>
                        <th className="px-5 py-3 w-28">Severity</th>
                        <th className="px-5 py-3 w-28">Score</th>
                        <th className="px-5 py-3">Preview</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredSamples.map((s, idx) => (
                        <tr
                          key={`${s.line}-${idx}`}
                          className="border-t border-white/5 hover:bg-white/5"
                        >
                          <td className="px-5 py-3 align-top text-slate-200">
                            {s.line}
                          </td>

                          <td className="px-5 py-3 align-top">
                            <span
                              className={cx(
                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                REASON_BADGES[s.reason] ??
                                  "bg-white/10 text-slate-200 ring-1 ring-white/10"
                              )}
                            >
                              {LABELS[s.reason] ?? s.reason}
                            </span>
                          </td>

                          <td className="px-5 py-3 align-top">
                            <span
                              className={cx(
                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                SEVERITY_BADGES[s.severity]
                              )}
                            >
                              {s.severity}
                            </span>
                          </td>

                          <td className="px-5 py-3 align-top text-slate-200 tabular-nums">
                            {typeof s.score === "number"
                              ? s.score.toFixed(4)
                              : "—"}
                          </td>

                          <td className="px-5 py-3 align-top text-slate-200 font-mono text-[12px] leading-5 whitespace-pre-wrap">
                            <div className="line-clamp-2 hover:line-clamp-none whitespace-pre-wrap">
                              {s.preview || "—"}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredSamples.length === 0 && (
                        <tr>
                          <td className="px-5 py-6 text-slate-300" colSpan={5}>
                            No samples match this filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
