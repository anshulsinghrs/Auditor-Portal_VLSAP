import React, { useState, useMemo } from "react";
import { Sparkles, Play, RefreshCw, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Zap, Info } from "lucide-react";
import ImageViewer from "./ImageViewer";
import { VLSAPVariable, AuditRecord, StreetViewImage } from "../types";

interface AiAuditPanelProps {
  variables: VLSAPVariable[];
  images: StreetViewImage[];
  audits: AuditRecord[];
  raters: string[];
  currentImageIndex: number;
  onChangeImage: (index: number) => void;
  activeProtocol: "A" | "B";
  onToggleProtocol: (p: "A" | "B") => void;
  onTriggerGeminiAudit: () => void;
  isAiAuditing: boolean;
  onRefreshStats: () => void;
}

export default function AiAuditPanel({
  variables,
  images,
  audits,
  raters,
  currentImageIndex,
  onChangeImage,
  activeProtocol,
  onToggleProtocol,
  onTriggerGeminiAudit,
  isAiAuditing,
  onRefreshStats
}: AiAuditPanelProps) {
  const activeImage = images[currentImageIndex];

  // Get AI audit results for the active image
  const aiResults = useMemo(() => {
    if (!activeImage) return [];
    return variables.map((v) => {
      const aiAudit = audits.find(
        (a) => a.imageId === activeImage.id &&
               a.auditorId === "Gemini-3.5-Flash" &&
               a.variableId === v.id
      );
      return {
        id: v.id,
        name: v.name,
        domain: v.domain,
        value: aiAudit?.value || null,
        confidence: aiAudit?.confidence || null,
        comment: aiAudit?.comment || null,
        timestamp: aiAudit?.timestamp || null
      };
    });
  }, [variables, audits, activeImage]);

  const auditedCount = aiResults.filter((r) => r.value !== null).length;

  // Human vs AI comparison
  const humanRaters = useMemo(() => raters.filter((r) => r.startsWith("Rater")), [raters]);

  const comparisonMatrix = useMemo(() => {
    if (!activeImage) return [];
    return variables.map((v) => {
      const humanWarmAudits = audits.filter(
        (a) => a.imageId === activeImage.id &&
               a.variableId === v.id &&
               a.mode === "Warm Read" &&
               humanRaters.includes(a.auditorId)
      );

      const humanValues = humanWarmAudits.map((a) => a.value).filter(Boolean);
      let humanConsensus = "No data";
      if (humanValues.length > 0) {
        const counts: Record<string, number> = {};
        humanValues.forEach((val) => { counts[val] = (counts[val] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        humanConsensus = sorted[0][0];
      }

      const geminiAudit = audits.find(
        (a) => a.imageId === activeImage.id &&
               a.variableId === v.id &&
               a.auditorId === "Gemini-3.5-Flash"
      );

      const geminiValue = geminiAudit ? geminiAudit.value : "Not Audited";
      const geminiConfidence = geminiAudit ? geminiAudit.confidence : null;
      const geminiComment = geminiAudit ? geminiAudit.comment : "";

      let agreement: "Agreement" | "Disagreement" | "Not Rated" = "Not Rated";
      if (humanValues.length > 0 && geminiAudit) {
        const normHuman = humanConsensus.split(" ")[0].toLowerCase();
        const normGemini = geminiValue.split(" ")[0].toLowerCase();
        agreement = normHuman === normGemini ? "Agreement" : "Disagreement";
      }

      return { id: v.id, name: v.name, humanConsensus, geminiValue, geminiConfidence, geminiComment, agreement };
    });
  }, [variables, audits, activeImage, humanRaters]);

  const matchCount = comparisonMatrix.filter((c) => c.agreement === "Agreement").length;
  const conflictCount = comparisonMatrix.filter((c) => c.agreement === "Disagreement").length;

  if (!activeImage) {
    return (
      <div className="p-8 text-center border rounded border-slate-200 bg-white text-slate-400 font-sans text-xs">
        No images loaded. Please sync images from Admin panel first.
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans" id="vlsap-ai-audit-panel">

      {/* Image Navigation Bar */}
      <div className="bg-white border border-slate-200/80 rounded-md p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
          <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
            AI AUDIT
          </span>
          <span>{currentImageIndex + 1} of {images.length} Panoramas</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => onChangeImage(Math.max(0, currentImageIndex - 1))}
            disabled={currentImageIndex === 0}
            className="p-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 transition-colors cursor-pointer border border-slate-200/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex space-x-0.5 max-w-[240px] overflow-x-auto py-0.5 px-1 bg-slate-50 rounded border border-slate-200/60">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => onChangeImage(idx)}
                className={`h-4 w-4 rounded-sm text-[9px] font-mono flex items-center justify-center font-bold shrink-0 transition-all cursor-pointer ${
                  idx === currentImageIndex
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200/70 text-slate-600 hover:bg-slate-300/80"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => onChangeImage(Math.min(images.length - 1, currentImageIndex + 1))}
            disabled={currentImageIndex === images.length - 1}
            className="p-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 transition-colors cursor-pointer border border-slate-200/60"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Split: Image Viewer + AI Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">

        {/* Left: Image Viewer */}
        <div className="lg:col-span-7">
          <ImageViewer
            image={activeImage}
            protocol={activeProtocol}
            onToggleProtocol={onToggleProtocol}
          />
        </div>

        {/* Right: AI Controls + Results */}
        <div className="lg:col-span-5 space-y-3">

          {/* Trigger Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Gemini 3.5 Flash Audit</h3>
                <p className="text-[10px] text-slate-400 font-mono">Vision-language model pedestrian analysis</p>
              </div>
            </div>

            <button
              onClick={onTriggerGeminiAudit}
              disabled={isAiAuditing}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              {isAiAuditing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing Image...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run AI Audit on This Image
                </>
              )}
            </button>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 border border-slate-200 rounded p-2 text-center">
                <div className="text-lg font-bold text-slate-900 font-mono">{auditedCount}</div>
                <div className="text-[8px] text-slate-400 font-mono uppercase">Variables Rated</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-center">
                <div className="text-lg font-bold text-emerald-700 font-mono">{matchCount}</div>
                <div className="text-[8px] text-emerald-600 font-mono uppercase">Matches</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
                <div className="text-lg font-bold text-red-700 font-mono">{conflictCount}</div>
                <div className="text-[8px] text-red-600 font-mono uppercase">Conflicts</div>
              </div>
            </div>
          </div>

          {/* AI Results Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[350px] overflow-y-auto">
            <div className="p-2.5 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
              <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1">
                <Zap className="h-3 w-3 text-indigo-500" /> AI Ratings for {activeImage.name}
              </h4>
            </div>
            <div className="divide-y divide-slate-100">
              {aiResults.map((result) => (
                <div key={result.id} className="px-3 py-2 hover:bg-slate-50/50">
                  <div className="flex items-center justify-between mb-0.5">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase">{result.id}</span>
                      <span className="text-xs font-semibold text-slate-800 block leading-tight">{result.name}</span>
                    </div>
                    {result.value ? (
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {result.value}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">Not audited</span>
                    )}
                  </div>
                  {result.confidence && (
                    <div className="flex items-center gap-1 text-[9px]">
                      <span className="text-amber-500">{"★".repeat(result.confidence)}{"☆".repeat(5 - result.confidence)}</span>
                    </div>
                  )}
                  {result.comment && (
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight italic">{result.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Human vs AI Comparison Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-900 font-sans">Human vs Machine Comparison Matrix</h3>
              <span className="text-[8px] bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
                VLM Proxy
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Comparing for: <span className="text-slate-900 font-semibold">{activeImage.name}</span>
            </p>
          </div>
          <button
            onClick={onRefreshStats}
            className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded border border-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono">
                <th className="px-2.5 py-1.5 font-semibold w-1/4">Metric</th>
                <th className="px-2.5 py-1.5 font-semibold text-center w-1/6">Human Consensus</th>
                <th className="px-2.5 py-1.5 font-semibold text-center w-1/6">Gemini-3.5-Flash</th>
                <th className="px-2.5 py-1.5 font-semibold text-center w-1/12">Match</th>
                <th className="px-2.5 py-1.5 w-1/3">AI Reasoning</th>
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
                      <span className="text-slate-300 font-semibold">—</span>
                    ) : (
                      <div>
                        <div className="font-bold text-indigo-700">{item.geminiValue}</div>
                        {item.geminiConfidence && (
                          <div className="text-amber-500 text-[9px]">{"★".repeat(item.geminiConfidence)}</div>
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
                      <span className="text-slate-300">Run AI audit to generate reasoning.</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
