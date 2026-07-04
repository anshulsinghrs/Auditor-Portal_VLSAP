import React, { useState, useEffect } from "react";
import { 
  Compass, LayoutDashboard, Settings, Award, ArrowLeft, ArrowRight, Upload, Sparkles, 
  UserCheck, Eye, RefreshCw, Layers, User, Bot, ShieldCheck, LogOut, Shuffle, AlertCircle
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
  const [hasGoogleApiKey, setHasGoogleApiKey] = useState(false);
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState("1ENECfT_ETGATB4533yAEKRZ-HugbMbad");
  const [instrumentLocked, setInstrumentLocked] = useState(false);
  const [auditorImages, setAuditorImages] = useState<Record<string, string[]>>({});
  const [auditorProfiles, setAuditorProfiles] = useState<Record<string, any>>({});
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [autoAssignCount, setAutoAssignCount] = useState(25);

  // Active Session State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAiAuditing, setIsAiAuditing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Filtered images list assigned to the logged-in auditor
  const activeImages = React.useMemo(() => {
    if (!auditorProfile) return images;
    
    const assignedIds = auditorImages[auditorProfile];
    if (assignedIds && assignedIds.length > 0) {
      return images.filter((img) => assignedIds.includes(img.id));
    }
    
    // Return empty list if logged in but no images assigned
    return [];
  }, [images, auditorProfile, auditorImages]);

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
        setHasGoogleApiKey((state as any).hasGoogleApiKey ?? false);
        setGoogleDriveFolderId(state.googleDriveFolderId || "1ENECfT_ETGATB4533yAEKRZ-HugbMbad");
        setInstrumentLocked(state.instrumentLocked || false);
        setAuditorImages(state.auditorImages || {});
        setAuditorProfiles(state.auditorProfiles || {});
        setAutoAssignEnabled(state.autoAssignEnabled ?? true);
        setAutoAssignCount(state.autoAssignCount ?? 25);
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

  // Automatically assign random images if a logged-in rater has no active assignment
  useEffect(() => {
    if (!loading && autoAssignEnabled && auditorProfile && images.length > 0) {
      const assigned = auditorImages[auditorProfile];
      if (!assigned || assigned.length === 0) {
        handleAssignImages(auditorProfile, autoAssignCount);
      }
    }
  }, [auditorProfile, auditorImages, loading, images, autoAssignEnabled, autoAssignCount]);

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

  // Navigation that changes active image index
  const navigateImage = (newIndexOrFn: number | ((prev: number) => number)) => {
    // Check if there is an active auditor session and an active image
    const currentImage = activeImages[currentImageIndex];
    if (auditorProfile && currentImage) {
      const activeRater = auditorProfile;
      const mode = calibrationPhase === "Reconciliation" ? "Validation" : calibrationPhase;
      
      // Get all current answers for this image
      const currentImageAnswers = audits.filter(
        (a) =>
          a.imageId === currentImage.id &&
          a.auditorId === activeRater &&
          a.mode === mode &&
          a.protocol === "A"
      );

      // Find active variables that don't have a value
      const unanswered = variables.filter((v) => {
        // Evaluate requirements to see if this variable is enabled
        if (v.requires) {
          const depAns = currentImageAnswers.find(a => a.variableId === v.requires?.variableId)?.value;
          if (depAns !== v.requires.value) {
            return false; // Disabled by dependency rule
          }
        }
        
        // Check if an answer choice has been selected
        const answerVal = currentImageAnswers.find(a => a.variableId === v.id)?.value;
        return !answerVal || answerVal === "";
      });

      if (unanswered.length > 0) {
        alert(`Please answer all active questions before leaving this panorama.\n\nMissing: ${unanswered.map(v => v.name).join(", ")}`);
        return; // Block navigation
      }
    }

    setCurrentImageIndex((prev) => {
      const nextIdx = typeof newIndexOrFn === "function" ? newIndexOrFn(prev) : newIndexOrFn;
      return Math.max(0, Math.min(activeImages.length - 1, nextIdx));
    });
  };

  // Logout auditor
  const handleLogoutAuditor = () => {
    setAuditorProfile(null);
    localStorage.removeItem("vlsap_auditor_profile");
  };

  // Protect AI Audit and Admin Dashboard with a password gate
  const handleSecureNavigation = (view: "ai" | "admin") => {
    const password = window.prompt(`Please enter the security password to access the ${view === "admin" ? "Admin Dashboard" : "AI Audit Interface"}:`);
    if (password === "anshulWER") {
      setActiveView(view);
    } else if (password !== null) {
      alert("Incorrect password! Access denied.");
    }
  };

  // Immediate autosave mechanism to server db
  const handleSaveAnswer = async (
    variableId: string,
    data: { value: string; confidence: number; comment: string }
  ) => {
    // Must mirror the list the auditor is actually viewing (activeImages), which is the
    // rater's assigned subset. Using the full `images` list here saved answers against the
    // wrong image and made the selection appear to do nothing.
    const activeImage = activeImages[currentImageIndex];
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
        setHasGoogleApiKey(data.state.hasGoogleApiKey ?? false);
        setGoogleDriveFolderId(data.state.googleDriveFolderId || "1ENECfT_ETGATB4533yAEKRZ-HugbMbad");
        setInstrumentLocked(data.state.instrumentLocked || false);
        setAuditorImages(data.state.auditorImages || {});
        setAuditorProfiles(data.state.auditorProfiles || {});
        setAutoAssignEnabled(data.state.autoAssignEnabled ?? true);
        setAutoAssignCount(data.state.autoAssignCount ?? 25);
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
      if (apiKey) setHasGoogleApiKey(true);
      setGoogleDriveFolderId(folderId);
    }
    return { success: data.success, message: data.message };
  };

  // Shuffle and Limit active queue
  const handleShuffleImages = async (count: number) => {
    try {
      const res = await fetch("/api/images/shuffle-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count })
      });
      const data = await res.json();
      if (data.success) {
        setImages(data.images);
        setCurrentImageIndex(0); // reset page index to first image of new queue
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || "Failed to size queue." };
    } catch (e: any) {
      console.error(e);
      return { success: false, message: e.message || "Network error occurred." };
    }
  };

  // Reset/Restore full images list from bundled catalog
  const handleResetImages = async () => {
    try {
      const res = await fetch("/api/images/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setImages(data.images);
        setCurrentImageIndex(0);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || "Failed to reset catalog." };
    } catch (e: any) {
      console.error(e);
      return { success: false, message: e.message || "Network error occurred." };
    }
  };

  // Assign a custom number of random images to a specific auditor
  const handleAssignImages = async (auditorId: string, count: number) => {
    try {
      const res = await fetch("/api/images/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditorId, count })
      });
      const data = await res.json();
      if (data.success) {
        setAuditorImages(data.state.auditorImages || {});
        setCurrentImageIndex(0); // reset page index to first image of new queue
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || "Failed to assign images." };
    } catch (e: any) {
      console.error(e);
      return { success: false, message: e.message || "Network error occurred." };
    }
  };

  // Unassign custom images queue for a specific auditor, restoring full catalog
  const handleUnassignImages = async (auditorId: string) => {
    try {
      const res = await fetch("/api/images/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditorId })
      });
      const data = await res.json();
      if (data.success) {
        setAuditorImages(data.state.auditorImages || {});
        setCurrentImageIndex(0);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || "Failed to clear assignment." };
    } catch (e: any) {
      console.error(e);
      return { success: false, message: e.message || "Network error occurred." };
    }
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
    const activeImage = activeImages[currentImageIndex];
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
  }, [audits, activeImages, currentImageIndex, auditorProfile, calibrationPhase]);

  // Compute auditor progress
  const auditorProgress = React.useMemo(() => {
    if (!auditorProfile) return { completed: 0, total: activeImages.length };
    const completedImageIds = new Set(
      audits
        .filter((a) => a.auditorId === auditorProfile && a.mode === (calibrationPhase === "Reconciliation" ? "Validation" : calibrationPhase))
        .map((a) => a.imageId)
    );
    return { completed: completedImageIds.size, total: activeImages.length };
  }, [audits, auditorProfile, activeImages, calibrationPhase]);

  // Set of panoramas the current auditor has fully completed (every applicable variable
  // answered, respecting the footway dependency cascade). Used to mark nav dots green.
  const completedImageIds = React.useMemo(() => {
    const done = new Set<string>();
    if (!auditorProfile) return done;
    const mode = calibrationPhase === "Reconciliation" ? "Validation" : calibrationPhase;

    // Build a per-image map of variableId -> value for this auditor and mode
    const byImage: Record<string, Record<string, string>> = {};
    audits.forEach((a) => {
      if (a.auditorId === auditorProfile && a.mode === mode && a.protocol === "A") {
        if (!byImage[a.imageId]) byImage[a.imageId] = {};
        byImage[a.imageId][a.variableId] = a.value;
      }
    });

    activeImages.forEach((img) => {
      const ansMap = byImage[img.id] || {};
      const allAnswered = variables.every((v) => {
        // A dependent variable that is currently disabled counts as satisfied
        const disabled = v.requires ? ansMap[v.requires.variableId] !== v.requires.value : false;
        if (disabled) return true;
        const val = ansMap[v.id];
        return val !== undefined && val !== "";
      });
      if (allAnswered) done.add(img.id);
    });
    return done;
  }, [audits, activeImages, auditorProfile, calibrationPhase, variables]);

  // Retrieve active designation from cache at top level (prevents React hook order violation)
  const activeDesignation = React.useMemo(() => {
    if (!auditorProfile) return "";
    const localProfilesStr = localStorage.getItem("vlsap_auditor_profiles_details") || "{}";
    const localProfiles = JSON.parse(localProfilesStr);
    return localProfiles[auditorProfile]?.designation || "Auditor";
  }, [auditorProfile]);

  // Handle auto-removal of auditor profile once they complete all their assigned images
  useEffect(() => {
    if (auditorProfile && auditorProgress.total > 0 && auditorProgress.completed === auditorProgress.total) {
      const timer = setTimeout(async () => {
        alert(`Congratulations ${auditorProfile}! You have successfully completed your assigned street audit task of ${auditorProgress.total} panoramas. Your profile has been finalized and removed from the active rater list.`);
        
        // Remove from raters list
        const updatedRaters = raters.filter((r) => r !== auditorProfile);
        
        // Call handleSaveSettings to persist the removal on the backend
        await handleSaveSettings({
          raters: updatedRaters
        });

        // Also clean up server auditorImages queue
        try {
          await fetch("/api/images/unassign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ auditorId: auditorProfile })
          });
        } catch (e) {
          console.error("Failed to unassign images on profile completion:", e);
        }

        // Log out and return to role selection
        setAuditorProfile(null);
        localStorage.removeItem("vlsap_auditor_profile");
        setActiveView("landing");
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [auditorProfile, auditorProgress.completed, auditorProgress.total, raters]);

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
                onClick={() => handleSecureNavigation("ai")}
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
                onClick={() => handleSecureNavigation("admin")}
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
                  <span>{currentImageIndex + 1} of {activeImages.length} Panoramas</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => navigateImage((prev) => Math.max(0, prev - 1))}
                    disabled={currentImageIndex === 0}
                    className="p-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 transition-colors cursor-pointer border border-slate-200/60"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex space-x-0.5 max-w-[240px] overflow-x-auto py-0.5 px-1 bg-slate-50 rounded border border-slate-200/60">
                    {activeImages.map((img, idx) => {
                      const isDone = completedImageIds.has(img.id);
                      const isActive = idx === currentImageIndex;
                      return (
                        <button
                          key={img.id}
                          title={isDone ? "Completed" : "Not yet completed"}
                          onClick={() => navigateImage(idx)}
                          className={`h-4 w-4 rounded-sm text-[9px] font-mono flex items-center justify-center font-bold shrink-0 transition-all cursor-pointer ${
                            isDone
                              ? "bg-emerald-500 text-white hover:bg-emerald-600"
                              : "bg-slate-200/70 text-slate-600 hover:bg-slate-300/80"
                          } ${isActive ? "ring-2 ring-inset ring-slate-900" : ""}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => navigateImage((prev) => Math.min(activeImages.length - 1, prev + 1))}
                    disabled={currentImageIndex === activeImages.length - 1}
                    className="p-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 transition-colors cursor-pointer border border-slate-200/60"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (activeImages.length === 0) return;
                      const randomIndex = Math.floor(Math.random() * activeImages.length);
                      navigateImage(randomIndex);
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
              {activeImages[currentImageIndex] ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                  {/* Left: Viewport */}
                  <div className="lg:col-span-7 space-y-2.5">
                    <ImageViewer
                      image={activeImages[currentImageIndex]}
                    />
                  </div>

                  {/* Right: Audit Form (survey only) */}
                  <div className="lg:col-span-5 h-[710px]">
                    <AuditForm
                      variables={variables}
                      currentImageId={activeImages[currentImageIndex].id}
                      activeRater={auditorProfile}
                      activeMode={calibrationPhase === "Reconciliation" ? "Validation" : calibrationPhase}
                      answers={activeAnswers}
                      onSaveAnswer={handleSaveAnswer}
                      onNextSegment={() => {
                        if (currentImageIndex === activeImages.length - 1) {
                          const confirmExit = window.confirm("You have reached the end of your assigned segment. Log out?");
                          if (confirmExit) {
                            handleLogoutAuditor();
                          }
                        } else {
                          navigateImage((prev) => prev + 1);
                        }
                      }}
                      isLastSegment={currentImageIndex === activeImages.length - 1}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center border rounded-md border-amber-200 bg-amber-50/40 text-slate-500 font-sans text-xs flex flex-col items-center justify-center gap-2.5 shadow-sm max-w-md mx-auto my-8">
                  <AlertCircle className="h-8 w-8 text-amber-600 animate-pulse" />
                  <span className="font-bold text-slate-800 text-sm">No Task Assigned</span>
                  <p className="text-slate-500 leading-normal text-[11px]">
                    You do not have any calibration panoramas assigned to your auditor profile yet. Please ask the project administrator to assign your task queue.
                  </p>
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
          hasGoogleApiKey={hasGoogleApiKey}
          googleDriveFolderId={googleDriveFolderId}
          instrumentLocked={instrumentLocked}
          calibrationPhase={calibrationPhase}
          currentProject={currentProject}
          onSaveSettings={handleSaveSettings}
          onTriggerDriveSync={handleTriggerDriveSync}
          onClearAudits={handleClearAudits}
          onShuffleImages={handleShuffleImages}
          onResetImages={handleResetImages}
          onAssignImages={handleAssignImages}
          onUnassignImages={handleUnassignImages}
          auditorImages={auditorImages}
          auditorProfiles={auditorProfiles}
          autoAssignEnabled={autoAssignEnabled}
          autoAssignCount={autoAssignCount}
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
