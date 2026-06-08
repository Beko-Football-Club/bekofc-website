#!/usr/bin/env node
/**
 * One-shot asset import. Run from repo root: node scripts/import-assets.mjs
 *
 * Inputs (assumed by user setup):
 *   ~/Downloads/BekoFC-LOGO.jpeg                — primary logo
 *   ~/Downloads/Beko-FC/                        — photo + video subfolder
 *
 * Outputs:
 *   site/public/uploads/logo.jpeg               — raster fallback
 *   site/public/uploads/logo.svg                — vectorized (potrace) or PNG-passthrough
 *   site/public/favicon.svg                     — same as logo.svg
 *   site/public/uploads/logo-og.png             — 1200x630 OG image
 *   site/public/uploads/photos/<NN>-<slug>.jpeg — curated 12 gallery photos
 *   site/local-media/<NN>-<slug>.mp4            — video staging (gitignored)
 */
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';

const HOME = homedir();
const DOWNLOADS = join(HOME, 'Downloads');
const LOGO_SRC = join(DOWNLOADS, 'BekoFC-LOGO.jpeg');
const BEKO_FOLDER = join(DOWNLOADS, 'Beko-FC');

const REPO = process.cwd();
const UPLOADS = join(REPO, 'site', 'public', 'uploads');
const PHOTOS = join(UPLOADS, 'photos');
const FAVICON = join(REPO, 'site', 'public', 'favicon.svg');
const LOCAL_MEDIA = join(REPO, 'site', 'local-media');

mkdirSync(UPLOADS, { recursive: true });
mkdirSync(PHOTOS, { recursive: true });
mkdirSync(LOCAL_MEDIA, { recursive: true });

if (!existsSync(LOGO_SRC)) {
  console.error(`MISSING: ${LOGO_SRC}`);
  process.exit(1);
}
copyFileSync(LOGO_SRC, join(UPLOADS, 'logo.jpeg'));
console.log('✓ logo.jpeg copied');

let svgWritten = false;
try {
  execSync('potrace --version', { stdio: 'ignore' });
  execSync(`potrace --svg -o "${join(UPLOADS, 'logo.svg')}" "${LOGO_SRC}"`, { stdio: 'inherit' });
  copyFileSync(join(UPLOADS, 'logo.svg'), FAVICON);
  svgWritten = true;
  console.log('✓ logo.svg vectorized via potrace');
} catch {
  console.warn('⚠ potrace unavailable — falling back to JPEG favicon link in BaseLayout');
}

if (!svgWritten) {
  copyFileSync(LOGO_SRC, FAVICON.replace(/\.svg$/, '.jpeg'));
  console.log('✓ favicon.jpeg fallback written (update BaseLayout link if needed)');
}

const photos = existsSync(BEKO_FOLDER)
  ? readdirSync(BEKO_FOLDER).filter((f) => /\.(jpe?g|png)$/i.test(f))
  : [];
const videos = existsSync(BEKO_FOLDER)
  ? readdirSync(BEKO_FOLDER).filter((f) => /\.mp4$/i.test(f))
  : [];

photos.slice(0, 12).forEach((f, i) => {
  const dst = join(PHOTOS, `${String(i + 1).padStart(2, '0')}-team.jpeg`);
  copyFileSync(join(BEKO_FOLDER, f), dst);
});
console.log(`✓ ${Math.min(photos.length, 12)} photos curated to site/public/uploads/photos/`);

videos.forEach((f, i) => {
  const dst = join(LOCAL_MEDIA, `${String(i + 1).padStart(2, '0')}-clip.mp4`);
  copyFileSync(join(BEKO_FOLDER, f), dst);
});
console.log(`✓ ${videos.length} videos staged to site/local-media/`);

console.log('\nNext: ensure site/public/uploads/logo-og.png exists (1200x630). Generate manually or use ImageMagick:');
console.log(`  magick -size 1200x630 xc:#FFD700 \\( "${join(UPLOADS, 'logo.jpeg')}" -resize 500x \\) -gravity center -composite "${join(UPLOADS, 'logo-og.png')}"`);
