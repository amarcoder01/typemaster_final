import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path: scripts/ is in root, so go up one level then to client/public
const PUBLIC_DIR = path.join(__dirname, '..', 'client', 'public');
const SOURCE_SVG = path.join(PUBLIC_DIR, 'logo-icon.svg');

console.log(`Looking for source SVG at: ${SOURCE_SVG}`);

if (!fs.existsSync(SOURCE_SVG)) {
    console.error('Source SVG not found!');
    process.exit(1);
}

const CONFIG = [
    { name: 'icon-72x72.png', size: 72 },
    { name: 'icon-96x96.png', size: 96 },
    { name: 'icon-128x128.png', size: 128 },
    { name: 'icon-144x144.png', size: 144 },
    { name: 'icon-152x152.png', size: 152 },
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-384x384.png', size: 384 },
    { name: 'icon-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon.png', size: 64 },
    { name: 'logo-icon.png', size: 512 }
];

async function generateIcons() {
    console.log('Generating icons from SVG...');

    for (const icon of CONFIG) {
        const outputPath = path.join(PUBLIC_DIR, icon.name);

        try {
            await sharp(SOURCE_SVG)
                .resize(icon.size, icon.size)
                .png({ quality: 80, compressionLevel: 9 })
                .toFile(outputPath);

            const stats = fs.statSync(outputPath);
            console.log(`Generated ${icon.name}: ${(stats.size / 1024).toFixed(2)}KB`);
        } catch (error) {
            console.error(`Error generating ${icon.name}:`, error);
        }
    }
}

generateIcons().catch(console.error);
