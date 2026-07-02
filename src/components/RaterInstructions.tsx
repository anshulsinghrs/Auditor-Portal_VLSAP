import React from "react";
import { ClipboardList, CheckCircle, ShieldAlert, BookOpen } from "lucide-react";

interface RaterInstructionsProps {
  onAccept: () => void;
}

export default function RaterInstructions({ onAccept }: RaterInstructionsProps) {
  return (
    <div className="max-w-2xl mx-auto my-4 p-4 bg-white border border-slate-200 rounded shadow-none animate-fade-in" id="vlsap-instructions-panel">
      <div className="flex items-center space-x-3 border-b border-slate-200 pb-3 mb-3">
        <div className="p-2 bg-amber-50 text-amber-700 rounded border border-amber-200/50">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-950 font-sans">
            VLSAP Human Auditor Calibration Protocols
          </h1>
          <p className="text-[10px] text-slate-400 font-mono">
            Platform Instrument Version: VLSAP-Pilot-v1 • Academic Benchmark Study
          </p>
        </div>
      </div>

      <div className="space-y-3 text-slate-700 leading-normal font-sans">
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-start space-x-2 text-[11px] text-slate-800">
          <ShieldAlert className="h-4 w-4 text-slate-800 mt-0.5 shrink-0" />
          <div className="leading-normal">
            <strong>Mandatory Scientific Mandate:</strong> This is a scientific instrument for VLM benchmarking. Strict adherence to rater protocols is required to maintain high inter-rater reliability (&alpha; &ge; 0.67).
          </div>
        </div>

        <h2 className="text-[10px] font-bold text-slate-950 uppercase tracking-wide font-mono flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-slate-500" /> Core Auditing Rules
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 border border-slate-200 rounded bg-slate-50/50">
            <h3 className="font-bold text-slate-900 mb-0.5">1. Evaluate Only Observable Evidence</h3>
            <p className="text-slate-600 leading-normal text-[11px]">Only record physical items clearly visible in the Street View frame. Never extrapolate or assume.</p>
          </div>

          <div className="p-2 border border-slate-200 rounded bg-slate-50/50">
            <h3 className="font-bold text-slate-900 mb-0.5">2. Never Guess</h3>
            <p className="text-slate-600 leading-normal text-[11px]">If a physical variable is hidden behind objects, parked cars, or is too distant to confidently resolve, do not speculate.</p>
          </div>

          <div className="p-2 border border-slate-200 rounded bg-slate-50/50">
            <h3 className="font-bold text-slate-900 mb-0.5">3. Unknown is Acceptable</h3>
            <p className="text-slate-600 leading-normal text-[11px]">Selecting &quot;Unknown&quot; is a valid data point. High-quality Unknown rates are superior to speculative false-positives.</p>
          </div>

          <div className="p-2 border border-slate-200 rounded bg-slate-50/50">
            <h3 className="font-bold text-slate-900 mb-0.5">4. Evaluate Each Image Independently</h3>
            <p className="text-slate-600 leading-normal text-[11px]">Do not let previous ratings or nearby street features influence your rating of the current segment.</p>
          </div>

          <div className="p-2 border border-slate-200 rounded bg-slate-50/50">
            <h3 className="font-bold text-slate-900 mb-0.5">5. Ignore Temporary Pedestrians</h3>
            <p className="text-slate-600 leading-normal text-[11px]">Ignore passing crowds or people walking unless their presence physically blocks pedestrian walkways permanently.</p>
          </div>

          <div className="p-2 border border-slate-200 rounded bg-slate-50/50">
            <h3 className="font-bold text-slate-900 mb-0.5">6. Rate Infrastructure, Not Beauty</h3>
            <p className="text-slate-600 leading-normal text-[11px]">Evaluate utility, width, and walkability. A visually unappealing street can be highly walkable; beautiful paths can be broken.</p>
          </div>

          <div className="p-2 border border-slate-200 rounded bg-slate-50/50">
            <h3 className="font-bold text-slate-900 mb-0.5">7. Complete Cold Read Independently</h3>
            <p className="text-slate-600 leading-normal text-[11px]">The initial review phase must be conducted blind to other raters. No joint discussions are allowed prior to cold read completion.</p>
          </div>

          <div className="p-2 border border-slate-200 rounded bg-slate-50/50">
            <h3 className="font-bold text-slate-900 mb-0.5">8. Calibration-Driven Warm Reads</h3>
            <p className="text-slate-600 leading-normal text-[11px]">Warm Read re-auditing occurs only after inter-rater consensus meetings where discrepant anchors are addressed.</p>
          </div>

          <div className="p-2 border border-slate-200 rounded bg-slate-50/50">
            <h3 className="font-bold text-slate-900 mb-0.5">9. Descriptive Confidence</h3>
            <p className="text-slate-600 leading-normal text-[11px]">Confidence scores (1-5) must purely describe physical visibility (e.g., 5: crystal clear, 1: heavily shadowed/distant).</p>
          </div>

          <div className="p-2 border border-slate-200 rounded bg-slate-50/50">
            <h3 className="font-bold text-slate-900 mb-0.5">10. Explanatory Comments Only</h3>
            <p className="text-slate-600 leading-normal text-[11px]">Comments should be used strictly to detail uncertainty, visual anomalies, or specific obstructions rather than routine marks.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-mono">
          <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></span>
          <span>Security Protocol Active • ID verified via email</span>
        </div>
        <button
          onClick={onAccept}
          className="w-full sm:w-auto px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded border border-slate-950 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-none"
          id="accept-instructions-btn"
        >
          <CheckCircle className="h-3.5 w-3.5 text-green-400" />
          I have read and understood the instructions
        </button>
      </div>
    </div>
  );
}
