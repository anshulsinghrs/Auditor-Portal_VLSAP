import React, { useState, useEffect } from "react";
import { 
  Compass, LayoutDashboard, Settings, Award, ArrowLeft, ArrowRight, Upload, Sparkles, 
  UserCheck, Eye, RefreshCw, Layers, User, Bot, ShieldCheck, LogOut, Shuffle
} from "lucide-react";
import RaterInstructions from "./components/RaterInstructions";
import ImageViewer from "./components/ImageViewer";
import AuditForm from "./components/AuditForm";
import AuditorProfile from "./components/AuditorProfile";
import AiAuditPanel from "./components/AiAuditPanel";
import ComparisonDashboard from "./components/ComparisonDashboard";
import AdminPanel from "./components/AdminPanel";
import { mockImages } from "./data/mock_images";
import variablesData from "./data/variables.json";
import { StreetViewImage, AuditRecord, VLSAPVariable, ServerState } from "./types";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [activeView, setActiveView] = useState<"landing" | "auditor" | "ai" | "admin">(() => {
    const saved = localStorage.getItem("vlsap_active_view");
    return (saved as any) || "landing";
  });
  
  // Auditor profile state
  const [auditorProfile, setAuditorProfile] = useState<string | null>(null);

  // Database States
  const [images, setImages] = useState<StreetViewImage[]>([]);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [raters, setRaters] = useState<string[]>([]);
  const [currentProject, setCurrentProject] = useState("VLSAP Calibration Micro-Pilot");
  const [calibrationPhase, setCalibrationPhase] = useState<"Cold Read" | "Warm Read" | "Reconciliation">("Cold Read");
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState("1ENECfT_ETGATB4533yAEKRZ-HugbMbad");
  const [instrumentLocked, setInstrumentLocked] = useState(false);

  // Active Session State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAiAuditing, setIsAiAuditing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Variables definitions (loaded from JSON)
  const variables = variablesData as VLSAPVariable[];

  // Fetch initial database state from Express server on mount
  const fetchState = async () => {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const state: ServerState = await res.json();
        setImages(state.images || []);
        setAudits(state.audits || []);
        setRaters(state.raters || []);
        setCurrentProject(state.currentProject || "VLSAP Calibration Micro-Pilot");
        setCalibrationPhase(state.calibrationPhase || "Cold Read");
        setGoogleApiKey(state.googleApiKey || "");
        setGoogleDriveFolderId(state.googleDriveFolderId || "1ENECfT_ETGATB4533yAEKRZ-HugbMbad");
        setInstrumentLocked(state.instrumentLocked || false);
      }
    } catch (e) {
      console.error("Failed to connect to full-stack server state API:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    
    // Check localStorage for persisted auditor profile
    const savedProfile = localStorage.getItem("vlsap_auditor_profile");
    if (savedProfile) {
      setAuditorProfile(savedProfile);
    }

    // Check localStorage to see if instructions were already accepted
    const accepted = localStorage.getItem("vlsap_instructions_accepted");
    if (accepted !== "true") {
      setShowInstructions(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("vlsap_active_view", activeView);
  }, [activeView]);

  const handleAcceptInstructions = () => {
    localStorage.setItem("vlsap_instructions_accepted", "true");
    setShowInstructions(false);
  };

  const handleResetInstructions = () => {
    localStorage.removeItem("vlsap_instructions_accepted");
    setShowInstructions(true);
  };

  // Handle auditor profile selection
  const handleSelectProfile = (rater: string) => {
    setAuditorProfile(rater);
    localStorage.setItem("vlsap_auditor_profile", rater);
  };

  // Handle creating a new auditor profile with demographic details
  const handleCreateProfile = async (profile: {
    name: string;
    gender: string;
    designation: string;
    age: number;
    education: string;
  }) => {
    // Generate a unique rater ID that aligns with existing stats code
    const cleanRaterId = `Rater - ${profile.name}`;

    // Read local cache of profile details
    const localProfilesStr = localStorage.getItem("vlsap_auditor_profiles_details") || "{}";
    const localProfiles = JSON.parse(localProfilesStr);
    localProfiles[cleanRaterId] = profile;
    localStorage.setItem("vlsap_auditor_profiles_details", JSON.stringify(localProfiles));

    // Save settings on the Express server
    const updatedRaters = raters.includes(cleanRaterId) ? raters : [...raters, cleanRaterId];
    await handleSaveSettings({
      raters: updatedRaters,
      auditorProfiles: localProfiles
    });

    handleSelectProfile(cleanRaterId);
  };

  // Logout auditor
  const handleLogoutAuditor = () => {
    setAuditorProfile(null);
    localStorage.removeItem("vlsap_auditor_profile");
  };

  // Immediate autosave mechanism to server db
  const handleSaveAnswer = async (
    variableId: string, 
    data: { value: string; confidence: number; comment: string }
  ) => {
    const activeImage = images[currentImageIndex];
    const activeRater = auditorProfile || "Rater A";
    if (!activeImage) return;

    const newRecord: Partial<AuditRecord> = {
      imageId: activeImage.id,
      driveId: activeImage.driveId,
      auditorId: activeRater,
      auditVersion: "1.0.0",
      instrumentVersion: "VLSAP-Pilot-v1",
      variableId: variableId,
      value: data.value,
      confidence: data.confidence,
      comment: data.comment,
      mode: calibrationPhase === "Reconciliation" ? "Validation" : calibrationPhase,
      protocol: "A"
    };

    // Optimistically update local React UI state
    setAudits((prev) => {
      const index = prev.findIndex(
        (a) =>
          a.imageId === newRecord.imageId &&
          a.auditorId === newRecord.auditorId &&
          a.variableId === newRecord.variableId &&
          a.mode === newRecord.mode &&
          a.protocol === newRecord.protocol
      );

      const updatedRecord = {
        ...newRecord,
        id: prev[index]?.id || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      } as AuditRecord;

      if (index >= 0) {
        const next = [...prev];
        next[index] = updatedRecord;
        return next;
      } else {
        return [...prev, updatedRecord];
      }
    });

    // Write-through to Express Server database
    try {
      await fetch("/api/audits/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord)
      });
    } catch (e) {
      console.error("Autosave to backend server failed:", e);
    }
  };

  // General server-wide settings updater
  const handleSaveSettings = async (settings: any) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        const data = await res.json();
        setImages(data.state.images || []);
        setAudits(data.state.audits || []);
        setRaters(data.state.raters || []);
        setCurrentProject(data.state.currentProject || "VLSAP Calibration Micro-Pilot");
        setCalibrationPhase(data.state.calibrationPhase || "Cold Read");
        setGoogleApiKey(data.state.googleApiKey || "");
        setGoogleDriveFolderId(data.state.googleDriveFolderId || "1ENECfT_ETGATB4533yAEKRZ-HugbMbad");
        setInstrumentLocked(data.state.instrumentLocked || false);
      }
    } catch (e) {
      console.error("Failed to update server settings:", e);
    }
  };

  // Clear audits
  const handleClearAudits = async () => {
    try {
      const res = await fetch("/api/audits/clear", { method: "POST" });
      if (res.ok) {
        setAudits([]);
      }
    } catch (e) {
      console.error("Failed to clear database:", e);
    }
  };

  // Trigger Google Drive sync via server-side controller
  const handleTriggerDriveSync = async (apiKey: string, folderId: string) => {
    const res = await fetch("/api/images/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, folderId })
    });
    const data = await res.json();
    if (data.success) {
      setImages(data.images);
      setGoogleApiKey(apiKey);
      setGoogleDriveFolderId(folderId);
    }
    return { success: data.success, message: data.message };
  };

  // Call server-side Gemini 3.5-flash audit evaluating active image
  const handleTriggerGeminiAudit = async () => {
    const activeImage = images[currentImageIndex];
    if (!activeImage) return;

    setIsAiAuditing(true);
    try {
      const res = await fetch("/api/gemini/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: activeImage.id,
          imageUrl: activeImage.protocolA_Url
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchState(); // Refresh our lists to include newly computed AI audits
      } else {
        throw new Error("Server returned audit error status.");
      }
    } catch (e: any) {
      alert(`Gemini Audit evaluation failed: ${e.message}`);
    } finally {
      setIsAiAuditing(false);
    }
  };

  // Drag and Drop File Upload handlers for custom streetscapes
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadedFile(e.target.files[0]);
    }
  };

  const handleUploadedFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Invalid file format. Please upload a panoramic image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      
      const newImage: StreetViewImage = {
        id: `VLSAP-Upload-${Date.now().toString().slice(-6)}`,
        driveId: `upload-${Date.now()}`,
        name: file.name.split(".")[0],
        category: "Custom Upload",
        description: `Custom uploaded street segment under research audit. File: ${file.name}`,
        location: "Researcher Uploaded Panorama",
        protocolA_Url: base64Data,
        protocolB_Urls: {
          North: base64Data,
          East: base64Data,
          South: base64Data,
          West: base64Data
        }
      };

      // Update images state & push through to database on server
      const updatedImages = [newImage, ...images];
      setImages(updatedImages);
      setCurrentImageIndex(0); // View upload immediately

      // Save updated image list on server using standard endpoint
      await handleSaveSettings({ images: updatedImages });
      alert(`Successfully processed and loaded custom panorama: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Get active answers for current image and auditor in the active calibration phase
  const activeAnswers = React.useMemo(() => {
    const activeImage = images[currentImageIndex];
    const activeRater = auditorProfile || "Rater A";
    if (!activeImage) return {};

    const filtered = audits.filter(
      (a) =>
        a.imageId === activeImage.id &&
        a.auditorId === activeRater &&
        a.mode === (calibrationPhase === "Reconciliation" ? "Validation" : calibrationPhase) &&
        a.protocol === "A"
    );

    const map: Record<string, { value: string; confidence: number; comment: string }> = {};
    filtered.forEach((a) => {
      map[a.variableId] = { value: a.value, confidence: a.confidence, comment: a.comment };
    });
    return map;
  }, [audits, images, currentImageIndex, auditorProfile, calibrationPhase]);

  // Compute auditor progress
  const auditorProgress = React.useMemo(() => {
    if (!auditorProfile) return { completed: 0, total: images.length };
    const completedImageIds = new Set(
      audits
        .filter((a) => a.auditorId === auditorProfile && a.mode === (calibrationPhase === "Reconciliation" ? "Validation" : calibrationPhase))
        .map((a) => a.imageId)
    );
    return { completed: completedImageIds.size, total: images.length };
  }, [audits, auditorProfile, images, calibrationPhase]);

  // Retrieve active designation from cache at top level (prevents React hook order violation)
  const activeDesignation = React.useMemo(() => {
    if (!auditorProfile) return "";
    const localProfilesStr = localStorage.getItem("vlsap_auditor_profiles_details") || "{}";
    const localProfiles = JSON.parse(localProfilesStr);
    return localProfiles[auditorProfile]?.designation || "Auditor";
  }, [auditorProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans text-gray-400">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-mono tracking-widest">LOADING VLSAP SECURE SERVER INSTANCE...</p>
      </div>
    );
  }

  // ==========================================
  // LANDING PAGE — Role Selection
  // ==========================================
  if (activeView === "landing") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="vlsap-root">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-3xl space-y-8">
            {/* Branding Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white mb-3 shadow-lg">
                <Compass className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Vision-Language Street Audit Platform
              </h1>
              <p className="text-sm text-slate-500 font-mono max-w-md mx-auto">
                Select your role to continue to the appropriate interface.
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400">
                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-bold uppercase">Pilot v1</span>
                <span>•</span>
                <span>Project: <span className="text-indigo-600 font-bold">{currentProject}</span></span>
              </div>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Auditor Card */}
              <button
                onClick={() => setActiveView("auditor")}
                className="group bg-white border-2 border-slate-200 hover:border-slate-900 rounded-xl p-6 flex flex-col items-center gap-4 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1 active:translate-y-0 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                  <User className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Auditor Portal</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Select your profile and fill out the pedestrian infrastructure survey for each street panorama.
                  </p>
                </div>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold font-mono uppercase">
                  Human Rater
                </span>
              </button>

              {/* AI Audit Card */}
              <button
                onClick={() => setActiveView("ai")}
                className="group bg-white border-2 border-slate-200 hover:border-slate-900 rounded-xl p-6 flex flex-col items-center gap-4 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1 active:translate-y-0 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                  <Bot className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">AI Audit</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Run Gemini 3.5 Flash vision audits, view AI results, and compare against human consensus.
                  </p>
                </div>
                <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold font-mono uppercase">
                  Machine Vision
                </span>
              </button>

              {/* Admin Card */}
              <button
                onClick={() => setActiveView("admin")}
                className="group bg-white border-2 border-slate-200 hover:border-slate-900 rounded-xl p-6 flex flex-col items-center gap-4 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1 active:translate-y-0 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Admin</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Manage project settings, sync images, view IRR statistics, and export audit data.
                  </p>
                </div>
                <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-bold font-mono uppercase">
                  Project Lead
                </span>
              </button>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-400 font-mono">
              VLSAP Academic Calibration • Managed Container Environment
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // AUDITOR VIEW — Profile + Survey Only
  // ==========================================
  if (activeView === "auditor") {
    // If no profile selected, show profile selection
    if (!auditorProfile) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="vlsap-root">
          {/* Minimal header */}
          <header className="bg-white border-b border-slate-200/80 px-4 py-2 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded text-white">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-slate-900">Auditor Portal</h1>
                <p className="text-[10px] text-slate-500 font-mono">VLSAP • {currentProject}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveView("landing")}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded border border-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3 w-3" /> Switch Role
            </button>
          </header>

          <main className="flex-1 w-full px-4 py-3">
            {showInstructions ? (
              <RaterInstructions onAccept={handleAcceptInstructions} />
            ) : (
              <AuditorProfile
                raters={raters}
                onSelectProfile={handleSelectProfile}
                onCreateProfile={handleCreateProfile}
              />
            )}
          </main>
        </div>
      );
    }

    // Profile selected → Show survey-only interface
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="vlsap-root">
        {/* Auditor-specific header */}
        <header className="bg-white border-b border-slate-200/80 px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 sticky top-0 z-40">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded text-white">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-slate-900">{auditorProfile}</h1>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase border border-emerald-200">
                  {calibrationPhase}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Role: <span className="font-semibold text-slate-700">{activeDesignation}</span> • {auditorProgress.completed} of {auditorProgress.total} panoramas started • {currentProject}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleLogoutAuditor();
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded border border-slate-200 transition-colors cursor-pointer"
            >
              <LogOut className="h-3 w-3" /> Switch Profile
            </button>
            <button
              onClick={() => { handleLogoutAuditor(); setActiveView("landing"); }}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded border border-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3 w-3" /> Exit
            </button>
          </div>
        </header>

        <main className="flex-1 w-full px-4 py-3">
          {showInstructions ? (
            <RaterInstructions onAccept={handleAcceptInstructions} />
          ) : (
            <div className="space-y-3">
              {/* Image Navigation */}
              <div className="bg-white border border-slate-200/80 rounded-md p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                  <span className="bg-emerald-100 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                    ACTIVE SEGMENT
                  </span>
                  <span>{currentImageIndex + 1} of {images.length} Panoramas</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setCurrentImageIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentImageIndex === 0}
                    className="p-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 transition-colors cursor-pointer border border-slate-200/60"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex space-x-0.5 max-w-[240px] overflow-x-auto py-0.5 px-1 bg-slate-50 rounded border border-slate-200/60">
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setCurrentImageIndex(idx)}
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
                    onClick={() => setCurrentImageIndex((prev) => Math.min(images.length - 1, prev + 1))}
                    disabled={currentImageIndex === images.length - 1}
                    className="p-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 transition-colors cursor-pointer border border-slate-200/60"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (images.length === 0) return;
                      const randomIndex = Math.floor(Math.random() * images.length);
                      setCurrentImageIndex(randomIndex);
                    }}
                    title="Jump to a Random Panorama"
                    className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded transition-colors cursor-pointer border border-amber-200/60 flex items-center space-x-1 text-[10px] font-semibold font-mono"
                  >
                    <Shuffle className="h-3 w-3" />
                    <span>Random</span>
                  </button>
                </div>
              </div>

              {/* Split layout: Image + Survey */}
              {images[currentImageIndex] ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                  {/* Left: Viewport */}
                  <div className="lg:col-span-7 space-y-2.5">
                    <ImageViewer
                      image={images[currentImageIndex]}
                    />
                  </div>

                  {/* Right: Audit Form (survey only) */}
                  <div className="lg:col-span-5 h-[710px]">
                    <AuditForm
                      variables={variables}
                      currentImageId={images[currentImageIndex].id}
                      activeRater={auditorProfile}
                      activeMode={calibrationPhase === "Reconciliation" ? "Validation" : calibrationPhase}
                      answers={activeAnswers}
                      onSaveAnswer={handleSaveAnswer}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border rounded border-slate-200 bg-white text-slate-400 font-sans text-xs">
                  No images loaded. Please contact the project admin to sync images.
                </div>
              )}

              {/* Footer */}
              <footer className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 font-mono gap-2">
                <div>VLSAP Academic Calibration • Auditor Survey Mode</div>
                <button 
                  onClick={handleResetInstructions} 
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Show Protocol Instructions
                </button>
              </footer>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ==========================================
  // AI AUDIT VIEW
  // ==========================================
  if (activeView === "ai") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="vlsap-root">
        <header className="bg-white border-b border-slate-200/80 px-4 py-2 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900">AI Audit Interface</h1>
              <p className="text-[10px] text-slate-500 font-mono">Gemini 3.5 Flash • {currentProject}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveView("landing")}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded border border-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" /> Switch Role
          </button>
        </header>

        <main className="flex-1 w-full px-4 py-3">
          <AiAuditPanel
            variables={variables}
            images={images}
            audits={audits}
            raters={raters}
            currentImageIndex={currentImageIndex}
            onChangeImage={setCurrentImageIndex}
            onTriggerGeminiAudit={handleTriggerGeminiAudit}
            isAiAuditing={isAiAuditing}
            onRefreshStats={fetchState}
          />
        </main>
      </div>
    );
  }

  // ==========================================
  // ADMIN VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="vlsap-root">
      <header className="bg-white border-b border-slate-200/80 px-4 py-2 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="text-[10px] text-slate-500 font-mono">Project Management • {currentProject}</p>
          </div>
        </div>
        <button
          onClick={() => setActiveView("landing")}
          className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded border border-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3 w-3" /> Switch Role
        </button>
      </header>

      <main className="flex-1 w-full px-4 py-3 space-y-4">
        {/* Admin Panel */}
        <AdminPanel
          images={images}
          audits={audits}
          raters={raters}
          googleApiKey={googleApiKey}
          googleDriveFolderId={googleDriveFolderId}
          instrumentLocked={instrumentLocked}
          calibrationPhase={calibrationPhase}
          currentProject={currentProject}
          onSaveSettings={handleSaveSettings}
          onTriggerDriveSync={handleTriggerDriveSync}
          onClearAudits={handleClearAudits}
        />

        {/* IRR & Calibration Statistics */}
        <div className="pt-2 border-t border-slate-200">
          <ComparisonDashboard
            variables={variables}
            images={images}
            audits={audits}
            raters={raters}
            activeImage={images[currentImageIndex] || images[0]}
            onRefreshStats={fetchState}
          />
        </div>

        {/* Footer */}
        <footer className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-center text-[10px] text-slate-400 font-mono">
          VLSAP Academic Calibration • Admin Dashboard
        </footer>
      </main>
    </div>
  );
}
