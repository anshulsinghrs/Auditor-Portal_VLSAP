import React, { useState } from "react";
import { Info, HelpCircle, ChevronDown, ChevronUp, Save, Star, AlertCircle } from "lucide-react";
import { VLSAPVariable, AuditRecord } from "../types";

interface AuditFormProps {
  variables: VLSAPVariable[];
  currentImageId: string;
  activeRater: string;
  activeMode: "Training" | "Cold Read" | "Warm Read" | "Validation";
  answers: Record<string, { value: string; confidence: number; comment: string }>;
  onSaveAnswer: (
    variableId: string, 
    data: { value: string; confidence: number; comment: string }
  ) => void;
}

export default function AuditForm({
  variables,
  currentImageId,
  activeRater,
  activeMode,
  answers,
  onSaveAnswer
}: AuditFormProps) {
  // Collapsed states per domain
  const [collapsedDomains, setCollapsedDomains] = useState<Record<string, boolean>>({
    "Pedestrian Infrastructure": false,
    "Crossing Infrastructure": false,
    "Pedestrian Space Occupation": false,
    "Traffic Environment": false,
    "Holistic Walkability": false
  });

  // Modal target for the active variable info popups
  const [infoTarget, setInfoTarget] = useState<VLSAPVariable | null>(null);

  // Helper to group variables by domain
  const domains = Array.from(new Set(variables.map((v) => v.domain)));

  const toggleDomain = (domain: string) => {
    setCollapsedDomains((prev) => ({ ...prev, [domain]: !prev[domain] }));
  };

  // Check if a variable is disabled due to dependencies
  const checkIsDisabled = (v: VLSAPVariable) => {
    if (!v.requires) return { disabled: false, message: "" };
    
    const dependencyVarId = v.requires.variableId;
    const dependencyTargetValue = v.requires.value;
    const dependencyCurrentAnswer = answers[dependencyVarId]?.value;

    if (dependencyCurrentAnswer !== dependencyTargetValue) {
      return { 
        disabled: true, 
        message: v.requires.disableMessage || `Disabled unless ${dependencyVarId} is '${dependencyTargetValue}'.`
      };
    }
    return { disabled: false, message: "" };
  };

  const handleValueChange = (variableId: string, value: string) => {
    const existing = answers[variableId] || { value: "", confidence: 4, comment: "" };
    
    // Custom dependency cascades
    // E.g., if we mark "footway_present" as "Absent", we clear/disable sub-metrics
    if (variableId === "footway_present" && value === "Absent") {
      // Trigger save of children variables as "N/A"
      variables.forEach((variable) => {
        if (variable.requires?.variableId === "footway_present") {
          let defaultValue = "N/A";
          if (variable.id === "footway_continuity") defaultValue = "No Footway";
          onSaveAnswer(variable.id, { value: defaultValue, confidence: 5, comment: "Automatically set due to absence of footway structure." });
        }
      });
    }

    onSaveAnswer(variableId, { ...existing, value });
  };

  const handleConfidenceChange = (variableId: string, confidence: number) => {
    const existing = answers[variableId] || { value: "", confidence: 4, comment: "" };
    onSaveAnswer(variableId, { ...existing, confidence });
  };

  const handleCommentChange = (variableId: string, comment: string) => {
    const existing = answers[variableId] || { value: "", confidence: 4, comment: "" };
    onSaveAnswer(variableId, { ...existing, comment });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded border border-slate-200/80 shadow-none font-sans" id="vlsap-audit-form-container">
      {/* Active Auditor Panel */}
      <div className="bg-slate-100/80 border-b border-slate-200/80 p-2.5 rounded-t flex items-center justify-between">
        <div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Current Session</span>
          <div className="flex items-center space-x-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-900 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800">{activeRater}</span>
            <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
              {activeMode}
            </span>
          </div>
        </div>

      </div>

      {/* Structured domains */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        {domains.map((domain) => {
          const domainVars = variables.filter((v) => v.domain === domain);
          const isCollapsed = collapsedDomains[domain];

          // Count completed variables in this domain
          const completedCount = domainVars.filter((v) => {
            const { disabled } = checkIsDisabled(v);
            return disabled || (answers[v.id]?.value && answers[v.id]?.value !== "");
          }).length;

          return (
            <div key={domain} className="border border-slate-200/80 rounded overflow-hidden shadow-none">
              {/* Collapsible header */}
              <button
                onClick={() => toggleDomain(domain)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 px-3 py-2 flex items-center justify-between border-b border-slate-200/80 transition-colors text-left cursor-pointer animate-fade-in"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900 font-sans">{domain}</span>
                  <span className="text-[9px] font-mono bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded-sm font-semibold">
                    {completedCount} / {domainVars.length} Done
                  </span>
                </div>
                {isCollapsed ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronUp className="h-3.5 w-3.5 text-slate-500" />}
              </button>

              {/* Collapsible items */}
              {!isCollapsed && (
                <div className="p-2 bg-slate-50/20 space-y-2 divide-y divide-slate-100">
                  {domainVars.map((v) => {
                    const ans = answers[v.id] || { value: "", confidence: 4, comment: "" };
                    const { disabled, message } = checkIsDisabled(v);

                    return (
                      <div 
                        key={v.id} 
                        className={`bg-white border p-2.5 rounded shadow-none transition-all relative ${
                          disabled ? "opacity-45 border-slate-100 bg-slate-50/50 select-none animate-fade-in" : "border-slate-200/60 hover:border-slate-300"
                        }`}
                        id={`var-card-${v.id}`}
                      >
                        {/* Title and info trigger */}
                        <div className="flex items-start justify-between gap-1.5 mb-2">
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 font-bold uppercase block tracking-wider">
                              ID: {v.id.toUpperCase()}
                            </span>
                            <span className="text-xs font-semibold text-slate-800 leading-tight">
                              {v.name}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => setInfoTarget(v)}
                            className="p-1 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded transition-colors cursor-pointer border border-slate-200/40"
                            title="Review codebook, definitions, & examples"
                          >
                            <Info className="h-3 w-3" />
                          </button>
                        </div>

                        {disabled ? (
                          /* DISABLED OVERLAY OR MESSAGE */
                          <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-medium py-1">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                            <span>{message}</span>
                          </div>
                        ) : (
                          /* RATING SECTION */
                          <div className="space-y-2">
                            {/* Options Radio List */}
                            <div className="flex flex-wrap gap-1">
                              {v.options.map((opt) => (
                                <button
                                  key={opt}
                                  onClick={() => handleValueChange(v.id, opt)}
                                  className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                                    ans.value === opt
                                      ? "bg-slate-900 border-slate-900 text-white shadow-none"
                                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}

                              {/* Unknown Option */}
                              <button
                                onClick={() => handleValueChange(v.id, "Unknown")}
                                className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                                  ans.value === "Unknown"
                                    ? "bg-amber-700 border-amber-700 text-white shadow-none"
                                    : "bg-white border-slate-200 text-amber-700 hover:border-amber-350"
                                }`}
                              >
                                Unknown
                              </button>
                            </div>

                            {/* Confidence Rating (1-5 Stars) */}
                            {ans.value !== "" && ans.value !== "N/A" && (
                              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-medium text-slate-500 font-mono">Confidence:</span>
                                <div className="flex items-center space-x-0.5">
                                  {[1, 2, 3, 4, 5].map((stars) => (
                                    <button
                                      key={stars}
                                      onClick={() => handleConfidenceChange(v.id, stars)}
                                      className="p-0.5 hover:scale-105 transition-transform cursor-pointer"
                                      title={`Level ${stars}`}
                                    >
                                      <Star 
                                        className={`h-3.5 w-3.5 ${
                                          stars <= ans.confidence 
                                            ? "text-amber-400 fill-amber-400" 
                                            : "text-slate-200"
                                        }`} 
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Qualitative Comments */}
                            {ans.value !== "" && (
                              <div className="pt-1">
                                <textarea
                                  value={ans.comment}
                                  onChange={(e) => handleCommentChange(v.id, e.target.value)}
                                  placeholder="Record reasons for unknown, anomalous visual blocks, or specific spatial constraints..."
                                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded p-1.5 text-[11px] transition-all outline-none font-sans leading-snug h-10 resize-none"
                                />
                              </div>
                            )}

                            {/* Automatic Autosave indicator */}
                            {ans.value !== "" && (
                              <div className="text-[8px] font-mono text-slate-400 text-right">
                                Saved immediately to manifest database
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Codebook Definitions Modal */}
      {infoTarget && (
        <div 
          className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-3 backdrop-blur-sm animate-fade-in"
          onClick={() => setInfoTarget(null)}
        >
          <div 
            className="bg-white border border-slate-200/80 rounded w-full max-w-xl shadow-lg p-4 overflow-y-auto max-h-[90vh] text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200/80 pb-2.5 mb-2.5">
              <div>
                <span className="text-[9px] font-mono text-indigo-700 font-bold uppercase tracking-wider block">
                  Codebook Reference • {infoTarget.id.toUpperCase()}
                </span>
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  {infoTarget.name}
                </h3>
              </div>
              <button 
                onClick={() => setInfoTarget(null)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded border cursor-pointer"
              >
                Close [Esc]
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 font-sans">
              <div>
                <h4 className="font-bold text-[10px] text-slate-900 uppercase tracking-wide font-mono mb-0.5">Definition:</h4>
                <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-200/60 leading-normal text-[11px]">{infoTarget.definition}</p>
              </div>

              <div>
                <h4 className="font-bold text-[10px] text-slate-900 uppercase tracking-wide font-mono mb-0.5">Observable Evidence Rules:</h4>
                <p className="text-slate-600 leading-normal text-[11px]">{infoTarget.evidence}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2 border border-green-200 bg-green-50/30 rounded">
                  <h5 className="font-bold text-[10px] text-green-950 uppercase tracking-wider font-mono mb-0.5">Positive Examples (+):</h5>
                  <ul className="list-disc pl-3.5 space-y-0.5 text-[11px] text-green-900">
                    {infoTarget.positiveExamples.map((ex, idx) => (
                      <li key={idx}>{ex}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-2 border border-red-200 bg-red-50/30 rounded">
                  <h5 className="font-bold text-[10px] text-red-950 uppercase tracking-wider font-mono mb-0.5">Negative Examples (-):</h5>
                  <ul className="list-disc pl-3.5 space-y-0.5 text-[11px] text-red-900">
                    {infoTarget.negativeExamples.map((ex, idx) => (
                      <li key={idx}>{ex}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-2 border border-amber-200 bg-amber-50/30 rounded">
                <h4 className="font-bold text-[10px] text-amber-950 uppercase tracking-wide font-mono mb-0.5">Unknown Rule:</h4>
                <p className="text-[11px] text-amber-900 leading-normal">{infoTarget.unknownRule}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
