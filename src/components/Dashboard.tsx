import React from "react";
import { Image, CheckSquare, Clock, UserCheck, Shield, HelpCircle, Activity, ExternalLink } from "lucide-react";
import { StreetViewImage, AuditRecord } from "../types";

interface DashboardProps {
  images: StreetViewImage[];
  audits: AuditRecord[];
  activeRater: string;
  calibrationPhase: "Cold Read" | "Warm Read" | "Reconciliation";
  currentProject: string;
  onOpenInstructions: () => void;
  onSelectImage: (index: number) => void;
  currentIndex: number;
}

export default function Dashboard({
  images,
  audits,
  activeRater,
  calibrationPhase,
  currentProject,
  onOpenInstructions,
  onSelectImage,
  currentIndex
}: DashboardProps) {
  // Compute user statistics
  const totalCount = images.length;

  // An image is completed if we have at least 1 saved answer for it in the current rater session
  const completedIds = Array.from(
    new Set(
      audits
        .filter((a) => a.auditorId === activeRater && a.mode === calibrationPhase)
        .map((a) => a.imageId)
    )
  );
  
  const completedCount = completedIds.length;
  const remainingCount = Math.max(0, totalCount - completedCount);
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Approximate remaining time: 45 seconds per remaining image
  const estRemainingMinutes = Math.ceil((remainingCount * 45) / 60);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="vlsap-dashboard-metrics">
      {/* Total progress bento block */}
      <div className="md:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">Current Phase</span>
              <h2 className="text-base font-bold text-gray-800 font-sans leading-tight">{currentProject}</h2>
            </div>
            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-800 text-xs font-mono font-bold rounded-lg flex items-center gap-1 uppercase">
              <Shield className="h-3 w-3" /> {calibrationPhase}
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-400">AUDITOR PROGRESS</span>
              <span className="text-gray-900 font-bold">{completedCount} / {totalCount} Panorama segments ({completionPercentage}%)</span>
            </div>
            {/* Elegant multi-colored progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-4">
          <div className="flex items-center space-x-2 text-xs text-gray-500 font-mono">
            <Activity className="h-3.5 w-3.5 text-indigo-500" />
            <span>Target human IRR standard: &alpha; &ge; 0.67</span>
          </div>
          
          <button
            onClick={onOpenInstructions}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
          >
            Review Codebook Instructions <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Grid statistics items */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
          <Image className="h-6 w-6" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 block">Total Segments</span>
          <span className="text-2xl font-bold text-gray-900 font-sans">{totalCount}</span>
          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">Locations in manifest</span>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-green-50 text-green-600 rounded-xl shrink-0">
          <CheckSquare className="h-6 w-6" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 block">Remaining Workload</span>
          <span className="text-2xl font-bold text-gray-900 font-sans">{remainingCount}</span>
          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">~ {estRemainingMinutes} min remaining</span>
        </div>
      </div>
    </div>
  );
}
