import { StreetViewImage } from "../types";

// The live image manifest ships in the repo's db.json (local /images
// panoramas) and is loaded by the server via getSeedImages(). This module only
// provides a safe empty fallback used if that manifest cannot be read. It
// intentionally contains NO external (Unsplash) placeholder photos so those
// images can never be served.
export function getFullPilotImages(): StreetViewImage[] {
  return [];
}
