import React, { useState } from "react";
import { User, Shield, ChevronRight, GraduationCap, Briefcase, Calendar, HeartHandshake } from "lucide-react";

interface AuditorProfileProps {
  raters: string[];
  onSelectProfile: (rater: string) => void;
  onCreateProfile: (profile: {
    name: string;
    gender: string;
    designation: string;
    age: number;
    education: string;
  }) => void;
}

export default function AuditorProfile({ raters, onSelectProfile, onCreateProfile }: AuditorProfileProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [designation, setDesignation] = useState("");
  const [age, setAge] = useState("");
  const [education, setEducation] = useState("");

  // Only surface profiles that were registered on THIS device (i.e. the auditor's own),
  // never the full roster of every rater. New auditors just register below.
  const ownProfiles = React.useMemo(() => {
    let details: Record<string, unknown> = {};
    try {
      details = JSON.parse(localStorage.getItem("vlsap_auditor_profiles_details") || "{}");
    } catch (e) {
      details = {};
    }
    const ownIds = new Set(Object.keys(details));
    return raters.filter((r) => ownIds.has(r));
  }, [raters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !gender || !designation.trim() || !age || !education) {
      alert("Please fill out all fields.");
      return;
    }

    onCreateProfile({
      name: name.trim(),
      gender,
      designation: designation.trim(),
      age: parseInt(age, 10),
      education
    });
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4" id="vlsap-auditor-profile">
      <div className="w-full max-w-xl space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white mb-2 shadow-sm">
            <User className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight font-sans">
            Auditor Profile Access
          </h2>
          <p className="text-xs text-slate-500 font-mono max-w-sm mx-auto">
            Access an existing profile or register a new one to start your calibration audits.
          </p>
        </div>

        {/* Existing Profiles block — only the auditor's own profiles registered on this device */}
        {ownProfiles.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-sm">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-slate-400" /> Resume Your Auditor Profile
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-0.5">
              {ownProfiles.map((rater) => (
                <button
                  key={rater}
                  type="button"
                  onClick={() => onSelectProfile(rater)}
                  className="px-3 py-2 text-left bg-slate-50 border border-slate-250 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-md text-xs font-semibold font-mono text-slate-800 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>{rater}</span>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Block */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono border-b border-slate-100 pb-2">
            Register New Auditor Profile
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" /> Full Name
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Sarah Chen"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-md px-3 py-2 text-xs transition-all outline-none font-sans"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <HeartHandshake className="h-3.5 w-3.5 text-slate-400" /> Gender
                <span className="text-red-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-md px-3 py-2 text-xs transition-all outline-none font-sans cursor-pointer"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* Designation */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" /> Designation
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Postdoctoral Researcher, Student, Auditor"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-md px-3 py-2 text-xs transition-all outline-none font-sans"
              />
            </div>

            {/* Age */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" /> Age
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 29"
                min="18"
                max="120"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-md px-3 py-2 text-xs transition-all outline-none font-mono"
              />
            </div>

            {/* Education */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-slate-400" /> Highest Level of Education Obtained
                <span className="text-red-500">*</span>
              </label>
              <select
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-md px-3 py-2 text-xs transition-all outline-none font-sans cursor-pointer"
              >
                <option value="">Select Education Level</option>
                <option value="High School / Secondary">High School / Secondary</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="PhD / Doctorate">PhD / Doctorate</option>
                <option value="Other Professional Qualification">Other Professional Qualification</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-950 flex items-center justify-center gap-2 shadow-sm mt-2"
            >
              <ChevronRight className="h-4 w-4" />
              Register & Start Auditing Survey
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
