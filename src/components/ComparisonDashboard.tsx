import React, { useState, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from "recharts";
import { calculateKrippendorffAlpha } from "../lib/reliability";
import { VLSAPVariable, AuditRecord, StreetViewImage } from "../types";
import { 
  Award, TrendingUp, AlertTriangle, ShieldAlert, Sparkles, CheckCircle2, XCircle, Info, RefreshCw 
} from "lucide-react";

interface ComparisonDashboardProps {
  variables: VLSAPVariable[];
  images: StreetViewImage[];
  audits: AuditRecord[];
  raters: string[];
  activeImage?: StreetViewImage;
  onRefreshStats: () => void;
}

export default function ComparisonDashboard({
  variables,
  images,
  audits,
  raters,
  activeImage,
  onRefreshStats
}: ComparisonDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<"nominal" | "ordinal">("nominal");

  // Filter out any AI or researchers from IRR computations
  const humanRaters = useMemo(() => {
    return raters.filter((r) => r.startsWith("Rater"));
  }, [raters]);

  const imageIds = useMemo(() => images.map((img) => img.id), [images]);

  // 1. Calculate Alpha stats for Cold and Warm reads for all variables
  const alphaStats = useMemo(() => {
    return variables.map((v) => {
      // Cold
      const coldRes = calculateKrippendorffAlpha(
        audits,
        v.id,
        humanRaters,
        imageIds,
        "Cold Read",
        selectedMetric
      );

      // Warm
      const warmRes = calculateKrippendorffAlpha(
        audits,
        v.id,
        humanRaters,
        imageIds,
        "Warm Read",
        selectedMetric
      );

      // Decision tier based on Warm Alpha
      let tier: "Retain" | "Revise" | "Drop" = "Drop";
      let color = "text-red-600 bg-red-50 border-red-200";
      if (warmRes.alpha >= 0.67) {
        tier = "Retain";
        color = "text-emerald-700 bg-emerald-50 border-emerald-200";
      } else if (warmRes.alpha >= 0.40) {
        tier = "Revise";
        color = "text-amber-700 bg-amber-50 border-amber-200";
      }

      return {
        id: v.id,
        name: v.name,
        domain: v.domain,
        coldAlpha: parseFloat(coldRes.alpha.toFixed(3)),
        coldCI: coldRes.bootstrapCI,
        coldUnknown: coldRes.unknownRate,
        warmAlpha: parseFloat(warmRes.alpha.toFixed(3)),
        warmCI: warmRes.bootstrapCI,
        warmUnknown: warmRes.unknownRate,
        tier,
        color
      };
    });
  }, [variables, audits, humanRaters, imageIds, selectedMetric]);

  // 2. Active Image Side-by-Side Comparison Matrix (Human Consensus vs Gemini)
  const comparisonMatrix = useMemo(() => {
    if (!activeImage) return [];
    return variables.map((v) => {
      // Find human ratings for active image in Warm Read
      const humanWarmAudits = audits.filter(
        (a) => a.imageId === activeImage.id && 
               a.variableId === v.id && 
               a.mode === "Warm Read" && 
               humanRaters.includes(a.auditorId)
      );

      // Compute most common human value (mode) or list unique values
      const humanValues = humanWarmAudits.map((a) => a.value).filter(Boolean);
      let humanConsensus = "No data";
      if (humanValues.length > 0) {
        const counts: Record<string, number> = {};
        humanValues.forEach((val) => { counts[val] = (counts[val] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        humanConsensus = sorted[0][0]; // Mode
      }

      // Find Gemini audit for active image
      const geminiAudit = audits.find(
        (a) => a.imageId === activeImage.id && 
               a.variableId === v.id && 
               a.auditorId === "Gemini-3.5-Flash"
      );

      const geminiValue = geminiAudit ? geminiAudit.value : "Not Audited";
      const geminiConfidence = geminiAudit ? geminiAudit.confidence : null;
      const geminiComment = geminiAudit ? geminiAudit.comment : "";

      // Agreement status
      let agreement: "Agreement" | "Disagreement" | "Not Rated" = "Not Rated";
      if (humanValues.length > 0 && geminiAudit) {
        // Strip out brackets/extra texts to do direct comparisons
        const normHuman = humanConsensus.split(" ")[0].toLowerCase();
        const normGemini = geminiValue.split(" ")[0].toLowerCase();
        agreement = normHuman === normGemini ? "Agreement" : "Disagreement";
      }

      return {
        id: v.id,
        name: v.name,
        humanConsensus,
        humanRaterDetails: humanValues.join(", ") || "No records",
        geminiValue,
        geminiConfidence,
        geminiComment,
        agreement
      };
    });
  }, [variables, audits, activeImage, humanRaters]);

  // Aggregate stats
  const averageWarmAlpha = useMemo(() => {
    const valid = alphaStats.map((s) => s.warmAlpha).filter((a) => !isNaN(a));
    if (valid.length === 0) return 0;
    return parseFloat((valid.reduce((sum, current) => sum + current, 0) / valid.length).toFixed(3));
  }, [alphaStats]);

  const retainedCount = alphaStats.filter((s) => s.tier === "Retain").length;
  const revisedCount = alphaStats.filter((s) => s.tier === "Revise").length;
  const droppedCount = alphaStats.filter((s) => s.tier === "Drop").length;

  return (
    <div className="space-y-3 animate-fade-in font-sans" id="vlsap-comparison-dashboard">
      
      {/* Overview Bento Stats Block */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3 shadow-none">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono font-bold uppercase text-slate-400">Mean Calibrated Alpha</span>
            <Award className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">{averageWarmAlpha}</div>
          <div className="text-[9px] text-slate-400 font-mono">Goal: &alpha; &ge; 0.67 standard</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-none border-l-2 border-l-emerald-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono font-bold uppercase text-slate-400">Retain Tier (&ge; 0.67)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-emerald-700 font-mono">{retainedCount}</div>
          <div className="text-[9px] text-slate-400 font-mono">Variables fully certified</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-none border-l-2 border-l-amber-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono font-bold uppercase text-slate-400">Revise Tier (0.40 - 0.67)</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-amber-700 font-mono">{revisedCount}</div>
          <div className="text-[9px] text-slate-400 font-mono">Needs anchor tuning</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-none border-l-2 border-l-red-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono font-bold uppercase text-slate-400">Drop Tier (&lt; 0.40)</span>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-xl font-extrabold text-red-700 font-mono">{droppedCount}</div>
          <div className="text-[9px] text-slate-400 font-mono">Dropped from baseline VLM</div>
        </div>
      </div>

      {/* Main Bar Chart: Cold vs Warm alpha */}
      <div className="bg-white border border-slate-200 rounded p-3 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 font-sans">
              Inter-Rater Reliability (Krippendorff&apos;s &alpha;) Calibration Comparison
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Analyzing N={humanRaters.length} human raters across {imageIds.length} panoramas: Cold vs Warm post-disagreement alignment
            </p>
          </div>

          <div className="flex bg-slate-100 rounded p-0.5 self-start border border-slate-200">
            <button
              onClick={() => setSelectedMetric("nominal")}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-sm transition-all cursor-pointer ${
                selectedMetric === "nominal" ? "bg-white text-slate-900 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Nominal Match
            </button>
            <button
              onClick={() => setSelectedMetric("ordinal")}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-sm transition-all cursor-pointer ${
                selectedMetric === "ordinal" ? "bg-white text-slate-900 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Ordinal Weight
            </button>
          </div>
        </div>

        {/* Recharts Wrapper */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={alphaStats}
              margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="id" 
                tick={{ fontSize: 9, fontFamily: "monospace", fill: "#64748b" }}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis 
                domain={[0, 1.0]} 
                tick={{ fontSize: 9, fontFamily: "sans-serif", fill: "#64748b" }} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "4px" }}
                labelStyle={{ color: "#ffffff", fontWeight: "bold", fontSize: "10px", fontFamily: "monospace" }}
                itemStyle={{ color: "#cbd5e1", fontSize: "10px" }}
              />
              <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "sans-serif" }} />
              {/* Critical alpha threshold boundary */}
              <ReferenceLine 
                y={0.67} 
                stroke="#ef4444" 
                strokeDasharray="4 4" 
                label={{ value: "Baseline (α = 0.67)", fill: "#ef4444", fontSize: 8, position: "top" }} 
              />
              <Bar dataKey="coldAlpha" name="Cold Read" fill="#94a3b8" radius={[2, 2, 0, 0]} />
              <Bar dataKey="warmAlpha" name="Warm Read" fill="#1e293b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Decision Matrix Tier List Table */}
      <div className="bg-white border border-slate-200 rounded shadow-none overflow-hidden">
        <div className="p-3 border-b border-slate-200">
          <h3 className="text-xs font-bold text-slate-900 font-sans">Variable Calibration Tiers & Decision Rules</h3>
          <p className="text-[10px] text-slate-400 font-mono">Summary of statistical outcomes and deployment approvals</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono">
                <th className="px-2.5 py-1.5 font-semibold">Variable</th>
                <th className="px-2.5 py-1.5 font-semibold text-center">Cold &alpha;</th>
                <th className="px-2.5 py-1.5 font-semibold text-center">Warm &alpha; (95% CI)</th>
                <th className="px-2.5 py-1.5 font-semibold text-center">Unknown Rate</th>
                <th className="px-2.5 py-1.5 font-semibold">Decision Rule</th>
                <th className="px-2.5 py-1.5 font-semibold">Action Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
              {alphaStats.map((stat) => (
                <tr key={stat.id} className="hover:bg-slate-50/50">
                  <td className="px-2.5 py-1.5">
                    <div className="font-bold text-slate-900">{stat.name}</div>
                    <div className="font-mono text-[9px] text-slate-400 uppercase">{stat.id} • {stat.domain}</div>
                  </td>
                  <td className="px-2.5 py-1.5 text-center font-mono text-slate-500">{stat.coldAlpha}</td>
                  <td className="px-2.5 py-1.5 text-center font-mono font-bold text-slate-900">
                    {stat.warmAlpha} <span className="text-[9px] text-slate-400 font-normal">({stat.warmCI[0].toFixed(2)}-{stat.warmCI[1].toFixed(2)})</span>
                  </td>
                  <td className="px-2.5 py-1.5 text-center font-mono text-slate-500">{(stat.warmUnknown * 100).toFixed(0)}%</td>
                  <td className="px-2.5 py-1.5">
                    <span className={`px-1.5 py-0.5 border text-[9px] font-bold rounded-sm ${stat.color}`}>
                      {stat.tier === "Retain" ? "RETAIN" : stat.tier === "Revise" ? "REVISE" : "DROP"}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5 text-slate-500 max-w-xs text-[10px] leading-normal">
                    {stat.tier === "Retain" ? (
                      "Usable human ground truth. Approved as baseline VLM comparison benchmark."
                    ) : stat.tier === "Revise" ? (
                      "Anchor mismatch. Refine definition reference, re-pilot prior to VLM matching."
                    ) : (
                      "Unacceptable agreement. No stable human benchmark; cannot validate against VLM."
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Human vs Gemini Side-by-Side Comparison Matrix */}
      {activeImage ? (
        <div className="bg-white border border-slate-200 rounded shadow-none overflow-hidden">
          <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-slate-900 font-sans">
                  Active Human vs Machine Comparison Matrix
                </h3>
                <span className="text-[8px] bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono uppercase font-bold">
                  Live VLM Proxy
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Side-by-side analysis for: <span className="text-slate-900 font-semibold">{activeImage.name}</span>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono">
                  <th className="px-2.5 py-1.5 font-semibold w-1/4">Metric</th>
                  <th className="px-2.5 py-1.5 font-semibold text-center w-1/6">Human Consensus</th>
                  <th className="px-2.5 py-1.5 font-semibold text-center w-1/6">Gemini-3.5-Flash</th>
                  <th className="px-2.5 py-1.5 font-semibold text-center w-1/12">Match State</th>
                  <th className="px-2.5 py-1.5 w-1/3">VLM Qualitative Evaluation Reasoning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                {comparisonMatrix.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-2.5 py-1.5">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="font-mono text-[9px] text-slate-400 uppercase">{item.id}</div>
                    </td>
                    <td className="px-2.5 py-1.5 text-center font-semibold text-slate-800">{item.humanConsensus}</td>
                    <td className="px-2.5 py-1.5 text-center">
                      {item.geminiValue === "Not Audited" ? (
                        <span className="text-slate-300 font-semibold">Not Audited</span>
                      ) : (
                        <div>
                          <div className="font-bold text-indigo-700">{item.geminiValue}</div>
                          {item.geminiConfidence && (
                            <div className="flex items-center justify-center gap-0.5 text-amber-500 text-[9px]">
                              {"★".repeat(item.geminiConfidence)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-2.5 py-1.5 text-center">
                      {item.agreement === "Agreement" ? (
                        <span className="px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold inline-flex items-center gap-0.5">
                          <CheckCircle2 className="h-3 w-3" /> MATCH
                        </span>
                      ) : item.agreement === "Disagreement" ? (
                        <span className="px-1.5 py-0.5 rounded-sm bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold inline-flex items-center gap-0.5">
                          <XCircle className="h-3 w-3" /> CONFLICT
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-2.5 py-1.5 text-slate-500 text-[10px] italic leading-normal">
                      {item.geminiComment || (
                        <span className="text-slate-300">Run Gemini evaluation in Audit panel to generate reasoning logs.</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded p-4 text-center text-slate-400 text-xs font-mono">
          NO ACTIVE IMAGE FOR COMPARISON MATRIX
        </div>
      )}
    </div>
  );
}
