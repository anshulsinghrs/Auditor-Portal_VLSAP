/**
 * VLSAP Local Image Importer Utility (CommonJS Format)
 * 
 * Place your 1000+ images in 'public/images/' directory and run this script:
 *   node scripts/import_local_images.cjs
 */

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../db.json');
const IMAGES_DIR = path.join(__dirname, '../public/images');

// 1. Ensure public/images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log('\n================================================================');
  console.log('  CREATED DIRECTORY: public/images/');
  console.log('================================================================');
  console.log('Please copy your 1000+ street images into the directory above,');
  console.log('then run this script again:');
  console.log('  node scripts/import_local_images.cjs\n');
  process.exit(0);
}

// 2. Read image files from directory
const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
const files = fs.readdirSync(IMAGES_DIR).filter(file => {
  const ext = path.extname(file).toLowerCase();
  return extensions.includes(ext);
});

if (files.length === 0) {
  console.log('\n================================================================');
  console.log('  NO IMAGES DETECTED IN public/images/');
  console.log('================================================================');
  console.log('Please copy your image files (.jpg, .jpeg, .png, or .webp) into:');
  console.log(`  ${IMAGES_DIR}`);
  console.log('then run this script again.\n');
  process.exit(0);
}

console.log(`\nDetected ${files.length} images. Processing and updating database...`);

// 3. Load current db.json state
let state = {
  images: [],
  audits: [],
  raters: ["Rater A", "Rater B", "Rater C", "Rater D", "Rater E"],
  projects: [
    { id: "proj-1", name: "VLSAP Calibration Micro-Pilot", description: "Inaugural IRR study on Domain 2 & 3 judgment variables.", createdAt: new Date().toISOString() }
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
    console.warn('Could not read existing db.json, generating new database state.', e.message);
  }
}

// 4. Map files to StreetViewImage objects
const localImages = files.map((file, index) => {
  const name = path.basename(file, path.extname(file));
  const url = `/images/${file}`;
  
  return {
    id: `VLSAP-Local-${String(index + 1).padStart(4, '0')}`,
    driveId: `local-${name}`,
    name: name,
    category: "Local Dataset",
    description: `Locally imported street view panorama file: ${file}`,
    location: "Local Directory",
    protocolA_Url: url,
    protocolB_Urls: {
      North: url,
      East: url,
      South: url,
      West: url
    }
  };
});

// Update images array
state.images = localImages;

// 5. Write back to db.json
fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');

console.log('================================================================');
console.log('  SUCCESSFULLY IMPORTED DATASET');
console.log('================================================================');
console.log(`Imported:   ${localImages.length} images`);
console.log(`Database:   ${DB_FILE}`);
console.log('\nRestart your server (npm run dev) to see the new local dataset!\n');
