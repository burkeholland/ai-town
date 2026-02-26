// verify-browser.mjs — Town verification + OG card image generator
//
// Usage: node verify-browser.mjs [building-slug]
//
// 1. Validates town.json
// 2. If a slug is provided, generates a styled OG card image
//    (renders an HTML card via Puppeteer — no WebGL needed)

import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const slug = process.argv[2] || '';

// ─── Building type → emoji mapping ──────────────────────────────────────────

const TYPE_EMOJI = {
  shop: '🏪',
  house: '🏠',
  restaurant: '🍽️',
  public: '🏛️',
  entertainment: '🎭',
  nature: '🌳',
  other: '🏗️',
};

// ─── OG Card HTML Template ──────────────────────────────────────────────────

function buildCardHtml(building) {
  const emoji = TYPE_EMOJI[building.type] || '🏘️';
  const name = escapeHtml(building.name);
  const desc = escapeHtml(building.description);
  const user = escapeHtml(building.contributor.username);
  const avatar = building.contributor.avatar;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 40%, #7dd3fc 100%);
    font-family: system-ui, -apple-system, sans-serif;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }
  .skyline {
    position: absolute; bottom: 0; left: 0; right: 0; height: 180px;
    display: flex; align-items: flex-end; justify-content: center; gap: 12px;
    opacity: 0.12;
  }
  .bld { background: #0c4a6e; border-radius: 6px 6px 0 0; }
  .card {
    background: white; border-radius: 24px; padding: 48px 56px;
    max-width: 720px; text-align: center; position: relative; z-index: 1;
    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
  }
  .emoji { font-size: 48px; margin-bottom: 16px; }
  h1 { font-size: 42px; font-weight: 800; color: #111827; margin-bottom: 10px; }
  .desc {
    font-size: 18px; color: #6b7280; line-height: 1.6; margin-bottom: 24px;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .contributor {
    display: inline-flex; align-items: center; gap: 10px;
    background: #f0f9ff; padding: 8px 20px; border-radius: 99px;
    font-size: 16px; font-weight: 600; color: #0369a1;
  }
  .contributor img {
    width: 32px; height: 32px; border-radius: 50%; border: 2px solid #bae6fd;
  }
  .badge {
    position: absolute; top: 24px; right: 32px;
    font-size: 13px; font-weight: 700; color: #0ea5e9;
    letter-spacing: 0.05em; text-transform: uppercase;
  }
</style>
</head>
<body>
  <div class="skyline">
    <div class="bld" style="width:40px;height:90px"></div>
    <div class="bld" style="width:55px;height:140px"></div>
    <div class="bld" style="width:35px;height:70px"></div>
    <div class="bld" style="width:60px;height:160px"></div>
    <div class="bld" style="width:45px;height:100px"></div>
    <div class="bld" style="width:50px;height:120px"></div>
    <div class="bld" style="width:38px;height:80px"></div>
    <div class="bld" style="width:55px;height:130px"></div>
    <div class="bld" style="width:42px;height:95px"></div>
    <div class="bld" style="width:48px;height:110px"></div>
    <div class="bld" style="width:35px;height:75px"></div>
  </div>
  <div class="card">
    <div class="badge">AI Town</div>
    <div class="emoji">${emoji}</div>
    <h1>${name}</h1>
    <p class="desc">${desc}</p>
    <div class="contributor">
      <img src="${escapeHtml(avatar)}" alt="${user}">
      Built by @${user}
    </div>
  </div>
</body></html>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

  // Step 2: If slug provided, find building and generate OG card
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

  // Try Puppeteer for OG card generation
  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
  } catch {
    console.log('⚠️  Puppeteer not installed — skipping OG image generation.');
    console.log('   Install with: npm install puppeteer');
    process.exit(0);
  }

  console.log(`📸 Generating OG card for "${slug}"...`);

  const cardHtml = buildCardHtml(building);

  // Serve the card HTML on a local port
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(cardHtml);
  });

  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const browser = await puppeteer.default.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630 });
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle0', timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));

    const ogDir = join(__dirname, 'town', slug);
    mkdirSync(ogDir, { recursive: true });

    const ogPath = join(ogDir, 'og.png');
    await page.screenshot({
      path: ogPath,
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });

    const size = statSync(ogPath).size;
    console.log(`✅ OG card saved to town/${slug}/og.png (${(size / 1024).toFixed(0)} KB)`);

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
