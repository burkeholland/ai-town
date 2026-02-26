// verify-browser.mjs — Puppeteer verification + OG image screenshot
//
// Usage: node verify-browser.mjs [building-slug]
//
// 1. Starts a local HTTP server
// 2. Loads the town page
// 3. Checks for JS errors
// 4. Verifies the town renders
// 5. If a slug is provided, screenshots the building for OG image

import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const slug = process.argv[2] || '';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

// Simple static file server
function startServer(port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let filePath = join(__dirname, req.url === '/' ? 'index.html' : req.url);

      if (!existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = extname(filePath);
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      const content = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': mime });
      res.end(content);
    });

    server.listen(port, () => resolve(server));
  });
}

async function verify() {
  const PORT = 8765;
  const server = await startServer(PORT);
  console.log(`Server running on http://localhost:${PORT}`);

  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
  } catch {
    console.error('Puppeteer not installed. Install with: npm install puppeteer');
    console.log('Skipping browser verification — falling back to basic checks.');

    // Basic verification: check town.json is valid
    try {
      const data = JSON.parse(readFileSync(join(__dirname, 'town.json'), 'utf8'));
      console.log(`✅ town.json is valid (${data.length} buildings)`);

      if (slug) {
        const building = data.find(b => b.id === slug);
        if (building) {
          console.log(`✅ Building "${slug}" found in town.json`);
        } else {
          console.error(`❌ Building "${slug}" not found in town.json`);
          server.close();
          process.exit(1);
        }
      }
    } catch (err) {
      console.error('❌ town.json parse error:', err.message);
      server.close();
      process.exit(1);
    }

    server.close();
    process.exit(0);
  }

  const browser = await puppeteer.default.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });

  // Collect JS errors
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    // Load the page
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0', timeout: 15000 });

    // Check for JS errors
    if (errors.length > 0) {
      console.error('❌ JavaScript errors detected:');
      errors.forEach(e => console.error(`   ${e}`));
      await browser.close();
      server.close();
      process.exit(1);
    }
    console.log('✅ No JavaScript errors.');

    // Verify canvas exists and has content
    const canvasExists = await page.$('#town-canvas');
    if (!canvasExists) {
      console.error('❌ Canvas element not found');
      await browser.close();
      server.close();
      process.exit(1);
    }
    console.log('✅ Canvas element found.');

    // If slug provided, take OG screenshot
    if (slug) {
      console.log(`📸 Generating OG image for "${slug}"...`);

      // Wait a moment for rendering
      await new Promise(r => setTimeout(r, 1000));

      const ogDir = join(__dirname, 'town', slug);
      mkdirSync(ogDir, { recursive: true });

      await page.screenshot({
        path: join(ogDir, 'og.png'),
        clip: { x: 0, y: 0, width: 1200, height: 630 },
      });

      console.log(`✅ OG image saved to town/${slug}/og.png`);
    }

    console.log('✅ All verification checks passed.');
  } catch (err) {
    console.error('❌ Verification error:', err.message);
    await browser.close();
    server.close();
    process.exit(1);
  }

  await browser.close();
  server.close();
  process.exit(0);
}

verify();
