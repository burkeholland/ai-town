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
const inputSlug = process.argv[2] || '';
const generateAll = inputSlug === '--all';

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

// ─── Share Page Generator ───────────────────────────────────────────────────
function buildSharePage(building) {
  const name = escapeHtml(building.name);
  const desc = escapeHtml(building.description);
  const user = escapeHtml(building.contributor.username);
  const slug = building.id;
  const baseUrl = 'https://burkeholland.github.io/ai-town';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — AI Town</title>
  <meta property="og:title" content="${name} — AI Town">
  <meta property="og:description" content="${desc} — Built by @${user}">
  <meta property="og:image" content="${baseUrl}/town/${slug}/og.png">
  <meta property="og:url" content="${baseUrl}/town/${slug}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="AI Town">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${name} — AI Town">
  <meta name="twitter:description" content="${desc} — Built by @${user}">
  <meta name="twitter:image" content="${baseUrl}/town/${slug}/og.png">
  <meta http-equiv="refresh" content="0;url=${baseUrl}/#building=${slug}">
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f0fdf4; }
    .card { text-align: center; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #666; }
    a { color: #22c55e; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🏘️ ${name}</h1>
    <p>${desc}</p>
    <p>Built by <strong>@${user}</strong></p>
    <p><a href="${baseUrl}/">Visit AI Town →</a></p>
  </div>
</body>
</html>`;
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

  if (!inputSlug) {
    console.log('✅ Verification complete (no slug — skipping OG image).');
    console.log('   Use: node verify-browser.mjs <slug> or node verify-browser.mjs --all');
    process.exit(0);
  }

  // Determine which buildings to process
  let targets;
  if (generateAll) {
    targets = buildings;
    console.log(`📸 Generating share cards for all ${buildings.length} buildings...`);
  } else {
    if (!safeSlugs(inputSlug)) {
      console.error(`❌ Invalid slug "${inputSlug}" — must be lowercase alphanumeric with hyphens`);
      process.exit(1);
    }
    const building = buildings.find(b => b.id === inputSlug);
    if (!building) {
      console.error(`❌ Building "${inputSlug}" not found in town.json`);
      process.exit(1);
    }
    const validationError = validateBuilding(building);
    if (validationError) {
      console.error(`❌ Building "${inputSlug}" has invalid data: ${validationError}`);
      process.exit(1);
    }
    targets = [building];
  }

  // Generate share page index.html for all targets (no puppeteer needed)
  for (const b of targets) {
    const dir = join(__dirname, 'town', b.id);
    mkdirSync(dir, { recursive: true });
    const htmlPath = join(dir, 'index.html');
    const { writeFileSync } = await import('fs');
    writeFileSync(htmlPath, buildSharePage(b));
    console.log(`✅ Share page: town/${b.id}/index.html`);
  }

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
  console.log(`📸 Generating OG images (port ${port})...`);

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
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
    page.on('pageerror', () => {});

    await page.goto(`http://localhost:${port}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for Three.js to initialize
    await new Promise(r => setTimeout(r, 4000));

    // Hide UI once (persists across camera repositions)
    await page.evaluate(() => {
      document.querySelector('header').style.display = 'none';
      document.querySelector('footer').style.display = 'none';
      for (const id of ['controls-hint', 'building-labels', 'crosshair', 'tooltip', 'info-panel']) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      }
      const container = document.getElementById('scene-container');
      if (container) {
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100vw';
        container.style.height = '100vh';
      }
    });

    for (const building of targets) {
      const slug = building.id;
      console.log(`  📷 ${slug}...`);

      // Set target slug and position camera
      await page.evaluate((targetSlug, plotIdx) => {
        const PLOTS = window.__townPlots || [];
        const plot = PLOTS[plotIdx] || { x: 25, z: 25 };

        if (window.__townRenderer) {
          const r = window.__townRenderer;

          // Find building bounding box for proper framing
          let radius = 4;
          r.scene.traverse((obj) => {
            if (obj.userData && obj.userData.id === targetSlug) {
              const box = new window.THREE.Box3().setFromObject(obj);
              const size = new window.THREE.Vector3();
              box.getSize(size);
              radius = Math.max(size.x, size.y, size.z) / 2;
            }
          });

          const camDist = Math.max(radius * 2.5, 8);
          const camHeight = Math.max(radius * 1.2, 4);
          const facing = PLOTS[plotIdx]?.facing || 0;
          const cx = plot.x + Math.sin(facing + 0.8) * camDist;
          const cz = plot.z + Math.cos(facing + 0.8) * camDist;
          r.camera.position.set(cx, camHeight, cz);
          r.camera.lookAt(plot.x, camHeight * 0.3, plot.z);
          r.camera.updateProjectionMatrix();
        }
      }, slug, building.plot || 0);

      await new Promise(r => setTimeout(r, 1500));

      // Take scene screenshot
      const sceneScreenshot = await page.screenshot({
        encoding: 'base64',
        clip: { x: 0, y: 0, width: 1200, height: 630 },
      });

      // Render composite card
      const compositeHtml = buildCompositeHtml(
        building,
        `data:image/png;base64,${sceneScreenshot}`
      );
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
      console.log(`  ✅ town/${slug}/og.png (${(size / 1024).toFixed(0)} KB)`);

      // Navigate back to the town for the next building
      if (targets.indexOf(building) < targets.length - 1) {
        await page.goto(`http://localhost:${port}/`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await new Promise(r => setTimeout(r, 4000));
        // Re-hide UI
        await page.evaluate(() => {
          document.querySelector('header').style.display = 'none';
          document.querySelector('footer').style.display = 'none';
          for (const id of ['controls-hint', 'building-labels', 'crosshair', 'tooltip', 'info-panel']) {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
          }
          const container = document.getElementById('scene-container');
          if (container) {
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100vw';
            container.style.height = '100vh';
          }
        });
      }
    }

    await browser.close();
  } catch (err) {
    console.error('❌ OG generation error:', err.message);
    server.close();
    process.exit(1);
  }

  server.close();
  console.log(`✅ All done — ${targets.length} building(s) processed.`);
  process.exit(0);
}

verify();
