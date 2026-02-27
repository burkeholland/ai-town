// verify-browser.mjs — Town verification + OG card image generator
//
// Usage: node verify-browser.mjs [building-slug]
//
// 1. Validates town.json
// 2. If a slug is provided, loads the 3D town with WebGL,
//    positions the camera at the building, and screenshots it
//    into a branded OG card (1200x630).

import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const slug = process.argv[2] || '';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

// ─── Static file server ─────────────────────────────────────────────────────

function startServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      let filePath = join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
      try {
        const stat = statSync(filePath);
        if (stat.isDirectory()) filePath = join(filePath, 'index.html');
      } catch {
        res.writeHead(404); res.end('Not found'); return;
      }
      try {
        const ext = extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(readFileSync(filePath));
      } catch {
        res.writeHead(404); res.end('Not found');
      }
    });
    server.listen(0, () => resolve(server));
  });
}

// ─── Validation helpers ─────────────────────────────────────────────────────

function validateBuilding(b) {
  const required = ['id', 'name', 'description', 'type'];
  for (const key of required) {
    if (typeof b[key] !== 'string' || !b[key]) return `missing or invalid "${key}"`;
  }
  if (!b.contributor || typeof b.contributor.username !== 'string') return 'missing contributor.username';
  if (!b.contributor.avatar || typeof b.contributor.avatar !== 'string') return 'missing contributor.avatar';
  return null;
}

function safeSlugs(id) {
  return /^[a-z0-9][a-z0-9-]*$/.test(id);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── OG Composite Page ─────────────────────────────────────────────────────
// Renders the 3D scene screenshot inside a branded card frame

function buildCompositeHtml(building, screenshotDataUrl) {
  const name = escapeHtml(building.name);
  const user = escapeHtml(building.contributor.username);
  const avatar = escapeHtml(building.contributor.avatar);

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    font-family: system-ui, -apple-system, sans-serif;
    overflow: hidden; position: relative;
  }
  .scene {
    width: 100%; height: 100%;
    background: url("${screenshotDataUrl}") center/cover no-repeat;
  }
  .overlay {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.7));
    padding: 40px 48px 36px;
    display: flex; align-items: flex-end; justify-content: space-between;
  }
  .info { color: white; }
  h1 { font-size: 36px; font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,0.4); margin-bottom: 6px; }
  .contributor {
    display: flex; align-items: center; gap: 10px;
    font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.9);
  }
  .contributor img {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.6);
  }
  .badge {
    background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
    padding: 8px 16px; border-radius: 10px;
    font-size: 14px; font-weight: 700; color: white;
    letter-spacing: 0.03em;
  }
</style>
</head>
<body>
  <div class="scene"></div>
  <div class="overlay">
    <div class="info">
      <h1>${name}</h1>
      <div class="contributor">
        <img src="${avatar}" alt="${user}">
        Built by @${user}
      </div>
    </div>
    <div class="badge">🏘️ AI Town</div>
  </div>
</body></html>`;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function verify() {
  // Step 1: Validate town.json
  let buildings;
  try {
    buildings = JSON.parse(readFileSync(join(__dirname, 'town.json'), 'utf8'));
    console.log(`✅ town.json is valid (${buildings.length} buildings)`);
  } catch (err) {
    console.error('❌ town.json parse error:', err.message);
    process.exit(1);
  }

  // Check for duplicate plots
  const plotMap = {};
  let hasDupes = false;
  for (const b of buildings) {
    const p = b.plot ?? 0;
    if (plotMap[p]) {
      console.error(`❌ Plot ${p} conflict: "${plotMap[p]}" and "${b.id}" are on the same plot`);
      hasDupes = true;
    }
    plotMap[p] = b.id;
  }
  if (hasDupes) process.exit(1);

  if (!slug) {
    console.log('✅ Verification complete (no slug — skipping OG image).');
    process.exit(0);
  }

  if (!safeSlugs(slug)) {
    console.error(`❌ Invalid slug "${slug}" — must be lowercase alphanumeric with hyphens`);
    process.exit(1);
  }

  const building = buildings.find(b => b.id === slug);
  if (!building) {
    console.error(`❌ Building "${slug}" not found in town.json`);
    process.exit(1);
  }

  const validationError = validateBuilding(building);
  if (validationError) {
    console.error(`❌ Building "${slug}" has invalid data: ${validationError}`);
    process.exit(1);
  }
  console.log(`✅ Building "${slug}" found and validated in town.json`);

  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
  } catch {
    console.log('⚠️  Puppeteer not installed — skipping OG image generation.');
    process.exit(0);
  }

  // Step 2: Start local server and load the 3D town
  const server = await startServer();
  const port = server.address().port;
  console.log(`📸 Generating OG image for "${slug}" (port ${port})...`);

  try {
    const browser = await puppeteer.default.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--use-gl=angle',
        '--use-angle=swiftshader-webgl',
      ],
    });

    const page = await browser.newPage();
    // Render at higher res for the scene capture
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

    // Suppress non-critical errors (favicon, etc)
    page.on('pageerror', () => {});

    await page.goto(`http://localhost:${port}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // Wait for Three.js to initialize, then position camera at the building
    await new Promise(r => setTimeout(r, 3000));

    // Position camera to look at this building's plot
    const plotIndex = building.plot || 0;
    await page.evaluate((plotIdx) => {
      // Plot positions (duplicated from buildings.js for headless access)
      const PLOTS = [
        { x: 25, z: 25 }, { x: 21, z: 21.5 }, { x: 29, z: 21.5 },
        { x: 21, z: 28.5 }, { x: 29, z: 28.5 }, { x: 15, z: 21 },
        { x: 10, z: 22 }, { x: 15, z: 30 }, { x: 10, z: 31 },
        { x: 3, z: 22 }, { x: 35, z: 21 }, { x: 40, z: 22 },
        { x: 35, z: 30 }, { x: 40, z: 31 }, { x: 47, z: 22 },
        { x: 20, z: 17 }, { x: 28, z: 16 }, { x: 21, z: 11 },
        { x: 28, z: 10 }, { x: 20, z: 5 }, { x: 20, z: 33 },
        { x: 28, z: 34 }, { x: 21, z: 39 }, { x: 28, z: 40 },
        { x: 20, z: 45 }, { x: 17, z: 15 }, { x: 33, z: 17 },
        { x: 17, z: 36 }, { x: 33, z: 33 }, { x: 7, z: 20 },
        { x: 43, z: 20 }, { x: 7, z: 32 }, { x: 43, z: 32 },
        { x: 13, z: 15 }, { x: 37, z: 15 }, { x: 13, z: 37 },
        { x: 37, z: 37 }, { x: 31, z: 12 }, { x: 31, z: 38 },
        { x: 6, z: 38 },
        { x: 50, z: 8 },
      ];

      const plot = PLOTS[plotIdx] || PLOTS[0];

      // Hide all UI elements
      document.querySelector('header').style.display = 'none';
      document.querySelector('footer').style.display = 'none';
      const hint = document.getElementById('controls-hint');
      if (hint) hint.style.display = 'none';
      const labels = document.getElementById('building-labels');
      if (labels) labels.style.display = 'none';
      const crosshair = document.getElementById('crosshair');
      if (crosshair) crosshair.style.display = 'none';
      const tooltip = document.getElementById('tooltip');
      if (tooltip) tooltip.style.display = 'none';

      // Make scene container fullscreen
      const container = document.getElementById('scene-container');
      if (container) {
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100vw';
        container.style.height = '100vh';
      }

      // Access the Three.js renderer instance to reposition camera
      // The renderer stores camera on the TownRenderer instance
      // We need to find it via the canvas's parent
      if (window.__townRenderer) {
        const r = window.__townRenderer;
        // Position camera in front of the building, looking at it
        const camDist = 8;
        const camHeight = 4;
        // Place camera to the south-east of the building looking at it
        r.camera.position.set(plot.x + 5, camHeight, plot.z + 6);
        r.camera.lookAt(plot.x, 1.5, plot.z);
        r.camera.updateProjectionMatrix();
      }
    }, plotIndex);

    // Let the scene re-render fullscreen
    await new Promise(r => setTimeout(r, 2000));

    // Take the scene screenshot as a data URL
    const sceneScreenshot = await page.screenshot({
      encoding: 'base64',
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });

    // Step 3: Render the composite card (scene + branding overlay)
    const compositeHtml = buildCompositeHtml(
      building,
      `data:image/png;base64,${sceneScreenshot}`
    );

    // Navigate to composite page
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
    await page.setContent(compositeHtml, { waitUntil: 'load', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    const ogDir = join(__dirname, 'town', slug);
    mkdirSync(ogDir, { recursive: true });
    const ogPath = join(ogDir, 'og.png');

    await page.screenshot({
      path: ogPath,
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });

    const size = statSync(ogPath).size;
    console.log(`✅ OG image saved to town/${slug}/og.png (${(size / 1024).toFixed(0)} KB)`);

    await browser.close();
  } catch (err) {
    console.error('❌ OG generation error:', err.message);
    server.close();
    process.exit(1);
  }

  server.close();
  console.log('✅ All checks passed.');
  process.exit(0);
}

verify();
