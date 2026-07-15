export interface StreetViewImage {
  id: string;
  driveId: string;
  name: string;
  category: string;
  description: string;
  location: string;
  protocolA_Url: string;
  protocolB_Urls: {
    North: string;
    East: string;
    South: string;
    West: string;
  };
}

export interface AuditRecord {
  id: string;
  imageId: string;
  driveId: string;
  auditorId: string; // e.g., "Rater A", "Rater B", "Gemini-3.5"
  auditVersion: string;
  instrumentVersion: string;
  timestamp: string;
  variableId: string;
  value: string;
  confidence: number; // 1-5
  comment: string;
  mode: "Training" | "Cold Read" | "Warm Read" | "Validation";
  protocol: "A" | "B";
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface CalibrationPhase {
  current: "Cold Read" | "Warm Read" | "Reconciliation";
}

export interface VLSAPVariable {
  id: string;
  name: string;
  domain: string;
  definition: string;
  evidence: string;
  positiveExamples: string[];
  negativeExamples: string[];
  unknownRule: string;
  options: string[];
  isMulti?: boolean;
  isText?: boolean;
  requires?: {
    variableId: string;
    value: string;
    disableMessage: string;
  };
}

export interface AuditorProfileDetails {
  name: string;
  gender: string;
  designation: string;
  age: number;
  education: string;
}

export interface ServerState {
  images: StreetViewImage[];
  audits: AuditRecord[];
  raters: string[];
  projects: Project[];
  currentProject: string;
  calibrationPhase: "Cold Read" | "Warm Read" | "Reconciliation";
  googleApiKey: string;
  hasGoogleApiKey?: boolean;
  googleDriveFolderId?: string;
  instrumentLocked: boolean;
  auditorImages?: { [auditorId: string]: string[] };
  auditorProfiles?: { [auditorId: string]: AuditorProfileDetails };
  autoAssignEnabled?: boolean;
  autoAssignCount?: number;
}
