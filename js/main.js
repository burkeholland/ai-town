// main.js — Load town.json and initialize the Three.js renderer

import { TownRenderer } from './renderer.js';

async function init() {
  const container = document.getElementById('scene-container');
  if (!container) {
    console.error('Scene container not found');
    return;
  }

  // Load town data
  let buildings;
  try {
    const res = await fetch('./town.json');
    buildings = await res.json();
  } catch (err) {
    console.error('Failed to load town.json:', err);
    buildings = [];
  }

  // Update building count
  const countEl = document.getElementById('building-count');
  if (countEl) {
    countEl.textContent = buildings.length;
  }

  // Initialize 3D renderer
  const renderer = new TownRenderer(container, buildings);

  // Toggle crosshair with pointer lock
  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === container.querySelector('canvas');
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.classList.toggle('hidden', !locked);
  });

  // Handle building selection — show info panel
  container.addEventListener('building-select', (e) => {
    const building = e.detail;
    const panel = document.getElementById('info-panel');
    if (!panel) return;

    if (!building) {
      panel.classList.add('hidden');
      return;
    }

    panel.classList.remove('hidden');
    document.getElementById('info-name').textContent = building.name;
    document.getElementById('info-desc').textContent = building.description;
    document.getElementById('info-type').textContent = building.type;

    const avatarEl = document.getElementById('info-avatar');
    if (avatarEl) {
      avatarEl.src = building.contributor.avatar;
      avatarEl.alt = building.contributor.username;
    }

    const usernameEl = document.getElementById('info-username');
    if (usernameEl) {
      usernameEl.textContent = `@${building.contributor.username}`;
      usernameEl.href = `https://github.com/${building.contributor.username}`;
    }

    const shareEl = document.getElementById('info-share');
    if (shareEl) {
      const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
      shareEl.href = `${baseUrl}/town/${building.id}/`;
      shareEl.textContent = `Share this building →`;
    }
  });

  // Close info panel
  const closeBtn = document.getElementById('info-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('info-panel')?.classList.add('hidden');
    });
  }
}

init();
