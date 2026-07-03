import React, { useState } from "react";
import { 
  FolderSync, UserPlus, Trash2, Key, Lock, Unlock, Download, Calendar, Play, AlertCircle, CheckCircle, Database, Shuffle, RefreshCw, Sparkles 
} from "lucide-react";
import { StreetViewImage, AuditRecord } from "../types";

interface AdminPanelProps {
  images: StreetViewImage[];
  audits: AuditRecord[];
  raters: string[];
  googleApiKey: string;
  hasGoogleApiKey: boolean;
  googleDriveFolderId: string;
  instrumentLocked: boolean;
  calibrationPhase: "Cold Read" | "Warm Read" | "Reconciliation";
  currentProject: string;
  onSaveSettings: (settings: {
    raters?: string[];
    currentProject?: string;
    calibrationPhase?: "Cold Read" | "Warm Read" | "Reconciliation";
    googleApiKey?: string;
    googleDriveFolderId?: string;
    instrumentLocked?: boolean;
    autoAssignEnabled?: boolean;
    autoAssignCount?: number;
  }) => void;
  onTriggerDriveSync: (apiKey: string, folderId: string) => Promise<{ success: boolean; message: string }>;
  onClearAudits: () => void;
  onShuffleImages: (count: number) => Promise<{ success: boolean; message: string }>;
  onResetImages: () => Promise<{ success: boolean; message: string }>;
  onAssignImages: (auditorId: string, count: number) => Promise<{ success: boolean; message: string }>;
  onUnassignImages: (auditorId: string) => Promise<{ success: boolean; message: string }>;
  auditorImages: Record<string, string[]>;
  auditorProfiles: Record<string, any>;
  autoAssignEnabled: boolean;
  autoAssignCount: number;
}

export default function AdminPanel({
  images,
  audits,
  raters,
  googleApiKey,
  hasGoogleApiKey,
  googleDriveFolderId,
  instrumentLocked,
  calibrationPhase,
  currentProject,
  onSaveSettings,
  onTriggerDriveSync,
  onClearAudits,
  onShuffleImages,
  onResetImages,
  onAssignImages,
  onUnassignImages,
  auditorImages,
  auditorProfiles,
  autoAssignEnabled,
  autoAssignCount
}: AdminPanelProps) {
  const [newRater, setNewRater] = useState("");
  const [assignCountMap, setAssignCountMap] = useState<Record<string, number>>({});
  const [apiKeyInput, setApiKeyInput] = useState(googleApiKey);
  const [folderIdInput, setFolderIdInput] = useState(googleDriveFolderId);
  const [syncStatus, setSyncStatus] = useState<{ type: "success" | "error" | "loading" | null; message: string }>({
    type: null,
    message: ""
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState(currentProject);
  
  // Sizing and shuffle states
  const [sessionCount, setSessionCount] = useState(25);
  const [isSizing, setIsSizing] = useState(false);
  const [sizeStatus, setSizeStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: ""
  });

  const handleShuffleLimit = async () => {
    setIsSizing(true);
    setSizeStatus({ type: null, message: "" });
    try {
      const res = await onShuffleImages(sessionCount);
      if (res.success) {
        setSizeStatus({ type: "success", message: res.message });
      } else {
        setSizeStatus({ type: "error", message: res.message || "Failed to configure queue." });
      }
    } catch (e: any) {
      setSizeStatus({ type: "error", message: e.message || "An unexpected error occurred." });
    } finally {
      setIsSizing(false);
    }
  };

  const handleResetImages = async () => {
    setIsSizing(true);
    setSizeStatus({ type: null, message: "" });
    try {
      const res = await onResetImages();
      if (res.success) {
        setSizeStatus({ type: "success", message: res.message });
      } else {
        setSizeStatus({ type: "error", message: res.message || "Failed to reset queue." });
      }
    } catch (e: any) {
      setSizeStatus({ type: "error", message: e.message || "An unexpected error occurred." });
    } finally {
      setIsSizing(false);
    }
  };

  // 1. Export as CSV
  const handleExportCSV = () => {
    if (audits.length === 0) {
      alert("No audits recorded yet to export.");
      return;
    }

    const headers = [
      "Record ID", "Image ID", "Drive File ID", "Auditor ID", 
      "Audit Version", "Instrument Version", "Timestamp", 
      "Variable ID", "Recorded Value", "Confidence", "Comment", "Phase Mode", "Protocol"
    ];

    const rows = audits.map((a) => [
      a.id,
      a.imageId,
      a.driveId,
      a.auditorId,
      a.auditVersion,
      a.instrumentVersion,
      a.timestamp,
      a.variableId,
      a.value,
      a.confidence,
      `"${(a.comment || "").replace(/"/g, '""')}"`, // escape quotes
      a.mode,
      a.protocol
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vlsap_audit_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export as JSON
  const handleExportJSON = () => {
    if (audits.length === 0) {
      alert("No audits recorded yet to export.");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(audits, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `vlsap_audit_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // Add a new rater to the pool
  const handleAddRater = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRater.trim();
    if (!trimmed) return;
    if (raters.includes(trimmed)) {
      alert("Auditor is already in the project pool.");
      return;
    }
    const updated = [...raters, trimmed];
    onSaveSettings({ raters: updated });
    setNewRater("");
  };

  // Remove a rater from the pool
  const handleRemoveRater = (rater: string) => {
    if (rater.startsWith("Rater A") || rater.startsWith("Rater B")) {
      alert("Base core calibration raters cannot be removed.");
      return;
    }
    const updated = raters.filter((r) => r !== rater);
    onSaveSettings({ raters: updated });
  };

  // Sync Google Drive crawler
  const handleSyncDrive = async () => {
    setIsSyncing(true);
    setSyncStatus({ type: "loading", message: `Connecting to Google Drive folder '${folderIdInput}'...` });
    
    try {
      const res = await onTriggerDriveSync(apiKeyInput, folderIdInput);
      if (res.success) {
        setSyncStatus({ type: "success", message: res.message });
      } else {
        setSyncStatus({ type: "error", message: res.message });
      }
    } catch (e: any) {
      setSyncStatus({ type: "error", message: `Connection failed: ${e.message}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateProjectName = () => {
    if (!projectNameInput.trim()) return;
    onSaveSettings({ currentProject: projectNameInput.trim() });
  };

  // Coverage stats. "Images audited" = distinct panoramas that have at least one
  // human (non-AI) evaluation. A per-rater breakdown is also computed for the team card.
  const auditedByRater: Record<string, Set<string>> = {};
  audits.forEach((a) => {
    if (!auditedByRater[a.auditorId]) auditedByRater[a.auditorId] = new Set();
    auditedByRater[a.auditorId].add(a.imageId);
  });
  const auditedImageCount = new Set(
    audits.filter((a) => a.auditorId !== "Gemini-3.5-Flash").map((a) => a.imageId)
  ).size;

  return (
    <div className="space-y-3 text-slate-800 font-sans animate-fade-in" id="vlsap-admin-panel">

      {/* Study coverage summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/85 rounded p-3 shadow-none">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono font-bold uppercase text-slate-400">Catalog Images</span>
            <Database className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">{images.length}</div>
          <div className="text-[9px] text-slate-400 font-mono">Panoramas in active queue</div>
        </div>

        <div className="bg-white border border-slate-200/85 rounded p-3 shadow-none border-l-2 border-l-emerald-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono font-bold uppercase text-slate-400">Images Audited</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-emerald-700 font-mono">{auditedImageCount}</div>
          <div className="text-[9px] text-slate-400 font-mono">Distinct images with a human evaluation</div>
        </div>

        <div className="bg-white border border-slate-200/85 rounded p-3 shadow-none col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono font-bold uppercase text-slate-400">Total Evaluations</span>
            <Sparkles className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">{audits.length}</div>
          <div className="text-[9px] text-slate-400 font-mono">Records across all raters &amp; AI</div>
        </div>
      </div>

      {/* 2-Column Core settings layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        
        {/* Card 1: Google Drive Image Syncer */}
        <div className="bg-white border border-slate-200/85 rounded p-3 shadow-none space-y-2.5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <FolderSync className="h-4 w-4 text-slate-700" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-tight">Google Drive Image Syncer</h3>
              <p className="text-[9px] text-slate-400 font-mono truncate max-w-[200px]" title={googleDriveFolderId}>
                Folder: <a href={`https://drive.google.com/drive/folders/${googleDriveFolderId}?usp=sharing`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-850 hover:underline">{googleDriveFolderId}</a>
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] text-slate-500 leading-normal">
              Retrieve all photographic panoramas matching <code>jpg, jpeg, png, webp</code> directly from the shared research folder.
            </p>
            
            <div className="space-y-1.5">
              <div className="relative">
                <Key className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={hasGoogleApiKey ? "A key is configured — enter a new one to replace it" : "Enter Google API Key"}
                  className="w-full bg-slate-50 border border-slate-200/85 focus:border-slate-400 rounded pl-7 pr-2.5 py-1 text-[11px] transition-all outline-none font-mono"
                />
                <span className={`absolute right-2 top-1.5 text-[8px] font-mono font-bold uppercase px-1 rounded-sm border ${
                  hasGoogleApiKey
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-100 border-slate-200 text-slate-500"
                }`}>
                  {hasGoogleApiKey ? "Configured" : "Not set"}
                </span>
              </div>

              <div className="flex items-center space-x-1.5">
                <div className="relative flex-1">
                  <Database className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={folderIdInput}
                    onChange={(e) => setFolderIdInput(e.target.value)}
                    placeholder="Enter Google Drive Folder ID"
                    className="w-full bg-slate-50 border border-slate-200/85 focus:border-slate-400 rounded pl-7 pr-2.5 py-1 text-[11px] transition-all outline-none font-mono"
                  />
                </div>
                <button
                  onClick={handleSyncDrive}
                  disabled={isSyncing}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded transition-colors cursor-pointer border border-slate-950 shrink-0"
                >
                  Sync Folder
                </button>
              </div>
            </div>
          </div>

          {syncStatus.type && (
            <div className={`p-2 border rounded text-[11px] flex items-start space-x-1.5 ${
              syncStatus.type === "success" 
                ? "bg-green-50 border-green-200 text-green-800" 
                : syncStatus.type === "error" 
                ? "bg-red-50 border-red-200 text-red-800" 
                : "bg-slate-50 border-slate-200 text-slate-850"
            }`}>
              {syncStatus.type === "success" && <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-600 mt-0.5" />}
              {syncStatus.type === "error" && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600 mt-0.5" />}
              {syncStatus.type === "loading" && <span className="h-3 w-3 border border-slate-900 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5"></span>}
              <span className="leading-tight">{syncStatus.message}</span>
            </div>
          )}

          <div className="bg-slate-50 p-2 rounded border border-slate-150 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">Currently Cached Images:</span>
            <span className="text-slate-900 font-bold">{images.length} Panoramas</span>
          </div>
        </div>

        {/* Card 2: Auditor Team Assignment */}
        <div className="bg-white border border-slate-200/85 rounded p-3 shadow-none space-y-2.5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <UserPlus className="h-4 w-4 text-slate-700" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-tight">Auditor Team Assignments</h3>
              <p className="text-[9px] text-slate-400 font-mono">Manage rater pools contributing to IRR benchmarks</p>
            </div>
          </div>

          <form onSubmit={handleAddRater} className="flex space-x-1.5">
            <input
              type="text"
              value={newRater}
              onChange={(e) => setNewRater(e.target.value)}
              placeholder="E.g., Rater F"
              className="flex-1 bg-slate-50 border border-slate-200/85 focus:border-slate-400 rounded px-2.5 py-1 text-[11px] transition-all outline-none font-sans"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded transition-colors cursor-pointer border border-slate-950 shrink-0"
            >
              Add Auditor
            </button>
          </form>

          <div className="grid grid-cols-1 gap-1.5 h-32 overflow-y-auto pr-1">
            {(() => {
              let localDetails: any = {};
              try {
                const localProfilesStr = localStorage.getItem("vlsap_auditor_profiles_details") || "{}";
                localDetails = JSON.parse(localProfilesStr);
              } catch (e) {}

              // Prefer server-synced profiles (all devices) and fall back to this
              // device's local cache so every auditor's details are shown.
              const profilesDetails: any = { ...localDetails, ...(auditorProfiles || {}) };

              return raters.map((rater) => {
                const details = profilesDetails[rater];
                return (
                  <div 
                    key={rater}
                    className="flex flex-col bg-slate-50 border border-slate-150 rounded px-2.5 py-1.5 text-[10px] font-mono gap-0.5 hover:border-slate-350 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-slate-700 font-bold">{rater}</span>
                      {!rater.startsWith("Rater A") && !rater.startsWith("Rater B") && (
                        <button
                          onClick={() => handleRemoveRater(rater)}
                          className="p-0.5 hover:text-red-500 text-slate-400 rounded transition-colors cursor-pointer"
                          title="Remove Auditor"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                     {details ? (
                      <div className="text-[9px] text-slate-500 font-sans grid grid-cols-2 gap-x-2 gap-y-0.5 border-t border-slate-200/50 pt-1 mt-0.5">
                        <div>Gender: <span className="font-semibold text-slate-700">{details.gender}</span></div>
                        <div>Age: <span className="font-semibold text-slate-700">{details.age}</span></div>
                        <div className="col-span-2 truncate">Role: <span className="font-semibold text-slate-700" title={details.designation}>{details.designation}</span></div>
                        <div className="col-span-2 truncate">Edu: <span className="font-semibold text-slate-700" title={details.education}>{details.education}</span></div>
                      </div>
                    ) : (
                      <span className="text-[8px] text-slate-400 font-sans italic border-t border-slate-100 pt-0.5">Core calibration rater (no profile metadata)</span>
                    )}

                    {/* Queue Assignment Sub-section */}
                    <div className="border-t border-slate-200/50 pt-1.5 mt-1.5 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[8px] font-sans">
                        <span className="text-slate-500 font-semibold">Images Audited:</span>
                        <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-1 rounded-sm">
                          {auditedByRater[rater]?.size || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-sans">
                        <span className="text-slate-500 font-semibold">Queue Scope:</span>
                        {auditorImages[rater] && auditorImages[rater].length > 0 ? (
                          <span className="bg-amber-100 border border-amber-200 text-amber-800 font-bold px-1 rounded-sm">
                            Assigned {auditorImages[rater].length} images
                          </span>
                        ) : (
                          <span className="bg-slate-100 border border-slate-200 text-slate-600 font-bold px-1 rounded-sm">
                            Full Catalog
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          placeholder="25"
                          value={assignCountMap[rater] ?? 25}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value) || 25);
                            setAssignCountMap(prev => ({ ...prev, [rater]: val }));
                          }}
                          className="w-10 bg-white border border-slate-200 rounded px-1 py-0.5 text-center font-bold text-[9px] outline-none"
                        />
                        <button
                          onClick={async () => {
                            const cnt = assignCountMap[rater] ?? 25;
                            await onAssignImages(rater, cnt);
                          }}
                          className="px-1.5 py-0.5 bg-slate-900 text-white font-bold text-[9px] rounded hover:bg-slate-800 cursor-pointer"
                        >
                          Assign
                        </button>
                        {auditorImages[rater] && auditorImages[rater].length > 0 && (
                          <button
                            onClick={async () => {
                              await onUnassignImages(rater);
                            }}
                            className="px-1.5 py-0.5 bg-white border border-slate-200 text-red-600 hover:text-red-700 font-bold text-[9px] rounded cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Card 3: Calibration & Protocols */}
        <div className="bg-white border border-slate-200/85 rounded p-3 shadow-none space-y-2.5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Calendar className="h-4 w-4 text-slate-700" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-tight">Calibration Phase Manager</h3>
              <p className="text-[9px] text-slate-400 font-mono">Control study workflow and editing bounds</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-0.5">Active Study Name:</label>
              <div className="flex space-x-1.5">
                <input
                  type="text"
                  value={projectNameInput}
                  onChange={(e) => setProjectNameInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200/85 focus:border-slate-400 rounded px-2.5 py-1 text-[11px] transition-all outline-none font-sans"
                />
                <button
                  onClick={handleUpdateProjectName}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-[11px] rounded cursor-pointer"
                >
                  Save Name
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(["Cold Read", "Warm Read", "Reconciliation"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onSaveSettings({ calibrationPhase: mode })}
                  className={`px-1.5 py-1.5 rounded border font-bold flex flex-col items-center justify-center text-center gap-0.5 cursor-pointer transition-all ${
                    calibrationPhase === mode 
                      ? "bg-slate-900 border-slate-950 text-white shadow-none" 
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span className="text-[9px] uppercase font-mono tracking-wide">{mode}</span>
                  <span className="text-[8px] font-semibold opacity-85 leading-tight">
                    {mode === "Cold Read" 
                      ? "Blind audits" 
                      : mode === "Warm Read" 
                      ? "Post-consensus" 
                      : "Final conflict lock"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: Baseline Lock & Data Security */}
        <div className="bg-white border border-slate-200/80 rounded p-3 shadow-none space-y-2.5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Lock className="h-4 w-4 text-slate-700" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-tight">Baseline Protocol Lock</h3>
              <p className="text-[9px] text-slate-400 font-mono">Verify and lock VLSAP taxonomy baseline</p>
            </div>
          </div>

          <div className="space-y-2 text-[11px]">
            <p className="text-slate-500 leading-normal">
              Locking prevents modifications to variables and domains, guaranteeing database integrity during active validation trials.
            </p>

            <div className="flex items-center justify-between p-2 rounded border border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-1.5">
                {instrumentLocked ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />
                )}
                <div>
                  <span className="font-bold block text-slate-800 text-[11px]">
                    {instrumentLocked ? "Taxonomy Baseline Locked" : "Taxonomy Editing Permitted"}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Instrument Version: VLSAP-Pilot-v1</span>
                </div>
              </div>

              <button
                onClick={() => onSaveSettings({ instrumentLocked: !instrumentLocked })}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                  instrumentLocked 
                    ? "bg-red-50 hover:bg-red-100 border-red-200 text-red-700" 
                    : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                }`}
              >
                {instrumentLocked ? (
                  <>
                    <Unlock className="h-3 w-3" /> Unlock
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" /> Lock Taxonomy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Card 5: Audit Session Sizing & Randomization */}
        <div className="bg-white border border-slate-200/80 rounded p-3 shadow-none space-y-2.5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-tight">Session Sizing & Randomization</h3>
              <p className="text-[9px] text-slate-400 font-mono">Limit active queues to random subsets of images</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <p className="text-slate-500 leading-normal text-[11px]">
              Set a calibration segment (e.g. 25 random images) for your raters. All raters will see the same randomized sequence.
            </p>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] font-bold text-slate-500 uppercase font-mono">Images count</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={sessionCount}
                  onChange={(e) => setSessionCount(Math.max(1, Number(e.target.value) || 25))}
                  className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center font-bold text-[11px] outline-none"
                />
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <button
                  onClick={handleShuffleLimit}
                  disabled={isSizing}
                  className="w-full py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-[10px] rounded transition-colors cursor-pointer border border-slate-950 flex items-center justify-center gap-1"
                >
                  <Shuffle className="h-3 w-3" />
                  {isSizing ? "Processing..." : `Shuffle & Limit to ${sessionCount}`}
                </button>

                <button
                  onClick={handleResetImages}
                  disabled={isSizing}
                  className="w-full py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] rounded cursor-pointer flex items-center justify-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Restore Full Catalog ({images.length})
                </button>
              </div>
            </div>

            {sizeStatus.type && (
              <div className={`p-1.5 rounded text-[10px] flex items-center gap-1 border ${
                sizeStatus.type === "success" 
                  ? "bg-emerald-50 border-emerald-150 text-emerald-700" 
                  : "bg-red-50 border-red-150 text-red-700"
              }`}>
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{sizeStatus.message}</span>
              </div>
            )}

            {/* Automatic Assignment Trigger Section */}
            <div className="pt-2.5 border-t border-slate-200 mt-2.5 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-800 uppercase font-mono tracking-wider block">Automatic Assignment Settings</span>
              
              <label className="flex items-center space-x-2 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAssignEnabled}
                  onChange={(e) => onSaveSettings({ autoAssignEnabled: e.target.checked })}
                  className="rounded border-slate-350 text-slate-900 focus:ring-0"
                />
                <span className="font-semibold text-slate-700">Auto-assign tasks to new/unassigned raters</span>
              </label>

              {autoAssignEnabled && (
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono">Assigned subset size:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={autoAssignCount}
                      onChange={(e) => onSaveSettings({ autoAssignCount: Math.max(1, Number(e.target.value) || 25) })}
                      className="w-14 bg-white border border-slate-200 rounded px-1 py-0.5 text-center font-bold text-[10px] outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">images</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Database Exports Block */}
      <div className="bg-white border border-slate-200 rounded p-3 shadow-none space-y-2">
        <div className="flex items-center space-x-2 border-b border-slate-150 pb-2">
          <Database className="h-4 w-4 text-slate-700" />
          <div>
            <h3 className="text-xs font-bold text-slate-900 leading-tight">Database Exports & Reset Control</h3>
            <p className="text-[9px] text-slate-400 font-mono">Export publication-grade raw benchmark CSV/JSON datasets</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-slate-50 hover:bg-slate-100/75 border border-slate-200 rounded text-left transition-all cursor-pointer flex flex-col justify-between h-16 hover:shadow-none"
          >
            <Download className="h-3.5 w-3.5 text-slate-900" />
            <div>
              <span className="font-bold text-[11px] block text-slate-950">Export CSV Format</span>
              <span className="text-[9px] text-slate-500 font-mono">Total records: {audits.length} evaluations</span>
            </div>
          </button>

          <button
            onClick={handleExportJSON}
            className="p-2.5 bg-slate-50 hover:bg-slate-100/75 border border-slate-200 rounded text-left transition-all cursor-pointer flex flex-col justify-between h-16 hover:shadow-none"
          >
            <Download className="h-3.5 w-3.5 text-slate-900" />
            <div>
              <span className="font-bold text-[11px] block text-slate-950">Export JSON Format</span>
              <span className="text-[9px] text-slate-500 font-mono">Full hierarchical schema logs</span>
            </div>
          </button>

          <button
            onClick={() => {
              const confirmReset = window.confirm(
                "Are you absolutely sure you want to clear ALL evaluation databases? This irreversibly deletes all auditor evaluations."
              );
              if (confirmReset) {
                onClearAudits();
                alert("Database reset completed successfully.");
              }
            }}
            className="p-2.5 bg-red-50 hover:bg-red-100/50 border border-red-200 rounded text-left transition-all cursor-pointer flex flex-col justify-between h-16 hover:shadow-none"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-600" />
            <div>
              <span className="font-bold text-[11px] block text-red-950">Reset Audit Database</span>
              <span className="text-[9px] text-red-700 font-mono">Warning: Irreversible deletion</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
