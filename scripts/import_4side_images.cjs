/**
 * VLSAP Kolkata 4-Side & Panorama Image Importer Utility (CommonJS Format)
 * 
 * Groups Kolkata 4-side image slices (0, 90, 180, 270) and panorama views, then seeds db.json
 * Run this script:
 *   node scripts/import_4side_images.cjs
 */

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../db.json');
const SLICES_DIR = path.join(__dirname, '../public/images/Kolkata_4Side_Images');
const PANORAMAS_DIR = path.join(__dirname, '../public/images/Kolkata');

if (!fs.existsSync(SLICES_DIR)) {
  console.error(`ERROR: Slices directory not found at ${SLICES_DIR}`);
  process.exit(1);
}

// 1. Read panorama files if they exist
const panoramas = {};
if (fs.existsSync(PANORAMAS_DIR)) {
  const panoramaFiles = fs.readdirSync(PANORAMAS_DIR);
  const panoramaRegex = /^(.+)_panorama\.(jpg|jpeg|png|webp)$/i;
  
  panoramaFiles.forEach(file => {
    const match = file.match(panoramaRegex);
    if (match) {
      const segmentId = match[1];
      panoramas[segmentId] = `/images/Kolkata/${file}`;
    }
  });
  console.log(`Detected ${Object.keys(panoramas).length} panorama images.`);
} else {
  console.warn(`WARNING: Panoramas directory not found at ${PANORAMAS_DIR}. Fallbacks will be used.`);
}

// 2. Read slices files
const files = fs.readdirSync(SLICES_DIR);
const segmentGroups = {};

// Regex matches e.g. "1010.0_slice_90.jpg"
const fileRegex = /^(.+)_slice_(0|90|180|270)\.(jpg|jpeg|png|webp)$/i;

files.forEach(file => {
  const match = file.match(fileRegex);
  if (match) {
    const segmentId = match[1];
    const angle = match[2];
    
    if (!segmentGroups[segmentId]) {
      segmentGroups[segmentId] = {};
    }
    segmentGroups[segmentId][angle] = `/images/Kolkata_4Side_Images/${file}`;
  }
});

// 3. Map and validate groups (each segment must have all 4 directions)
const validSegments = [];
Object.keys(segmentGroups).forEach(segmentId => {
  const group = segmentGroups[segmentId];
  if (group['0'] && group['90'] && group['180'] && group['270']) {
    validSegments.push({
      segmentId: segmentId,
      numericId: parseFloat(segmentId) || 0,
      urls: group
    });
  } else {
    console.warn(`WARNING: Segment ${segmentId} is missing one or more slices, skipping.`);
  }
});

// Sort segments numerically
validSegments.sort((a, b) => a.numericId - b.numericId);

if (validSegments.length === 0) {
  console.error("ERROR: No valid 4-side segments found (each must have slice_0, slice_90, slice_180, slice_270).");
  process.exit(1);
}

console.log(`Detected ${validSegments.length} valid street segments. Writing to database...`);

// 4. Load or initialize database state
let state = {
  images: [],
  audits: [],
  raters: ["Rater A", "Rater B", "Rater C", "Rater D", "Rater E"],
  projects: [
    { id: "proj-1", name: "VLSAP Calibration Micro-Pilot", description: "Inaugural IRR study on Kolkata 4-side and panorama variables.", createdAt: new Date().toISOString() }
  ],
  currentProject: "VLSAP Calibration Micro-Pilot",
  calibrationPhase: "Cold Read",
  googleApiKey: "",
  instrumentLocked: false
};

if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    state = JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read existing db.json, generating new database state.');
  }
}

// 5. Map valid segments to StreetViewImage schema
const kolkataImages = validSegments.map((seg, index) => {
  const panoramaUrl = panoramas[seg.segmentId] || seg.urls['0']; // Use slice 0 (North) as fallback if no panorama file
  
  return {
    id: `Kolkata-${seg.segmentId}`,
    driveId: `kolkata-drive-${seg.segmentId}`,
    name: `Kolkata Segment ${seg.segmentId}`,
    category: "Kolkata 4-Side & Panorama",
    description: `Kolkata segment ${seg.segmentId} (Includes panorama and 4-directional views)`,
    location: "Kolkata, India",
    protocolA_Url: panoramaUrl, // Use actual panorama!
    protocolB_Urls: {
      North: seg.urls['0'],
      East: seg.urls['90'],
      South: seg.urls['180'],
      West: seg.urls['270']
    }
  };
});

// Update database state images array
state.images = kolkataImages;

// Clean up any old audits to avoid referencing missing images
state.audits = [];

// Write back to db.json
fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');

console.log('================================================================');
console.log('  SUCCESSFULLY IMPORTED KOLKATA DATASET (PANORAMA + 4-SIDE)');
console.log('================================================================');
console.log(`Imported:   ${kolkataImages.length} street segments`);
console.log(`Database:   ${DB_FILE}`);
console.log('\nRestart your server to see the updated dataset!\n');
