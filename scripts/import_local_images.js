import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Delegate to the CommonJS script
execSync(`node "${path.join(__dirname, 'import_local_images.cjs')}"`, { stdio: 'inherit' });
