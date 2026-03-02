// buildings.js — 3D building construction for Three.js

import * as THREE from 'three';

// Lightweight glow orb — replaces PointLight for zero GPU cost.
// Returns a small emissive sphere that can be positioned and added like a light.
const _glowGeo = new THREE.SphereGeometry(0.08, 4, 4);
function createGlowOrb(color) {
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 });
  return new THREE.Mesh(_glowGeo, mat);
}

// Building type color schemes
export const BUILDING_TYPES = {
  shop:          { roof: 0xff7f50, wall: 0xfef3c7, accent: 0xea580c, door: 0x92400e },
  house:         { roof: 0x84cc16, wall: 0xfef3c7, accent: 0x65a30d, door: 0x92400e },
  restaurant:    { roof: 0xf59e0b, wall: 0xfef3c7, accent: 0xd97706, door: 0x92400e },
  public:        { roof: 0x0ea5e9, wall: 0xf0f9ff, accent: 0x0284c7, door: 0x1e3a5f },
  entertainment: { roof: 0xc4b5fd, wall: 0xfef3c7, accent: 0x8b5cf6, door: 0x4c1d95 },
  nature:        { roof: 0x84cc16, wall: 0x84cc16, accent: 0x65a30d, door: 0x92400e },
  other:         { roof: 0x9ca3af, wall: 0xfef3c7, accent: 0x6b7280, door: 0x4b5563 },
};

// Organic village layout — BotW-inspired winding roads and scattered plots
// Each plot has a world position and facing direction (radians)
// facing: 0 = front faces +Z, PI/2 = +X, PI = -Z, -PI/2 = -X

export const TOWN_CENTER_X = 25;
export const TOWN_CENTER_Z = 25;

const PLOTS = [
  // ─── Town Square (center — RESERVED plots 1-4) ───
  { x: 25,   z: 25,   facing: 0 },                // 0: Town Hall
  { x: 21.5, z: 21.5, facing: Math.PI / 4 },      // 1: NW (RESERVED)
  { x: 28.5, z: 21.5, facing: -Math.PI / 4 },     // 2: NE (RESERVED)
  { x: 21.5, z: 28.5, facing: 3 * Math.PI / 4 },  // 3: SW (RESERVED)
  { x: 28.5, z: 28.5, facing: -3 * Math.PI / 4 }, // 4: SE (RESERVED)

  // ─── Main Street West (just off road edge) ───
  { x: 15,   z: 21.5, facing: 0 },                 // 5: north side (faces +Z toward road)
  { x: 8,    z: 21.5, facing: 0 },                 // 6: north side
  { x: 15,   z: 28.5, facing: Math.PI },           // 7: south side (faces -Z toward road)
  { x: 8,    z: 28.5, facing: Math.PI },           // 8: south side
  { x: 0,    z: 21.5, facing: 0 },                 // 9: west terminus north side

  // ─── Main Street East (just off road edge) ───
  { x: 35,   z: 21.5, facing: 0 },                 // 10: north side
  { x: 42,   z: 21.5, facing: 0 },                 // 11: north side
  { x: 35,   z: 28.5, facing: Math.PI },           // 12: south side
  { x: 42,   z: 28.5, facing: Math.PI },           // 13: south side
  { x: 50,   z: 21.5, facing: 0 },                 // 14: east terminus (waterfront)

  // ─── North Road (just off road edge) ───
  { x: 21.5, z: 15,   facing: Math.PI / 2 },      // 15: west side
  { x: 28.5, z: 15,   facing: -Math.PI / 2 },     // 16: east side
  { x: 21.5, z: 8,    facing: Math.PI / 2 },      // 17: west side
  { x: 28.5, z: 8,    facing: -Math.PI / 2 },     // 18: east side
  { x: 21.5, z: 1,    facing: Math.PI / 2 },      // 19: west side far north

  // ─── South Road (just off road edge) ───
  { x: 21.5, z: 35,   facing: Math.PI / 2 },      // 20: west side
  { x: 28.5, z: 35,   facing: -Math.PI / 2 },     // 21: east side
  { x: 21.5, z: 42,   facing: Math.PI / 2 },      // 22: west side
  { x: 28.5, z: 42,   facing: -Math.PI / 2 },     // 23: east side
  { x: 21.5, z: 50,   facing: Math.PI / 2 },      // 24: west side far south

  // ─── Scattered / Outskirts ───
  { x: 14,   z: 15,   facing: Math.PI / 3 },      // 25: NW quadrant
  { x: 36,   z: 15,   facing: -Math.PI / 3 },     // 26: NE quadrant
  { x: 14,   z: 35,   facing: 2 * Math.PI / 3 },  // 27: SW quadrant
  { x: 36,   z: 35,   facing: -2 * Math.PI / 3 }, // 28: SE quadrant
  { x: 4,    z: 15,   facing: Math.PI / 4 },      // 29: far west north
  { x: 46,   z: 15,   facing: -Math.PI / 4 },     // 30: far east north
  { x: 4,    z: 38,   facing: Math.PI / 4 },      // 31: far west south
  { x: 46,   z: 38,   facing: -Math.PI / 4 },     // 32: far east south
  { x: 10,   z: 5,    facing: Math.PI / 4 },      // 33: outskirts NW
  { x: 40,   z: 5,    facing: -Math.PI / 4 },     // 34: outskirts NE
  { x: 10,   z: 45,   facing: -Math.PI / 4 },     // 35: outskirts SW
  { x: 40,   z: 45,   facing: Math.PI / 4 },      // 36: outskirts SE
  { x: 35,   z: 4,    facing: Math.PI },           // 37: outskirts far N
  { x: 35,   z: 46,   facing: 0 },                 // 38: outskirts far S
  { x: -5,   z: 26,   facing: 0 },                 // 39: outskirts far W
  { x: 55,   z: 8,    facing: Math.PI * 3 / 4 },  // 40: outskirts far NE (large)
];

export function plotToWorld(plotIndex) {
  const plot = PLOTS[plotIndex] || PLOTS[0];
  return { x: plot.x, z: plot.z, facing: plot.facing };
}

export function getAvailablePlots() {
  return PLOTS.map((p, i) => ({ plot: i, x: p.x, z: p.z, facing: p.facing }));
}

// Custom building renderers keyed by building ID
const CUSTOM_BUILDERS = {};

// Create 3D building group
export function createBuilding(building) {
  const type = BUILDING_TYPES[building.type] || BUILDING_TYPES.other;
  const group = new THREE.Group();
  group.userData = building;

  if (CUSTOM_BUILDERS[building.id]) {
    CUSTOM_BUILDERS[building.id](group, building, type);
  } else if (building.type === 'nature') {
    buildNature(group, building, type);
  } else {
    buildStructure(group, building, type);
  }

  // Position and rotate based on plot
  const plot = PLOTS[building.plot] || PLOTS[0];
  group.position.set(plot.x, 0, plot.z);
  group.rotation.y = plot.facing || 0;

  return group;
}

function buildStructure(group, building, type) {
  const wallW = 1.8;
  const wallH = 1.6;
  const wallD = 1.5;

  // Base/foundation
  const baseGeo = new THREE.BoxGeometry(wallW + 0.2, 0.1, wallD + 0.2);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.05;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Walls
  const wallGeo = new THREE.BoxGeometry(wallW, wallH, wallD);
  const wallMat = new THREE.MeshStandardMaterial({ color: type.wall });
  const walls = new THREE.Mesh(wallGeo, wallMat);
  walls.position.y = wallH / 2 + 0.1;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // Roof — pitched
  const roofH = 0.8;
  const roofGeo = new THREE.ConeGeometry(wallW * 0.85, roofH, 4);
  const roofMat = new THREE.MeshStandardMaterial({ color: type.roof });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = wallH + 0.1 + roofH / 2;
  roof.castShadow = true;
  group.add(roof);

  // Door
  const doorGeo = new THREE.BoxGeometry(0.35, 0.6, 0.05);
  const doorMat = new THREE.MeshStandardMaterial({ color: type.door });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 0.4, wallD / 2 + 0.03);
  group.add(door);

  // Windows
  const winGeo = new THREE.BoxGeometry(0.3, 0.3, 0.05);
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xbfdbfe,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
  });

  // Front windows
  for (const xOff of [-0.5, 0.5]) {
    const win = new THREE.Mesh(winGeo, winMat);
    win.position.set(xOff, wallH * 0.65, wallD / 2 + 0.03);
    group.add(win);
  }

  // Side window
  const sideWin = new THREE.Mesh(winGeo, winMat);
  sideWin.rotation.y = Math.PI / 2;
  sideWin.position.set(wallW / 2 + 0.03, wallH * 0.65, 0);
  group.add(sideWin);

  // Plaque on front wall
  buildPlaque(group, building, wallD / 2 + 0.03, 2.6);
}

function buildNature(group, building, type) {
  if (building.id === 'pixel-fountain') {
    // Fountain basin
    const basinGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.4, 16);
    const basinMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.position.y = 0.2;
    basin.castShadow = true;
    basin.receiveShadow = true;
    group.add(basin);

    // Water surface
    const waterGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.05, 16);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.7,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = 0.38;
    group.add(water);

    // Center pillar
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.15, 1.2, 8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 0.8;
    pillar.castShadow = true;
    group.add(pillar);

    // Water drops at top
    const dropGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const dropMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.6,
    });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const drop = new THREE.Mesh(dropGeo, dropMat);
      drop.position.set(Math.cos(angle) * 0.25, 1.4 + Math.sin(i) * 0.1, Math.sin(angle) * 0.25);
      group.add(drop);
    }
  } else {
    // Park / nature — grass patch + trees
    const grassGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.08, 16);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0xbbf7d0 });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.y = 0.04;
    grass.receiveShadow = true;
    group.add(grass);

    const treePositions = [
      { x: -0.6, z: -0.4 },
      { x: 0.5, z: -0.6 },
      { x: 0, z: 0.5 },
    ];

    for (const pos of treePositions) {
      buildTree(group, pos.x, pos.z);
    }
  }

  // Stone marker with plaque
  const markerGeo = new THREE.BoxGeometry(0.5, 0.45, 0.25);
  const markerMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db });
  const marker = new THREE.Mesh(markerGeo, markerMat);
  marker.position.set(0, 0.225, 1.0);
  marker.castShadow = true;
  group.add(marker);
  buildPlaque(group, building, 1.125, 1.6);
}

function buildTree(group, x, z) {
  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x92400e });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(x, 0.4, z);
  trunk.castShadow = true;
  group.add(trunk);

  // Canopy — layered spheres for charm
  const canopyMat1 = new THREE.MeshStandardMaterial({ color: 0x4ade80 });
  const canopyMat2 = new THREE.MeshStandardMaterial({ color: 0x22c55e });

  const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), canopyMat1);
  c1.position.set(x, 1.05, z);
  c1.castShadow = true;
  group.add(c1);

  const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), canopyMat2);
  c2.position.set(x - 0.15, 0.85, z + 0.1);
  c2.castShadow = true;
  group.add(c2);
}

function buildPlaque(group, building, frontZ, plaqueY = 1.2, plaqueX = 0) {
  // Anchor point for HTML overlay label (avatar + username)
  group.userData.plaqueWorldPos = new THREE.Vector3(plaqueX, plaqueY, frontZ + 0.1);
}

// Create a smooth curved road strip from waypoints
function createRoadStrip(waypoints, width, material) {
  const curve = new THREE.CatmullRomCurve3(
    waypoints.map(p => new THREE.Vector3(p.x, 0, p.z)),
    false, 'catmullrom', 0.5
  );
  const N = 60;
  const vertices = [];
  const indices = [];
  const hw = width / 2;

  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const px = -tangent.z;
    const pz = tangent.x;
    const len = Math.sqrt(px * px + pz * pz) || 1;
    vertices.push(
      point.x - (px / len) * hw, 0.02, point.z - (pz / len) * hw,
      point.x + (px / len) * hw, 0.02, point.z + (pz / len) * hw
    );
    if (i < N) {
      const j = i * 2;
      indices.push(j, j + 2, j + 1, j + 1, j + 2, j + 3);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

// ─── Custom Building: Grand Town Hall ──────────────────────────────────────

CUSTOM_BUILDERS['town-hall'] = function (group, building) {
  const W = 4.0;        // width
  const D = 3.0;        // depth
  const storyH = 1.4;   // height per floor
  const stories = 3;
  const story4H = 1.8;  // 4th story — tall (~20ft) ceilings
  const baseH = 0.3;    // foundation height
  const totalWallH = stories * storyH;

  // Materials
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd4ccc0, roughness: 0.85 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0e6d6, roughness: 0.7 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xb8a088, roughness: 0.8 });
  const columnMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.5 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x3b1a0e, roughness: 0.6 });
  const winMat = new THREE.MeshStandardMaterial({ color: 0xbfdbfe, emissive: 0x3b82f6, emissiveIntensity: 0.12, transparent: true, opacity: 0.35, roughness: 0.1 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4a843, metalness: 0.6, roughness: 0.3 });

  // ── STONE STEPS (3 wide steps leading up) ──
  for (let i = 0; i < 3; i++) {
    const stepW = W + 0.6 - i * 0.15;
    const stepGeo = new THREE.BoxGeometry(stepW, 0.1, 0.5);
    const step = new THREE.Mesh(stepGeo, stoneMat);
    step.position.set(0, i * 0.1 + 0.05, D / 2 + 1.2 - i * 0.4);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  }

  // ── FOUNDATION ──
  const baseGeo = new THREE.BoxGeometry(W + 0.4, baseH, D + 0.4);
  const base = new THREE.Mesh(baseGeo, stoneMat);
  base.position.y = baseH / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // ── MAIN BODY (3 stories) ──
  const wallGeo = new THREE.BoxGeometry(W, totalWallH, D);
  const walls = new THREE.Mesh(wallGeo, wallMat);
  walls.position.y = baseH + totalWallH / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // Floor divider trims
  for (let floor = 1; floor <= stories; floor++) {
    const tGeo = new THREE.BoxGeometry(W + 0.08, 0.06, D + 0.08);
    const t = new THREE.Mesh(tGeo, trimMat);
    t.position.y = baseH + floor * storyH;
    group.add(t);
  }

  // ── 4th STORY — tall (~20ft) ceilings ──
  const s4Base = baseH + totalWallH;  // y at base of 4th story = 4.5

  const wall4Geo = new THREE.BoxGeometry(W, story4H, D);
  const wall4 = new THREE.Mesh(wall4Geo, wallMat);
  wall4.position.y = s4Base + story4H / 2;
  wall4.castShadow = true;
  wall4.receiveShadow = true;
  group.add(wall4);

  // Trim strip at 4th story base
  const trim4Geo = new THREE.BoxGeometry(W + 0.08, 0.06, D + 0.08);
  const trim4 = new THREE.Mesh(trim4Geo, trimMat);
  trim4.position.y = s4Base;
  group.add(trim4);

  // ── WRAP-AROUND BALCONY ──
  const bExt = 0.65;  // how far balcony extends beyond the walls on each side
  const balconyFloorY = s4Base;
  const slabMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.9 });

  // Front slab — full width including corners
  const bFrontGeo = new THREE.BoxGeometry(W + 2 * bExt, 0.1, bExt);
  const bFront = new THREE.Mesh(bFrontGeo, slabMat);
  bFront.position.set(0, balconyFloorY + 0.05, D / 2 + bExt / 2);
  bFront.castShadow = true;
  bFront.receiveShadow = true;
  group.add(bFront);

  // Back slab — full width including corners
  const bBack = new THREE.Mesh(bFrontGeo, slabMat);
  bBack.position.set(0, balconyFloorY + 0.05, -D / 2 - bExt / 2);
  group.add(bBack);

  // Left slab — side only (between front and back)
  const bSideGeo = new THREE.BoxGeometry(bExt, 0.1, D);
  const bLeft = new THREE.Mesh(bSideGeo, slabMat);
  bLeft.position.set(-W / 2 - bExt / 2, balconyFloorY + 0.05, 0);
  bLeft.castShadow = true;
  bLeft.receiveShadow = true;
  group.add(bLeft);

  // Right slab
  const bRight = new THREE.Mesh(bSideGeo, slabMat);
  bRight.position.set(W / 2 + bExt / 2, balconyFloorY + 0.05, 0);
  group.add(bRight);

  // Balcony railing
  const railH = 0.4;
  const railTopY = balconyFloorY + 0.1 + railH;
  const postCenterY = balconyFloorY + 0.1 + railH / 2;
  const bOuterW = W + 2 * bExt;
  const bOuterD = D + 2 * bExt;
  const postGeo2 = new THREE.BoxGeometry(0.06, railH, 0.06);
  const postMat2 = new THREE.MeshStandardMaterial({ color: 0xd4ccc0, roughness: 0.8 });
  const railMat2 = new THREE.MeshStandardMaterial({ color: 0xd4ccc0, roughness: 0.7 });

  // Front & back railing posts
  const nFP = 10;
  for (let i = 0; i <= nFP; i++) {
    const px = -bOuterW / 2 + (i / nFP) * bOuterW;
    for (const pz of [D / 2 + bExt - 0.05, -D / 2 - bExt + 0.05]) {
      const post = new THREE.Mesh(postGeo2, postMat2);
      post.position.set(px, postCenterY, pz);
      group.add(post);
    }
  }

  // Side railing posts (skip corners, already covered by front/back)
  const nSP = 7;
  for (let i = 1; i < nSP; i++) {
    const pz = -D / 2 + (i / nSP) * D;
    for (const px of [-W / 2 - bExt + 0.05, W / 2 + bExt - 0.05]) {
      const post = new THREE.Mesh(postGeo2, postMat2);
      post.position.set(px, postCenterY, pz);
      group.add(post);
    }
  }

  // Top handrails
  const fRailGeo = new THREE.BoxGeometry(bOuterW, 0.05, 0.05);
  const sRailGeo = new THREE.BoxGeometry(0.05, 0.05, bOuterD);
  for (const pz of [D / 2 + bExt - 0.05, -D / 2 - bExt + 0.05]) {
    const r = new THREE.Mesh(fRailGeo, railMat2);
    r.position.set(0, railTopY, pz);
    group.add(r);
  }
  for (const px of [-W / 2 - bExt + 0.05, W / 2 + bExt - 0.05]) {
    const r = new THREE.Mesh(sRailGeo, railMat2);
    r.position.set(px, railTopY, 0);
    group.add(r);
  }

  // ── 4th FLOOR WINDOWS (tall, matching aesthetic) ──
  // Front
  for (const wx of [-1.4, -0.6, 0.6, 1.4]) {
    const w4 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.06), winMat);
    w4.position.set(wx, s4Base + story4H * 0.52, D / 2 + 0.04);
    group.add(w4);
    const sill4 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.1), stoneMat);
    sill4.position.set(wx, s4Base + story4H * 0.52 - 0.38, D / 2 + 0.06);
    group.add(sill4);
  }
  // Side windows
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const w4s = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.3), winMat);
      w4s.position.set(side * (W / 2 + 0.04), s4Base + story4H * 0.52, -D / 3 + i * D / 3);
      group.add(w4s);
    }
  }
  // Back windows
  for (const wx of [-1.0, 0, 1.0]) {
    const w4b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.65, 0.06), winMat);
    w4b.position.set(wx, s4Base + story4H * 0.52, -D / 2 - 0.04);
    group.add(w4b);
  }

  // ── FRONT COLUMNS (span ground + 2nd floor) ──
  const colH = storyH * 2;
  const colR = 0.12;
  for (const cx of [-W / 2 + 0.3, -W / 6, W / 6, W / 2 - 0.3]) {
    // Shaft
    const colGeo = new THREE.CylinderGeometry(colR, colR * 1.15, colH, 12);
    const col = new THREE.Mesh(colGeo, columnMat);
    col.position.set(cx, baseH + colH / 2, D / 2 + 0.1);
    col.castShadow = true;
    group.add(col);
    // Capital
    const capGeo = new THREE.BoxGeometry(colR * 3, 0.1, colR * 3);
    const cap = new THREE.Mesh(capGeo, columnMat);
    cap.position.set(cx, baseH + colH + 0.05, D / 2 + 0.1);
    group.add(cap);
    // Base
    const cbGeo = new THREE.BoxGeometry(colR * 2.5, 0.08, colR * 2.5);
    const cb = new THREE.Mesh(cbGeo, columnMat);
    cb.position.set(cx, baseH + 0.04, D / 2 + 0.1);
    group.add(cb);
  }

  // ── PEDIMENT (triangular gable) ──
  const pedW = W + 0.2;
  const pedH = 0.8;
  const pedShape = new THREE.Shape();
  pedShape.moveTo(-pedW / 2, 0);
  pedShape.lineTo(pedW / 2, 0);
  pedShape.lineTo(0, pedH);
  pedShape.closePath();
  const pedGeo = new THREE.ExtrudeGeometry(pedShape, { depth: 0.12, bevelEnabled: false });
  const pediment = new THREE.Mesh(pedGeo, wallMat);
  pediment.position.set(0, baseH + storyH * 2 + 0.03, D / 2);
  pediment.castShadow = true;
  group.add(pediment);

  // Pediment trim
  const pedTrimGeo = new THREE.BoxGeometry(pedW + 0.1, 0.06, 0.14);
  const pedTrim = new THREE.Mesh(pedTrimGeo, trimMat);
  pedTrim.position.set(0, baseH + storyH * 2 + 0.03, D / 2 + 0.06);
  group.add(pedTrim);

  // ── GRAND DOUBLE DOORS ──
  for (const dx of [-0.25, 0.25]) {
    const dGeo = new THREE.BoxGeometry(0.45, 1.0, 0.06);
    const d = new THREE.Mesh(dGeo, doorMat);
    d.position.set(dx, baseH + 0.5, D / 2 + 0.04);
    group.add(d);
    // Door panel detail
    const panelGeo = new THREE.BoxGeometry(0.35, 0.35, 0.02);
    const panel = new THREE.Mesh(panelGeo, new THREE.MeshStandardMaterial({ color: 0x4a2510 }));
    panel.position.set(dx, baseH + 0.65, D / 2 + 0.08);
    group.add(panel);
  }
  // Door arch
  const archGeo = new THREE.TorusGeometry(0.45, 0.05, 8, 12, Math.PI);
  const arch = new THREE.Mesh(archGeo, trimMat);
  arch.position.set(0, baseH + 1.0, D / 2 + 0.04);
  group.add(arch);
  // Door handles
  for (const dx of [-0.08, 0.08]) {
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), goldMat);
    handle.position.set(dx, baseH + 0.55, D / 2 + 0.08);
    group.add(handle);
  }

  // ── WINDOWS ──
  // Ground floor front (beside doors)
  for (const wx of [-1.2, -0.7, 0.7, 1.2]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.06), winMat);
    w.position.set(wx, baseH + storyH * 0.45, D / 2 + 0.04);
    group.add(w);
    // Window sill
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.1), stoneMat);
    sill.position.set(wx, baseH + storyH * 0.18, D / 2 + 0.06);
    group.add(sill);
  }
  // Second floor front
  for (const wx of [-1.4, -0.8, -0.2, 0.2, 0.8, 1.4]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.06), winMat);
    w.position.set(wx, baseH + storyH + storyH * 0.45, D / 2 + 0.04);
    group.add(w);
  }
  // Third floor — round oculus windows
  for (const wx of [-1.0, 0, 1.0]) {
    const w = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12), winMat);
    w.position.set(wx, baseH + storyH * 2 + storyH * 0.45, D / 2 + 0.04);
    group.add(w);
    // Circular frame
    const fr = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 16), trimMat);
    fr.position.set(wx, baseH + storyH * 2 + storyH * 0.45, D / 2 + 0.04);
    group.add(fr);
  }
  // Side windows (both sides, all floors)
  for (const side of [-1, 1]) {
    for (let floor = 0; floor < stories; floor++) {
      for (let i = 0; i < 3; i++) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.3), winMat);
        w.position.set(side * (W / 2 + 0.04), baseH + floor * storyH + storyH * 0.45, -D / 3 + i * D / 3);
        group.add(w);
      }
    }
  }
  // Back windows
  for (let floor = 0; floor < stories; floor++) {
    for (const wx of [-1.0, 0, 1.0]) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.06), winMat);
      w.position.set(wx, baseH + floor * storyH + storyH * 0.45, -D / 2 - 0.04);
      group.add(w);
    }
  }

  // ── FLAT ROOF with PARAPET ──
  const roofSlabGeo = new THREE.BoxGeometry(W + 0.3, 0.12, D + 0.3);
  const roofSlab = new THREE.Mesh(roofSlabGeo, roofMat);
  roofSlab.position.y = baseH + totalWallH + story4H + 0.06;
  roofSlab.castShadow = true;
  group.add(roofSlab);

  const parapetH = 0.25;
  for (const [pw, pd, px, pz] of [
    [W + 0.3, 0.08, 0, D / 2 + 0.11],
    [W + 0.3, 0.08, 0, -D / 2 - 0.11],
    [0.08, D + 0.3, -W / 2 - 0.11, 0],
    [0.08, D + 0.3, W / 2 + 0.11, 0],
  ]) {
    const pGeo = new THREE.BoxGeometry(pw, parapetH, pd);
    const p = new THREE.Mesh(pGeo, stoneMat);
    p.position.set(px, baseH + totalWallH + story4H + 0.12 + parapetH / 2, pz);
    group.add(p);
  }

  // Parapet corner posts
  for (const [cx, cz] of [
    [-W / 2 - 0.05, D / 2 + 0.05],
    [W / 2 + 0.05, D / 2 + 0.05],
    [-W / 2 - 0.05, -D / 2 - 0.05],
    [W / 2 + 0.05, -D / 2 - 0.05],
  ]) {
    const cpGeo = new THREE.BoxGeometry(0.15, parapetH + 0.12, 0.15);
    const cp = new THREE.Mesh(cpGeo, stoneMat);
    cp.position.set(cx, baseH + totalWallH + story4H + 0.12 + (parapetH + 0.12) / 2, cz);
    group.add(cp);
    // Sphere finial
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), stoneMat);
    fin.position.set(cx, baseH + totalWallH + story4H + 0.12 + parapetH + 0.19, cz);
    group.add(fin);
  }

  // ── CLOCK TOWER ──
  const towerW = 1.2;
  const towerH = 2.0;
  const towerBase = baseH + totalWallH + story4H + 0.12;

  const towerGeo = new THREE.BoxGeometry(towerW, towerH, towerW);
  const tower = new THREE.Mesh(towerGeo, wallMat);
  tower.position.y = towerBase + towerH / 2;
  tower.castShadow = true;
  group.add(tower);

  // Tower corner pilasters
  for (const [cx, cz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    const pilGeo = new THREE.BoxGeometry(0.08, towerH, 0.08);
    const pil = new THREE.Mesh(pilGeo, trimMat);
    pil.position.set(cx * towerW / 2, towerBase + towerH / 2, cz * towerW / 2);
    group.add(pil);
  }

  // Tower cornice
  const tCorniceGeo = new THREE.BoxGeometry(towerW + 0.12, 0.08, towerW + 0.12);
  const tCornice = new THREE.Mesh(tCorniceGeo, trimMat);
  tCornice.position.y = towerBase + towerH;
  group.add(tCornice);

  // Clock faces on all 4 sides
  const clockY = towerBase + towerH * 0.65;
  const clockFaceGeo = new THREE.CircleGeometry(0.35, 16);
  const clockFaceMat = new THREE.MeshStandardMaterial({ color: 0xfefce8 });
  const clockFrameGeo = new THREE.TorusGeometry(0.37, 0.04, 8, 24);
  const hourHandGeo = new THREE.BoxGeometry(0.03, 0.2, 0.02);
  const minHandGeo = new THREE.BoxGeometry(0.02, 0.28, 0.02);
  const handMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });

  const clockSides = [
    { pos: [0, clockY, towerW / 2 + 0.03], ry: 0 },
    { pos: [0, clockY, -towerW / 2 - 0.03], ry: Math.PI },
    { pos: [towerW / 2 + 0.03, clockY, 0], ry: Math.PI / 2 },
    { pos: [-towerW / 2 - 0.03, clockY, 0], ry: -Math.PI / 2 },
  ];

  for (const { pos, ry } of clockSides) {
    const cg = new THREE.Group();
    cg.add(new THREE.Mesh(clockFaceGeo, clockFaceMat));
    cg.add(new THREE.Mesh(clockFrameGeo, goldMat));
    // Hour hand
    const hh = new THREE.Mesh(hourHandGeo, handMat);
    hh.position.set(0, 0.08, 0.01);
    hh.rotation.z = 0.5;
    cg.add(hh);
    // Minute hand
    const mh = new THREE.Mesh(minHandGeo, handMat);
    mh.position.set(0, 0.1, 0.02);
    mh.rotation.z = -0.8;
    cg.add(mh);
    cg.position.set(...pos);
    cg.rotation.y = ry;
    group.add(cg);
  }

  // Tower arched windows (below clocks)
  for (const { pos, ry } of clockSides) {
    const tw = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.04), winMat);
    tw.position.set(pos[0], towerBase + towerH * 0.25, pos[2]);
    tw.rotation.y = ry;
    group.add(tw);
  }

  // ── COPPER DOME ──
  const domeGeo = new THREE.SphereGeometry(towerW * 0.52, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, metalness: 0.4, roughness: 0.5 });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = towerBase + towerH + 0.03;
  dome.castShadow = true;
  group.add(dome);

  // Gold spire
  const spireGeo = new THREE.ConeGeometry(0.04, 0.6, 6);
  const spire = new THREE.Mesh(spireGeo, goldMat);
  spire.position.y = towerBase + towerH + towerW * 0.52 + 0.3;
  group.add(spire);

  // Gold sphere at spire tip
  const tipSphere = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), goldMat);
  tipSphere.position.y = towerBase + towerH + towerW * 0.52 + 0.62;
  group.add(tipSphere);

  // ── PLAQUE ANCHOR (HTML overlay shows avatar + username) ──
  const plaqueY = baseH + 1.25;
  const plaqueZ = D / 2 + 0.05;
  group.userData.plaqueWorldPos = new THREE.Vector3(0, 7.0, plaqueZ + 0.15);

  // ── DECORATIVE DETAILS ──
  // Lanterns flanking the entrance
  for (const lx of [-0.9, 0.9]) {
    // Bracket
    const brGeo = new THREE.BoxGeometry(0.04, 0.04, 0.15);
    const br = new THREE.Mesh(brGeo, new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
    br.position.set(lx, baseH + 1.5, D / 2 + 0.1);
    group.add(br);
    // Lantern body
    const lbGeo = new THREE.BoxGeometry(0.1, 0.15, 0.1);
    const lb = new THREE.Mesh(lbGeo, new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
    lb.position.set(lx, baseH + 1.42, D / 2 + 0.18);
    group.add(lb);
    // Lantern glow
    const lanternLight = createGlowOrb(0xfbbf24);
    lanternLight.position.set(lx, baseH + 1.42, D / 2 + 0.25);
    group.add(lanternLight);
  }

  // ── INTERIOR GLOW ──
  const glow = createGlowOrb(0xfbbf24);
  glow.position.set(0, baseH + 1.5, 0);
  group.add(glow);

  const towerGlow = createGlowOrb(0xfef3c7);
  towerGlow.position.set(0, towerBase + towerH * 0.5, 0);
  group.add(towerGlow);

  // ── ROOFTOP GARDEN ──
  const roofY = towerBase; // top surface of roof slab

  // Potted plants at four corners of the rooftop
  const potMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 });
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 1.0 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x4a7c59, roughness: 0.8 });
  for (const [px, pz] of [[-1.5, 1.0], [1.5, 1.0], [-1.5, -1.0], [1.5, -1.0]]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.18, 8), potMat);
    pot.position.set(px, roofY + 0.09, pz);
    pot.castShadow = true;
    group.add(pot);
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 8), soilMat);
    soil.position.set(px, roofY + 0.195, pz);
    group.add(soil);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 7, 6), foliageMat);
    leaf.position.set(px, roofY + 0.36, pz);
    leaf.castShadow = true;
    group.add(leaf);
  }

  // Small bench near front of rooftop
  const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.7 });
  const benchMetalMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.5 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.22), benchWoodMat);
  seat.position.set(0, roofY + 0.30, D / 2 - 0.25);
  seat.castShadow = true;
  group.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.04), benchWoodMat);
  back.position.set(0, roofY + 0.50, D / 2 - 0.14);
  group.add(back);
  for (const [lx, lz] of [[-0.28, -0.08], [0.28, -0.08], [-0.28, 0.08], [0.28, 0.08]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.04), benchMetalMat);
    leg.position.set(lx, roofY + 0.12, D / 2 - 0.25 + lz);
    group.add(leg);
  }

  // Small flagpole with flag on the back-left corner of the parapet
  const flagPoleMat = new THREE.MeshStandardMaterial({ color: 0xb8a088, metalness: 0.3 });
  const flagMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.8, side: THREE.DoubleSide });
  const flagpole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), flagPoleMat);
  flagpole.position.set(-W / 2 + 0.3, roofY + parapetH + 0.35, -D / 2 + 0.3);
  group.add(flagpole);
  const flagCloth = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), flagMat);
  flagCloth.position.set(-W / 2 + 0.45, roofY + parapetH + 0.62, -D / 2 + 0.3);
  group.add(flagCloth);
};

// ─── Custom Building: The Cat Bookshop ─────────────────────────────────────

CUSTOM_BUILDERS['the-cat-bookshop'] = function (group, building) {
  const wallW = 2.0;
  const wallD = 1.6;
  const floor1H = 1.4;
  const floor2H = 1.2;
  const totalH = floor1H + floor2H;

  // Foundation
  const baseGeo = new THREE.BoxGeometry(wallW + 0.3, 0.12, wallD + 0.3);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xb8a088 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.06;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Ground floor — individual wall panels instead of solid box
  // so you can see through the bay window
  const wall1Mat = new THREE.MeshStandardMaterial({ color: 0xfdf6e3 });

  // Back wall
  const backWallGeo = new THREE.BoxGeometry(wallW, floor1H, 0.08);
  const backWall = new THREE.Mesh(backWallGeo, wall1Mat);
  backWall.position.set(0, floor1H / 2 + 0.12, -wallD / 2 + 0.04);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  // Left wall
  const leftWallGeo = new THREE.BoxGeometry(0.08, floor1H, wallD);
  const leftWall = new THREE.Mesh(leftWallGeo, wall1Mat);
  leftWall.position.set(-wallW / 2 + 0.04, floor1H / 2 + 0.12, 0);
  leftWall.castShadow = true;
  group.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(leftWallGeo, wall1Mat);
  rightWall.position.set(wallW / 2 - 0.04, floor1H / 2 + 0.12, 0);
  rightWall.castShadow = true;
  group.add(rightWall);

  // Front wall — left section (next to door)
  const frontLeftGeo = new THREE.BoxGeometry(wallW * 0.25, floor1H, 0.08);
  const frontLeft = new THREE.Mesh(frontLeftGeo, wall1Mat);
  frontLeft.position.set(-wallW / 2 + wallW * 0.125, floor1H / 2 + 0.12, wallD / 2 - 0.04);
  group.add(frontLeft);

  // Front wall — top strip above bay window
  const frontTopGeo = new THREE.BoxGeometry(wallW, floor1H * 0.25, 0.08);
  const frontTop = new THREE.Mesh(frontTopGeo, wall1Mat);
  frontTop.position.set(0, floor1H * 0.875 + 0.12, wallD / 2 - 0.04);
  group.add(frontTop);

  // Interior warm back wall (visible through window)
  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0xf5deb3,
    emissive: 0xfbbf24,
    emissiveIntensity: 0.15,
  });
  const interiorGeo = new THREE.BoxGeometry(wallW - 0.2, floor1H - 0.1, 0.04);
  const interior = new THREE.Mesh(interiorGeo, interiorMat);
  interior.position.set(0, floor1H / 2 + 0.12, -wallD / 2 + 0.15);
  group.add(interior);

  // Interior bookshelves on back wall
  const shelfMat2 = new THREE.MeshStandardMaterial({ color: 0x92400e });
  for (let i = 0; i < 3; i++) {
    const iShelf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.1), shelfMat2);
    iShelf.position.set(-0.3 + i * 0.35, 0.5 + i * 0.35, -wallD / 2 + 0.22);
    group.add(iShelf);
    // Tiny books on shelf
    const bColors = [0xef4444, 0x3b82f6, 0x22c55e, 0xf59e0b, 0x8b5cf6];
    for (let j = 0; j < 4; j++) {
      const bk = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.1, 0.06),
        new THREE.MeshStandardMaterial({ color: bColors[j % bColors.length] })
      );
      bk.position.set(-0.3 + i * 0.35 - 0.1 + j * 0.07, 0.57 + i * 0.35, -wallD / 2 + 0.22);
      group.add(bk);
    }
  }

  // Floor divider trim
  const trimGeo = new THREE.BoxGeometry(wallW + 0.08, 0.06, wallD + 0.08);
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x92400e });
  const trim = new THREE.Mesh(trimGeo, trimMat);
  trim.position.y = floor1H + 0.12;
  group.add(trim);

  // Second floor walls — slightly darker
  const wall2Geo = new THREE.BoxGeometry(wallW, floor2H, wallD);
  const wall2Mat = new THREE.MeshStandardMaterial({ color: 0xf5e6d0 });
  const walls2 = new THREE.Mesh(wall2Geo, wall2Mat);
  walls2.position.y = floor1H + 0.12 + floor2H / 2;
  walls2.castShadow = true;
  group.add(walls2);

  // Pitched roof — warm terracotta
  const roofH = 0.7;
  const roofGeo = new THREE.ConeGeometry(wallW * 0.82, roofH, 4);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xc2703e });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = totalH + 0.12 + roofH / 2;
  roof.castShadow = true;
  group.add(roof);

  // Chimney
  const chimneyGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
  const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
  chimney.position.set(0.5, totalH + 0.12 + roofH - 0.1, -0.3);
  chimney.castShadow = true;
  group.add(chimney);

  // ── Bay window (front, ground floor) ──
  const bayW = 0.9;
  const bayH = 0.8;
  const bayD = 0.3;

  // Bay shelf (bottom only — no front wall so you can see inside)
  const shelfGeo = new THREE.BoxGeometry(bayW, 0.06, bayD);
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0xfdf6e3 });
  const shelf = new THREE.Mesh(shelfGeo, shelfMat);
  shelf.position.set(0.35, 0.22, wallD / 2 + bayD / 2);
  group.add(shelf);

  // Bay side walls (left + right)
  for (const side of [-1, 1]) {
    const sideGeo = new THREE.BoxGeometry(0.04, bayH, bayD);
    const sideWall = new THREE.Mesh(sideGeo, shelfMat);
    sideWall.position.set(0.35 + side * bayW / 2, 0.6, wallD / 2 + bayD / 2);
    group.add(sideWall);
  }

  // Bay top
  const topGeo = new THREE.BoxGeometry(bayW, 0.04, bayD);
  const bayTop = new THREE.Mesh(topGeo, shelfMat);
  bayTop.position.set(0.35, 0.98, wallD / 2 + bayD / 2);
  group.add(bayTop);

  // Bay window glass — very transparent so you can see the cat + books
  const glassGeo = new THREE.BoxGeometry(bayW - 0.08, bayH - 0.1, 0.02);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
    roughness: 0.05,
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.set(0.35, 0.6, wallD / 2 + bayD + 0.01);
  glass.renderOrder = 1;
  group.add(glass);

  // Window frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x92400e });
  // Horizontal bars
  for (const fy of [0.25, 0.6, 0.95]) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(bayW + 0.04, 0.04, 0.05),
      frameMat
    );
    bar.position.set(0.35, fy, wallD / 2 + bayD + 0.02);
    group.add(bar);
  }
  // Vertical bars
  for (const fx of [0.35 - bayW / 2, 0.35, 0.35 + bayW / 2]) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, bayH + 0.04, 0.05),
      frameMat
    );
    bar.position.set(fx, 0.6, wallD / 2 + bayD + 0.02);
    group.add(bar);
  }

  // Books in the window display — inside the bay window
  const bookColors = [0xef4444, 0x3b82f6, 0x22c55e, 0xf59e0b, 0x8b5cf6, 0xec4899];
  const bookMats = bookColors.map(c => new THREE.MeshStandardMaterial({ color: c }));
  const displayZ = wallD / 2 + bayD * 0.5; // center of bay enclosure
  // Left stack
  for (let i = 0; i < 4; i++) {
    const bookGeo = new THREE.BoxGeometry(0.18, 0.05, 0.12);
    const book = new THREE.Mesh(bookGeo, bookMats[i % bookMats.length]);
    book.position.set(0.08, 0.25 + i * 0.055, displayZ);
    book.rotation.y = (i % 2) * 0.15;
    group.add(book);
  }
  // Right stack
  for (let i = 0; i < 3; i++) {
    const bookGeo = new THREE.BoxGeometry(0.15, 0.05, 0.14);
    const book = new THREE.Mesh(bookGeo, bookMats[(i + 2) % bookMats.length]);
    book.position.set(0.55, 0.25 + i * 0.055, displayZ);
    book.rotation.y = -(i % 2) * 0.1;
    group.add(book);
  }

  // 🐱 Cat sleeping on the books — inside bay window
  const catZ = displayZ;
  const catMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });

  // Body — elongated sphere
  const catBodyGeo = new THREE.SphereGeometry(0.12, 8, 6);
  const catBody = new THREE.Mesh(catBodyGeo, catMat);
  catBody.scale.set(1.6, 0.7, 1.0);
  catBody.position.set(0.32, 0.52, catZ);
  group.add(catBody);

  // Head
  const catHeadGeo = new THREE.SphereGeometry(0.08, 8, 6);
  const catHead = new THREE.Mesh(catHeadGeo, catMat);
  catHead.position.set(0.15, 0.56, catZ);
  group.add(catHead);

  // Ears — tiny cones
  const earGeo = new THREE.ConeGeometry(0.03, 0.05, 4);
  const ear1 = new THREE.Mesh(earGeo, catMat);
  ear1.position.set(0.12, 0.64, catZ - 0.04);
  group.add(ear1);
  const ear2 = new THREE.Mesh(earGeo, catMat);
  ear2.position.set(0.12, 0.64, catZ + 0.04);
  group.add(ear2);

  // Nose — tiny pink dot
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xfda4af });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), noseMat);
  nose.position.set(0.08, 0.55, catZ);
  group.add(nose);

  // Tail — curved
  const tailGeo = new THREE.CylinderGeometry(0.02, 0.012, 0.2, 6);
  const tail = new THREE.Mesh(tailGeo, catMat);
  tail.position.set(0.52, 0.5, catZ);
  tail.rotation.z = Math.PI / 3;
  group.add(tail);

  // ── Door ──
  const doorGeo = new THREE.BoxGeometry(0.35, 0.7, 0.05);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x6b3a1f });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(-0.5, 0.47, wallD / 2 + 0.03);
  group.add(door);

  // Door handle
  const handleGeo = new THREE.SphereGeometry(0.025, 6, 6);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.6 });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.set(-0.38, 0.47, wallD / 2 + 0.06);
  group.add(handle);

  // ── Second floor round window ──
  const roundWinGeo = new THREE.CircleGeometry(0.18, 16);
  const roundWinMat = new THREE.MeshStandardMaterial({
    color: 0xbfdbfe,
    emissive: 0x60a5fa,
    emissiveIntensity: 0.15,
    transparent: true, opacity: 0.35, roughness: 0.1,
  });
  const roundWin = new THREE.Mesh(roundWinGeo, roundWinMat);
  roundWin.position.set(0, floor1H + 0.12 + floor2H * 0.5, wallD / 2 + 0.03);
  group.add(roundWin);

  // Round window frame
  const ringGeo = new THREE.TorusGeometry(0.19, 0.025, 8, 24);
  const ring = new THREE.Mesh(ringGeo, frameMat);
  ring.position.set(0, floor1H + 0.12 + floor2H * 0.5, wallD / 2 + 0.03);
  group.add(ring);

  // Side windows (2nd floor)
  const sideWinGeo = new THREE.BoxGeometry(0.05, 0.28, 0.22);
  const sideWinMat = new THREE.MeshStandardMaterial({
    color: 0xbfdbfe,
    emissive: 0x60a5fa,
    emissiveIntensity: 0.1,
    transparent: true, opacity: 0.35, roughness: 0.1,
  });
  const sideWin = new THREE.Mesh(sideWinGeo, sideWinMat);
  sideWin.position.set(wallW / 2 + 0.03, floor1H + 0.12 + floor2H * 0.5, 0);
  group.add(sideWin);

  // ── Potted plants by the door ──
  const potMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
  for (const px of [-0.8, -0.2]) {
    // Pot
    const potGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.12, 8);
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(px, 0.18, wallD / 2 + 0.15);
    group.add(pot);
    // Plant
    const plantGeo = new THREE.SphereGeometry(0.1, 6, 6);
    const plant = new THREE.Mesh(plantGeo, leafMat);
    plant.position.set(px, 0.32, wallD / 2 + 0.15);
    group.add(plant);
  }

  // ── Shop awning ──
  const awningGeo = new THREE.BoxGeometry(wallW + 0.1, 0.04, 0.5);
  const awningMat = new THREE.MeshStandardMaterial({ color: 0x92400e });
  const awning = new THREE.Mesh(awningGeo, awningMat);
  awning.position.set(0, floor1H + 0.05, wallD / 2 + 0.25);
  awning.rotation.x = 0.15;
  awning.castShadow = true;
  group.add(awning);

  // Warm interior glow (point light)
  const glow = createGlowOrb(0xfbbf24);
  glow.position.set(0, 0.8, 0);
  group.add(glow);

  // Plaque above door
  buildPlaque(group, building, wallD / 2 - 0.04, 3.8, -0.5);
};

// ─── Custom Building: Ashley's Antiques ────────────────────────────────────

CUSTOM_BUILDERS['ashleys-antiques'] = function (group, building) {
  const W = 2.2;        // width
  const D = 1.8;        // depth
  const wallH = 1.8;    // wall height
  const baseH = 0.12;   // foundation height

  // Materials — deep purple walls, warm dusty interior
  const foundMat    = new THREE.MeshStandardMaterial({ color: 0x9c8ea0, roughness: 0.95 });
  const wallMat     = new THREE.MeshStandardMaterial({ color: 0x4a1080, roughness: 0.85 }); // deep purple
  const roofMat     = new THREE.MeshStandardMaterial({ color: 0x2d0a4e, roughness: 0.9 });  // very dark purple
  const trimMat     = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.7 });  // mid purple trim
  const doorMat     = new THREE.MeshStandardMaterial({ color: 0x1e0a3c, roughness: 0.7 });  // near-black door
  const winMat      = new THREE.MeshStandardMaterial({ color: 0xc4b5fd, emissive: 0x8b5cf6, emissiveIntensity: 0.3, transparent: true, opacity: 0.35, roughness: 0.1 });
  const woodMat     = new THREE.MeshStandardMaterial({ color: 0x6b3a1f, roughness: 0.9 });  // shelf wood
  const counterMat  = new THREE.MeshStandardMaterial({ color: 0x7c3d0c, roughness: 0.8 });  // counter wood
  const counterTopMat = new THREE.MeshStandardMaterial({ color: 0x5c2d0a, roughness: 0.6 });
  const signMat     = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.85 }); // cream sign
  const goldMat     = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.6, roughness: 0.4 });

  // ── FOUNDATION ──
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, baseH, D + 0.3), foundMat);
  base.position.y = baseH / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // ── WALLS ──
  const walls = new THREE.Mesh(new THREE.BoxGeometry(W, wallH, D), wallMat);
  walls.position.y = baseH + wallH / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // ── ROOF (pitched, very dark purple) ──
  const roofH = 0.9;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(W * 0.86, roofH, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = baseH + wallH + roofH / 2;
  roof.castShadow = true;
  group.add(roof);

  // Roofline trim strip
  const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(W + 0.14, 0.06, D + 0.14), trimMat);
  roofTrim.position.y = baseH + wallH + 0.03;
  group.add(roofTrim);

  // ── FRONT DOOR ──
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.65, 0.05), doorMat);
  door.position.set(0.35, baseH + 0.33, D / 2 + 0.03);
  group.add(door);

  // Door frame (gold)
  const doorFrameTop = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.05), goldMat);
  doorFrameTop.position.set(0.35, baseH + 0.675, D / 2 + 0.03);
  group.add(doorFrameTop);

  // ── DISPLAY WINDOW (left of door) ──
  const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.58, 0.04), trimMat);
  winFrame.position.set(-0.42, baseH + wallH * 0.52, D / 2 + 0.025);
  group.add(winFrame);

  const win = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.48, 0.05), winMat);
  win.position.set(-0.42, baseH + wallH * 0.52, D / 2 + 0.03);
  group.add(win);

  // ── SHOP SIGN above windows ──
  const shopSign = new THREE.Mesh(new THREE.BoxGeometry(W * 0.75, 0.22, 0.06), trimMat);
  shopSign.position.set(0, baseH + wallH * 0.9, D / 2 + 0.05);
  group.add(shopSign);

  // Gold bar brackets for shop sign
  for (const bx of [-W * 0.3, W * 0.3]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.04), goldMat);
    bracket.position.set(bx, baseH + wallH * 0.87, D / 2 + 0.04);
    group.add(bracket);
  }

  // ── INTERIOR SHELVES (left wall) ──
  const shelfColors = [
    [0x111827, 0xf3f4f6, 0x1e40af],   // dark, white, blue (floppy disks)
    [0xdc2626, 0x111827, 0x374151],   // red, black, gray (modems/cassettes)
    [0x065f46, 0xf3f4f6, 0x1e40af],   // green, white, blue
  ];
  for (let i = 0; i < 3; i++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.16), woodMat);
    shelf.position.set(-W / 2 + 0.38, baseH + 0.32 + i * 0.42, -D / 2 + 0.16);
    group.add(shelf);

    // Floppy-disk / modem items on each shelf
    for (let j = 0; j < 3; j++) {
      const item = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.09, 0.03),
        new THREE.MeshStandardMaterial({ color: shelfColors[i][j] })
      );
      item.position.set(-W / 2 + 0.15 + j * 0.13, baseH + 0.40 + i * 0.42, -D / 2 + 0.13);
      group.add(item);
    }
  }

  // ── TAMAGOTCHI SHELF (right wall) ──
  const tamColors = [0xfb7185, 0x34d399, 0xfbbf24, 0x60a5fa];
  for (let i = 0; i < 2; i++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.16), woodMat);
    shelf.position.set(W / 2 - 0.34, baseH + 0.42 + i * 0.48, -D / 2 + 0.16);
    group.add(shelf);

    for (let j = 0; j < 2; j++) {
      const egg = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6),
        new THREE.MeshStandardMaterial({ color: tamColors[i * 2 + j] }));
      egg.scale.y = 0.82;
      egg.position.set(W / 2 - 0.46 + j * 0.2, baseH + 0.50 + i * 0.48, -D / 2 + 0.14);
      group.add(egg);
    }
  }

  // ── COUNTER ──
  const counter = new THREE.Mesh(new THREE.BoxGeometry(W * 0.55, 0.55, 0.22), counterMat);
  counter.position.set(-W / 4, baseH + 0.275, D / 2 - 0.36);
  group.add(counter);

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(W * 0.57, 0.04, 0.24), counterTopMat);
  counterTop.position.set(-W / 4, baseH + 0.57, D / 2 - 0.36);
  group.add(counterTop);

  // ── HAND-LETTERED SIGN on counter: "Be kind. Rewind" ──
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.03), signMat);
  sign.position.set(-W / 4, baseH + 0.66, D / 2 - 0.29);
  group.add(sign);

  const signStick = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x6b7280 }));
  signStick.position.set(-W / 4, baseH + 0.595, D / 2 - 0.29);
  group.add(signStick);

  buildPlaque(group, building, D / 2 + 0.03, 2.6);
};

// ─── Custom Building: Pierce's Pub ─────────────────────────────────────────

CUSTOM_BUILDERS['pierces-pub'] = function (group, building) {
  const W = 2.4;        // width
  const D = 1.8;        // depth
  const wallH = 1.7;    // wall height
  const baseH = 0.12;   // foundation height

  // Materials — warm, worn, homey
  const stoneMat   = new THREE.MeshStandardMaterial({ color: 0xb0a090, roughness: 0.95 });
  const wallMat    = new THREE.MeshStandardMaterial({ color: 0x7c5c3a, roughness: 0.85 }); // dark timber
  const plasterMat = new THREE.MeshStandardMaterial({ color: 0xe8d8b8, roughness: 0.9 });  // cream plaster panels
  const beamMat    = new THREE.MeshStandardMaterial({ color: 0x4a2e0e, roughness: 0.9 });  // dark oak beams
  const roofMat    = new THREE.MeshStandardMaterial({ color: 0x3d2b1a, roughness: 0.95 }); // near-black thatch/slate
  const doorMat    = new THREE.MeshStandardMaterial({ color: 0x2e1a0e, roughness: 0.7 });
  const winMat     = new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xfbbf24, emissiveIntensity: 0.35, transparent: true, opacity: 0.4, roughness: 0.1 }); // warm amber glow
  const metalMat   = new THREE.MeshStandardMaterial({ color: 0x4b3621, metalness: 0.5, roughness: 0.5 });
  const barrelMat  = new THREE.MeshStandardMaterial({ color: 0x6b3a1f, roughness: 0.9 });
  const hoopMat    = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.4, roughness: 0.6 });

  // ── FOUNDATION ──
  const baseGeo = new THREE.BoxGeometry(W + 0.3, baseH, D + 0.3);
  const base = new THREE.Mesh(baseGeo, stoneMat);
  base.position.y = baseH / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // ── MAIN WALLS (plaster between dark timber frames — Tudor style) ──
  const wallGeo = new THREE.BoxGeometry(W, wallH, D);
  const walls = new THREE.Mesh(wallGeo, plasterMat);
  walls.position.y = baseH + wallH / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // Timber frame cross-beams on front face
  const hBeamGeo = new THREE.BoxGeometry(W + 0.04, 0.07, 0.06);
  const beamHeights = [baseH + wallH * 0.3, baseH + wallH * 0.65, baseH + wallH];
  for (const hy of beamHeights) {
    const hBeam = new THREE.Mesh(hBeamGeo, beamMat);
    hBeam.position.set(0, hy, D / 2 + 0.03);
    group.add(hBeam);
  }

  // Vertical corner timbers (front face)
  const vBeamGeo = new THREE.BoxGeometry(0.07, wallH + 0.07, 0.06);
  for (const bx of [-W / 2, W / 2]) {
    const vBeam = new THREE.Mesh(vBeamGeo, beamMat);
    vBeam.position.set(bx, baseH + wallH / 2, D / 2 + 0.03);
    group.add(vBeam);
  }

  // Diagonal brace timbers on front face
  const diagGeo = new THREE.BoxGeometry(0.06, wallH * 0.6, 0.05);
  const diagL = new THREE.Mesh(diagGeo, beamMat);
  diagL.position.set(-W / 4, baseH + wallH * 0.5, D / 2 + 0.03);
  diagL.rotation.z = 0.45;
  group.add(diagL);
  const diagR = new THREE.Mesh(diagGeo, beamMat);
  diagR.position.set(W / 4, baseH + wallH * 0.5, D / 2 + 0.03);
  diagR.rotation.z = -0.45;
  group.add(diagR);

  // Dark timber side walls
  const sideWallGeo = new THREE.BoxGeometry(0.07, wallH, D);
  for (const sx of [-W / 2, W / 2]) {
    const sw = new THREE.Mesh(sideWallGeo, wallMat);
    sw.position.set(sx, baseH + wallH / 2, 0);
    sw.castShadow = true;
    group.add(sw);
  }

  // ── PITCHED ROOF (low, heavy, cozy) ──
  const roofH = 1.0;
  const roofGeo = new THREE.ConeGeometry(W * 0.88, roofH, 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = baseH + wallH + roofH / 2;
  roof.castShadow = true;
  group.add(roof);

  // Roof overhang eaves (front + back)
  const eaveGeo = new THREE.BoxGeometry(W + 0.35, 0.06, 0.25);
  for (const ez of [D / 2 + 0.12, -D / 2 - 0.12]) {
    const eave = new THREE.Mesh(eaveGeo, roofMat);
    eave.position.set(0, baseH + wallH + 0.04, ez);
    eave.castShadow = true;
    group.add(eave);
  }

  // ── CHIMNEY (back left) ──
  const chimneyGeo = new THREE.BoxGeometry(0.22, 0.9, 0.22);
  const chimney = new THREE.Mesh(chimneyGeo, stoneMat);
  chimney.position.set(-W / 2 + 0.35, baseH + wallH + roofH * 0.3, -D / 2 + 0.35);
  chimney.castShadow = true;
  group.add(chimney);

  // Chimney cap
  const capGeo = new THREE.BoxGeometry(0.28, 0.06, 0.28);
  const cap = new THREE.Mesh(capGeo, beamMat);
  cap.position.set(-W / 2 + 0.35, baseH + wallH + roofH * 0.3 + 0.48, -D / 2 + 0.35);
  group.add(cap);

  // ── DOOR ──
  const doorGeo = new THREE.BoxGeometry(0.4, 0.75, 0.06);
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(-0.35, baseH + 0.38, D / 2 + 0.04);
  group.add(door);

  // Door frame
  const dfTopGeo = new THREE.BoxGeometry(0.44, 0.06, 0.06);
  const dfTop = new THREE.Mesh(dfTopGeo, beamMat);
  dfTop.position.set(-0.35, baseH + 0.77, D / 2 + 0.04);
  group.add(dfTop);

  // Door handle
  const handleGeo = new THREE.SphereGeometry(0.03, 6, 6);
  const handle = new THREE.Mesh(handleGeo, metalMat);
  handle.position.set(-0.2, baseH + 0.38, D / 2 + 0.08);
  group.add(handle);

  // ── FRONT WINDOWS (warm amber glow — life inside) ──
  const winGeo = new THREE.BoxGeometry(0.38, 0.32, 0.05);
  for (const wx of [0.28, 0.78]) {
    const win = new THREE.Mesh(winGeo, winMat);
    win.position.set(wx - W / 2 + 0.18, baseH + wallH * 0.55, D / 2 + 0.04);
    group.add(win);
    // Window frame
    const wfH = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.05), beamMat);
    wfH.position.set(wx - W / 2 + 0.18, baseH + wallH * 0.55 + 0.18, D / 2 + 0.04);
    group.add(wfH);
    const wfH2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.05), beamMat);
    wfH2.position.set(wx - W / 2 + 0.18, baseH + wallH * 0.55 - 0.18, D / 2 + 0.04);
    group.add(wfH2);
  }

  // ── HANGING PUB SIGN ──
  // Bracket arm
  const bracketGeo = new THREE.BoxGeometry(0.04, 0.04, 0.35);
  const bracket = new THREE.Mesh(bracketGeo, metalMat);
  bracket.position.set(W / 2 - 0.15, baseH + wallH * 0.88, D / 2 + 0.2);
  group.add(bracket);
  // Sign board
  const signGeo = new THREE.BoxGeometry(0.55, 0.22, 0.04);
  const signMat = new THREE.MeshStandardMaterial({ color: 0x2e1a0e, roughness: 0.8 });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(W / 2 - 0.15, baseH + wallH * 0.78, D / 2 + 0.35);
  sign.castShadow = true;
  group.add(sign);
  // Sign chains (thin cylinders)
  for (const cx of [-0.2, 0.2]) {
    const chainGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.12, 4);
    const chain = new THREE.Mesh(chainGeo, metalMat);
    chain.position.set(W / 2 - 0.15 + cx, baseH + wallH * 0.84, D / 2 + 0.35);
    group.add(chain);
  }

  // ── BARRELS by the entrance ──
  for (const [bx, bz, br] of [[W / 2 + 0.18, D / 2 - 0.15, 0], [W / 2 + 0.18, D / 2 + 0.18, 0.3]]) {
    const bGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.35, 10);
    const barrel = new THREE.Mesh(bGeo, barrelMat);
    barrel.position.set(bx, 0.175, bz);
    barrel.rotation.y = br;
    barrel.castShadow = true;
    group.add(barrel);
    // Hoops
    for (const hy of [0.06, 0.175, 0.29]) {
      const hoopGeo = new THREE.TorusGeometry(0.135, 0.012, 4, 12);
      const hoop = new THREE.Mesh(hoopGeo, hoopMat);
      hoop.position.set(bx, hy, bz);
      hoop.rotation.x = Math.PI / 2;
      group.add(hoop);
    }
  }

  // ── STEP / STOOP ──
  const stepGeo = new THREE.BoxGeometry(W * 0.5, 0.08, 0.35);
  const step = new THREE.Mesh(stepGeo, stoneMat);
  step.position.set(-0.35, 0.04, D / 2 + 0.18);
  step.castShadow = true;
  step.receiveShadow = true;
  group.add(step);

  // ── WARM INTERIOR GLOW ──
  const glow = createGlowOrb(0xfbbf24);
  glow.position.set(0, baseH + wallH * 0.5, 0);
  group.add(glow);

  // Lantern above door
  const lanternBodyGeo = new THREE.BoxGeometry(0.1, 0.14, 0.1);
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
  const lantern = new THREE.Mesh(lanternBodyGeo, lanternMat);
  lantern.position.set(-0.35, baseH + wallH * 0.88, D / 2 + 0.12);
  group.add(lantern);
  const lanternLight = createGlowOrb(0xfbbf24);
  lanternLight.position.set(-0.35, baseH + wallH * 0.85, D / 2 + 0.2);
  group.add(lanternLight);

  // ── PLAQUE ──
  buildPlaque(group, building, D / 2 + 0.04, 3.2);
};

// ─── Custom Building: Martin's Makerspace ──────────────────────────────────

CUSTOM_BUILDERS['martins-makerspace'] = function (group, building) {
  const W = 2.4;
  const D = 1.8;
  const wallH = 1.8;
  const baseH = 0.12;

  // Materials
  const concreteMat  = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.9 });
  const wallMat      = new THREE.MeshStandardMaterial({ color: 0xf0f9ff, roughness: 0.8 });
  const metalMat     = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.5, roughness: 0.5 });
  const glassMat     = new THREE.MeshStandardMaterial({ color: 0xbfdbfe, transparent: true, opacity: 0.35, roughness: 0.1 });
  const roofMat      = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.7 });
  const benchMat     = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
  const metalLegMat  = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.4, roughness: 0.6 });
  const doorMat      = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.5, metalness: 0.3 });
  const printerMat   = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.6 });
  const printerAccMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0ea5e9, emissiveIntensity: 0.4 });
  const screenMat    = new THREE.MeshStandardMaterial({ color: 0x1e40af, emissive: 0x60a5fa, emissiveIntensity: 0.7 });
  const pegboardMat  = new THREE.MeshStandardMaterial({ color: 0xf5deb3, roughness: 0.9 });
  const toolMat      = new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.6, roughness: 0.4 });
  const handleYellowMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.7 });

  // ── FOUNDATION ──
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, baseH, D + 0.3), concreteMat);
  base.position.y = baseH / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // ── BACK WALL ──
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, wallH, 0.1), wallMat);
  backWall.position.set(0, baseH + wallH / 2, -D / 2 + 0.05);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  // ── SIDE WALLS ──
  for (const sx of [-W / 2 + 0.05, W / 2 - 0.05]) {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallH, D), wallMat);
    sw.position.set(sx, baseH + wallH / 2, 0);
    sw.castShadow = true;
    sw.receiveShadow = true;
    group.add(sw);
  }

  // ── FRONT FACE: steel pillars, glass panels, door ──
  // Corner steel pillars
  for (const cx of [-W / 2 + 0.06, W / 2 - 0.06]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallH, 0.1), metalMat);
    pillar.position.set(cx, baseH + wallH / 2, D / 2 - 0.05);
    pillar.castShadow = true;
    group.add(pillar);
  }
  // Centre door-frame pillar (right side of door)
  for (const cx of [-0.3, 0.3]) {
    const dp = new THREE.Mesh(new THREE.BoxGeometry(0.06, wallH, 0.06), metalMat);
    dp.position.set(cx, baseH + wallH / 2, D / 2 - 0.03);
    group.add(dp);
  }
  // Horizontal top beam
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, 0.1), metalMat);
  topBeam.position.set(0, baseH + wallH - 0.04, D / 2 - 0.05);
  group.add(topBeam);
  // Horizontal mid beam (above door, below sign)
  const midBeam = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, 0.08), metalMat);
  midBeam.position.set(0, baseH + wallH * 0.72, D / 2 - 0.04);
  group.add(midBeam);

  // Large glass panels (left + right of door)
  const glassH = wallH * 0.68;
  for (const gx of [-0.73, 0.73]) {
    const gp = new THREE.Mesh(new THREE.BoxGeometry(0.55, glassH, 0.04), glassMat);
    gp.position.set(gx, baseH + glassH / 2 + 0.04, D / 2);
    gp.renderOrder = 1;
    group.add(gp);
    // Horizontal glazing bars
    for (const gy of [0.35, 0.7, 1.05]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.025, 0.05), metalMat);
      bar.position.set(gx, baseH + gy, D / 2 + 0.01);
      group.add(bar);
    }
  }
  // Transom glass above door
  const transom = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.22, 0.04), glassMat);
  transom.position.set(0, baseH + wallH * 0.76, D / 2);
  transom.renderOrder = 1;
  group.add(transom);

  // ── DOOR ──
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.52, wallH * 0.67, 0.06), doorMat);
  door.position.set(0, baseH + (wallH * 0.67) / 2, D / 2 + 0.04);
  group.add(door);
  // Door glass panel
  const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.36, wallH * 0.35, 0.04), glassMat);
  doorGlass.position.set(0, baseH + wallH * 0.51, D / 2 + 0.07);
  doorGlass.renderOrder = 1;
  group.add(doorGlass);
  // Door handle (horizontal push bar)
  const handleMat2 = new THREE.MeshStandardMaterial({ color: 0xb8bcc8, metalness: 0.8, roughness: 0.2 });
  const pushBar = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.025, 0.025), handleMat2);
  pushBar.position.set(0.14, baseH + wallH * 0.33, D / 2 + 0.09);
  group.add(pushBar);

  // ── "HACKERS WELCOME" PIXEL SIGN above door ──
  const signBoardMat = new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.9 });
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.22, 0.06), signBoardMat);
  const signY = baseH + wallH * 0.84;
  signBoard.position.set(0, signY, D / 2 + 0.09);
  group.add(signBoard);
  // Green LED border
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x00e676, emissive: 0x00e676, emissiveIntensity: 0.6 });
  for (const [bw, bh, bx, by] of [
    [0.9, 0.018, 0, signY + 0.1],
    [0.9, 0.018, 0, signY - 0.1],
    [0.018, 0.22, -0.44, signY],
    [0.018, 0.22,  0.44, signY],
  ]) {
    const bl = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.02), borderMat);
    bl.position.set(bx, by, D / 2 + 0.13);
    group.add(bl);
  }
  // Pixel art "HW" (Hackers Welcome) in green
  const pixMat = new THREE.MeshStandardMaterial({ color: 0x00e676, emissive: 0x00e676, emissiveIntensity: 0.8 });
  const ps = 0.018;   // pixel size
  const pstep = 0.023; // pixel step
  const H5 = [[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]];
  const W5 = [[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[0,1,0,1,0],[0,1,0,1,0]];
  const letters = [H5, W5];
  const totalLettersW = 2 * 5 * pstep + 0.02;
  const startPx = -totalLettersW / 2 + pstep / 2;
  for (let li = 0; li < letters.length; li++) {
    const lx = startPx + li * (5 * pstep + 0.02);
    letters[li].forEach((row, ri) => {
      row.forEach((on, ci) => {
        if (!on) return;
        const px = new THREE.Mesh(new THREE.BoxGeometry(ps, ps, 0.01), pixMat);
        px.position.set(lx + ci * pstep, signY + 0.05 - ri * pstep, D / 2 + 0.13);
        group.add(px);
      });
    });
  }

  // ── FLAT ROOF ──
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.12, D + 0.2), roofMat);
  roofSlab.position.y = baseH + wallH + 0.06;
  roofSlab.castShadow = true;
  group.add(roofSlab);
  // Parapet
  const parapetMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.8 });
  for (const [pw, pd, px, pz] of [
    [W + 0.2, 0.06, 0,         D / 2 + 0.07],
    [W + 0.2, 0.06, 0,        -D / 2 - 0.07],
    [0.06,    D + 0.2, -W / 2 - 0.07, 0],
    [0.06,    D + 0.2,  W / 2 + 0.07, 0],
  ]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.22, pd), parapetMat);
    p.position.set(px, baseH + wallH + 0.12 + 0.11, pz);
    group.add(p);
  }
  // Rooftop AC unit
  const acUnit = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.3), concreteMat);
  acUnit.position.set(-0.7, baseH + wallH + 0.12 + 0.11, -0.4);
  group.add(acUnit);
  const acVent = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.28), metalMat);
  acVent.position.set(-0.7, baseH + wallH + 0.12 + 0.24, -0.4);
  group.add(acVent);

  // ── INTERIOR BACK WALL (lit, visible through glass) ──
  const interiorMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0xdbeafe, emissiveIntensity: 0.12 });
  const intBack = new THREE.Mesh(new THREE.BoxGeometry(W - 0.15, wallH - 0.1, 0.04), interiorMat);
  intBack.position.set(0, baseH + wallH / 2 + 0.05, -D / 2 + 0.15);
  group.add(intBack);

  // ── PEGBOARD (on back wall, upper portion) ──
  const pegboard = new THREE.Mesh(new THREE.BoxGeometry(W * 0.75, wallH * 0.45, 0.05), pegboardMat);
  pegboard.position.set(0.1, baseH + wallH * 0.68, -D / 2 + 0.17);
  group.add(pegboard);
  // Pegboard holes grid
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x374151 });
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 8; col++) {
      const hole = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), holeMat);
      hole.position.set(-W * 0.75 / 2 + 0.1 + col * 0.22, baseH + wallH * 0.5 + row * 0.14, -D / 2 + 0.19);
      group.add(hole);
    }
  }

  // Tools on pegboard
  // Hammer
  const hammerHandle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.17, 0.03), handleYellowMat);
  hammerHandle.position.set(-0.55, baseH + wallH * 0.71, -D / 2 + 0.23);
  group.add(hammerHandle);
  const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.05, 0.04), toolMat);
  hammerHead.position.set(-0.55, baseH + wallH * 0.81, -D / 2 + 0.23);
  group.add(hammerHead);

  // Wrench
  const wrenchBody = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.03), toolMat);
  wrenchBody.rotation.z = 0.2;
  wrenchBody.position.set(-0.2, baseH + wallH * 0.72, -D / 2 + 0.23);
  group.add(wrenchBody);
  const wrenchEnd = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.03), toolMat);
  wrenchEnd.position.set(-0.2, baseH + wallH * 0.82, -D / 2 + 0.23);
  group.add(wrenchEnd);

  // Screwdriver
  const screwHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), handleYellowMat);
  screwHandle.position.set(0.15, baseH + wallH * 0.73, -D / 2 + 0.23);
  group.add(screwHandle);
  const screwShank = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.1, 0.018), toolMat);
  screwShank.position.set(0.15, baseH + wallH * 0.59, -D / 2 + 0.23);
  group.add(screwShank);

  // Pliers
  const pliersBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.03), toolMat);
  pliersBody.position.set(0.5, baseH + wallH * 0.72, -D / 2 + 0.23);
  group.add(pliersBody);
  const pliersJaw = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.03), toolMat);
  pliersJaw.position.set(0.5, baseH + wallH * 0.81, -D / 2 + 0.23);
  group.add(pliersJaw);

  // ── WORKBENCHES (along side walls) ──
  for (const bx of [-W / 2 + 0.32, W / 2 - 0.32]) {
    // Bench top
    const benchTop = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, D * 0.72), benchMat);
    benchTop.position.set(bx, baseH + wallH * 0.44, 0);
    benchTop.castShadow = true;
    group.add(benchTop);
    // Legs
    for (const lz of [-D * 0.29, D * 0.29]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, wallH * 0.44, 0.05), metalLegMat);
      leg.position.set(bx, baseH + wallH * 0.22, lz);
      group.add(leg);
    }
    // Lower shelf
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, D * 0.68), benchMat);
    shelf.position.set(bx, baseH + wallH * 0.18, 0);
    group.add(shelf);
  }

  // ── 3D PRINTERS on benches ──
  // Printer 1 — left bench
  const p1x = -W / 2 + 0.32;
  const p1y = baseH + wallH * 0.44 + 0.03;
  for (const [pz, col] of [[-0.2, 0x0ea5e9], [0.2, 0x8b5cf6]]) {
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.22), printerMat);
    pBody.position.set(p1x, p1y + 0.13, pz);
    pBody.castShadow = true;
    group.add(pBody);
    // Accent top bar (printer gantry rod)
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.02), printerAccMat);
    gantry.position.set(p1x, p1y + 0.24, pz - 0.09);
    group.add(gantry);
    // Screen
    const scr = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), screenMat);
    scr.position.set(p1x + 0.06, p1y + 0.2, pz + 0.12);
    group.add(scr);
    // Print bed
    const bed = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.015, 0.14), new THREE.MeshStandardMaterial({ color: 0x1c1917 }));
    bed.position.set(p1x, p1y + 0.025, pz);
    group.add(bed);
    // Tiny print object on bed
    const blob = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.05), new THREE.MeshStandardMaterial({ color: col }));
    blob.position.set(p1x, p1y + 0.055, pz);
    group.add(blob);
  }

  // Printer 2 — right bench (single, larger)
  const p2x = W / 2 - 0.32;
  const p2y = p1y;
  const p2Body = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.25), printerMat);
  p2Body.position.set(p2x, p2y + 0.15, 0);
  p2Body.castShadow = true;
  group.add(p2Body);
  const p2Gantry = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.27), printerAccMat);
  p2Gantry.position.set(p2x + 0.1, p2y + 0.27, 0);
  group.add(p2Gantry);
  const p2Screen = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.02), screenMat);
  p2Screen.position.set(p2x - 0.07, p2y + 0.24, 0.14);
  group.add(p2Screen);
  const p2Bed = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.16), new THREE.MeshStandardMaterial({ color: 0x1c1917 }));
  p2Bed.position.set(p2x, p2y + 0.025, 0);
  group.add(p2Bed);
  const p2Job = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.06), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
  p2Job.position.set(p2x, p2y + 0.072, 0);
  group.add(p2Job);

  // ── CENTRE WORKBENCH ──
  const ctbTop = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.6), benchMat);
  ctbTop.position.set(0, baseH + wallH * 0.38, -0.2);
  ctbTop.castShadow = true;
  group.add(ctbTop);
  for (const [cx, cz] of [[-0.25, -0.24], [0.25, -0.24], [-0.25, 0.24], [0.25, 0.24]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, wallH * 0.38, 0.04), metalLegMat);
    leg.position.set(cx, baseH + wallH * 0.19, -0.2 + cz);
    group.add(leg);
  }
  // Laptop / soldering station on central bench
  const laptop = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.18), new THREE.MeshStandardMaterial({ color: 0x374151 }));
  laptop.position.set(-0.1, baseH + wallH * 0.38 + 0.035, -0.2);
  group.add(laptop);
  const screen2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.01), screenMat);
  screen2.rotation.x = -0.5;
  screen2.position.set(-0.1, baseH + wallH * 0.38 + 0.1, -0.2 - 0.07);
  group.add(screen2);

  // ── INTERIOR LIGHT ──
  const glow = createGlowOrb(0xe0f2fe);
  glow.position.set(0, baseH + wallH * 0.7, 0);
  group.add(glow);
  // Sign glow
  const signGlow = createGlowOrb(0x00e676);
  signGlow.position.set(0, signY, D / 2 + 0.2);
  group.add(signGlow);

  // ── 🐾 HIDDEN FURBY (purple/pink, tucked in back-right corner) ──
  const frbX  = W / 2 - 0.55;
  const frbZ  = -D / 2 + 0.35;
  const frbY  = baseH;
  const fBodyMat  = new THREE.MeshStandardMaterial({ color: 0xd946ef, roughness: 0.95 }); // fuchsia
  const fEarMat   = new THREE.MeshStandardMaterial({ color: 0xf0abfc, roughness: 0.95 }); // lighter pink
  const fBellyMat = new THREE.MeshStandardMaterial({ color: 0xfce7f3, roughness: 0.95 }); // pale pink
  const fEyeMat   = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const fPupilMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b });
  const fBeakMat  = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 });

  // Body
  const fBody = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 7), fBodyMat);
  fBody.scale.set(1.0, 1.15, 0.95);
  fBody.position.set(frbX, frbY + 0.11, frbZ);
  group.add(fBody);
  // Belly patch
  const fBelly = new THREE.Mesh(new THREE.SphereGeometry(0.065, 7, 6), fBellyMat);
  fBelly.scale.set(0.75, 0.85, 0.4);
  fBelly.position.set(frbX, frbY + 0.12, frbZ + 0.09);
  group.add(fBelly);
  // Ear bumps
  for (const ex of [-0.075, 0.075]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.04, 7, 6), fEarMat);
    ear.position.set(frbX + ex, frbY + 0.24, frbZ - 0.01);
    group.add(ear);
  }
  // Hair tuft
  const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 5), fBodyMat);
  tuft.position.set(frbX, frbY + 0.3, frbZ);
  group.add(tuft);
  // Big eyes
  for (const ex of [-0.042, 0.042]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 7, 6), fEyeMat);
    eye.position.set(frbX + ex, frbY + 0.18, frbZ + 0.09);
    group.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), fPupilMat);
    pupil.position.set(frbX + ex, frbY + 0.18, frbZ + 0.115);
    group.add(pupil);
    // Shine dot
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.005, 5, 5), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 }));
    shine.position.set(frbX + ex + 0.01, frbY + 0.19, frbZ + 0.122);
    group.add(shine);
  }
  // Beak
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.03, 4), fBeakMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(frbX, frbY + 0.14, frbZ + 0.11);
  group.add(beak);
  // Feet
  for (const fx of [-0.045, 0.045]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), fBodyMat);
    foot.scale.set(1.2, 0.5, 1.3);
    foot.position.set(frbX + fx, frbY + 0.025, frbZ + 0.05);
    group.add(foot);
  }

  // ── PLAQUE ANCHOR ──
  buildPlaque(group, building, D / 2 + 0.1, 3.0);
};

// ─── Custom Building: Reddington's Theatre ─────────────────────────────────

CUSTOM_BUILDERS['reddingtons'] = function (group, building) {
  const W     = 3.8;    // facade width
  const baseH = 0.18;   // foundation height

  // ── ZONE DEPTHS (front → back) ──
  const D_f   = 1.8;    // ornate facade section
  const D_a   = 2.2;    // auditorium block
  const D_fly = 1.2;    // fly tower
  const D_b   = 0.8;    // backstage block
  const D_total = D_f + D_a + D_fly + D_b; // 6.0

  // Z positions (building centred at z=0, front face at z=+D_total/2)
  const z_front  =  D_total / 2;                     //  3.0
  const z_fBack  =  z_front - D_f;                   //  1.2
  const z_aBack  =  z_fBack - D_a;                   // -1.0
  const z_flyBack = z_aBack  - D_fly;                // -2.2
  const z_back   = -D_total / 2;                     // -3.0
  const z_fC     = (z_front  + z_fBack)  / 2;       //  2.1 (facade centre)
  const z_aC     = (z_fBack  + z_aBack)  / 2;       //  0.1 (auditorium centre)
  const z_flyC   = (z_aBack  + z_flyBack) / 2;      // -1.6 (fly tower centre)
  const z_bC     = (z_flyBack + z_back)   / 2;      // -2.6 (backstage centre)

  // Heights
  const floor1H    = 1.55;   // ground floor
  const floor2H    = 1.25;   // second floor
  const floor2Base = baseH + floor1H + 0.1;
  const facadeH    = 2.9;    // main facade wall (below stepped parapets)
  const audH       = 2.8;    // auditorium block
  const flyH       = 6.0;    // fly tower — signature silhouette
  const backstageH = 1.5;    // backstage block

  // ── MATERIALS ──
  const creamMat    = new THREE.MeshStandardMaterial({ color: 0xF5F5DC, roughness: 0.85 });
  const brickMat    = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
  const trimMat     = new THREE.MeshStandardMaterial({ color: 0xFFFEF0, roughness: 0.7 });
  const roofMat     = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.8 });
  const doorMat     = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.6 });
  const winMat      = new THREE.MeshStandardMaterial({ color: 0xbfdbfe, emissive: 0x3b82f6, emissiveIntensity: 0.15, transparent: true, opacity: 0.35, roughness: 0.1 });
  const glowWinMat  = new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xfbbf24, emissiveIntensity: 0.5 });
  const goldMat     = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.6, roughness: 0.3 });
  const brassMat    = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.5, roughness: 0.35 });
  const marqueeMat  = new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.7 });
  const bannerMat   = new THREE.MeshStandardMaterial({ color: 0x6B0F1A, roughness: 0.85 });
  const bannerTxtMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.3, roughness: 0.5 });
  const charcoalMat = new THREE.MeshStandardMaterial({ color: 0x2C2C2C, roughness: 0.9 });
  const audRoofMat  = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.9 });
  const bulbMat     = new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfbbf24, emissiveIntensity: 0.9 });

  // ── FOUNDATION ──
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, baseH, D_total + 0.4), creamMat);
  base.position.set(0, baseH / 2, 0);
  base.castShadow = true; base.receiveShadow = true;
  group.add(base);

  // ── ZONE 1: ORNATE FACADE SECTION ──
  const facadeWall = new THREE.Mesh(new THREE.BoxGeometry(W, facadeH, D_f), creamMat);
  facadeWall.position.set(0, baseH + facadeH / 2, z_fC);
  facadeWall.castShadow = true; facadeWall.receiveShadow = true;
  group.add(facadeWall);

  // Floor divider cornice
  const corn1 = new THREE.Mesh(new THREE.BoxGeometry(W + 0.14, 0.1, D_f + 0.1), trimMat);
  corn1.position.set(0, baseH + floor1H + 0.05, z_fC);
  group.add(corn1);

  // ── STEPPED ART-DECO PARAPET ──
  // Three tiers: centre highest (4.2), mid (3.8), outer edges (3.4)
  const wallTop = baseH + facadeH;  // 3.08
  const parapetDefs = [
    { w: W * 0.33, top: 4.2,  x: 0 },
    { w: W * 0.24, top: 3.8,  x: -W * 0.285 },
    { w: W * 0.24, top: 3.8,  x:  W * 0.285 },
    { w: W * 0.11, top: 3.4,  x: -W * 0.455 },
    { w: W * 0.11, top: 3.4,  x:  W * 0.455 },
  ];
  for (const { w, top, x } of parapetDefs) {
    const ph = top - wallTop;
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, ph, D_f + 0.1), creamMat);
    p.position.set(x, wallTop + ph / 2, z_fC);
    p.castShadow = true;
    group.add(p);
  }
  // Gold trim cap on centre parapet
  const capTrim = new THREE.Mesh(new THREE.BoxGeometry(W * 0.33 + 0.1, 0.08, D_f + 0.2), goldMat);
  capTrim.position.set(0, 4.2 + 0.04, z_fC);
  group.add(capTrim);

  // Parapet finials (gold spires on stepped edges)
  for (const fx of [-W * 0.285, 0, W * 0.285]) {
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.16), creamMat);
    ped.position.set(fx, 3.8 + 0.11, z_front + 0.05);
    group.add(ped);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.2, 4), goldMat);
    spire.position.set(fx, 3.8 + 0.33, z_front + 0.05);
    spire.rotation.y = Math.PI / 4;
    group.add(spire);
  }

  // ── FLUTED VERTICAL PILASTERS (8, avoiding entrance) ──
  // Entrance occupies x ≈ ±0.9; place 4 pilasters each side outside entrance
  const pilH = facadeH;
  const leftPilX  = [-1.82, -1.54, -1.26, -0.98];
  const rightPilX = leftPilX.map(x => -x);
  for (const px of [...leftPilX, ...rightPilX]) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.13, pilH, 0.09), trimMat);
    pil.position.set(px, baseH + pilH / 2, z_front + 0.045);
    pil.castShadow = true;
    group.add(pil);
    // Gold capital
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.13), goldMat);
    cap.position.set(px, baseH + pilH + 0.045, z_front + 0.045);
    group.add(cap);
    // Fluting grooves (3 per pilaster)
    for (let fi = 0; fi < 3; fi++) {
      const groove = new THREE.Mesh(new THREE.BoxGeometry(0.016, pilH * 0.9, 0.012), brickMat);
      groove.position.set(px - 0.025 + fi * 0.025, baseH + pilH / 2, z_front + 0.1);
      group.add(groove);
    }
  }

  // ── CHEVRON FRIEZES between floors ──
  const nChev = 28;
  for (const chevY of [baseH + floor1H + 0.18, baseH + floor1H + 0.28]) {
    for (let i = 0; i < nChev; i++) {
      const cx = -W / 2 + (i + 0.5) / nChev * W;
      const chev = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.075, 0.04), goldMat);
      chev.position.set(cx, chevY, z_front + 0.04);
      chev.rotation.z = (i % 2 === 0) ? Math.PI / 4 : -Math.PI / 4;
      group.add(chev);
    }
  }

  // ── ENTRANCE: wide charcoal steps (5) ──
  for (let i = 0; i < 5; i++) {
    const sW = W * 0.52 - i * 0.07;
    const step = new THREE.Mesh(new THREE.BoxGeometry(sW, 0.07, 0.28), charcoalMat);
    step.position.set(0, baseH + i * 0.07 + 0.035, z_front + 0.42 - i * 0.25);
    step.castShadow = true; step.receiveShadow = true;
    group.add(step);
  }

  // ── ENTRANCE ARCH & DOUBLE DOORS ──
  const archHalf = 0.62;
  const archTop  = baseH + 1.22;
  for (const ax of [-archHalf, archHalf]) {
    const upright = new THREE.Mesh(new THREE.BoxGeometry(0.13, 1.22, 0.11), trimMat);
    upright.position.set(ax, baseH + 0.61, z_front + 0.055);
    group.add(upright);
  }
  const arch = new THREE.Mesh(new THREE.TorusGeometry(archHalf + 0.065, 0.065, 8, 16, Math.PI), trimMat);
  arch.position.set(0, archTop, z_front + 0.055);
  group.add(arch);
  const keystone = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.1), goldMat);
  keystone.position.set(0, archTop + archHalf + 0.065, z_front + 0.055);
  group.add(keystone);

  for (const dx of [-0.28, 0.28]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.15, 0.05), doorMat);
    door.position.set(dx, baseH + 0.575, z_front + 0.03);
    group.add(door);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.38, 0.025), new THREE.MeshStandardMaterial({ color: 0x2a0e04 }));
    panel.position.set(dx, baseH + 0.7, z_front + 0.058);
    group.add(panel);
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), goldMat);
    handle.position.set(dx > 0 ? dx - 0.1 : dx + 0.1, baseH + 0.575, z_front + 0.058);
    group.add(handle);
  }

  // ── MARQUEE CANOPY (wide, thin, theatrical red with bulbs) ──
  const mqW = 2.2;
  const mqY = baseH + 1.38;
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(mqW, 0.1, 0.85), marqueeMat);
  canopy.position.set(0, mqY, z_front + 0.425);
  canopy.castShadow = true;
  group.add(canopy);
  // Canopy fascia
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(mqW, 0.28, 0.07), marqueeMat);
  fascia.position.set(0, mqY - 0.19, z_front + 0.82);
  group.add(fascia);
  // Diagonal gold support brackets
  for (const bx of [-mqW / 2 + 0.22, mqW / 2 - 0.22]) {
    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.64, 6), goldMat);
    bracket.position.set(bx, mqY - 0.16, z_front + 0.24);
    bracket.rotation.x = -Math.PI / 4;
    group.add(bracket);
  }
  // 12 spherical bulbs along front edge
  for (let i = 0; i < 12; i++) {
    const bx = -mqW / 2 + 0.1 + (i / 11) * (mqW - 0.2);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), bulbMat);
    bulb.position.set(bx, mqY - 0.07, z_front + 0.82);
    group.add(bulb);
  }
  // Gold name bars on fascia
  for (const [bw, by] of [[mqW * 0.55, mqY - 0.15], [mqW * 0.38, mqY - 0.28]]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.06, 0.025), goldMat);
    bar.position.set(0, by, z_front + 0.87);
    group.add(bar);
  }

  // ── SUNBURST MOTIF (20 rays, alternating gold/brass) ──
  const sbY = floor2Base + 0.52;
  const sbZ = z_front + 0.065;
  for (let i = 0; i < 20; i++) {
    const angle = (-Math.PI / 2) + (i / 19) * Math.PI;
    const r1 = 0.2, r2 = 0.72;
    const ray = new THREE.Mesh(new THREE.BoxGeometry(0.028, r2 - r1, 0.05), i % 2 === 0 ? goldMat : brassMat);
    ray.position.set(
      Math.cos(angle) * (r1 + (r2 - r1) / 2),
      sbY + Math.sin(angle) * (r1 + (r2 - r1) / 2),
      sbZ
    );
    ray.rotation.z = angle + Math.PI / 2;
    group.add(ray);
  }
  const sunArc = new THREE.Mesh(new THREE.TorusGeometry(0.69, 0.03, 6, 24, Math.PI), goldMat);
  sunArc.position.set(0, sbY, sbZ);
  group.add(sunArc);

  // ── SHOW BANNER (large, burgundy, "OCTOCATS CODE" in gold) ──
  const bannerY  = baseH + 2.6;
  const bannerHH = 0.78;
  const bannerWW = W * 0.93;
  const banner = new THREE.Mesh(new THREE.BoxGeometry(bannerWW, bannerHH, 0.055), bannerMat);
  banner.position.set(0, bannerY, z_front + 0.065);
  group.add(banner);
  // Gold outline border
  for (const [gw, gh, gx, gy] of [
    [bannerWW + 0.09, 0.045, 0, bannerY + bannerHH / 2 + 0.022],
    [bannerWW + 0.09, 0.045, 0, bannerY - bannerHH / 2 - 0.022],
    [0.045, bannerHH + 0.09, -bannerWW / 2 - 0.045, bannerY],
    [0.045, bannerHH + 0.09,  bannerWW / 2 + 0.045, bannerY],
  ]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, 0.04), goldMat);
    b.position.set(gx, gy, z_front + 0.075);
    group.add(b);
  }
  // Gold bars suggesting "OCTOCATS CODE" lettering (three staggered rows)
  const textRows = [
    { y: bannerY + 0.25, bars: [0.11, 0.07, 0.10, 0.07, 0.11, 0.07, 0.10, 0.07, 0.11] },
    { y: bannerY + 0.04, bars: [0.10, 0.07, 0.11, 0.07, 0.10, 0.07, 0.10] },
    { y: bannerY - 0.17, bars: [0.10, 0.07, 0.11, 0.07, 0.10, 0.07, 0.11, 0.07, 0.09] },
  ];
  for (const { y, bars } of textRows) {
    const totalW = bars.reduce((a, b) => a + b, 0) + (bars.length - 1) * 0.04;
    let lx = -totalW / 2;
    for (const bw of bars) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.065, 0.025), bannerTxtMat);
      bar.position.set(lx + bw / 2, y, z_front + 0.095);
      group.add(bar);
      lx += bw + 0.04;
    }
  }

  // ── FACADE WINDOWS ──
  // Ground floor arched windows (flanking entrance)
  for (const wx of [-W / 2 + 0.82, W / 2 - 0.82]) {
    const wBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.055), winMat);
    wBody.position.set(wx, baseH + 0.62, z_front + 0.04);
    group.add(wBody);
    const wArch = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.04, 6, 12, Math.PI), trimMat);
    wArch.position.set(wx, baseH + 0.97, z_front + 0.04);
    group.add(wArch);
    const wSill = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.1), trimMat);
    wSill.position.set(wx, baseH + 0.22, z_front + 0.06);
    group.add(wSill);
  }
  // Second floor windows (arched, with pediments)
  const sf2Y = floor2Base + floor2H * 0.46;
  for (const wx of [-W / 2 + 0.68, -W / 2 + 1.36, 0, W / 2 - 1.36, W / 2 - 0.68]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.62, 0.06), glowWinMat);
    w.position.set(wx, sf2Y, z_front + 0.04);
    group.add(w);
    const wArc = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.04, 6, 12, Math.PI), trimMat);
    wArc.position.set(wx, sf2Y + 0.31, z_front + 0.04);
    group.add(wArc);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.045, 0.1), trimMat);
    sill.position.set(wx, sf2Y - 0.335, z_front + 0.06);
    group.add(sill);
  }

  // ── BOX OFFICE WINDOW (right of entrance) ──
  const boxOff = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.055), glowWinMat);
  boxOff.position.set(W / 2 - 0.36, baseH + 0.32, z_front + 0.05);
  group.add(boxOff);
  const boTrim = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.045, 0.08), goldMat);
  boTrim.position.set(W / 2 - 0.36, baseH + 0.48, z_front + 0.06);
  group.add(boTrim);

  // ── ENTRANCE LANTERNS ──
  for (const lx of [-0.78, 0.78]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 6), goldMat);
    pole.position.set(lx, baseH + 0.28, z_front + 0.16);
    group.add(pole);
    const lBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.1), doorMat);
    lBody.position.set(lx, baseH + 0.65, z_front + 0.16);
    group.add(lBody);
    const lTop = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.1, 4), goldMat);
    lTop.position.set(lx, baseH + 0.8, z_front + 0.16);
    lTop.rotation.y = Math.PI / 4;
    group.add(lTop);
    const lLight = createGlowOrb(0xfbbf24);
    lLight.position.set(lx, baseH + 0.65, z_front + 0.23);
    group.add(lLight);
  }

  // ── A-FRAME POSTER BOARDS (flanking entrance) ──
  for (const px of [-(W / 2 + 0.42), W / 2 + 0.42]) {
    // Panel
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.04), creamMat);
    panel.position.set(px, baseH + 0.6, z_front + 0.55);
    group.add(panel);
    // Coloured strips suggesting show poster
    for (const [oy, ow, col] of [[0.3, 0.52, 0x8B0000], [0.08, 0.52, 0xD4AF37], [-0.15, 0.44, 0x1A1A1A]]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(ow, 0.18, 0.012), new THREE.MeshStandardMaterial({ color: col }));
      strip.position.set(px, baseH + 0.6 + oy, z_front + 0.565);
      group.add(strip);
    }
    // A-frame legs
    for (const lz of [-0.12, 0.12]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.65, 6), doorMat);
      leg.position.set(px, baseH + 0.1, z_front + 0.55 + lz);
      leg.rotation.x = lz > 0 ? 0.14 : -0.14;
      group.add(leg);
    }
    // Small foliage planter
    const planter = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.4), goldMat);
    planter.position.set(px, baseH + 0.1, z_front + 0.55);
    group.add(planter);
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), new THREE.MeshStandardMaterial({ color: 0x2C5F2D, roughness: 0.9 }));
    foliage.position.set(px, baseH + 0.35, z_front + 0.55);
    group.add(foliage);
  }

  // ── VELVET ROPE POSTS ──
  const ropePostMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.8, roughness: 0.2 });
  const ropeLineMat = new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.8 });
  for (const rpx of [-0.78, 0.78]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.82, 8), ropePostMat);
    post.position.set(rpx, baseH + 0.41, z_front + 0.78);
    group.add(post);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), ropePostMat);
    top.position.set(rpx, baseH + 0.87, z_front + 0.78);
    group.add(top);
  }
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 1.56, 6), ropeLineMat);
  rope.position.set(0, baseH + 0.74, z_front + 0.78);
  rope.rotation.z = Math.PI / 2;
  group.add(rope);

  // ── ZONE 2: AUDITORIUM BLOCK (brick, barrel vault roof) ──
  const aud = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, audH, D_a), brickMat);
  aud.position.set(0, baseH + audH / 2, z_aC);
  aud.castShadow = true; aud.receiveShadow = true;
  group.add(aud);
  // Barrel vault roof (full cylinder half-exposed above wall top)
  const barrelR = 0.68;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelR, barrelR, W + 0.3, 16, 1, false), audRoofMat);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0, baseH + audH, z_aC);
  barrel.castShadow = true;
  group.add(barrel);
  // Side windows on auditorium (two per side)
  for (const side of [-1, 1]) {
    for (const wz of [z_aC - D_a * 0.3, z_aC + D_a * 0.3]) {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.42), winMat);
      sw.position.set(side * (W / 2 + 0.12), baseH + audH * 0.55, wz);
      group.add(sw);
    }
  }

  // ── ZONE 3: FLY TOWER (tall, windowless, brick — the signature element) ──
  const flyW = W * 0.72;
  const fly = new THREE.Mesh(new THREE.BoxGeometry(flyW, flyH, D_fly), brickMat);
  fly.position.set(0, baseH + flyH / 2, z_flyC);
  fly.castShadow = true; fly.receiveShadow = true;
  group.add(fly);
  // Fly tower flat roof
  const flyRoof = new THREE.Mesh(new THREE.BoxGeometry(flyW + 0.15, 0.12, D_fly + 0.15), roofMat);
  flyRoof.position.set(0, baseH + flyH + 0.06, z_flyC);
  group.add(flyRoof);
  // Small parapet on fly tower
  for (const [pw, pd, px, pz] of [
    [flyW + 0.15, 0.1, 0, z_flyC - D_fly / 2 - 0.05],
    [flyW + 0.15, 0.1, 0, z_flyC + D_fly / 2 + 0.05],
    [0.1, D_fly + 0.2, -(flyW / 2 + 0.075), z_flyC],
    [0.1, D_fly + 0.2,  (flyW / 2 + 0.075), z_flyC],
  ]) {
    const pp = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.28, pd), brickMat);
    pp.position.set(px, baseH + flyH + 0.12 + 0.14, pz);
    group.add(pp);
  }

  // ── ZONE 4: BACKSTAGE BLOCK (low, utilitarian) ──
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, backstageH, D_b), brickMat);
  back.position.set(0, baseH + backstageH / 2, z_bC);
  back.castShadow = true; back.receiveShadow = true;
  group.add(back);
  const backRoof = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 0.1, D_b + 0.1), roofMat);
  backRoof.position.set(0, baseH + backstageH + 0.05, z_bC);
  group.add(backRoof);

  // ── STAGE DOOR (left side wall, near fly tower / backstage junction) ──
  const sdZ = z_flyBack - 0.35;   // near the rear, on left side
  const stageDoor = new THREE.Mesh(new THREE.BoxGeometry(0.055, 1.2, 0.6), doorMat);
  stageDoor.position.set(-(W / 2 + 0.03), baseH + 0.6, sdZ);
  group.add(stageDoor);
  // "STAGE DOOR" sign above (brass bar + three gold rectangles)
  const sdSign = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.82), goldMat);
  sdSign.position.set(-(W / 2 + 0.03), baseH + 1.42, sdZ);
  group.add(sdSign);
  for (let si = 0; si < 3; si++) {
    const sl = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.06, 0.18), brassMat);
    sl.position.set(-(W / 2 + 0.02), baseH + 1.42, sdZ - 0.24 + si * 0.24);
    group.add(sl);
  }

  // ── INTERIOR GLOW ──
  const glow1 = createGlowOrb(0xc4b5fd);
  glow1.position.set(0, baseH + floor1H * 0.5, z_fC);
  group.add(glow1);
  const glow2 = createGlowOrb(0xfbbf24);
  glow2.position.set(0, floor2Base + 0.55, z_fC);
  group.add(glow2);
  const glow3 = createGlowOrb(0xff8800);
  glow3.position.set(0, baseH + 1.2, z_flyC);
  group.add(glow3);

  // ── PLAQUE ANCHOR ──
  buildPlaque(group, building, z_front + 0.07, 4.2);
};

// ─── Custom Building: Hilbert's Hotel ──────────────────────────────────────

CUSTOM_BUILDERS['hilberts-hotel'] = function (group, building) {
  const W = 2.4;
  const D = 1.8;
  const numFloors = 9;
  const floorH = 0.85;
  const baseH = 0.22;
  const totalWallH = numFloors * floorH;

  // ── MATERIALS ──
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.85 });
  const darkMat     = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.9 });
  const trimMat     = new THREE.MeshStandardMaterial({ color: 0x718096, roughness: 0.7 });
  const winMat      = new THREE.MeshStandardMaterial({ color: 0x93c5fd, emissive: 0x3b82f6, emissiveIntensity: 0.28, transparent: true, opacity: 0.35, roughness: 0.1 });
  const goldMat     = new THREE.MeshStandardMaterial({ color: 0xd4a843, metalness: 0.55, roughness: 0.35 });
  const neonMat     = new THREE.MeshStandardMaterial({ color: 0x7c3aed, emissive: 0x7c3aed, emissiveIntensity: 0.9 });
  const doorMat     = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.5 });
  const signMat     = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 });

  // ── FOUNDATION ──
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, baseH, D + 0.3), darkMat);
  base.position.y = baseH / 2;
  base.castShadow = true; base.receiveShadow = true;
  group.add(base);

  // Entrance steps
  for (let i = 0; i < 3; i++) {
    const sw = W * 0.65 - i * 0.12;
    const step = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.07, 0.27), darkMat);
    step.position.set(0, baseH + i * 0.07 + 0.035, D / 2 + 0.42 - i * 0.22);
    step.castShadow = true;
    group.add(step);
  }

  // ── MAIN TOWER ──
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(W, totalWallH, D), concreteMat);
  mainBody.position.y = baseH + totalWallH / 2;
  mainBody.castShadow = true; mainBody.receiveShadow = true;
  group.add(mainBody);

  // Floor band trims
  for (let f = 1; f <= numFloors; f++) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(W + 0.07, 0.045, D + 0.07), trimMat);
    band.position.y = baseH + f * floorH;
    group.add(band);
  }

  // Vertical corner pilasters
  for (const cx of [-W / 2, W / 2]) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.1, totalWallH, 0.1), darkMat);
    pil.position.set(cx, baseH + totalWallH / 2, 0);
    group.add(pil);
  }

  // ── WINDOWS — front face ──
  const winGeo = new THREE.BoxGeometry(0.22, 0.3, 0.05);
  for (let f = 0; f < numFloors; f++) {
    const fy = baseH + f * floorH + floorH * 0.52;
    for (const wx of [-0.72, 0, 0.72]) {
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(wx, fy, D / 2 + 0.03);
      group.add(win);
    }
  }

  // ── WINDOWS — side faces ──
  const sideWinGeo = new THREE.BoxGeometry(0.05, 0.3, 0.22);
  for (let f = 0; f < numFloors; f++) {
    const fy = baseH + f * floorH + floorH * 0.52;
    for (const wz of [-0.38, 0.38]) {
      for (const sx of [-W / 2 - 0.03, W / 2 + 0.03]) {
        const win = new THREE.Mesh(sideWinGeo, winMat);
        win.position.set(sx, fy, wz);
        group.add(win);
      }
    }
  }

  // ── MATHEMATICAL SYMBOL HELPERS ──
  const fz = D / 2 + 0.035;   // z-offset for front face decorations

  // Infinity (∞) — two torus rings side by side
  function addInfinity(x, y, scale) {
    const r = 0.068 * scale;
    const t = 0.018 * scale;
    const geo = new THREE.TorusGeometry(r, t, 8, 18);
    for (const dx of [-r, r]) {
      const mesh = new THREE.Mesh(geo, goldMat);
      mesh.position.set(x + dx, y, fz);
      mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
    }
  }

  // Plus (+)
  function addPlus(x, y, scale) {
    const s = 0.13 * scale;
    const t = 0.022 * scale;
    const h = new THREE.Mesh(new THREE.BoxGeometry(s, t, t), goldMat);
    h.position.set(x, y, fz);
    group.add(h);
    const v = new THREE.Mesh(new THREE.BoxGeometry(t, s, t), goldMat);
    v.position.set(x, y, fz);
    group.add(v);
  }

  // Equals (=)
  function addEquals(x, y, scale) {
    const s = 0.13 * scale;
    const t = 0.018 * scale;
    const g = 0.038 * scale;
    for (const dy of [-g, g]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(s, t, t), goldMat);
      bar.position.set(x, y + dy, fz);
      group.add(bar);
    }
  }

  // Sigma (Σ) — three horizontal bars with short diagonal bar approximation
  function addSigma(x, y, scale) {
    const bw = 0.14 * scale;
    const bh = 0.018 * scale;
    for (const dy of [0.06 * scale, 0, -0.06 * scale]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bh), goldMat);
      bar.position.set(x, y + dy, fz);
      group.add(bar);
    }
    // Vertical connector on left side
    const vbar = new THREE.Mesh(new THREE.BoxGeometry(bh, 0.13 * scale, bh), goldMat);
    vbar.position.set(x - bw / 2 + bh / 2, y, fz);
    group.add(vbar);
  }

  // ── DECORATE FLOOR TRIM BANDS ──
  // Symbols alternate: ∞, +, =, Σ
  const symPositions = [-0.88, 0.88];
  for (let f = 0; f < numFloors; f++) {
    const fy = baseH + (f + 0.5) * floorH + floorH * 0.35;
    const pat = f % 4;
    for (const sx of symPositions) {
      if (pat === 0) addInfinity(sx, fy, 1.0);
      else if (pat === 1) addPlus(sx, fy, 1.0);
      else if (pat === 2) addEquals(sx, fy, 1.0);
      else                addSigma(sx, fy, 1.0);
    }
  }

  // ── ENTRANCE CANOPY ──
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(W * 0.68, 0.07, 0.52), darkMat);
  canopy.position.set(0, baseH + floorH * 0.82, D / 2 + 0.28);
  canopy.castShadow = true;
  group.add(canopy);

  // Canopy trim edge
  const canopyEdge = new THREE.Mesh(new THREE.BoxGeometry(W * 0.68, 0.06, 0.04), goldMat);
  canopyEdge.position.set(0, baseH + floorH * 0.82 + 0.035, D / 2 + 0.54);
  group.add(canopyEdge);

  for (const cx of [-0.55, 0.55]) {
    const sup = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), trimMat);
    sup.position.set(cx, baseH + floorH * 0.57, D / 2 + 0.5);
    group.add(sup);
  }

  // ── DOOR ──
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.63, 0.05), doorMat);
  door.position.set(0, baseH + 0.315, D / 2 + 0.03);
  group.add(door);

  // Door frame (gold)
  const topFrame = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.05, 0.05), goldMat);
  topFrame.position.set(0, baseH + 0.655, D / 2 + 0.03);
  group.add(topFrame);
  for (const fx of [-0.29, 0.29]) {
    const sf = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.68, 0.05), goldMat);
    sf.position.set(fx, baseH + 0.34, D / 2 + 0.03);
    group.add(sf);
  }

  // Small infinity above door arch
  addInfinity(0, baseH + 0.82, 0.85);

  // ── ROOFTOP PARAPET ──
  const roofY = baseH + totalWallH;
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(W + 0.14, 0.44, D + 0.14), darkMat);
  parapet.position.y = roofY + 0.22;
  parapet.castShadow = true;
  group.add(parapet);

  const parapetTrim = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.06, D + 0.2), trimMat);
  parapetTrim.position.y = roofY + 0.47;
  group.add(parapetTrim);

  // ── ROOFTOP SIGN BOARD ──
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(W * 0.88, 0.58, 0.08), signMat);
  signBoard.position.set(0, roofY + 0.87, D / 2 + 0.07);
  group.add(signBoard);

  // Gold border on sign board
  for (const dy of [0.31, -0.31]) {
    const border = new THREE.Mesh(new THREE.BoxGeometry(W * 0.88 + 0.06, 0.04, 0.04), goldMat);
    border.position.set(0, roofY + 0.87 + dy, D / 2 + 0.09);
    group.add(border);
  }

  // Large neon ∞ on sign (two large tori)
  const bigR = 0.115;
  const bigT = 0.026;
  const bigGeo = new THREE.TorusGeometry(bigR, bigT, 8, 22);
  for (const dx of [-bigR, bigR]) {
    const ring = new THREE.Mesh(bigGeo, neonMat);
    ring.position.set(dx, roofY + 0.87, D / 2 + 0.12);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  }

  // "ℵ₀" approximation flanking the ∞ on the sign
  function addAlephSign(x, y) {
    const z = D / 2 + 0.12;
    const diag = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.2, 0.025), neonMat);
    diag.rotation.z = -0.25;
    diag.position.set(x, y, z);
    group.add(diag);
    for (const dy of [0.04, -0.04]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.025), neonMat);
      bar.rotation.z = 0.25;
      bar.position.set(x, y + dy, z);
      group.add(bar);
    }
    // Subscript 0 circle
    const zeroGeo = new THREE.TorusGeometry(0.025, 0.01, 6, 12);
    const zero = new THREE.Mesh(zeroGeo, neonMat);
    zero.rotation.x = Math.PI / 2;
    zero.position.set(x + 0.07, y - 0.08, z);
    group.add(zero);
  }

  addAlephSign(-0.53, roofY + 0.87);
  addAlephSign( 0.53, roofY + 0.87);

  // ── PENTHOUSE / ELEVATOR HOUSING ──
  const penthouse = new THREE.Mesh(new THREE.BoxGeometry(W * 0.38, 0.5, D * 0.38), darkMat);
  penthouse.position.y = roofY + 0.67;
  penthouse.castShadow = true;
  group.add(penthouse);

  // ── INTERIOR GLOW ──
  const glow = createGlowOrb(0x7c3aed);
  glow.position.set(0, baseH + totalWallH * 0.45, 0);
  group.add(glow);
  const roofGlow = createGlowOrb(0xd4a843);
  roofGlow.position.set(0, roofY + 1.1, D / 2 + 0.1);
  group.add(roofGlow);

  // ── PLAQUE ──
  buildPlaque(group, building, D / 2 + 0.04, 2.8);
};

// ─── Custom Building: Town Green Gazebo ────────────────────────────────────

CUSTOM_BUILDERS['town-green-gazebo'] = function (group, building) {
  const R      = 1.8;   // radius from center to column
  const baseH  = 0.3;   // stone foundation height
  const colH   = 2.2;   // column height above foundation
  const roofH  = 1.4;   // main roof cone height
  const totalH = baseH + colH;  // top of columns

  // Materials
  const whiteMat   = new THREE.MeshStandardMaterial({ color: 0xF8F8F8, roughness: 0.5 });
  const stoneMat   = new THREE.MeshStandardMaterial({ color: 0xc8c0b0, roughness: 0.9 });
  const shingleMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.95 });
  const brickMat   = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
  const brassMat   = new THREE.MeshStandardMaterial({ color: 0xB8860B, metalness: 0.5, roughness: 0.4 });
  const woodMat    = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.8 });
  const flowerMat  = new THREE.MeshStandardMaterial({ color: 0xE63946 });
  const ivyMat     = new THREE.MeshStandardMaterial({ color: 0x2D5016 });
  const darkMat    = new THREE.MeshStandardMaterial({ color: 0x1f2937 });

  // ── BRICK WALKWAY ──
  const walkGeo = new THREE.CylinderGeometry(R + 1.3, R + 1.3, 0.04, 8);
  const walk = new THREE.Mesh(walkGeo, brickMat);
  walk.rotation.y = Math.PI / 8;
  walk.position.y = 0.02;
  walk.receiveShadow = true;
  group.add(walk);

  // ── OCTAGONAL STONE FOUNDATION ──
  const foundGeo = new THREE.CylinderGeometry(R + 0.2, R + 0.25, baseH, 8);
  const found = new THREE.Mesh(foundGeo, stoneMat);
  found.rotation.y = Math.PI / 8;
  found.position.y = baseH / 2;
  found.castShadow = true;
  found.receiveShadow = true;
  group.add(found);

  // ── FLOOR ──
  const floorGeo = new THREE.CylinderGeometry(R + 0.05, R + 0.05, 0.06, 8);
  const floorMesh = new THREE.Mesh(floorGeo, whiteMat);
  floorMesh.rotation.y = Math.PI / 8;
  floorMesh.position.y = baseH + 0.03;
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Column positions: vertices of a regular octagon, offset by π/8 so faces
  // align with cardinal directions.  Face 1 (midAngle ≈ π/2) = south (+Z) → stairs.
  // Face 5 (midAngle ≈ 3π/2) = north (-Z) → ramp.
  const colAngleOffset = Math.PI / 8;

  // ── EIGHT COLUMNS ──
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + colAngleOffset;
    const cx = Math.cos(angle) * (R - 0.05);
    const cz = Math.sin(angle) * (R - 0.05);

    const colGeo = new THREE.CylinderGeometry(0.1, 0.12, colH, 10);
    const col = new THREE.Mesh(colGeo, whiteMat);
    col.position.set(cx, baseH + colH / 2, cz);
    col.castShadow = true;
    group.add(col);

    // Corinthian-style capital
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.28), whiteMat);
    cap.position.set(cx, baseH + colH + 0.05, cz);
    group.add(cap);
    const capDetail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.22), whiteMat);
    capDetail.position.set(cx, baseH + colH - 0.02, cz);
    group.add(capDetail);

    // Column base
    const cb = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.25), whiteMat);
    cb.position.set(cx, baseH + 0.04, cz);
    group.add(cb);
  }

  // ── ROOF BEAM RING at top of columns ──
  const beamRingGeo = new THREE.CylinderGeometry(R + 0.05, R + 0.05, 0.12, 8);
  const beamRing = new THREE.Mesh(beamRingGeo, whiteMat);
  beamRing.rotation.y = Math.PI / 8;
  beamRing.position.y = totalH + 0.06;
  group.add(beamRing);

  // ── OCTAGONAL SHINGLE ROOF ──
  const roofGeo = new THREE.ConeGeometry(R + 0.18, roofH, 8);
  const roof = new THREE.Mesh(roofGeo, shingleMat);
  roof.rotation.y = Math.PI / 8;
  roof.position.y = totalH + 0.12 + roofH / 2;
  roof.castShadow = true;
  group.add(roof);

  // Shingle row rings (simulate overlapping cedar shingles)
  for (let row = 0; row < 4; row++) {
    const t = (row + 0.5) / 4;
    const rowR = (R + 0.18) * (1 - t * 0.85);
    const rowY = totalH + 0.15 + t * roofH * 0.9;
    const shingleRing = new THREE.Mesh(
      new THREE.CylinderGeometry(rowR + 0.03, rowR + 0.03, 0.04, 8),
      shingleMat
    );
    shingleRing.rotation.y = Math.PI / 8;
    shingleRing.position.y = rowY;
    group.add(shingleRing);
  }

  // ── CUPOLA ──
  const cupolaH = 0.55;
  const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, cupolaH, 8), whiteMat);
  cupola.rotation.y = Math.PI / 8;
  cupola.position.y = totalH + 0.12 + roofH + cupolaH / 2;
  group.add(cupola);

  const cupolaRoof = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.32, 8), shingleMat);
  cupolaRoof.rotation.y = Math.PI / 8;
  cupolaRoof.position.y = totalH + 0.12 + roofH + cupolaH + 0.16;
  group.add(cupolaRoof);

  // Brass finial sphere
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), brassMat);
  finial.position.y = totalH + 0.12 + roofH + cupolaH + 0.35;
  group.add(finial);

  // ── RAILINGS between columns (6 open faces; skip face 1=south/stairs, face 5=north/ramp) ──
  for (let i = 0; i < 8; i++) {
    if (i === 1) continue; // south face — stairs here
    if (i === 5) continue; // north face — ramp here

    const a1 = (i / 8) * Math.PI * 2 + colAngleOffset;
    const a2 = ((i + 1) / 8) * Math.PI * 2 + colAngleOffset;
    const midAngle = (a1 + a2) / 2;

    const x1 = Math.cos(a1) * (R - 0.05);
    const z1 = Math.sin(a1) * (R - 0.05);
    const x2 = Math.cos(a2) * (R - 0.05);
    const z2 = Math.sin(a2) * (R - 0.05);
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;

    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    const railAngle = Math.atan2(dx, dz);
    const railH = 0.5;

    // Top and bottom rails
    for (const ry of [baseH + 0.18, baseH + railH]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len * 0.84, 0.04, 0.04), whiteMat);
      rail.position.set(midX, ry, midZ);
      rail.rotation.y = railAngle;
      group.add(rail);
    }

    // Turned balusters
    for (let b = 1; b <= 3; b++) {
      const t = b / 4;
      const bx = x1 + (x2 - x1) * t;
      const bz = z1 + (z2 - z1) * t;
      const bal = new THREE.Mesh(new THREE.BoxGeometry(0.04, railH, 0.04), whiteMat);
      bal.position.set(bx, baseH + railH / 2, bz);
      group.add(bal);
    }

    // Gingerbread bracket at top of arch
    const bktX = Math.cos(midAngle) * (R - 0.18);
    const bktZ = Math.sin(midAngle) * (R - 0.18);
    const bkt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.06), whiteMat);
    bkt.position.set(bktX, totalH - 0.18, bktZ);
    group.add(bkt);
    // Diagonal brace on bracket
    for (const side of [-1, 1]) {
      const braceAngle = Math.atan2(bktZ, bktX);
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.04), whiteMat);
      br.position.set(bktX + Math.cos(braceAngle + side * 0.3) * 0.1,
                      totalH - 0.3,
                      bktZ + Math.sin(braceAngle + side * 0.3) * 0.1);
      group.add(br);
    }
  }

  // ── STAIRS on south face (face 1, midAngle ≈ π/2 → +Z) ──
  // Columns of face 1 are at angles 3π/8 and 5π/8; z ≈ 0.924*(R-0.05)
  const stairBaseZ = Math.sin(3 * Math.PI / 8) * (R - 0.05); // ≈ front edge z
  for (let s = 0; s < 5; s++) {
    const stepW = 1.3 - s * 0.04;
    const step = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.06, 0.22), stoneMat);
    step.position.set(0, s * 0.06 + 0.03, stairBaseZ + 0.12 + (4 - s) * 0.22);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  }
  // Stair handrails
  for (const sx of [-0.56, 0.56]) {
    const hrPost = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.04), whiteMat);
    hrPost.position.set(sx, 0.18, stairBaseZ + 1.2);
    group.add(hrPost);
    const hr = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.1), whiteMat);
    hr.position.set(sx, 0.32, stairBaseZ + 0.65);
    hr.rotation.x = -0.24;
    group.add(hr);
  }

  // ── RAMP on north face (face 5, midAngle ≈ 3π/2 → -Z) ──
  const rampLength = 1.5;
  const rampAngle = Math.atan2(baseH, rampLength);
  const rampCenterZ = -(stairBaseZ + rampLength / 2);
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, rampLength), stoneMat);
  ramp.position.set(0, baseH / 2, rampCenterZ);
  ramp.rotation.x = rampAngle;
  ramp.castShadow = true;
  group.add(ramp);
  // Ramp railings
  for (const rx of [-0.44, 0.44]) {
    const rRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, rampLength + 0.05), whiteMat);
    rRail.position.set(rx, 0.35, rampCenterZ);
    rRail.rotation.x = rampAngle;
    group.add(rRail);
    const rPost = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.04), whiteMat);
    rPost.position.set(rx, 0.18, rampCenterZ - rampLength / 2);
    group.add(rPost);
  }

  // ── HANGING FLOWER BASKETS (7 arches — skip face 1=south/stairs) ──
  for (let i = 0; i < 8; i++) {
    if (i === 1) continue; // south face has stairs

    const a1 = (i / 8) * Math.PI * 2 + colAngleOffset;
    const a2 = ((i + 1) / 8) * Math.PI * 2 + colAngleOffset;
    const midAngle = (a1 + a2) / 2;
    const bx = Math.cos(midAngle) * (R - 0.3);
    const bz = Math.sin(midAngle) * (R - 0.3);
    const hangY = totalH - 0.12;

    // Chain
    const chainMat = new THREE.MeshStandardMaterial({ color: 0xa0a0a0, metalness: 0.5 });
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.25, 4), chainMat);
    chain.position.set(bx, hangY - 0.1, bz);
    group.add(chain);

    // Wire basket
    const basketMat = new THREE.MeshStandardMaterial({ color: 0x6B3A1F, roughness: 0.9 });
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.1, 8), basketMat);
    basket.position.set(bx, hangY - 0.28, bz);
    group.add(basket);

    // Red geranium clusters (asymmetric count)
    const fCount = 3 + (i % 3);
    for (let f = 0; f < fCount; f++) {
      const fa = (f / fCount) * Math.PI * 2 + i * 0.53;
      const fr = 0.05 + (f % 2) * 0.04;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.04 + (i % 2) * 0.01, 5, 4),
        flowerMat
      );
      flower.position.set(bx + Math.cos(fa) * fr, hangY - 0.22, bz + Math.sin(fa) * fr);
      group.add(flower);
    }

    // Trailing ivy tendrils
    const ivyLen = 0.12 + (i % 3) * 0.06;
    const ivy1 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.005, ivyLen, 4), ivyMat);
    ivy1.position.set(bx + 0.06, hangY - 0.38, bz + 0.03);
    ivy1.rotation.z = 0.35 + (i % 2) * 0.2;
    group.add(ivy1);
    const ivy2 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, ivyLen * 0.8, 4), ivyMat);
    ivy2.position.set(bx - 0.04, hangY - 0.35, bz + 0.05);
    ivy2.rotation.z = -0.3 - (i % 3) * 0.15;
    group.add(ivy2);
  }

  // ── INTERIOR BENCHES (6 benches along inner wall faces) ──
  const benchFaces = [0, 2, 3, 4, 6, 7]; // skip face 1 (south entry) and face 5 (north ramp)
  for (const fi of benchFaces) {
    const a1 = (fi / 8) * Math.PI * 2 + colAngleOffset;
    const a2 = ((fi + 1) / 8) * Math.PI * 2 + colAngleOffset;
    const midAngle = (a1 + a2) / 2;
    const bx = Math.cos(midAngle) * (R - 0.62);
    const bz = Math.sin(midAngle) * (R - 0.62);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.22), woodMat);
    seat.position.set(bx, baseH + 0.28, bz);
    seat.rotation.y = midAngle;
    group.add(seat);

    const backX = bx + Math.cos(midAngle) * 0.12;
    const backZ = bz + Math.sin(midAngle) * 0.12;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.2, 0.04), woodMat);
    back.position.set(backX, baseH + 0.42, backZ);
    back.rotation.y = midAngle;
    group.add(back);

    // Bench legs
    for (const off of [-0.28, 0.28]) {
      const legX = bx + Math.sin(midAngle) * off;
      const legZ = bz - Math.cos(midAngle) * off;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.04), woodMat);
      leg.position.set(legX, baseH + 0.14, legZ);
      group.add(leg);
    }
  }

  // ── MUSIC STANDS (3 in center performance area) ──
  for (let i = 0; i < 3; i++) {
    const sx = -0.38 + i * 0.38;
    const sz = 0.25 - (i % 2) * 0.15;

    const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.8, 5), darkMat);
    standPole.position.set(sx, baseH + 0.4, sz);
    group.add(standPole);

    const standTop = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.14), darkMat);
    standTop.position.set(sx, baseH + 0.85, sz);
    standTop.rotation.x = 0.4;
    group.add(standTop);
  }

  // ── PODIUM on west side ──
  const podMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 });
  const pod = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.3), podMat);
  pod.position.set(-0.9, baseH + 0.3, 0);
  group.add(pod);
  const podTop = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.34), podMat);
  podTop.position.set(-0.9, baseH + 0.62, 0);
  group.add(podTop);
  // Brass microphone
  const micPole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.22, 5), darkMat);
  micPole.position.set(-0.9, baseH + 0.75, 0);
  group.add(micPole);
  const mic = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), brassMat);
  mic.position.set(-0.9, baseH + 0.87, 0);
  group.add(mic);

  // ── BRASS LANTERNS hanging from ceiling beams ──
  const lanternData = [
    { x: 0,    z: 0,    drop: 0.5  },
    { x: 0.55, z: 0.32, drop: 0.65 },
    { x: -0.5, z: -0.3, drop: 0.55 },
  ];
  const wireMat = new THREE.MeshStandardMaterial({ color: 0xB8860B, metalness: 0.5 });
  for (const ld of lanternData) {
    const ceilY = totalH + 0.08;
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, ld.drop, 4), wireMat);
    wire.position.set(ld.x, ceilY - ld.drop / 2, ld.z);
    group.add(wire);
    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.12), brassMat);
    lantern.position.set(ld.x, ceilY - ld.drop, ld.z);
    group.add(lantern);
    const glow = createGlowOrb(0xfbbf24);
    glow.position.set(ld.x, ceilY - ld.drop - 0.05, ld.z);
    group.add(glow);
  }

  // ── COMMEMORATIVE BRASS PLAQUE "Dedicated 1887" on front-right column ──
  const comPlaqueMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.02), brassMat);
  const plqAngle = (2 / 8) * Math.PI * 2 + colAngleOffset; // front-right column angle
  const plqCx = Math.cos(plqAngle) * (R - 0.05);
  const plqCz = Math.sin(plqAngle) * (R - 0.05);
  comPlaqueMesh.position.set(plqCx, baseH + 0.6, plqCz);
  comPlaqueMesh.rotation.y = -plqAngle + Math.PI;
  group.add(comPlaqueMesh);

  // ── CONTRIBUTOR PLAQUE ANCHOR ──
  buildPlaque(group, building, R + 0.25, 2.2);
};

// ─── Custom Building: Fish Soup ─────────────────────────────────────────────

CUSTOM_BUILDERS['fish-soup'] = function (group, building) {
  // ── MATERIALS ──────────────────────────────────────────────────────────────
  const bodyMat    = new THREE.MeshStandardMaterial({ color: 0x4A90C8, roughness: 0.3, metalness: 0.3 });
  const silverMat  = new THREE.MeshStandardMaterial({ color: 0xC0D8E8, roughness: 0.3, metalness: 0.4 });
  const brassMat   = new THREE.MeshStandardMaterial({ color: 0xF4A261, metalness: 0.5, roughness: 0.4 });
  const deckMat    = new THREE.MeshStandardMaterial({ color: 0x8B6F47, roughness: 0.9 });
  const plankDark  = new THREE.MeshStandardMaterial({ color: 0x6B5232, roughness: 0.95 });
  const gillMat    = new THREE.MeshStandardMaterial({ color: 0x2C5F7D, emissive: 0x2C5F7D, emissiveIntensity: 0.3 });
  const eyeMat     = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.1, metalness: 0.3 });
  const eyeHLMat   = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
  const neonMat    = new THREE.MeshStandardMaterial({ color: 0xff6b9d, emissive: 0xff6b9d, emissiveIntensity: 0.8 });
  const ropeMat    = new THREE.MeshStandardMaterial({ color: 0xD2691E, roughness: 0.9 });
  const winMat     = new THREE.MeshStandardMaterial({
    color: 0xbfdbfe, emissive: 0x3b82f6, emissiveIntensity: 0.15,
    transparent: true, opacity: 0.35, roughness: 0.1,
  });
  const billMat    = new THREE.MeshStandardMaterial({
    color: 0xbfdbfe, emissive: 0x3b82f6, emissiveIntensity: 0.12,
    transparent: true, opacity: 0.4, roughness: 0.05,
  });
  const tealIntMat = new THREE.MeshStandardMaterial({ color: 0x2C5F7D, emissive: 0x7dd3fc, emissiveIntensity: 0.2 });

  // ── DOCK PLATFORM ──────────────────────────────────────────────────────────
  const dock = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 3.6), deckMat);
  dock.position.set(0, 0.05, 0);
  dock.receiveShadow = true;
  dock.castShadow = true;
  group.add(dock);

  // Dock plank lines
  for (let i = -1.3; i <= 1.3; i += 0.3) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.11, 3.6), plankDark);
    plank.position.set(i, 0.055, 0);
    group.add(plank);
  }

  // ── MAIN FISH BODY ─────────────────────────────────────────────────────────
  // Elongated ellipsoid: 1.3 wide × 1.1 tall × 3.4 long
  const fishBody = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 12), bodyMat);
  fishBody.scale.set(1.0, 0.85, 2.6);
  fishBody.position.set(0, 1.2, -0.2);
  fishBody.castShadow = true;
  fishBody.receiveShadow = true;
  group.add(fishBody);

  // Upper spine ridge — seafoam silver
  const spine = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 7), silverMat);
  spine.scale.set(0.55, 0.5, 2.6);
  spine.position.set(0, 1.65, -0.2);
  spine.castShadow = true;
  group.add(spine);

  // ── BILL / ENTRANCE ATRIUM (glass cone, tip points forward) ─────────────────
  // ConeGeometry default: apex at +Y. rotation.x = -PI/2 → apex goes to +Z (tip forward)
  const bill = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.5, 10), billMat);
  bill.rotation.x = -Math.PI / 2;
  bill.position.set(0, 1.1, 2.15); // base at z≈1.4, tip at z≈2.9
  bill.renderOrder = 1;
  bill.castShadow = true;
  group.add(bill);

  // Brass entrance arch at bill base
  const entryArch = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 16, Math.PI), brassMat);
  entryArch.position.set(0, 1.1, 1.4);
  entryArch.rotation.x = -Math.PI / 2;
  group.add(entryArch);

  // Brass door frame at entrance
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.04), brassMat);
  doorFrame.position.set(0, 0.77, 1.42);
  group.add(doorFrame);

  // ── DORSAL FIN ─────────────────────────────────────────────────────────────
  // ExtrudeGeometry: 2D shape in XY plane, depth along Z.
  // After rotation.y = -PI/2: old X → fish +Z, old Y → fish +Y, old Z → fish -X.
  const dorsalShape = new THREE.Shape();
  dorsalShape.moveTo(-0.75, 0);  // back of fin
  dorsalShape.lineTo(0.65, 0);   // front of fin
  dorsalShape.lineTo(-0.05, 0.9); // apex
  dorsalShape.closePath();
  const dorsalGeo = new THREE.ExtrudeGeometry(dorsalShape, { depth: 0.07, bevelEnabled: false });
  const dorsal = new THREE.Mesh(dorsalGeo, silverMat);
  dorsal.rotation.y = -Math.PI / 2;
  dorsal.position.set(0.035, 1.75, -0.2); // on top of spine
  dorsal.castShadow = true;
  group.add(dorsal);

  // Brass leading-edge trim on dorsal fin
  const dorsalTrim = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.95, 0.1), brassMat);
  dorsalTrim.position.set(0, 2.2, 0.3);
  dorsalTrim.rotation.z = -0.52;
  group.add(dorsalTrim);

  // ── TAIL FINS ──────────────────────────────────────────────────────────────
  // Two forked lobes flaring outward at the tail
  for (const side of [-1, 1]) {
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.lineTo(side * 0.85, 0.15);
    tailShape.lineTo(side * 0.72, 0.72);
    tailShape.lineTo(0, 0.32);
    tailShape.closePath();
    const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.06, bevelEnabled: false });
    const tailFin = new THREE.Mesh(tailGeo, silverMat);
    // shape XY → rotate so fins flare in world X and rise in Y, thin in Z
    tailFin.rotation.x = Math.PI / 2; // old X→X, old Y→-Z, old Z→+Y
    tailFin.position.set(-0.03, 1.33, -1.85);
    tailFin.castShadow = true;
    group.add(tailFin);
  }

  // Cantilevered tail outdoor deck
  const tailDeck = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.6), deckMat);
  tailDeck.position.set(0, 1.25, -1.65);
  tailDeck.castShadow = true;
  group.add(tailDeck);

  // Deck railing — brass
  for (const rx of [-0.7, 0.7]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.04), brassMat);
    post.position.set(rx, 1.46, -1.65);
    group.add(post);
  }
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.04), brassMat);
  topRail.position.set(0, 1.63, -1.65);
  group.add(topRail);
  const backRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.6), brassMat);
  backRail.position.set(0, 1.46, -1.95);
  group.add(backRail);

  // ── PECTORAL FINS ──────────────────────────────────────────────────────────
  for (const side of [-1, 1]) {
    const pec = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.55), brassMat);
    pec.position.set(side * 0.9, 1.0, 0.2);
    pec.rotation.z = side * 0.35;
    pec.castShadow = true;
    group.add(pec);
    // Ventilation grille lines
    for (let g = 0; g < 4; g++) {
      const grille = new THREE.Mesh(new THREE.BoxGeometry(0.53, 0.02, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xb07040 }));
      grille.position.set(side * 0.9, 1.07, 0.06 + g * 0.13);
      grille.rotation.z = side * 0.35;
      group.add(grille);
    }
  }

  // ── CIRCULAR PORTHOLE WINDOWS ──────────────────────────────────────────────
  for (const pz of [0.85, 0.25, -0.35, -0.95]) {
    for (const side of [-1, 1]) {
      const port = new THREE.Mesh(new THREE.CircleGeometry(0.14, 12), winMat);
      port.position.set(side * 0.63, 1.2, pz);
      port.rotation.y = side * Math.PI / 2;
      port.renderOrder = 1;
      group.add(port);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 8, 16), brassMat);
      ring.position.set(side * 0.62, 1.2, pz);
      ring.rotation.y = side * Math.PI / 2;
      group.add(ring);
    }
  }

  // ── GILL SLITS (cyan backlit) ───────────────────────────────────────────────
  for (let i = 0; i < 5; i++) {
    for (const side of [-1, 1]) {
      const gill = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.03), gillMat);
      gill.position.set(side * 0.56, 1.1, 1.1 - i * 0.1);
      gill.rotation.y = side * 0.2;
      gill.rotation.z = side * 0.15;
      group.add(gill);
    }
  }

  // ── EYES (googly — large glossy black with white cartoon highlights) ────────
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), eyeMat);
    eye.position.set(side * 0.56, 1.4, 1.0);
    eye.castShadow = true;
    group.add(eye);
    const hl = new THREE.Mesh(new THREE.CircleGeometry(0.07, 8), eyeHLMat);
    hl.position.set(side * 0.77, 1.55, 1.05);
    hl.rotation.y = side * 0.6;
    group.add(hl);
  }

  // ── NEON "FISH SOUP" SIGN ──────────────────────────────────────────────────
  const signBg = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 }));
  signBg.position.set(0, 1.97, 0.5);
  group.add(signBg);

  // Hot-pink neon lettering bar
  const neonBar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.14, 0.04), neonMat);
  neonBar.position.set(0, 1.97, 0.55);
  group.add(neonBar);

  // "EST. 2026" sub-line in brass
  const estLine = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.03), brassMat);
  estLine.position.set(0, 1.8, 0.54);
  group.add(estLine);

  // Neon glow point light
  const neonGlow = createGlowOrb(0xff6b9d);
  neonGlow.position.set(0, 1.97, 0.65);
  group.add(neonGlow);

  // ── INTERIOR VISIBLE THROUGH PORTHOLES ────────────────────────────────────
  // Teal interior back wall
  const intWall = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.06), tealIntMat);
  intWall.position.set(0, 1.2, -0.55);
  group.add(intWall);

  // Round dining table with white linen + brass pedestal
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 10),
    new THREE.MeshStandardMaterial({ color: 0xFFFFF0 }));
  tableTop.position.set(0, 1.08, 0.2);
  group.add(tableTop);
  const tablePed = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 6), brassMat);
  tablePed.position.set(0, 0.97, 0.2);
  group.add(tablePed);

  // Driftwood chandelier arm
  const chanArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x8B7355 }));
  chanArm.position.set(0, 1.7, 0.1);
  group.add(chanArm);

  // Brass bar visible through forward portholes
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.24, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x7c3d0c, roughness: 0.7 }));
  bar.position.set(0.1, 1.0, 0.65);
  group.add(bar);

  // ── BRASS BOLLARDS ─────────────────────────────────────────────────────────
  for (const [bx, bz] of [[-1.1, 1.4], [1.1, 1.4], [-1.1, -1.4], [1.1, -1.4]]) {
    const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.5, 8), brassMat);
    bollard.position.set(bx, 0.25, bz);
    bollard.castShadow = true;
    group.add(bollard);
    const bCap = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), brassMat);
    bCap.position.set(bx, 0.55, bz);
    group.add(bCap);
  }

  // ── ROPE COILS (manila rope around front bollards) ─────────────────────────
  for (const [bx, bz] of [[-1.1, 1.4], [1.1, 1.4]]) {
    for (let j = 0; j < 3; j++) {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.1 + j * 0.015, 0.025, 4, 10), ropeMat);
      coil.position.set(bx, 0.06 + j * 0.045, bz);
      coil.rotation.x = Math.PI / 2;
      group.add(coil);
    }
  }

  // ── FISHING NET on port side ──────────────────────────────────────────────
  for (let nz = 0; nz < 4; nz++) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.5, 0.015), ropeMat);
    v.position.set(-1.22, 0.35, -0.52 + nz * 0.28);
    group.add(v);
  }
  for (let ny = 0; ny < 3; ny++) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.9), ropeMat);
    h.position.set(-1.22, 0.2 + ny * 0.18, -0.1);
    group.add(h);
  }

  // Glass floats on net — turquoise, amber, coral
  for (const [i, col] of [[0, 0x40E0D0], [1, 0xFFBF00], [2, 0xFF7F50]]) {
    const fMat = new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.8, roughness: 0.1 });
    const floatSphere = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), fMat);
    floatSphere.position.set(-1.28, 0.48 + i * 0.2, -0.28 + i * 0.22);
    group.add(floatSphere);
  }

  // ── SHIP'S BELL at entrance ────────────────────────────────────────────────
  const bellStand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), brassMat);
  bellStand.position.set(0.6, 0.22, 1.3);
  group.add(bellStand);
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.14, 8, 1, true), brassMat);
  bell.position.set(0.6, 0.55, 1.3);
  group.add(bell);
  const bellRim = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 6, 12), brassMat);
  bellRim.position.set(0.6, 0.48, 1.3);
  bellRim.rotation.x = Math.PI / 2;
  group.add(bellRim);

  // ── BLUE CERAMIC PLANTERS with sea grass ──────────────────────────────────
  const planterMat = new THREE.MeshStandardMaterial({ color: 0x1E90FF, roughness: 0.7 });
  const seaGrassMat = new THREE.MeshStandardMaterial({ color: 0x6B8E23 });
  for (const [px, pz] of [[-1.0, 1.0], [1.0, 1.0], [-1.0, -1.0], [1.0, -1.0]]) {
    const planter = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.22, 8), planterMat);
    planter.position.set(px, 0.11, pz);
    group.add(planter);
    for (let s = 0; s < 4; s++) {
      const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.24 + s * 0.04, 4), seaGrassMat);
      blade.position.set(px + Math.cos(s * 1.5) * 0.06, 0.33 + s * 0.02, pz + Math.sin(s * 1.5) * 0.06);
      blade.rotation.z = (s % 2) * 0.2 - 0.1;
      group.add(blade);
    }
  }

  // ── INTERIOR AQUATIC GLOW ─────────────────────────────────────────────────
  const aquaGlow = createGlowOrb(0x7dd3fc);
  aquaGlow.position.set(0, 1.2, 0);
  group.add(aquaGlow);

  const warmGlow = createGlowOrb(0xfbbf24);
  warmGlow.position.set(0, 1.0, 0.6);
  group.add(warmGlow);

  // ── CONTRIBUTOR PLAQUE ────────────────────────────────────────────────────
  buildPlaque(group, building, 1.55, 2.2);
};

// ─── Custom Building: Serenity (Comfy Christmas Cottage) ───────────────────

CUSTOM_BUILDERS['serenity'] = function (group, building) {
  const W = 2.6;
  const D = 2.0;
  const wallH = 1.8;
  const baseH = 0.12;
  const roofH = 1.2;

  // ── MATERIALS ──────────────────────────────────────────────────────────────
  const wallMat      = new THREE.MeshStandardMaterial({ color: 0xFFF5E6, roughness: 0.9 });
  const roofMat      = new THREE.MeshStandardMaterial({ color: 0xDDEEFF, roughness: 0.95 });
  const timberMat    = new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 0.85 });
  const doorMat      = new THREE.MeshStandardMaterial({ color: 0x6D4C41, roughness: 0.7 });
  const snowMat      = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 1.0 });
  const stoneMat     = new THREE.MeshStandardMaterial({ color: 0x95A5A6, roughness: 0.95 });
  const redMat       = new THREE.MeshStandardMaterial({ color: 0xDC143C });
  const greenMat     = new THREE.MeshStandardMaterial({ color: 0x2D5016 });
  const goldMat      = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.4, roughness: 0.4 });
  const amberMat     = new THREE.MeshStandardMaterial({ color: 0xFFC857, emissive: 0xFFC857, emissiveIntensity: 0.6 });
  const postMat      = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
  const whiteTrimMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 });
  const coalMat      = new THREE.MeshStandardMaterial({ color: 0x1A1A1A });
  const hatMat       = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const treeGreenMat = new THREE.MeshStandardMaterial({ color: 0x1B4D1B });
  const warmWinMat   = new THREE.MeshStandardMaterial({
    color: 0xFFC857, emissive: 0xFFC857, emissiveIntensity: 0.4,
    transparent: true, opacity: 0.45, roughness: 0.1,
  });

  // ── FOUNDATION ──────────────────────────────────────────────────────────────
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, baseH, D + 0.3), stoneMat);
  base.position.y = baseH / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // ── WALLS ──────────────────────────────────────────────────────────────────
  const walls = new THREE.Mesh(new THREE.BoxGeometry(W, wallH, D), wallMat);
  walls.position.y = baseH + wallH / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // Timber framing — vertical corner beams on front face
  for (const bx of [-W / 2, W / 2]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.07, wallH, 0.07), timberMat);
    beam.position.set(bx, baseH + wallH / 2, D / 2);
    group.add(beam);
  }
  // Horizontal beam beneath roofline (front face)
  const hBeam = new THREE.Mesh(new THREE.BoxGeometry(W + 0.07, 0.06, 0.06), timberMat);
  hBeam.position.set(0, baseH + wallH * 0.92, D / 2);
  group.add(hBeam);

  // ── PITCHED ROOF (snow-dusted) ──────────────────────────────────────────────
  const roof = new THREE.Mesh(new THREE.ConeGeometry((W / 2) * 1.15, roofH, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = baseH + wallH + roofH / 2;
  roof.castShadow = true;
  group.add(roof);

  // Snow cap on roof ridge
  const ridgeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, W * 0.9, 6), snowMat);
  ridgeCap.rotation.z = Math.PI / 2;
  ridgeCap.position.y = baseH + wallH + roofH * 0.92;
  group.add(ridgeCap);

  // Snow on front eave
  const eaveFront = new THREE.Mesh(new THREE.BoxGeometry(W * 1.15, 0.1, 0.22), snowMat);
  eaveFront.position.set(0, baseH + wallH + 0.06, D / 2 * 1.15);
  group.add(eaveFront);

  // ── CHIMNEY ─────────────────────────────────────────────────────────────────
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.0, 0.28), stoneMat);
  chimney.position.set(-W / 2 + 0.45, baseH + wallH + 0.58, 0);
  group.add(chimney);
  const chimSnow = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.36), snowMat);
  chimSnow.position.set(-W / 2 + 0.45, baseH + wallH + 1.1, 0);
  group.add(chimSnow);
  // Smoke wisps
  for (let i = 0; i < 3; i++) {
    const smk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03 + i * 0.015, 0.04, 0.18, 5),
      new THREE.MeshStandardMaterial({ color: 0xDDDDDD, transparent: true, opacity: 0.5 - i * 0.12 })
    );
    smk.position.set(-W / 2 + 0.45 + i * 0.02, baseH + wallH + 1.25 + i * 0.22, 0);
    group.add(smk);
  }

  // ── FRONT DOOR ─────────────────────────────────────────────────────────────
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.78, 0.06), doorMat);
  door.position.set(0, baseH + 0.39, D / 2 + 0.03);
  group.add(door);
  // Arch cap above door
  const archCap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.06), doorMat);
  archCap.position.set(0, baseH + 0.87, D / 2 + 0.03);
  group.add(archCap);
  // Door knob
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), goldMat);
  knob.position.set(0.17, baseH + 0.45, D / 2 + 0.06);
  group.add(knob);

  // ── WREATH on door ──────────────────────────────────────────────────────────
  const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.032, 6, 14), greenMat);
  wreath.position.set(0, baseH + 0.6, D / 2 + 0.07);
  group.add(wreath);
  // Crimson bow
  const bow1 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.02), redMat);
  bow1.position.set(-0.04, baseH + 0.755, D / 2 + 0.09);
  bow1.rotation.z = 0.4;
  group.add(bow1);
  const bow2 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.02), redMat);
  bow2.position.set(0.04, baseH + 0.755, D / 2 + 0.09);
  bow2.rotation.z = -0.4;
  group.add(bow2);

  // ── WINDOWS (front, flanking door) ─────────────────────────────────────────
  for (const wx of [-0.88, 0.88]) {
    // White frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.58, 0.05), whiteTrimMat);
    frame.position.set(wx, baseH + wallH * 0.5, D / 2 + 0.024);
    group.add(frame);
    // Warm amber glass
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.5, 0.05), warmWinMat);
    glass.position.set(wx, baseH + wallH * 0.5, D / 2 + 0.036);
    group.add(glass);
    // Pane dividers
    const hdiv = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.025, 0.04), whiteTrimMat);
    hdiv.position.set(wx, baseH + wallH * 0.5, D / 2 + 0.05);
    group.add(hdiv);
    const vdiv = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.52, 0.04), whiteTrimMat);
    vdiv.position.set(wx, baseH + wallH * 0.5, D / 2 + 0.05);
    group.add(vdiv);
    // Window sill
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.08), whiteTrimMat);
    sill.position.set(wx, baseH + wallH * 0.26, D / 2 + 0.035);
    group.add(sill);
    // Candle on sill
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.14, 6),
      new THREE.MeshStandardMaterial({ color: 0xFFFEF0 }));
    candle.position.set(wx, baseH + wallH * 0.26 + 0.09, D / 2 - 0.08);
    group.add(candle);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.027, 5, 4), amberMat);
    flame.scale.y = 1.4;
    flame.position.set(wx, baseH + wallH * 0.26 + 0.17, D / 2 - 0.08);
    group.add(flame);
    // Candle light
    const cLight = createGlowOrb(0xFFC857);
    cLight.position.set(wx, baseH + wallH * 0.45, D / 2 - 0.2);
    group.add(cLight);
  }

  // ── CHRISTMAS TREE (interior centerpiece) ───────────────────────────────────
  const treeX = 0.25;
  const treeZ = D / 2 - 0.42;
  // Trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 6), postMat);
  trunk.position.set(treeX, baseH + 0.075, treeZ);
  group.add(trunk);
  // Layered tiers
  const tierData = [
    { r: 0.52, h: 0.55, y: 0.12 },
    { r: 0.38, h: 0.50, y: 0.50 },
    { r: 0.24, h: 0.45, y: 0.82 },
  ];
  for (const t of tierData) {
    const tier = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 8), treeGreenMat);
    tier.position.set(treeX, baseH + t.y, treeZ);
    group.add(tier);
  }
  // Gold star topper
  const starMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.6 });
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.075), starMat);
  star.rotation.y = Math.PI / 4;
  star.position.set(treeX, baseH + 1.12, treeZ);
  group.add(star);
  // Ornaments
  const ornData = [
    { dx: -0.18, dy: 0.20, dz: 0.12, col: 0xDC143C },
    { dx:  0.15, dy: 0.38, dz: -0.1, col: 0xFFD700 },
    { dx: -0.08, dy: 0.58, dz: 0.08, col: 0xDC143C },
    { dx:  0.10, dy: 0.75, dz: 0.06, col: 0xFFD700 },
    { dx: -0.10, dy: 0.92, dz: -0.05, col: 0xDC143C },
  ];
  for (const o of ornData) {
    const orn = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 5),
      new THREE.MeshStandardMaterial({ color: o.col, metalness: 0.5, roughness: 0.3 }));
    orn.position.set(treeX + o.dx, baseH + o.dy, treeZ + o.dz);
    group.add(orn);
  }
  // Tiny white lights
  for (let i = 0; i < 6; i++) {
    const a = i * 1.1;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 4, 3),
      new THREE.MeshStandardMaterial({ color: 0xFFFACD, emissive: 0xFFFACD, emissiveIntensity: 1.0 }));
    bulb.position.set(treeX + Math.sin(a) * 0.25, baseH + 0.15 + i * 0.16, treeZ + Math.cos(a) * 0.1);
    group.add(bulb);
  }
  // Wrapped presents
  const presentCols = [0xDC143C, 0xFFD700, 0x2D5016];
  for (let i = 0; i < 3; i++) {
    const present = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.13),
      new THREE.MeshStandardMaterial({ color: presentCols[i] }));
    present.position.set(treeX - 0.13 + i * 0.13, baseH + 0.055, treeZ + 0.06);
    group.add(present);
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.025, 0.02), goldMat);
    ribbon.position.set(treeX - 0.13 + i * 0.13, baseH + 0.1, treeZ + 0.06);
    group.add(ribbon);
  }
  // Tree glow
  const treeLight = createGlowOrb(0xFFFFCC);
  treeLight.position.set(treeX, baseH + 0.6, treeZ);
  group.add(treeLight);

  // ── ICICLES along front eave ────────────────────────────────────────────────
  for (const ix of [-W * 0.45, -W * 0.22, 0, W * 0.22, W * 0.45]) {
    const h = 0.12 + Math.abs(ix) * 0.02;
    const icicle = new THREE.Mesh(new THREE.ConeGeometry(0.022, h, 5),
      new THREE.MeshStandardMaterial({ color: 0xDDEEFF, transparent: true, opacity: 0.85 }));
    icicle.position.set(ix, baseH + wallH + 0.02, D / 2 + 0.1);
    group.add(icicle);
  }

  // ── SNOW DRIFTS at base ─────────────────────────────────────────────────────
  const driftL = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 5), snowMat);
  driftL.scale.set(1.3, 0.45, 0.65);
  driftL.position.set(-W / 2 - 0.1, 0, 0);
  group.add(driftL);
  const driftR = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 5), snowMat);
  driftR.scale.set(1.3, 0.45, 0.65);
  driftR.position.set(W / 2 + 0.1, 0, 0);
  group.add(driftR);

  // ── FLAGSTONE PATHWAY ──────────────────────────────────────────────────────
  for (let i = 0; i < 4; i++) {
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.26), stoneMat);
    stone.position.set((i % 2) * 0.06 - 0.03, 0.025, D / 2 + 0.28 + i * 0.32);
    group.add(stone);
  }

  // ── MAILBOX ─────────────────────────────────────────────────────────────────
  const mbX = W / 2 + 0.12;
  const mbZ = D / 2 + 0.1;
  const mbPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 6), postMat);
  mbPost.position.set(mbX, 0.425, mbZ);
  group.add(mbPost);
  const mbBody = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.30, 12), redMat);
  mbBody.rotation.z = Math.PI / 2;
  mbBody.position.set(mbX, 0.92, mbZ);
  group.add(mbBody);
  const mbSnow = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.06, 0.21), snowMat);
  mbSnow.position.set(mbX, 0.98, mbZ);
  group.add(mbSnow);

  // ── SNOWMAN ─────────────────────────────────────────────────────────────────
  const smX = -W / 2 - 0.1;
  const smZ = D / 2 + 0.55;
  const smBody = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 9), snowMat);
  smBody.position.set(smX, 0.26, smZ);
  group.add(smBody);
  const smTorso = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 9), snowMat);
  smTorso.position.set(smX, 0.72, smZ);
  group.add(smTorso);
  const smHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 9), snowMat);
  smHead.position.set(smX, 1.1, smZ);
  group.add(smHead);
  // Coal buttons
  for (let i = 0; i < 3; i++) {
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 4), coalMat);
    btn.position.set(smX, 0.6 + i * 0.1, smZ + 0.20);
    group.add(btn);
  }
  // Carrot nose
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.1, 5),
    new THREE.MeshStandardMaterial({ color: 0xFF6600 }));
  nose.rotation.x = Math.PI / 2;
  nose.position.set(smX, 1.10, smZ + 0.16);
  group.add(nose);
  // Eyes
  for (const ex of [-0.06, 0.06]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 4), coalMat);
    eye.position.set(smX + ex, 1.16, smZ + 0.14);
    group.add(eye);
  }
  // Top hat
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.035, 12), hatMat);
  brim.position.set(smX, 1.29, smZ);
  group.add(brim);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.20, 12), hatMat);
  hat.position.set(smX, 1.39, smZ);
  group.add(hat);
  // Stick arms
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.30, 5), postMat);
    arm.rotation.z = side * (Math.PI / 4);
    arm.position.set(smX + side * 0.25, 0.72, smZ);
    group.add(arm);
  }

  // ── WARM INTERIOR GLOW ─────────────────────────────────────────────────────
  const warmGlow = createGlowOrb(0xFFE5B4);
  warmGlow.position.set(0, baseH + 0.8, D / 2 - 0.3);
  group.add(warmGlow);

  // ── CONTRIBUTOR PLAQUE ─────────────────────────────────────────────────────
  buildPlaque(group, building, D / 2 + 0.06, 2.5);
};

// Create organic village ground with winding roads
export function createGround() {
  const group = new THREE.Group();

  // Countryside — large green plane
  const fieldGeo = new THREE.PlaneGeometry(300, 300);
  const fieldMat = new THREE.MeshStandardMaterial({ color: 0x7cba3f, roughness: 0.95 });
  const field = new THREE.Mesh(fieldGeo, fieldMat);
  field.rotation.x = -Math.PI / 2;
  field.position.set(TOWN_CENTER_X, -0.05, TOWN_CENTER_Z);
  field.receiveShadow = true;
  group.add(field);

  // Village green — softer grass circle
  const villageGeo = new THREE.CircleGeometry(45, 32);
  const villageMat = new THREE.MeshStandardMaterial({ color: 0x8fce4a, roughness: 0.9 });
  const village = new THREE.Mesh(villageGeo, villageMat);
  village.rotation.x = -Math.PI / 2;
  village.position.set(TOWN_CENTER_X, 0.0, TOWN_CENTER_Z);
  village.receiveShadow = true;
  group.add(village);

  // Town square — cobblestone circle in the center
  const squareGeo = new THREE.CircleGeometry(7, 24);
  const squareMat = new THREE.MeshStandardMaterial({ color: 0xc9b896, roughness: 0.95 });
  const square = new THREE.Mesh(squareGeo, squareMat);
  square.rotation.x = -Math.PI / 2;
  square.position.set(TOWN_CENTER_X, 0.015, TOWN_CENTER_Z);
  square.receiveShadow = true;
  group.add(square);

  // Winding roads
  const roadMat = new THREE.MeshStandardMaterial({ color: 0xb8a88a, roughness: 1.0, side: THREE.DoubleSide });
  const roads = [
    // Main Street (east-west curve, 2-lane width)
    { points: [
      { x: -18, z: 27 }, { x: -8, z: 26.5 }, { x: 5, z: 26 },
      { x: 15, z: 25.5 }, { x: 25, z: 25 }, { x: 35, z: 25.5 },
      { x: 45, z: 26 }, { x: 58, z: 26.5 }, { x: 68, z: 27 },
    ], width: 4.0 },
    // North Path (2-lane width)
    { points: [
      { x: 25, z: 25 }, { x: 25, z: 18 }, { x: 25, z: 10 },
      { x: 25, z: 2 }, { x: 24, z: -8 }, { x: 22, z: -18 },
    ], width: 3.5 },
    // South Path (2-lane width)
    { points: [
      { x: 25, z: 25 }, { x: 25, z: 32 }, { x: 25, z: 40 },
      { x: 25, z: 50 }, { x: 24, z: 58 }, { x: 22, z: 65 },
    ], width: 3.5 },
  ];

  for (const road of roads) {
    group.add(createRoadStrip(road.points, road.width, roadMat));
  }

  // Wildflowers in countryside
  const seeded = seedRandom(123);
  const flowerColors = [0xff6b9d, 0xfbbf24, 0xf472b6, 0xa78bfa, 0xfb923c, 0xfde68a];
  for (let i = 0; i < 600; i++) {
    const fx = seeded() * 250 - 100 + TOWN_CENTER_X;
    const fz = seeded() * 250 - 100 + TOWN_CENTER_Z;
    const dx = fx - TOWN_CENTER_X;
    const dz = fz - TOWN_CENTER_Z;
    if (Math.sqrt(dx * dx + dz * dz) < 48) continue;
    const color = flowerColors[Math.floor(seeded() * flowerColors.length)];
    const size = 0.06 + seeded() * 0.08;
    const flowerGeo = new THREE.SphereGeometry(size, 4, 4);
    const flowerMat2 = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const flower = new THREE.Mesh(flowerGeo, flowerMat2);
    flower.position.set(fx, size * 0.5, fz);
    group.add(flower);
  }

  // Grass tufts within the village
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x6db33f });
  for (let i = 0; i < 250; i++) {
    const angle = seeded() * Math.PI * 2;
    const dist = 8 + seeded() * 38;
    const gx = Math.cos(angle) * dist + TOWN_CENTER_X;
    const gz = Math.sin(angle) * dist + TOWN_CENTER_Z;
    const d2c = Math.sqrt((gx - 25) ** 2 + (gz - 25) ** 2);
    if (d2c < 7.5) continue;
    const tGeo = new THREE.ConeGeometry(0.04 + seeded() * 0.03, 0.12 + seeded() * 0.08, 4);
    const tuft = new THREE.Mesh(tGeo, grassMat);
    tuft.position.set(gx, 0.06, gz);
    group.add(tuft);
  }

  return group;
}

// Seeded PRNG for deterministic scenery
function seedRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

// Scenery tree
// Shared materials for scenery (avoid per-object allocations)
const _treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x6b3a1f });
const _treeCanopyMats = [0x2d7d32, 0x388e3c, 0x43a047, 0x4caf50].map(
  c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true })
);
const _rockMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.95, flatShading: true });

export function createSceneryTree(x, z, scale = 1) {
  const group = new THREE.Group();
  const rand = seedRandom(Math.floor(x * 100 + z * 7));

  const trunkH = (1.2 + rand() * 0.8) * scale;
  const trunkGeo = new THREE.CylinderGeometry(0.08 * scale, 0.14 * scale, trunkH, 5);
  const trunk = new THREE.Mesh(trunkGeo, _treeTrunkMat);
  trunk.position.y = trunkH / 2;
  group.add(trunk);

  // Single large canopy (cone shape — like an evergreen)
  const canopyH = (1.5 + rand() * 1.0) * scale;
  const canopyR = (0.7 + rand() * 0.4) * scale;
  const canopyGeo = new THREE.ConeGeometry(canopyR, canopyH, 6);
  const canopyMat = _treeCanopyMats[Math.floor(rand() * _treeCanopyMats.length)];
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.y = trunkH + canopyH * 0.35;
  group.add(canopy);

  // Second smaller layer on top
  const topH = canopyH * 0.6;
  const topR = canopyR * 0.55;
  const topGeo = new THREE.ConeGeometry(topR, topH, 6);
  const top = new THREE.Mesh(topGeo, _treeCanopyMats[0]);
  top.position.y = trunkH + canopyH * 0.7;
  group.add(top);

  group.position.set(x, 0, z);
  return group;
}

// Rock
export function createRock(x, z, scale = 1) {
  const geo = new THREE.DodecahedronGeometry(0.3 * scale, 0);
  const rock = new THREE.Mesh(geo, _rockMat);
  rock.position.set(x, 0.12 * scale, z);
  const s = Math.floor(x * 7 + z * 13);
  rock.rotation.set(s * 0.3, s * 0.7, s * 0.5);
  rock.scale.set(1, 0.5 + (s % 5) * 0.1, 1);
  rock.receiveShadow = true;
  return rock;
}

// Pond
export function createPond(x, z) {
  const group = new THREE.Group();

  const bankGeo = new THREE.CylinderGeometry(3.5, 4, 0.15, 24);
  const bankMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.9 });
  const bank = new THREE.Mesh(bankGeo, bankMat);
  bank.position.y = 0.05;
  bank.receiveShadow = true;
  group.add(bank);

  const waterGeo = new THREE.CylinderGeometry(3, 3, 0.08, 24);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1,
    metalness: 0.2,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = 0.12;
  group.add(water);

  const lilyMat = new THREE.MeshStandardMaterial({ color: 0x4ade80 });
  const rand = seedRandom(42);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + rand() * 0.5;
    const dist = 1 + rand() * 1.5;
    const lilyGeo = new THREE.CircleGeometry(0.2 + rand() * 0.15, 8);
    const lily = new THREE.Mesh(lilyGeo, lilyMat);
    lily.rotation.x = -Math.PI / 2;
    lily.position.set(Math.cos(angle) * dist, 0.17, Math.sin(angle) * dist);
    group.add(lily);
  }

  group.position.set(x, 0, z);
  return group;
}

// Cloud
export function createCloud(x, y, z, scale = 1) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    transparent: true,
    opacity: 0.85,
  });

  const puffs = [
    { x: 0, y: 0, z: 0, r: 1.2 },
    { x: 1, y: 0.2, z: 0.3, r: 1.0 },
    { x: -0.9, y: 0.1, z: -0.2, r: 0.9 },
    { x: 0.5, y: 0.4, z: -0.3, r: 0.7 },
    { x: -0.4, y: 0.3, z: 0.4, r: 0.8 },
  ];

  for (const p of puffs) {
    const geo = new THREE.SphereGeometry(p.r * scale, 7, 5);
    const puff = new THREE.Mesh(geo, mat);
    puff.position.set(p.x * scale, p.y * scale, p.z * scale);
    group.add(puff);
  }

  group.position.set(x, y, z);
  return group;
}

// ─── Custom Building: The Bug Museum ───────────────────────────────────────

CUSTOM_BUILDERS['the-bug-museum'] = function (group, building) {
  const W = 3.5;         // width
  const D = 2.4;         // depth
  const floor1H = 1.6;   // ground floor height
  const floor2H = 1.4;   // second floor height
  const totalH = floor1H + floor2H;
  const baseH = 0.15;    // foundation height

  // Materials
  const concreteMat  = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.9 });
  const darkMat      = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.9 });
  const roofMat      = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.85 });
  const cyanMat      = new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.5 });
  const blackMat     = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.8 });
  const magentaMat   = new THREE.MeshStandardMaterial({ color: 0xff00ff, roughness: 0.7 });
  const winMat       = new THREE.MeshStandardMaterial({
    color: 0xbfdbfe, emissive: 0x3b82f6, emissiveIntensity: 0.15,
    transparent: true, opacity: 0.35, roughness: 0.1,
  });
  const goldMat      = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5, roughness: 0.4 });
  const floorMat     = new THREE.MeshStandardMaterial({ color: 0xf9fafb, roughness: 0.7 });
  const benchMat     = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.85 });
  const chromeMat    = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, metalness: 0.7, roughness: 0.3 });
  const glowCyanMat  = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.6 });
  const whiteMat     = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.1 });
  const beigeMat     = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 });

  // ── FOUNDATION ──
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, baseH, D + 0.3), concreteMat);
  base.position.y = baseH / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // ── MAIN WALLS (concrete box, two stories) ──
  const walls = new THREE.Mesh(new THREE.BoxGeometry(W, totalH, D), concreteMat);
  walls.position.y = baseH + totalH / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // Floor divider strip
  const divider = new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, 0.07, D + 0.06), darkMat);
  divider.position.y = baseH + floor1H;
  group.add(divider);

  // ── FLAT ROOF ──
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.12, D + 0.2), roofMat);
  roofSlab.position.y = baseH + totalH + 0.06;
  roofSlab.castShadow = true;
  group.add(roofSlab);

  // Parapet walls
  for (const [pw, pd, px, pz] of [
    [W + 0.2, 0.07, 0,          D / 2 + 0.08],
    [W + 0.2, 0.07, 0,         -D / 2 - 0.08],
    [0.07, D + 0.2, -W / 2 - 0.08, 0],
    [0.07, D + 0.2,  W / 2 + 0.08, 0],
  ]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.3, pd), darkMat);
    p.position.set(px, baseH + totalH + 0.12 + 0.15, pz);
    group.add(p);
  }

  // ── VERTEX GLITCH SPIKE (back-right corner, roof stretched upward) ──
  const spikeGeo = new THREE.BoxGeometry(0.35, 2.5, 0.35);
  const spike = new THREE.Mesh(spikeGeo, concreteMat);
  spike.position.set(W / 2 - 0.18, baseH + totalH + 0.12 + 1.25, -D / 2 + 0.18);
  spike.rotation.z = 0.18;
  spike.rotation.x = -0.12;
  spike.castShadow = true;
  group.add(spike);
  // Tip detail — glitchy broken edge
  const spikeTip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), darkMat);
  spikeTip.position.set(W / 2 - 0.1, baseH + totalH + 2.9, -D / 2 + 0.22);
  spikeTip.rotation.z = 0.4;
  group.add(spikeTip);

  // ── CHECKERBOARD LEFT WALL (magenta + black, missing-texture style) ──
  const sqSize = 0.25;
  const cols = Math.ceil(D / sqSize);
  const rows = Math.ceil(totalH / sqSize);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isMagenta = (r + c) % 2 === 0;
      const mat = isMagenta ? magentaMat : blackMat;
      const sq = new THREE.Mesh(new THREE.BoxGeometry(0.02, sqSize - 0.01, sqSize - 0.01), mat);
      const pz = -D / 2 + sqSize * (c + 0.5);
      const py = baseH + sqSize * (r + 0.5);
      sq.position.set(-W / 2 - 0.01, py, pz);
      group.add(sq);
    }
  }

  // ── WIDE STEPS (front entrance) ──
  for (let i = 0; i < 4; i++) {
    const stepW = W + 0.5 - i * 0.12;
    const step = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.12, 0.38), concreteMat);
    step.position.set(0, i * 0.12 + 0.06, D / 2 + 0.38 * (4 - i));
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  }

  // ── FLOOR-TO-CEILING DISPLAY WINDOW (front, right of center) ──
  const displayWin = new THREE.Mesh(new THREE.BoxGeometry(1.4, floor1H * 0.85, 0.06), winMat);
  displayWin.position.set(0.8, baseH + floor1H * 0.48, D / 2 + 0.04);
  displayWin.renderOrder = 1;
  group.add(displayWin);

  // Window frame
  const wfMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });
  for (const [fw, fh, fx, fy] of [
    [1.42, 0.05, 0.8, baseH + floor1H * 0.88 + 0.01],
    [1.42, 0.05, 0.8, baseH + 0.04],
    [0.05, floor1H * 0.85, 0.8 - 0.72, baseH + floor1H * 0.48],
    [0.05, floor1H * 0.85, 0.8 + 0.72, baseH + floor1H * 0.48],
  ]) {
    const fr = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.07), wfMat);
    fr.position.set(fx, fy, D / 2 + 0.04);
    group.add(fr);
  }

  // Second floor windows (front)
  for (const wx of [-0.9, 0, 0.9]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.06), winMat);
    w.position.set(wx, baseH + floor1H + floor2H * 0.55, D / 2 + 0.04);
    w.renderOrder = 1;
    group.add(w);
    // Sill
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.1), concreteMat);
    sill.position.set(wx, baseH + floor1H + floor2H * 0.28, D / 2 + 0.06);
    group.add(sill);
  }

  // Side windows (right wall, both floors)
  for (let floor = 0; floor < 2; floor++) {
    const flH = floor === 0 ? floor1H : floor2H;
    const flBase = floor === 0 ? 0 : floor1H;
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.4), winMat);
    w.position.set(W / 2 + 0.04, baseH + flBase + flH * 0.55, 0);
    w.renderOrder = 1;
    group.add(w);
  }

  // ── DOUBLE ENTRANCE DOORS (cyan) ──
  for (const dx of [-0.55, 0.05]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.06), cyanMat);
    door.position.set(dx - 0.65 + 0.55 + 0.55, baseH + 0.56, D / 2 + 0.04);
    group.add(door);
    // Black handle
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.04), blackMat);
    handle.position.set(dx - 0.65 + 0.55 + 0.55 + (dx < 0 ? 0.18 : -0.18), baseH + 0.55, D / 2 + 0.08);
    group.add(handle);
  }
  // Door recess frame
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.18, 0.08), darkMat);
  doorFrame.position.set(-0.1, baseH + 0.6, D / 2 + 0.01);
  group.add(doorFrame);

  // ── BUG MUSEUM SIGN (above entrance) ──
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(W * 0.85, 0.32, 0.08), blackMat);
  signBoard.position.set(0, baseH + floor1H * 0.88, D / 2 + 0.08);
  group.add(signBoard);

  // "BUG MUSEUM" in cyan pixel letters (simplified: two rectangular blocks with gaps)
  const pixMat2 = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.7 });
  const ps = 0.022;
  const pstep = 0.028;
  // Letter pixel bitmaps (5x5)
  const B5 = [[1,1,0],[1,1,1],[1,1,0],[1,1,1],[1,1,0]];
  const U5 = [[1,0,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]];
  const G5 = [[0,1,1],[1,0,0],[1,0,1],[1,0,1],[0,1,1]];
  const M5 = [[1,0,1],[1,1,1],[1,1,1],[1,0,1],[1,0,1]];
  const E5 = [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,1,1]];
  const S5 = [[0,1,1],[1,0,0],[0,1,0],[0,0,1],[1,1,0]];
  const U2 = U5;
  const letters2 = [B5, U5, G5, M5, U2, S5, E5, U2, M5];
  const totalW2 = letters2.length * (3 * pstep + 0.012);
  const startX2 = -totalW2 / 2 + 1.5 * pstep;
  for (let li = 0; li < letters2.length; li++) {
    const lx = startX2 + li * (3 * pstep + 0.012);
    letters2[li].forEach((row, ri) => {
      row.forEach((on, ci) => {
        if (!on) return;
        const px = new THREE.Mesh(new THREE.BoxGeometry(ps, ps, 0.01), pixMat2);
        px.position.set(lx + ci * pstep, baseH + floor1H * 0.88 + 0.08 - ri * pstep, D / 2 + 0.13);
        group.add(px);
      });
    });
  }

  // ── CONCRETE BENCHES (flanking entrance) ──
  for (const bx of [-W / 2 + 0.5, W / 2 - 0.5]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.35), darkMat);
    bench.position.set(bx, 0.09, D / 2 + 0.5);
    bench.castShadow = true;
    bench.receiveShadow = true;
    group.add(bench);
  }

  // ── GEOMETRIC PLANTERS (black cubes with green bushes) ──
  for (const px of [-W / 2 + 1.0, W / 2 - 1.0]) {
    const planter = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), blackMat);
    planter.position.set(px, 0.16, D / 2 + 0.85);
    planter.castShadow = true;
    group.add(planter);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 6),
      new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.9 }));
    bush.position.set(px, 0.52, D / 2 + 0.85);
    bush.castShadow = true;
    group.add(bush);
  }

  // ── PIXELATED FLOATING CUBES (around entrance, glitchy) ──
  const cubeDefs = [
    { x: -1.4, y: 0.6, z: D / 2 + 0.8,  s: 0.22, m: magentaMat },
    { x:  1.3, y: 0.8, z: D / 2 + 0.9,  s: 0.18, m: cyanMat },
    { x: -1.6, y: 1.4, z: D / 2 + 0.5,  s: 0.28, m: cyanMat },
    { x:  1.5, y: 1.2, z: D / 2 + 0.4,  s: 0.20, m: magentaMat },
    { x: -1.2, y: 1.9, z: D / 2 + 0.7,  s: 0.16, m: magentaMat },
    { x:  1.1, y: 1.7, z: D / 2 + 0.6,  s: 0.24, m: cyanMat },
    { x: -0.7, y: 2.2, z: D / 2 + 1.0,  s: 0.14, m: cyanMat },
    { x:  0.6, y: 2.0, z: D / 2 + 1.1,  s: 0.20, m: magentaMat },
  ];
  for (const cd of cubeDefs) {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(cd.s, cd.s, cd.s), cd.m);
    cube.position.set(cd.x, cd.y, cd.z);
    cube.rotation.set(0.5 + cd.x, 0.8 + cd.y * 0.3, 0.3 + cd.z * 0.1);
    cube.castShadow = true;
    group.add(cube);
  }

  // ── INTERIOR FLOOR (visible through windows) ──
  const intFloor = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.04, D - 0.2), floorMat);
  intFloor.position.set(0, baseH + 0.04, 0);
  group.add(intFloor);

  // ── INTERIOR: BACK WALL PANEL "It Works On My Machine" ──
  const iwomPanel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.06), whiteMat);
  iwomPanel.position.set(-0.5, baseH + 1.0, -D / 2 + 0.08);
  group.add(iwomPanel);
  // Panel title pixel letters (tiny)
  const tinyMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
  for (let i = 0; i < 5; i++) {
    const pixRow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 0.02), tinyMat);
    pixRow.position.set(-0.8 + i * 0.09, baseH + 1.1, -D / 2 + 0.12);
    group.add(pixRow);
  }

  // ── INTERIOR: GLASS DISPLAY CASE (404 Fossil, center) ──
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.05,
    transparent: true, opacity: 0.15, roughness: 0.05,
  });
  // Case walls
  const caseGroup = new THREE.Group();
  // Front/back glass
  for (const cz of [-0.4, 0.4]) {
    const cg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.03), caseMat);
    cg.position.set(0.6, baseH + 0.4, cz);
    cg.renderOrder = 2;
    group.add(cg);
  }
  // Case frame (cyan)
  const caseFrame = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.58, 0.82), glowCyanMat);
  caseFrame.position.set(0.6, baseH + 0.42, 0);
  // Use wireframe-like approach with thin frame pieces
  for (const [fw, fh, fd, fx, fy, fz] of [
    [0.74, 0.03, 0.03, 0.6, baseH + 0.68, 0.38],
    [0.74, 0.03, 0.03, 0.6, baseH + 0.68, -0.38],
    [0.74, 0.03, 0.03, 0.6, baseH + 0.12, 0.38],
    [0.74, 0.03, 0.03, 0.6, baseH + 0.12, -0.38],
    [0.03, 0.58, 0.03, 0.97, baseH + 0.40, 0.38],
    [0.03, 0.58, 0.03, 0.23, baseH + 0.40, 0.38],
    [0.03, 0.58, 0.03, 0.97, baseH + 0.40, -0.38],
    [0.03, 0.58, 0.03, 0.23, baseH + 0.40, -0.38],
  ]) {
    const fr = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, fd), glowCyanMat);
    fr.position.set(fx, fy, fz);
    group.add(fr);
  }
  // 404 Fossil — pixelated error icon (magenta boxes inside case)
  for (const [ox, oy, oz] of [
    [-0.1, 0, 0],  [0, 0.08, 0],  [0.1, 0, 0],
    [-0.05, -0.08, 0],  [0.05, -0.08, 0],
  ]) {
    const fossil = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), magentaMat);
    fossil.position.set(0.6 + ox, baseH + 0.42 + oy, oz);
    group.add(fossil);
  }

  // ── INTERIOR: PEDESTAL + SEGFAULT SCULPTURE (left) ──
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.65, 0.25), concreteMat);
  pedestal.position.set(-0.9, baseH + 0.35, -0.3);
  group.add(pedestal);
  // Segfault Sculpture: twisted boxes
  for (const [sx, sy, sz, rz] of [
    [0, 0, 0, 0],
    [0.04, 0.12, 0, 0.4],
    [-0.04, 0.22, 0.02, -0.3],
    [0.06, 0.32, -0.02, 0.6],
  ]) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.06), chromeMat);
    seg.position.set(-0.9 + sx, baseH + 0.7 + sy, -0.3 + sz);
    seg.rotation.z = rz;
    seg.castShadow = true;
    group.add(seg);
  }

  // ── INTERIOR: CRT MONITOR (right side) ──
  const crtBody = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.3), beigeMat);
  crtBody.position.set(0.9, baseH + 0.58, 0.3);
  group.add(crtBody);
  // CRT screen glowing cyan
  const crtScreen = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.04), glowCyanMat);
  crtScreen.position.set(0.9, baseH + 0.6, 0.3 + 0.17);
  group.add(crtScreen);
  // CRT table
  const crtTable = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.45), darkMat);
  crtTable.position.set(0.9, baseH + 0.4, 0.3);
  group.add(crtTable);

  // ── INTERIOR: CEILING SPOTLIGHTS ──
  const spotY = baseH + floor1H - 0.06;
  for (const [sx, sz] of [[-0.7, -0.3], [0.5, 0], [0.9, 0.5]]) {
    const spotBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.18, 8), blackMat);
    spotBody.position.set(sx, spotY, sz);
    group.add(spotBody);
    // Warm glow downward
    const spotLight = createGlowOrb(0xfef3c7);
    spotLight.position.set(sx, spotY - 0.1, sz);
    group.add(spotLight);
  }

  // ── BRASS PLAQUES beside exhibits ──
  for (const [px, pz] of [[0.6, 0.55], [-0.65, -0.1], [0.65, 0.55]]) {
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.02), goldMat);
    plaque.position.set(px, baseH + 0.2, pz);
    group.add(plaque);
  }

  // ── INTERIOR LIGHT ──
  const glow = createGlowOrb(0xffffff);
  glow.position.set(0, baseH + floor1H * 0.7, 0);
  group.add(glow);

  // ── PLAQUE ANCHOR ──
  buildPlaque(group, building, D / 2 + 0.05, 4.0);
};

// ─── Custom Building: The Cinnamon Roll ────────────────────────────────────

CUSTOM_BUILDERS['the-cinnamon-roll'] = function (group, building) {
  const R      = 2.0;   // main roll radius
  const H      = 2.6;   // roll height
  const baseH  = 0.4;   // base platform height
  const baseR  = 2.35;  // base platform radius

  // ── MATERIALS ──
  const rollMat     = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.85 }); // Saddle Brown
  const rollLightMat = new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.8 }); // Tan highlight
  const frostMat    = new THREE.MeshStandardMaterial({ color: 0xF5E6D3, roughness: 0.6 });  // Cream frosting
  const caramelMat  = new THREE.MeshStandardMaterial({ color: 0xC19A6B, roughness: 0.85 }); // Caramel base
  const darkMat     = new THREE.MeshStandardMaterial({ color: 0x2d1810, roughness: 0.8 });  // Dark chocolate
  const signWoodMat = new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.9 });  // Sign wood
  const ironMat     = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 });  // Wrought iron
  const amberMat    = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.2, transparent: true, opacity: 0.85 });
  const herbMat     = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });
  const winMat      = new THREE.MeshStandardMaterial({
    color: 0xbfdbfe, emissive: 0x3b82f6, emissiveIntensity: 0.15,
    transparent: true, opacity: 0.35, roughness: 0.1,
  });

  // ── BASE PLATFORM (caramel plate) ──
  const base = new THREE.Mesh(new THREE.CylinderGeometry(baseR, baseR, baseH, 32), caramelMat);
  base.position.y = baseH / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // ── MAIN ROLL BODY ──
  const rollBody = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 32), rollMat);
  rollBody.position.y = baseH + H / 2;
  rollBody.castShadow = true;
  rollBody.receiveShadow = true;
  group.add(rollBody);

  // Top face (slightly lighter baked highlights)
  const rollTop = new THREE.Mesh(new THREE.CircleGeometry(R, 32), rollLightMat);
  rollTop.rotation.x = -Math.PI / 2;
  rollTop.position.y = baseH + H + 0.01;
  group.add(rollTop);

  // ── SPIRAL RIBBON (helix around exterior, 3.5 turns bottom→top) ──
  const spiralSegs  = 160;
  const turns       = 3.5;
  const ribW        = (2 * Math.PI * turns * R) / spiralSegs * 1.15; // slightly overlap
  const ribH        = 0.13;
  const ribD        = 0.1;
  const spiralMat   = new THREE.MeshStandardMaterial({ color: 0x5c2d0a, roughness: 0.9 });
  for (let i = 0; i < spiralSegs; i++) {
    const t     = i / spiralSegs;
    const angle = t * Math.PI * 2 * turns;
    const y     = baseH + 0.05 + t * (H - 0.1);
    const seg   = new THREE.Mesh(new THREE.BoxGeometry(ribW, ribH, ribD), spiralMat);
    seg.position.set(Math.cos(angle) * (R + ribD / 2), y, Math.sin(angle) * (R + ribD / 2));
    seg.rotation.y = angle + Math.PI / 2; // align width tangentially
    seg.castShadow = true;
    group.add(seg);
  }

  // ── FROSTING DRIPS (irregular cream blobs from top) ──
  const frostAngles = [0, 0.7, 1.4, 2.0, 2.6, 3.2, 3.9, 4.6, 5.2, 5.8, Math.PI, Math.PI * 1.5];
  const frostDropY  = [0, -0.18, -0.08, -0.24, -0.12, -0.20, -0.06, -0.22, -0.14, -0.10, -0.20, -0.16];
  for (let i = 0; i < frostAngles.length; i++) {
    const a  = frostAngles[i];
    const dy = frostDropY[i];
    const fr = R * 0.78 + (i % 3) * 0.06;
    // Top mound blob
    const blob = new THREE.Mesh(new THREE.SphereGeometry(0.28 + (i % 3) * 0.04, 8, 6), frostMat);
    blob.position.set(Math.cos(a) * fr, baseH + H + 0.12, Math.sin(a) * fr);
    group.add(blob);
    // Drip stretching down the side
    const drip = new THREE.Mesh(new THREE.SphereGeometry(0.15, 7, 6), frostMat);
    drip.scale.set(0.9, 1.7, 0.9);
    drip.position.set(Math.cos(a) * (R - 0.05), baseH + H + dy, Math.sin(a) * (R - 0.05));
    group.add(drip);
  }
  // Centre swirl rings on top
  for (let si = 0; si < 3; si++) {
    const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.45 - si * 0.14, 0.09 - si * 0.01, 6, 24), frostMat);
    swirl.rotation.x = Math.PI / 2;
    swirl.position.y = baseH + H + 0.06 + si * 0.07;
    group.add(swirl);
  }

  // ── ARCHED ENTRANCE (front face, carved into roll) ──
  const doorW = 0.72;
  const doorH = 1.1;
  const doorZ = R + 0.02;
  // Door frame uprights
  for (const dx of [-doorW / 2, doorW / 2]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, doorH, 0.07), darkMat);
    post.position.set(dx, baseH + doorH / 2, doorZ);
    group.add(post);
  }
  // Arch
  const arch = new THREE.Mesh(new THREE.TorusGeometry(doorW / 2 + 0.04, 0.055, 8, 16, Math.PI), darkMat);
  arch.position.set(0, baseH + doorH, doorZ);
  group.add(arch);
  // Glass door panel
  const glassDoor = new THREE.Mesh(new THREE.BoxGeometry(doorW - 0.04, doorH - 0.04, 0.04), winMat);
  glassDoor.position.set(0, baseH + doorH / 2, doorZ);
  glassDoor.renderOrder = 1;
  group.add(glassDoor);

  // ── CIRCULAR PORTHOLE WINDOWS (4 around the roll) ──
  const winR    = 0.28;
  const winRing = new THREE.MeshStandardMaterial({ color: 0x2d1810, roughness: 0.7 });
  for (const angle of [Math.PI / 4, -Math.PI / 4, Math.PI * 3 / 4, -Math.PI * 3 / 4]) {
    const wx = Math.cos(angle) * (R + 0.02);
    const wz = Math.sin(angle) * (R + 0.02);
    const win = new THREE.Mesh(new THREE.CircleGeometry(winR, 16), winMat);
    win.rotation.y = -angle;
    win.position.set(wx, baseH + H * 0.58, wz);
    group.add(win);
    const frame = new THREE.Mesh(new THREE.TorusGeometry(winR + 0.04, 0.04, 6, 20), winRing);
    frame.rotation.y = -angle;
    frame.position.set(wx, baseH + H * 0.58, wz);
    group.add(frame);
  }

  // ── CINNAMON STICK COLUMNS (flanking entrance) ──
  for (const sx of [-0.6, 0.6]) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.6, 8), rollMat);
    stick.position.set(sx, 0.8, R + 0.12);
    group.add(stick);
    // Horizontal groove rings
    for (let gi = 0; gi < 5; gi++) {
      const groove = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 4, 12), spiralMat);
      groove.rotation.x = Math.PI / 2;
      groove.position.set(sx, 0.22 + gi * 0.28, R + 0.12);
      group.add(groove);
    }
  }

  // ── STRIPED AWNING above entrance ──
  const awningGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.5, 14, 1, true, -Math.PI / 2, Math.PI);
  const awning = new THREE.Mesh(awningGeo, frostMat);
  awning.rotation.z = Math.PI / 2;
  awning.position.set(0, baseH + doorH + 0.35, R + 0.55);
  group.add(awning);
  // Tan stripes on awning
  const stripMat = new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.9 });
  for (let si = 0; si < 4; si++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.54), stripMat);
    stripe.position.set(-0.51 + si * 0.34, baseH + doorH + 0.35, R + 0.55);
    group.add(stripe);
  }

  // ── WOODEN SIGN (to the right of entrance, on two posts) ──
  const signX = 1.05;
  const signZ = R + 0.45;
  for (const sx of [0.7, 1.4]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6), signWoodMat);
    post.position.set(sx, 0.75, signZ);
    group.add(post);
  }
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.34, 0.07), signWoodMat);
  signBoard.position.set(signX, 1.38, signZ);
  group.add(signBoard);
  // Dark border on sign
  const signBorder = new THREE.Mesh(new THREE.BoxGeometry(0.89, 0.38, 0.04), darkMat);
  signBorder.position.set(signX, 1.38, signZ - 0.02);
  group.add(signBorder);
  // Text lines on sign
  for (const [tw, ty] of [[0.68, 0.07], [0.55, -0.07]]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.045, 0.02), darkMat);
    line.position.set(signX, 1.38 + ty, signZ + 0.055);
    group.add(line);
  }

  // ── STEAM VENTS on top of roll ──
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
  const steamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
  for (const [vx, vz] of [[-0.5, 0.3], [0.4, -0.35], [0.1, -0.65]]) {
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.38, 8), ventMat);
    vent.position.set(vx, baseH + H + 0.19, vz);
    group.add(vent);
    for (let s = 0; s < 2; s++) {
      const steam = new THREE.Mesh(new THREE.SphereGeometry(0.07 - s * 0.01, 6, 6), steamMat);
      steam.position.set(vx + s * 0.04, baseH + H + 0.44 + s * 0.14, vz);
      group.add(steam);
    }
  }

  // ── OUTDOOR BISTRO TABLES (3 on the caramel base) ──
  const tablePositions = [
    { x: -R - 0.68, z: 0.5 },
    { x: -R - 0.68, z: -0.5 },
    { x:  R + 0.68, z: -0.4 },
  ];
  for (const tp of tablePositions) {
    // Table top (amber glass)
    const tabTop = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 12), amberMat);
    tabTop.position.set(tp.x, baseH + 0.5, tp.z);
    group.add(tabTop);
    // Table leg
    const tabLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.5, 8), ironMat);
    tabLeg.position.set(tp.x, baseH + 0.25, tp.z);
    group.add(tabLeg);
    // 2 chairs around each table
    for (const ca of [0, Math.PI]) {
      const cx = tp.x + Math.cos(ca) * 0.43;
      const cz = tp.z + Math.sin(ca) * 0.43;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.22), ironMat);
      seat.position.set(cx, baseH + 0.33, cz);
      group.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.03), ironMat);
      back.position.set(cx, baseH + 0.46, cz + Math.cos(ca) * 0.11);
      group.add(back);
    }
  }

  // ── TERRACOTTA PLANTERS with herb bushes ──
  const planterMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });
  for (const [px, pz] of [[R + 0.9, 0.55], [R + 0.9, -0.55], [-R - 1.0, 0]]) {
    const planter = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.2, 8), planterMat);
    planter.position.set(px, baseH + 0.1, pz);
    group.add(planter);
    const herb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 6, 6), herbMat);
    herb.position.set(px, baseH + 0.29, pz);
    group.add(herb);
  }

  // ── INTERIOR (visible through porthole windows and glass door) ──
  // Interior warm back wall
  const intWallMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfbbf24, emissiveIntensity: 0.1 });
  const intBack = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.14, R - 0.14, H - 0.2, 32), intWallMat);
  intBack.position.y = baseH + H / 2;
  group.add(intBack);

  // Interior floor (caramel/honey wood)
  const intFloor = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.15, R - 0.15, 0.04, 32),
    new THREE.MeshStandardMaterial({ color: 0xC19A6B, roughness: 0.8 }));
  intFloor.position.y = baseH + 0.02;
  group.add(intFloor);

  // Display bakery case (against back wall)
  const caseMat = new THREE.MeshStandardMaterial({ color: 0x4a2e0e, roughness: 0.8 });
  const dCase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.5), caseMat);
  dCase.position.set(0, baseH + 0.3, -R * 0.5);
  group.add(dCase);
  const caseGlass = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 0.04), winMat);
  caseGlass.position.set(0, baseH + 0.35, -R * 0.5 + 0.27);
  caseGlass.renderOrder = 1;
  group.add(caseGlass);
  // Mini cinnamon rolls on display shelves
  for (let i = 0; i < 6; i++) {
    const mini = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 8), rollMat);
    mini.position.set(-0.35 + i * 0.14, baseH + 0.56, -R * 0.5);
    group.add(mini);
    const miniFrost = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.013, 4, 8), frostMat);
    miniFrost.rotation.x = Math.PI / 2;
    miniFrost.position.set(-0.35 + i * 0.14, baseH + 0.58, -R * 0.5);
    group.add(miniFrost);
  }

  // Coffee bar counter (L-shaped, dark walnut)
  const barMat = new THREE.MeshStandardMaterial({ color: 0x3b1a0e, roughness: 0.85 });
  const bar1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.3), barMat);
  bar1.position.set(-0.45, baseH + 0.25, -R * 0.38);
  group.add(bar1);
  const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.75), barMat);
  bar2.position.set(-0.95, baseH + 0.25, -R * 0.18);
  group.add(bar2);
  // Silver espresso machine on bar
  const machineMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc8, metalness: 0.6, roughness: 0.3 });
  const machine = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.16), machineMat);
  machine.position.set(-0.45, baseH + 0.61, -R * 0.38);
  group.add(machine);

  // Pendant lamps hanging from ceiling
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.55 });
  const cordMat = new THREE.MeshStandardMaterial({ color: 0x374151 });
  for (const [lx, lz, lh] of [[0.5, 0.4, H * 0.7], [-0.4, 0.3, H * 0.68], [0, -0.35, H * 0.72]]) {
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), lampMat);
    shade.position.set(lx, baseH + lh, lz);
    group.add(shade);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.38, 4), cordMat);
    cord.position.set(lx, baseH + lh + 0.19, lz);
    group.add(cord);
  }

  // Chalkboard menu on side wall
  const chalkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
  const chalkboard = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.82, 0.04), chalkMat);
  chalkboard.position.set(0.85, baseH + H * 0.5, -R * 0.72);
  group.add(chalkboard);
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xF5E6D3, roughness: 0.9 });
  for (let mi = 0; mi < 4; mi++) {
    const mline = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.02), lineMat);
    mline.position.set(0.85, baseH + H * 0.5 + 0.24 - mi * 0.14, -R * 0.72 + 0.03);
    group.add(mline);
  }

  // ── INTERIOR WARM GLOW ──
  const glow = createGlowOrb(0xfbbf24);
  glow.position.set(0, baseH + H * 0.5, 0);
  group.add(glow);

  // ── PLAQUE ANCHOR ──
  buildPlaque(group, building, R + 0.1, 2.8);
};

// ─── Custom Building: Bobby's House (Pineapple Under the Sea) ──────────────

CUSTOM_BUILDERS['bobbys-house'] = function (group, building) {
  // Color palette
  const PINEAPPLE_YELLOW  = 0xFFB627;
  const CROSSHATCH_ORANGE = 0xFF8C00;
  const LEAF_GREEN        = 0x7CB342;
  const WIN_TEAL          = 0x0288D1;
  const DOOR_AMBER        = 0xD97706;
  const ROCK_GRAY         = 0x78909C;
  const SNAIL_PINK        = 0xFF6B9D;
  const SNAIL_BODY_COLOR  = 0xFFE082;
  const CORAL_COLOR       = 0xFF7043;

  const bodyMat       = new THREE.MeshStandardMaterial({ color: PINEAPPLE_YELLOW, roughness: 0.6 });
  const xhatchMat     = new THREE.MeshStandardMaterial({ color: CROSSHATCH_ORANGE, roughness: 0.5 });
  const leafMat       = new THREE.MeshStandardMaterial({ color: LEAF_GREEN, roughness: 0.8 });
  const doorMat       = new THREE.MeshStandardMaterial({ color: DOOR_AMBER, roughness: 0.6 });
  const rockMat       = new THREE.MeshStandardMaterial({ color: ROCK_GRAY, roughness: 0.95 });
  const snailShellMat = new THREE.MeshStandardMaterial({ color: SNAIL_PINK, roughness: 0.6 });
  const snailBodyMat  = new THREE.MeshStandardMaterial({ color: SNAIL_BODY_COLOR, roughness: 0.7 });
  const torchMat      = new THREE.MeshStandardMaterial({ color: 0x7B4F2A, roughness: 0.9 });
  const flameMat      = new THREE.MeshStandardMaterial({ color: 0xFF6F00, emissive: 0xFF6F00, emissiveIntensity: 0.6 });
  const coralMat      = new THREE.MeshStandardMaterial({ color: CORAL_COLOR, roughness: 0.7 });
  const frameMat      = new THREE.MeshStandardMaterial({ color: WIN_TEAL, roughness: 0.5 });
  const goldMat       = new THREE.MeshStandardMaterial({ color: 0xD4A843, metalness: 0.6, roughness: 0.3 });
  const winMat        = new THREE.MeshStandardMaterial({
    color: 0xbfdbfe,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
  });

  // ── PINEAPPLE BODY (3 stacked cylinders for a bulbous look) ──
  const body0 = new THREE.Mesh(new THREE.CylinderGeometry(0.90, 0.82, 0.72, 14), bodyMat);
  body0.position.y = 0.36;
  body0.castShadow = true;
  body0.receiveShadow = true;
  group.add(body0);

  const body1 = new THREE.Mesh(new THREE.CylinderGeometry(0.80, 0.90, 0.88, 14), bodyMat);
  body1.position.y = 0.72 + 0.44;
  body1.castShadow = true;
  group.add(body1);

  const body2 = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.80, 0.70, 14), bodyMat);
  body2.position.y = 0.72 + 0.88 + 0.35;
  body2.castShadow = true;
  group.add(body2);

  const bodyTopY = 0.72 + 0.88 + 0.70; // ≈ 2.30

  // ── DIAMOND CROSSHATCH TEXTURE ──
  // Thin raised orange boxes in crisscross diagonals across the pineapple surface
  const crossLevels = [
    { y: 0.22, r: 0.84, n: 8 },
    { y: 0.62, r: 0.91, n: 9 },
    { y: 1.05, r: 0.88, n: 9 },
    { y: 1.50, r: 0.82, n: 8 },
    { y: 1.90, r: 0.66, n: 7 },
  ];
  for (const lv of crossLevels) {
    for (let i = 0; i < lv.n; i++) {
      const angle = (i / lv.n) * Math.PI * 2;
      const x = Math.sin(angle) * lv.r;
      const z = Math.cos(angle) * lv.r;
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.04), xhatchMat);
      b1.position.set(x, lv.y, z);
      b1.rotation.y = -angle;
      b1.rotation.z = 0.42;
      group.add(b1);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.04), xhatchMat);
      b2.position.set(x, lv.y, z);
      b2.rotation.y = -angle;
      b2.rotation.z = -0.42;
      group.add(b2);
    }
  }

  // ── SPIKY LEAF CROWN ──
  const tilt = Math.PI / 5.5;
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.7, 5), leafMat);
    leaf.position.set(Math.sin(angle) * 0.3, bodyTopY + 0.85, Math.cos(angle) * 0.3);
    leaf.rotation.x = Math.cos(angle) * tilt;
    leaf.rotation.z = -Math.sin(angle) * tilt;
    leaf.castShadow = true;
    group.add(leaf);
  }
  // Inner shorter leaves for layered look
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.10, 1.2, 5), leafMat);
    leaf.position.set(Math.sin(angle) * 0.15, bodyTopY + 0.60, Math.cos(angle) * 0.15);
    leaf.rotation.x = Math.cos(angle) * tilt * 0.6;
    leaf.rotation.z = -Math.sin(angle) * tilt * 0.6;
    leaf.castShadow = true;
    group.add(leaf);
  }
  // Central upright leaf
  const centerLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.11, 1.9, 5), leafMat);
  centerLeaf.position.y = bodyTopY + 0.95;
  group.add(centerLeaf);

  // ── PORTHOLE WINDOWS ──
  const w1Angle = Math.atan2(-0.32, 0.78);
  const win1 = new THREE.Mesh(new THREE.CircleGeometry(0.27, 16), winMat);
  win1.position.set(-0.32, 1.15, 0.78);
  win1.rotation.y = w1Angle;
  group.add(win1);
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 8, 20), frameMat);
  ring1.position.set(-0.32, 1.15, 0.78);
  ring1.rotation.y = w1Angle;
  group.add(ring1);

  const w2Angle = Math.atan2(0.28, 0.58);
  const win2 = new THREE.Mesh(new THREE.CircleGeometry(0.23, 16), winMat);
  win2.position.set(0.28, 2.05, 0.58);
  win2.rotation.y = w2Angle;
  group.add(win2);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 20), frameMat);
  ring2.position.set(0.28, 2.05, 0.58);
  ring2.rotation.y = w2Angle;
  group.add(ring2);

  // ── ARCHED DOORWAY ──
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.90, 0.06), doorMat);
  door.position.set(0, 0.45, 0.89);
  group.add(door);

  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.055, 7, 12, Math.PI), doorMat);
  arch.position.set(0, 0.90, 0.89);
  group.add(arch);

  // Small porthole in door
  const doorWin = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), winMat);
  doorWin.position.set(0, 0.72, 0.92);
  group.add(doorWin);
  const doorWinRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 14), frameMat);
  doorWinRing.position.set(0, 0.72, 0.92);
  group.add(doorWinRing);

  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), goldMat);
  handle.position.set(0.18, 0.45, 0.93);
  group.add(handle);

  // ── RIVER ROCK STEPS ──
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28 - i * 0.04, 0.29 - i * 0.04, 0.09, 10),
      rockMat
    );
    step.position.set(0, i * 0.09 + 0.045, 0.88 + (3 - i) * 0.22);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  }

  // ── TIKI TORCHES ──
  for (const tx of [-0.72, 0.72]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.15, 6), torchMat);
    pole.position.set(tx, 0.575, 0.65);
    pole.castShadow = true;
    group.add(pole);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.12, 8), torchMat);
    cup.position.set(tx, 1.22, 0.65);
    group.add(cup);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 6), flameMat);
    flame.position.set(tx, 1.40, 0.65);
    group.add(flame);
    const torchLight = createGlowOrb(0xFF8C00);
    torchLight.position.set(tx, 1.4, 0.7);
    group.add(torchLight);
  }

  // ── CORAL FORMATIONS ──
  const coralSpots = [
    { x: -1.1, z: 0.4 }, { x: 1.1, z: 0.3 }, { x: -0.9, z: -0.7 },
    { x: 0.85, z: -0.8 }, { x: 0.1, z: -1.1 }, { x: -0.4, z: 1.0 },
  ];
  for (const cp of coralSpots) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.38, 5), coralMat);
    stem.position.set(cp.x, 0.19, cp.z);
    group.add(stem);
    for (const [bx, bz, rot] of [[0.1, 0, 0.55], [-0.1, 0, -0.55], [0, 0.08, 0.45]]) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.22, 4), coralMat);
      br.position.set(cp.x + bx, 0.44, cp.z + bz);
      br.rotation.z = rot;
      group.add(br);
    }
  }

  // ── PET SNAIL ──
  const sx = 1.2, sz = 0.85;

  // Slug-shaped body
  const snailBody = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), snailBodyMat);
  snailBody.scale.set(1.9, 0.55, 1.0);
  snailBody.position.set(sx, 0.10, sz);
  group.add(snailBody);

  // Head
  const snailHead = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), snailBodyMat);
  snailHead.position.set(sx + 0.27, 0.18, sz);
  group.add(snailHead);

  // Shell (sphere with spiral rings for texture)
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), snailShellMat);
  shell.scale.y = 0.85;
  shell.position.set(sx - 0.05, 0.25, sz);
  group.add(shell);

  const spiralPaleMat = new THREE.MeshStandardMaterial({ color: 0xFFB3C8, roughness: 0.6 });
  for (let s = 0; s < 3; s++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.19 - s * 0.045, 0.022, 6, 14),
      s % 2 === 0 ? snailShellMat : spiralPaleMat
    );
    ring.position.set(sx - 0.05, 0.25 + s * 0.055, sz);
    ring.rotation.x = s * 0.28;
    group.add(ring);
  }

  // Antennae stalks with googly eye-ball tips
  const antennaeData = [
    { dz: -0.07, tz: 0.28 },
    { dz:  0.07, tz: -0.28 },
  ];
  const eyeMat   = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  const shineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  for (const ant of antennaeData) {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.20, 4), snailBodyMat);
    stalk.position.set(sx + 0.32, 0.30, sz + ant.dz);
    stalk.rotation.z = ant.tz;
    group.add(stalk);
    const eyeTipX = sx + 0.32 + Math.sin(ant.tz) * 0.10;
    const eyeTipY = 0.41;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), eyeMat);
    eye.position.set(eyeTipX, eyeTipY, sz + ant.dz);
    group.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.012, 4, 4), shineMat);
    shine.position.set(eyeTipX + 0.01, eyeTipY + 0.01, sz + ant.dz);
    group.add(shine);
  }

  // ── INTERIOR WARM GLOW ──
  const interiorGlow = createGlowOrb(0xFFC107);
  interiorGlow.position.set(0, 1.2, 0);
  group.add(interiorGlow);

  // ── PLAQUE ANCHOR ──
  buildPlaque(group, building, 0.92, 3.4);
};

// ─── Custom Building: Hot Yoga, Studio Charlie ─────────────────────────────

CUSTOM_BUILDERS['hot-yoga-studio-charlie'] = function (group, building) {
  const W     = 3.6;   // width (front face)
  const D     = 2.8;   // depth (front to back)
  const wallH = 2.8;   // wall height
  const parH  = 0.18;  // parapet height
  const baseH = 0.1;   // foundation

  // ── MATERIALS ──────────────────────────────────────────────────────────────
  const stuccoMat  = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.85, emissive: 0xffffff, emissiveIntensity: 0.03 });
  const bronzeMat  = new THREE.MeshStandardMaterial({ color: 0x7c6545, metalness: 0.5, roughness: 0.5 });
  const roofMat    = new THREE.MeshStandardMaterial({ color: 0xe8e2d8, roughness: 0.9 });
  const woodMat    = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
  const brickMat   = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.95 });
  const stoneMat   = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95 });
  const rivRockMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });
  const trunkMat   = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });
  const greenMat   = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
  const ltGreenMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.9 });
  const purpleMat  = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.8 });
  const pinkMat    = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.8 });
  const matMat     = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.85 });
  const goldMat    = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.4, roughness: 0.3, emissive: 0xfbbf24, emissiveIntensity: 0.2 });
  const fairyMat   = new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfbbf24, emissiveIntensity: 0.55 });
  const candleMat  = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.6 });
  const winMat     = new THREE.MeshStandardMaterial({ color: 0xbfdbfe, emissive: 0x3b82f6, emissiveIntensity: 0.15, transparent: true, opacity: 0.35, roughness: 0.1 });
  const skyMat     = new THREE.MeshStandardMaterial({ color: 0xbfdbfe, emissive: 0x93c5fd, emissiveIntensity: 0.2, transparent: true, opacity: 0.4, roughness: 0.1 });
  const lampMat    = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xfbbf24, emissiveIntensity: 0.3, transparent: true, opacity: 0.7 });

  // ── FOUNDATION ──────────────────────────────────────────────────────────────
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, baseH, D + 0.2), stoneMat);
  base.position.y = baseH / 2;
  base.receiveShadow = true;
  group.add(base);

  // ── CORNER POSTS (creamy stucco with mica sparkle) ──────────────────────────
  for (const [cx, cz] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, wallH, 0.2), stuccoMat);
    post.position.set(cx, baseH + wallH / 2, cz);
    post.castShadow = true;
    group.add(post);
  }

  // ── FLOOR-TO-CEILING WINDOWS ────────────────────────────────────────────────
  const doorW = 0.85;
  const sideWinW = (W - doorW) / 2 - 0.15;

  // Front face — two side windows flanking the door
  for (const side of [-1, 1]) {
    const wx = side * (doorW / 2 + sideWinW / 2 + 0.05);
    const win = new THREE.Mesh(new THREE.BoxGeometry(sideWinW, wallH - 0.08, 0.07), winMat);
    win.position.set(wx, baseH + wallH / 2, D / 2 + 0.04);
    group.add(win);
    // Bronze frame dividers
    for (const fx of [wx - sideWinW / 2, wx + sideWinW / 2]) {
      const fv = new THREE.Mesh(new THREE.BoxGeometry(0.05, wallH, 0.07), bronzeMat);
      fv.position.set(fx, baseH + wallH / 2, D / 2 + 0.04);
      group.add(fv);
    }
    const fh = new THREE.Mesh(new THREE.BoxGeometry(sideWinW + 0.05, 0.05, 0.07), bronzeMat);
    fh.position.set(wx, baseH + wallH - 0.04, D / 2 + 0.04);
    group.add(fh);
  }

  // Back face — full-width window
  const backWin = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, wallH - 0.08, 0.07), winMat);
  backWin.position.set(0, baseH + wallH / 2, -D / 2 - 0.04);
  group.add(backWin);
  for (const fx of [-W / 3, 0, W / 3]) {
    const fv = new THREE.Mesh(new THREE.BoxGeometry(0.05, wallH, 0.07), bronzeMat);
    fv.position.set(fx, baseH + wallH / 2, -D / 2 - 0.04);
    group.add(fv);
  }

  // Side windows (left and right)
  for (const side of [-1, 1]) {
    const sx = side * (W / 2 + 0.04);
    const sWin = new THREE.Mesh(new THREE.BoxGeometry(0.07, wallH - 0.08, D - 0.2), winMat);
    sWin.position.set(sx, baseH + wallH / 2, 0);
    group.add(sWin);
    // Vertical divider in the middle
    const sMid = new THREE.Mesh(new THREE.BoxGeometry(0.06, wallH, 0.05), bronzeMat);
    sMid.position.set(sx, baseH + wallH / 2, 0);
    group.add(sMid);
  }

  // ── DOUBLE GLASS DOORS ──────────────────────────────────────────────────────
  const doorGlassMat = new THREE.MeshStandardMaterial({ color: 0xbfdbfe, emissive: 0x60a5fa, emissiveIntensity: 0.2, transparent: true, opacity: 0.5, roughness: 0.1 });
  const doorH2 = wallH * 0.82;
  for (const dx of [-doorW / 4, doorW / 4]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(doorW / 2 - 0.04, doorH2, 0.07), doorGlassMat);
    door.position.set(dx, baseH + doorH2 / 2, D / 2 + 0.04);
    group.add(door);
    // Handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.16, 6), bronzeMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(dx > 0 ? dx - 0.14 : dx + 0.14, baseH + doorH2 * 0.45, D / 2 + 0.09);
    group.add(handle);
  }
  // Door transom frame
  const transom = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.1, 0.05, 0.08), bronzeMat);
  transom.position.set(0, baseH + doorH2, D / 2 + 0.04);
  group.add(transom);

  // ── FLAT ROOF WITH PARAPET ──────────────────────────────────────────────────
  const roof = new THREE.Mesh(new THREE.BoxGeometry(W + 0.28, 0.16, D + 0.28), roofMat);
  roof.position.y = baseH + wallH + 0.08;
  roof.castShadow = true;
  group.add(roof);
  // Parapet walls
  const parapetData = [
    { w: W + 0.28, d: 0.16, x: 0, z:  D / 2 + 0.14 },
    { w: W + 0.28, d: 0.16, x: 0, z: -D / 2 - 0.14 },
    { w: 0.16, d: D + 0.28, x:  W / 2 + 0.14, z: 0 },
    { w: 0.16, d: D + 0.28, x: -W / 2 - 0.14, z: 0 },
  ];
  for (const p of parapetData) {
    const par = new THREE.Mesh(new THREE.BoxGeometry(p.w, parH, p.d), roofMat);
    par.position.set(p.x, baseH + wallH + 0.16 + parH / 2, p.z);
    group.add(par);
  }

  // ── SKYLIGHTS (3 circular on roof) ──────────────────────────────────────────
  for (let i = -1; i <= 1; i++) {
    const sky = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.07, 14), skyMat);
    sky.position.set(i * W / 3.4, baseH + wallH + 0.19, 0);
    group.add(sky);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.04, 6, 14), bronzeMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(i * W / 3.4, baseH + wallH + 0.2, 0);
    group.add(rim);
  }

  // ── GOLD SIGN "STUDIO CHARLIE" ───────────────────────────────────────────────
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 0.07), goldMat);
  sign.position.set(0, baseH + wallH - 0.26, D / 2 + 0.1);
  group.add(sign);

  // ── ENTRY STEPS ─────────────────────────────────────────────────────────────
  for (let i = 0; i < 2; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.22), stoneMat);
    step.position.set(0, 0.05 + i * 0.1, D / 2 + 0.3 + i * 0.18);
    group.add(step);
  }

  // ── WISTERIA CASCADING FROM ROOF ────────────────────────────────────────────
  // Roof-edge planter (front)
  const wPlanter = new THREE.Mesh(new THREE.BoxGeometry(W - 0.28, 0.14, 0.18), stuccoMat);
  wPlanter.position.set(0, baseH + wallH + 0.23, D / 2 + 0.05);
  group.add(wPlanter);

  // Hanging clusters — deterministic positions
  const wisteriaDrops = [
    { x: -1.4, drop: 0.9 }, { x: -1.0, drop: 1.2 }, { x: -0.6, drop: 1.5 },
    { x: -0.3, drop: 1.7 }, { x:  0.0, drop: 1.9 }, { x:  0.3, drop: 1.7 },
    { x:  0.6, drop: 1.5 }, { x:  1.0, drop: 1.2 }, { x:  1.4, drop: 0.9 },
  ];
  for (const w of wisteriaDrops) {
    const buds = Math.round(4 + w.drop * 4);
    for (let j = 0; j < buds; j++) {
      const bud = new THREE.Mesh(new THREE.SphereGeometry(0.065 + (j % 2) * 0.025, 5, 4), purpleMat);
      bud.position.set(
        w.x + (j % 3 - 1) * 0.07,
        baseH + wallH + 0.18 - (j / buds) * w.drop,
        D / 2 + 0.04 + (j % 2) * 0.05
      );
      group.add(bud);
    }
  }
  // Side wisteria on right wall top
  for (let j = 0; j < 10; j++) {
    const bud = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), purpleMat);
    bud.position.set(W / 2 + 0.05, baseH + wallH - j * 0.2, D / 2 - j * 0.12);
    group.add(bud);
  }

  // ── BOUGAINVILLEA on left wall ───────────────────────────────────────────────
  const bougData = [
    { t: 0.05, off: 0 }, { t: 0.15, off: -0.1 }, { t: 0.25, off: 0.12 },
    { t: 0.35, off: -0.05 }, { t: 0.45, off: 0.08 }, { t: 0.55, off: -0.1 },
    { t: 0.65, off: 0.06 }, { t: 0.75, off: -0.08 }, { t: 0.85, off: 0.1 },
    { t: 0.95, off: -0.05 }, { t: 0.3, off: 0.15 }, { t: 0.7, off: -0.12 },
    { t: 0.5, off: 0.18 }, { t: 0.1, off: -0.15 }, { t: 0.9, off: 0.06 },
  ];
  for (const b of bougData) {
    const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.07 + (Math.floor(b.off * 10) % 2) * 0.03, 5, 4), pinkMat);
    bloom.position.set(-W / 2 - 0.05, baseH + b.t * wallH * 1.05, -D / 2 + b.t * D + b.off);
    group.add(bloom);
    if (Math.floor(b.t * 10) % 3 === 0) {
      const vine = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.03), greenMat);
      vine.position.set(-W / 2 - 0.05, baseH + b.t * wallH * 0.9, -D / 2 + b.t * D);
      group.add(vine);
    }
  }

  // ── FAIRY LIGHTS ────────────────────────────────────────────────────────────
  // Along front roofline
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.024, 4, 3), fairyMat);
    bulb.position.set(-W / 2 + 0.1 + t * (W - 0.2), baseH + wallH + 0.12 - Math.sin(t * Math.PI) * 0.1, D / 2 + 0.12);
    group.add(bulb);
  }
  // Woven through wisteria
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.024, 4, 3), fairyMat);
    bulb.position.set(-W / 2 + 0.3 + t * (W - 0.6), baseH + wallH - 0.15 - Math.sin(t * Math.PI * 2) * 0.25, D / 2 + 0.14);
    group.add(bulb);
  }

  // ── ROCK GARDEN FOUNTAIN (right of entrance) ────────────────────────────────
  const fX = W / 2 - 0.15;
  const fZ = D / 2 + 0.7;
  // Stone basin
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.1, 14), stoneMat);
  basin.position.set(fX, 0.05, fZ);
  group.add(basin);
  // River rocks
  for (const [rx, rz, rs] of [[0, 0, 0.16], [-0.13, 0.1, 0.13], [0.11, -0.1, 0.14]]) {
    const rock = new THREE.Mesh(new THREE.SphereGeometry(rs, 7, 5), rivRockMat);
    rock.scale.y = 0.65;
    rock.position.set(fX + rx, 0.1 + rs * 0.4, fZ + rz);
    group.add(rock);
  }
  // Succulents around basin
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const succ = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.11, 5), ltGreenMat);
    succ.position.set(fX + Math.cos(ang) * 0.46, 0.055, fZ + Math.sin(ang) * 0.46);
    group.add(succ);
  }
  // Quartz crystals
  const xtalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.0, metalness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.08 });
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2 + 0.4;
    const xtal = new THREE.Mesh(new THREE.OctahedronGeometry(0.065), xtalMat);
    xtal.position.set(fX + Math.cos(ang) * 0.34, 0.065, fZ + Math.sin(ang) * 0.34);
    group.add(xtal);
  }

  // ── ENTRANCE PLANTERS ────────────────────────────────────────────────────────
  for (const px of [-(doorW / 2 + 0.22), doorW / 2 + 0.22]) {
    const planter = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.52, 0.26), stuccoMat);
    planter.position.set(px, 0.26, D / 2 + 0.16);
    group.add(planter);
    // Wisteria sprigs
    for (let i = 0; i < 5; i++) {
      const bud = new THREE.Mesh(new THREE.SphereGeometry(0.055, 5, 4), purpleMat);
      bud.position.set(px + (i % 2 - 0.5) * 0.09, 0.55 + i * 0.1, D / 2 + 0.1);
      group.add(bud);
    }
  }

  // ── WINDOW BOXES WITH ORCHIDS ────────────────────────────────────────────────
  for (const wx of [-W / 2 + 0.52, W / 2 - 0.52]) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.16), stuccoMat);
    box.position.set(wx, baseH + 0.07, D / 2 + 0.1);
    group.add(box);
    for (let i = 0; i < 4; i++) {
      const orchid = new THREE.Mesh(new THREE.SphereGeometry(0.038, 5, 4), new THREE.MeshStandardMaterial({ color: 0xfae8ff }));
      orchid.position.set(wx - 0.18 + i * 0.12, baseH + 0.2, D / 2 + 0.1);
      group.add(orchid);
    }
  }

  // ── INTERIOR — WOOD FLOOR ────────────────────────────────────────────────────
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W - 0.22, 0.07, D - 0.22), woodMat);
  floor.position.y = baseH + 0.035;
  floor.receiveShadow = true;
  group.add(floor);

  // ── INTERIOR — EXPOSED BRICK BACK WALL ──────────────────────────────────────
  const brickWall = new THREE.Mesh(new THREE.BoxGeometry(W - 0.22, wallH - 0.1, 0.1), brickMat);
  brickWall.position.set(0, baseH + (wallH - 0.1) / 2, -D / 2 + 0.08);
  group.add(brickWall);
  // Brick row detail
  for (let row = 0; row < 6; row++) {
    const mortar = new THREE.Mesh(new THREE.BoxGeometry(W - 0.22, 0.04, 0.11), new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 1.0 }));
    mortar.position.set(0, baseH + 0.25 + row * 0.4, -D / 2 + 0.09);
    group.add(mortar);
  }

  // ── INTERIOR — YOGA MATS (4×4) ──────────────────────────────────────────────
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const mat = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.02, 0.22), matMat);
      mat.position.set(-0.72 + col * 0.48, baseH + 0.07, -0.6 + row * 0.42);
      group.add(mat);
    }
  }

  // ── INTERIOR — TROPICAL PLANTS ──────────────────────────────────────────────
  const plantPos = [
    [-W / 2 + 0.22, -D / 2 + 0.28], [W / 2 - 0.22, -D / 2 + 0.28],
    [-W / 2 + 0.22,  D / 2 - 0.45], [W / 2 - 0.22,  D / 2 - 0.45],
    [0, -D / 2 + 0.28],
  ];
  for (const [px, pz] of plantPos) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.048, 0.65, 6), trunkMat);
    trunk.position.set(px, baseH + 0.325, pz);
    group.add(trunk);
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5), greenMat);
    foliage.scale.y = 0.65;
    foliage.position.set(px, baseH + 0.78, pz);
    group.add(foliage);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 5), ltGreenMat);
    tip.position.set(px, baseH + 0.95, pz);
    group.add(tip);
  }

  // ── INTERIOR — PENDANT LAMPS ────────────────────────────────────────────────
  const lampPos = [[-0.75, -0.55], [0.75, -0.55], [-0.75, 0.55], [0.75, 0.55], [0, 0]];
  for (const [lx, lz] of lampPos) {
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.2, 8), lampMat);
    shade.rotation.x = Math.PI;
    shade.position.set(lx, baseH + wallH - 0.42, lz);
    group.add(shade);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.42, 4), bronzeMat);
    cord.position.set(lx, baseH + wallH - 0.21, lz);
    group.add(cord);
    const glow = createGlowOrb(0xfbbf24);
    glow.position.set(lx, baseH + wallH - 0.5, lz);
    group.add(glow);
  }

  // ── INTERIOR — CANDLES IN BRICK NICHES ──────────────────────────────────────
  for (let i = 0; i < 4; i++) {
    const cx = -W / 2 + 0.38 + i * 0.72;
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.065, 5), new THREE.MeshStandardMaterial({ color: 0xfef3c7 }));
    candle.position.set(cx, baseH + wallH * 0.5, -D / 2 + 0.14);
    group.add(candle);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.018, 4, 3), candleMat);
    flame.scale.y = 1.4;
    flame.position.set(cx, baseH + wallH * 0.5 + 0.05, -D / 2 + 0.14);
    group.add(flame);
  }

  // ── CRYSTALS / SUN CATCHERS IN WINDOWS ──────────────────────────────────────
  const crystalPalette = [0xff00ff, 0x00ffff, 0xffff00, 0xff80ff, 0x80ffff, 0xfff080];
  const crystalPositions = [
    [-W / 2 + 0.25, wallH * 0.68, 0], [W / 2 - 0.25, wallH * 0.68, 0],
    [0, wallH * 0.68, -D / 2 + 0.1], [0, wallH * 0.68, D / 2 - 0.1],
    [-W / 2 + 0.7, wallH * 0.55, D / 2 - 0.1], [W / 2 - 0.7, wallH * 0.55, D / 2 - 0.1],
  ];
  for (let i = 0; i < crystalPositions.length; i++) {
    const [cx, cy, cz] = crystalPositions[i];
    const xtal = new THREE.Mesh(
      i % 2 === 0 ? new THREE.OctahedronGeometry(0.075) : new THREE.TetrahedronGeometry(0.085),
      new THREE.MeshStandardMaterial({ color: crystalPalette[i], transparent: true, opacity: 0.28, roughness: 0.0, emissive: crystalPalette[i], emissiveIntensity: 0.14 })
    );
    xtal.position.set(cx, baseH + cy, cz);
    xtal.rotation.y = i * 0.8;
    group.add(xtal);
  }

  // ── MIST AT DOORWAY ──────────────────────────────────────────────────────────
  for (let i = 0; i < 4; i++) {
    const mist = new THREE.Mesh(
      new THREE.SphereGeometry(0.11 + i * 0.04, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 - i * 0.01 })
    );
    mist.position.set((i % 2 === 0 ? 0.14 : -0.14), baseH + 0.18 + i * 0.13, D / 2 + 0.3);
    group.add(mist);
  }

  // ── WARM AMBIENT GLOW ────────────────────────────────────────────────────────
  const warmGlow = createGlowOrb(0xfbbf24);
  warmGlow.position.set(0, baseH + wallH * 0.4, 0);
  group.add(warmGlow);

  // ── CONTRIBUTOR PLAQUE ────────────────────────────────────────────────────────
  buildPlaque(group, building, D / 2 + 0.12, 2.4);
};

// ─── Custom Building: Motz Coffee Co. & Roastery ───────────────────────────

CUSTOM_BUILDERS['motz-coffee-co'] = function (group, building) {
  const W = 3.6;        // width
  const D = 2.2;        // depth
  const wallH = 2.2;    // wall height
  const baseH = 0.1;    // foundation height

  // Materials
  const facadeMat   = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });  // matte black
  const brassMat    = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.5, roughness: 0.4 });
  const walnutMat   = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.85 });
  const chromeMat   = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.7, roughness: 0.3 });
  const copperMat   = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.5, roughness: 0.5 });
  const burlMat     = new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 0.9 });
  const roasterMat  = new THREE.MeshStandardMaterial({ color: 0xcc2200, roughness: 0.7 });
  const floorMat    = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 });
  const interiorMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0e, emissive: 0xf59e0b, emissiveIntensity: 0.12, roughness: 0.9 });
  const winMat      = new THREE.MeshStandardMaterial({
    color: 0xbfdbfe, emissive: 0x3b82f6, emissiveIntensity: 0.15,
    transparent: true, opacity: 0.35, roughness: 0.1,
  });
  const chalkMat    = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
  const neonMat     = new THREE.MeshStandardMaterial({ color: 0x00d9ff, emissive: 0x00d9ff, emissiveIntensity: 0.9 });
  const plantMat    = new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.9 });
  const potMat      = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });

  // ── FOUNDATION ──
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, baseH, D + 0.2), new THREE.MeshStandardMaterial({ color: 0x333333 }));
  base.position.y = baseH / 2;
  base.receiveShadow = true;
  group.add(base);

  // ── MAIN WALLS (matte black) ──
  const walls = new THREE.Mesh(new THREE.BoxGeometry(W, wallH, D), facadeMat);
  walls.position.y = baseH + wallH / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // ── FLAT ROOF with slight overhang ──
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.12, D + 0.3), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 }));
  roofSlab.position.y = baseH + wallH + 0.06;
  roofSlab.castShadow = true;
  group.add(roofSlab);

  // ── BRASS KICKPLATE along facade base ──
  const kickplate = new THREE.Mesh(new THREE.BoxGeometry(W + 0.02, 0.18, 0.05), brassMat);
  kickplate.position.set(0, baseH + 0.09, D / 2 + 0.03);
  group.add(kickplate);

  // ── INTERIOR warm back wall (glows amber, visible through windows) ──
  const intWall = new THREE.Mesh(new THREE.BoxGeometry(W - 0.3, wallH - 0.3, 0.04), interiorMat);
  intWall.position.set(0, baseH + wallH / 2, -D / 2 + 0.12);
  group.add(intWall);

  // ── INTERIOR FLOOR ──
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.04, D - 0.2), floorMat);
  floor.position.set(0, baseH + 0.02, 0);
  group.add(floor);

  // ── THREE LARGE FRONT WINDOWS with brass frames ──
  const winH = 1.6;
  const winW = 0.85;
  const winY = baseH + 0.28 + winH / 2;
  const winXPositions = [-1.1, 0, 1.1];

  for (const wx of winXPositions) {
    // Brass outer frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.1, winH + 0.1, 0.06), brassMat);
    frame.position.set(wx, winY, D / 2 + 0.02);
    group.add(frame);
    // Glass
    const glass = new THREE.Mesh(new THREE.BoxGeometry(winW, winH, 0.05), winMat);
    glass.position.set(wx, winY, D / 2 + 0.03);
    group.add(glass);
    // Brass window divider (horizontal)
    const divH = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.06, 0.04, 0.07), brassMat);
    divH.position.set(wx, winY + 0.2, D / 2 + 0.035);
    group.add(divH);
  }

  // ── ENTRY DOOR (between left and center windows) ──
  const doorX = -0.55;
  const doorW = 0.48;
  const doorH = 1.2;
  const doorMat2 = new THREE.MeshStandardMaterial({
    color: 0x111111, emissive: 0x1a1a1a, emissiveIntensity: 0.05,
    transparent: true, opacity: 0.65, roughness: 0.1,
  });
  const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.05), doorMat2);
  door.position.set(doorX, baseH + doorH / 2 + 0.02, D / 2 + 0.03);
  group.add(door);
  // Brass door frame
  const dFrameTop = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.08, 0.05, 0.06), brassMat);
  dFrameTop.position.set(doorX, baseH + doorH + 0.05, D / 2 + 0.03);
  group.add(dFrameTop);
  for (const sx of [-1, 1]) {
    const dFrameSide = new THREE.Mesh(new THREE.BoxGeometry(0.05, doorH + 0.05, 0.06), brassMat);
    dFrameSide.position.set(doorX + sx * (doorW / 2 + 0.025), baseH + doorH / 2 + 0.02, D / 2 + 0.03);
    group.add(dFrameSide);
  }
  // Brass push bar
  const pushBar = new THREE.Mesh(new THREE.BoxGeometry(doorW * 0.7, 0.03, 0.04), brassMat);
  pushBar.position.set(doorX, baseH + doorH * 0.48, D / 2 + 0.06);
  group.add(pushBar);

  // ── SIGN BAND above windows — matte black with brass letters hint ──
  const signBand = new THREE.Mesh(new THREE.BoxGeometry(W, 0.35, 0.06), facadeMat);
  signBand.position.set(0, baseH + wallH - 0.18, D / 2 + 0.04);
  group.add(signBand);
  // Brass sign text represented as thin rectangular bars
  const letterOffsets = [-1.3, -0.9, -0.5, -0.1, 0.3, 0.7, 1.1, 1.3];
  for (const lx of letterOffsets) {
    const letter = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.04), brassMat);
    letter.position.set(lx, baseH + wallH - 0.18, D / 2 + 0.08);
    group.add(letter);
  }

  // ── NEON SIDE SIGN (left wall, vertical, cyan glow) ──
  const neonGeo = new THREE.BoxGeometry(0.08, 1.4, 0.07);
  const neonSign = new THREE.Mesh(neonGeo, neonMat);
  neonSign.position.set(-W / 2 - 0.04, baseH + wallH * 0.55, D / 2 - 0.5);
  group.add(neonSign);
  // Neon brackets
  for (const ny of [0.3, -0.3]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.03), brassMat);
    bracket.position.set(-W / 2 + 0.04, baseH + wallH * 0.55 + ny, D / 2 - 0.5);
    group.add(bracket);
  }
  // Neon glow light
  const neonGlow = createGlowOrb(0x00d9ff);
  neonGlow.position.set(-W / 2 - 0.1, baseH + wallH * 0.55, D / 2 - 0.5);
  group.add(neonGlow);

  // ── COPPER CHIMNEY (back-right corner, for roaster exhaust) ──
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.9, 8), copperMat);
  chimney.position.set(W / 2 - 0.45, baseH + wallH + 0.51, -D / 2 + 0.45);
  chimney.castShadow = true;
  group.add(chimney);
  // Chimney cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.11, 0.06, 8), copperMat);
  cap.position.set(W / 2 - 0.45, baseH + wallH + 0.99, -D / 2 + 0.45);
  group.add(cap);

  // ── INTERIOR: L-SHAPED WALNUT COUNTER (back + left walls) ──
  const backCounter = new THREE.Mesh(new THREE.BoxGeometry(W - 0.5, 0.06, 0.5), walnutMat);
  backCounter.position.set(0, baseH + 0.55, -D / 2 + 0.38);
  group.add(backCounter);
  const backCounterFront = new THREE.Mesh(new THREE.BoxGeometry(W - 0.5, 0.55, 0.06), darkWoodMat);
  backCounterFront.position.set(0, baseH + 0.27, -D / 2 + 0.64);
  group.add(backCounterFront);

  // Left counter arm
  const leftCounter = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.8), darkWoodMat);
  leftCounter.position.set(-W / 2 + 0.52, baseH + 0.27, -D / 2 + 0.38);
  group.add(leftCounter);
  const leftCounterTop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.8), walnutMat);
  leftCounterTop.position.set(-W / 2 + 0.52, baseH + 0.55, -D / 2 + 0.38);
  group.add(leftCounterTop);

  // ── INTERIOR: ESPRESSO MACHINE (center back, chrome) ──
  const espresso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.32, 0.28), chromeMat);
  espresso.position.set(0, baseH + 0.58 + 0.16, -D / 2 + 0.3);
  group.add(espresso);
  // Group heads (3 horizontal cylinders)
  for (const gx of [-0.2, 0, 0.2]) {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.15, 8), chromeMat);
    head.rotation.z = Math.PI / 2;
    head.position.set(gx, baseH + 0.58 + 0.08, -D / 2 + 0.45);
    group.add(head);
  }
  // Steam wands
  for (const sx of [-0.28, 0.28]) {
    const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 5), chromeMat);
    wand.rotation.x = -0.4;
    wand.position.set(sx, baseH + 0.58 + 0.05, -D / 2 + 0.45);
    group.add(wand);
  }

  // ── INTERIOR: GRINDERS (flanking espresso machine) ──
  for (const gx of [-0.55, 0.55]) {
    // Base
    const gBase = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.14), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    gBase.position.set(gx, baseH + 0.55 + 0.14, -D / 2 + 0.28);
    group.add(gBase);
    // Hopper
    const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.2, 8), chromeMat);
    hopper.position.set(gx, baseH + 0.55 + 0.38, -D / 2 + 0.28);
    group.add(hopper);
  }

  // ── INTERIOR: STANDING BAR (right side, stools) ──
  const standBar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.7, 1.0), darkWoodMat);
  standBar.position.set(W / 2 - 0.24, baseH + 0.35, -0.1);
  group.add(standBar);
  const standBarTop = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 1.0), walnutMat);
  standBarTop.position.set(W / 2 - 0.24, baseH + 0.72, -0.1);
  group.add(standBarTop);
  // 3 stools
  for (let si = 0; si < 3; si++) {
    const stoolZ = -0.55 + si * 0.5;
    const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), brassMat);
    stoolLeg.position.set(W / 2 - 0.5, baseH + 0.25, stoolZ);
    group.add(stoolLeg);
    const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 10), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    stoolSeat.position.set(W / 2 - 0.5, baseH + 0.52, stoolZ);
    group.add(stoolSeat);
  }

  // ── INTERIOR: ROASTERY CORNER (back-right — small roaster + sacks) ──
  // Roaster drum (red cylinder)
  const roasterDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.48, 12), roasterMat);
  roasterDrum.rotation.z = Math.PI / 2;
  roasterDrum.position.set(W / 2 - 0.45, baseH + 0.44, -D / 2 + 0.38);
  group.add(roasterDrum);
  // Roaster frame
  const roasterFrame = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 0.28), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
  roasterFrame.position.set(W / 2 - 0.45, baseH + 0.14, -D / 2 + 0.38);
  group.add(roasterFrame);
  // Burlap coffee sacks (3 cylinders, stacked/leaning)
  const sackOffsets = [{ x: 0.12, y: 0.14 }, { x: 0.22, y: 0.14 }, { x: 0.17, y: 0.38 }];
  for (const so of sackOffsets) {
    const sack = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.28, 8), burlMat);
    sack.position.set(W / 2 - so.x, baseH + so.y, -D / 2 + 0.65);
    group.add(sack);
  }

  // ── INTERIOR: CHALKBOARD MENU (left wall) ──
  const menuBoard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.9), chalkMat);
  menuBoard.position.set(-W / 2 + 0.04, baseH + 0.9, -0.3);
  group.add(menuBoard);
  // White "text lines" on menu board
  const textMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9 });
  for (let tl = 0; tl < 4; tl++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.3 - tl * 0.03), textMat);
    line.position.set(-W / 2 + 0.06, baseH + 1.08 - tl * 0.14, -0.05 + tl * 0.02);
    group.add(line);
  }

  // ── INTERIOR: VINYL RECORD SHELF (left wall, lower) ──
  const vinylShelf = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.55), walnutMat);
  vinylShelf.position.set(-W / 2 + 0.04, baseH + 0.55, 0.35);
  group.add(vinylShelf);
  // 5 vinyl records as colored thin squares
  const vinylColors = [0xef4444, 0x111111, 0x3b82f6, 0x111111, 0x22c55e];
  for (let vi = 0; vi < 5; vi++) {
    const record = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.22, 0.02),
      new THREE.MeshStandardMaterial({ color: vinylColors[vi] })
    );
    record.position.set(-W / 2 + 0.05, baseH + 0.67, 0.13 + vi * 0.09);
    group.add(record);
  }

  // ── INTERIOR: PENDANT LAMPS ──
  const pendantMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.6 });
  const pendantCordMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const pendantPositions = [[-1.0, -0.5], [-0.3, 0.3], [0.4, -0.4], [1.0, 0.2], [0, -0.8]];
  for (const [px, pz] of pendantPositions) {
    const cordLen = 0.3 + Math.abs(px * 0.1);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, cordLen, 4), pendantCordMat);
    cord.position.set(px, baseH + wallH - cordLen / 2, pz);
    group.add(cord);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), pendantMat);
    bulb.position.set(px, baseH + wallH - cordLen - 0.065, pz);
    group.add(bulb);
  }

  // ── OUTDOOR SEATING: 2 CAFÉ TABLES + PLANTERS ──
  for (const tx of [-0.9, 0.9]) {
    // Table pedestal
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.45, 6), brassMat);
    pedestal.position.set(tx, baseH + 0.225, D / 2 + 0.5);
    group.add(pedestal);
    // Table top
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 12), facadeMat);
    tableTop.position.set(tx, baseH + 0.47, D / 2 + 0.5);
    group.add(tableTop);
    // Brass table top edge ring
    const tableRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.015, 6, 20), brassMat);
    tableRing.rotation.x = Math.PI / 2;
    tableRing.position.set(tx, baseH + 0.49, D / 2 + 0.5);
    group.add(tableRing);
    // Simple chair (2 per table)
    for (const cOff of [-0.3, 0.3]) {
      const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.18), facadeMat);
      seatMesh.position.set(tx + cOff, baseH + 0.32, D / 2 + 0.5);
      group.add(seatMesh);
      const backMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.025), facadeMat);
      backMesh.position.set(tx + cOff, baseH + 0.42, D / 2 + 0.41);
      group.add(backMesh);
    }
  }

  // ── OUTDOOR PLANTERS flanking entrance ──
  for (const px of [-W / 2 + 0.25, W / 2 - 0.25]) {
    const planter = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.28), facadeMat);
    planter.position.set(px, baseH + 0.14, D / 2 + 0.18);
    group.add(planter);
    // Soil top
    const soil = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.04, 0.26), new THREE.MeshStandardMaterial({ color: 0x3a2510 }));
    soil.position.set(px, baseH + 0.3, D / 2 + 0.18);
    group.add(soil);
    // Greenery
    for (let pi = 0; pi < 3; pi++) {
      const plant = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), plantMat);
      plant.position.set(px - 0.08 + pi * 0.08, baseH + 0.38, D / 2 + 0.18);
      group.add(plant);
    }
  }

  // ── WARM INTERIOR GLOW ──
  const warmGlow = createGlowOrb(0xf59e0b);
  warmGlow.position.set(0, baseH + 0.8, 0);
  group.add(warmGlow);

  // ── CONTRIBUTOR PLAQUE ──
  buildPlaque(group, building, D / 2 + 0.05, 2.8);
};

// ─── Custom Building: Japanese Cherry Blossom Park ──────────────────────────

CUSTOM_BUILDERS['japanese-cherry-blossom-park'] = function (group, building) {
  // Materials
  const grassMat      = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.9 });
  const vermMat       = new THREE.MeshStandardMaterial({ color: 0xdc143c, roughness: 0.7 });
  const stoneMat      = new THREE.MeshStandardMaterial({ color: 0x8b7d6b, roughness: 0.9 });
  const trunkMat      = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
  const blossomMat    = new THREE.MeshStandardMaterial({ color: 0xffb6d9, roughness: 0.8 });
  const benchMat      = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.85 });
  const fujiBodyMat   = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.8, flatShading: true });
  const fujiSnowMat   = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, flatShading: true });
  const petalMat      = new THREE.MeshStandardMaterial({ color: 0xffb6d9, roughness: 0.8, side: THREE.DoubleSide });
  const mossMat       = new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.95 });

  // ── GROUND ──────────────────────────────────────────────────────────────────
  const ground = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.05, 5.5), grassMat);
  ground.position.y = 0.025;
  ground.receiveShadow = true;
  group.add(ground);

  // ── MOUNT FUJI BACKDROP ──────────────────────────────────────────────────────
  const fujiBody = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3.0, 8), fujiBodyMat);
  fujiBody.position.set(0, 1.5, -2.8);
  fujiBody.castShadow = true;
  group.add(fujiBody);
  const fujiSnow = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.6, 8), fujiSnowMat);
  fujiSnow.position.set(0, 3.8, -2.8);
  fujiSnow.castShadow = true;
  group.add(fujiSnow);

  // ── TORII GATE ───────────────────────────────────────────────────────────────
  const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.8, 8);
  for (const px of [-1.1, 1.1]) {
    const post = new THREE.Mesh(postGeo, vermMat);
    post.position.set(px, 1.4, 2.6);
    post.castShadow = true;
    group.add(post);
  }
  const kasagi = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.27, 0.22), vermMat);
  kasagi.position.set(0, 2.72, 2.6);
  kasagi.castShadow = true;
  group.add(kasagi);
  for (const sx of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.22), vermMat);
    tip.position.set(sx * 1.55, 2.79, 2.6);
    tip.rotation.z = sx * 0.18;
    group.add(tip);
  }
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 0.14), vermMat);
  nuki.position.set(0, 2.32, 2.6);
  group.add(nuki);

  // ── STONE LANTERNS (×2) ──────────────────────────────────────────────────────
  for (const lx of [-1.55, 1.55]) {
    const lz = 2.2;
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.35), stoneMat);
    base.position.set(lx, 0.07, lz);
    group.add(base);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.58, 6), stoneMat);
    post.position.set(lx, 0.43, lz);
    group.add(post);
    const mid = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.38), stoneMat);
    mid.position.set(lx, 0.84, lz);
    group.add(mid);
    // Warm glow orb (replaces PointLight for performance)
    const glow = createGlowOrb(0xfbbf24);
    glow.position.set(lx, 0.84, lz);
    group.add(glow);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.26, 4), stoneMat);
    roof.position.set(lx, 1.1, lz);
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
  }

  // ── STEPPING-STONE PATH ───────────────────────────────────────────────────────
  const stonePositions = [
    { x:  0.00, z:  2.3 }, { x:  0.25, z:  1.85 }, { x:  0.50, z:  1.40 },
    { x:  0.70, z:  0.95 }, { x:  0.65, z:  0.50 }, { x:  0.40, z:  0.05 },
    { x:  0.10, z: -0.40 }, { x: -0.20, z: -0.85 }, { x: -0.45, z: -1.30 },
    { x: -0.40, z: -1.75 }, { x: -0.20, z: -2.20 }, { x:  0.05, z: -2.65 },
  ];
  const stoneRadii = [0.25, 0.27, 0.24, 0.26, 0.25, 0.27, 0.24, 0.26, 0.25, 0.27, 0.24, 0.26];
  for (let i = 0; i < stonePositions.length; i++) {
    const s = stonePositions[i];
    const r = stoneRadii[i];
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.07, 8), stoneMat);
    stone.position.set(s.x, 0.06, s.z);
    stone.rotation.y = i * 0.4;
    group.add(stone);
  }

  // ── SAKURA TREES (×5) ─────────────────────────────────────────────────────────
  const treeData = [
    { x: -1.8, z:  0.6, trunkH: 2.0, trunkR: 0.10, canopyR: 1.0 },
    { x:  1.6, z:  0.1, trunkH: 2.4, trunkR: 0.12, canopyR: 1.2 },
    { x: -1.3, z: -1.4, trunkH: 1.9, trunkR: 0.09, canopyR: 0.95 },
    { x:  1.9, z: -1.7, trunkH: 2.2, trunkR: 0.11, canopyR: 1.1 },
    { x:  0.2, z: -2.7, trunkH: 2.1, trunkR: 0.10, canopyR: 1.05 },
  ];
  for (const t of treeData) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(t.trunkR * 0.75, t.trunkR, t.trunkH, 7), trunkMat);
    trunk.position.set(t.x, t.trunkH / 2, t.z);
    trunk.castShadow = true;
    group.add(trunk);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(t.canopyR, 10, 8), blossomMat);
    canopy.position.set(t.x, t.trunkH + t.canopyR * 0.7, t.z);
    canopy.castShadow = true;
    group.add(canopy);
    const fallAngles = [0, 0.78, 1.57, 2.36, 3.14, 3.93, 4.71, 5.50];
    const fallDists  = [0.55, 0.40, 0.65, 0.35, 0.70, 0.45, 0.60, 0.50];
    for (let i = 0; i < 8; i++) {
      const petal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.05), petalMat);
      petal.position.set(
        t.x + Math.cos(fallAngles[i]) * fallDists[i],
        0.055,
        t.z + Math.sin(fallAngles[i]) * fallDists[i]
      );
      petal.rotation.y = fallAngles[i];
      group.add(petal);
    }
  }

  // ── WOODEN BENCHES (×2) ──────────────────────────────────────────────────────
  const benchData = [
    { x: -1.55, z: -0.5 },
    { x:  1.55, z: -0.9 },
  ];
  for (const b of benchData) {
    for (const [ox, oz] of [[-0.5, -0.10], [-0.5, 0.10], [0.5, -0.10], [0.5, 0.10]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.40, 0.07), benchMat);
      leg.position.set(b.x + ox, 0.20, b.z + oz);
      group.add(leg);
    }
    for (let si = 0; si < 3; si++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.27), benchMat);
      plank.position.set(b.x, 0.43, b.z - 0.05 + si * 0.10);
      group.add(plank);
    }
  }

  // ── FLOATING PETALS ──────────────────────────────────────────────────────────
  const floatingPetals = [
    { x: -0.5, y: 0.50, z:  2.1, rx: 0.2, ry: 0.3, rz: 0.1 },
    { x:  0.9, y: 0.30, z:  1.5, rx: 0.5, ry: 1.1, rz: 0.4 },
    { x: -1.1, y: 0.70, z:  0.8, rx: 0.3, ry: 0.7, rz: 0.2 },
    { x:  1.3, y: 0.40, z:  0.0, rx: 0.6, ry: 2.0, rz: 0.3 },
    { x: -0.4, y: 0.60, z: -0.6, rx: 0.1, ry: 0.4, rz: 0.5 },
    { x:  0.7, y: 0.25, z: -1.3, rx: 0.4, ry: 1.5, rz: 0.2 },
    { x: -1.6, y: 0.55, z: -1.7, rx: 0.2, ry: 0.9, rz: 0.4 },
    { x:  1.1, y: 0.80, z: -2.2, rx: 0.5, ry: 0.2, rz: 0.3 },
    { x: -0.8, y: 0.35, z:  1.1, rx: 0.3, ry: 2.5, rz: 0.1 },
    { x:  0.3, y: 0.65, z: -0.2, rx: 0.6, ry: 1.8, rz: 0.5 },
  ];
  for (const p of floatingPetals) {
    const petal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.05), petalMat);
    petal.position.set(p.x, p.y, p.z);
    petal.rotation.set(p.rx, p.ry, p.rz);
    group.add(petal);
  }

  // ── GROUND PETALS ──────────────────────────────────────────────────────────
  const groundPetals = [
    { x: -2.1, z:  1.2 }, { x:  2.0, z:  0.7 }, { x: -0.6, z:  1.9 },
    { x:  1.3, z: -0.4 }, { x: -1.9, z: -0.9 }, { x:  2.2, z: -1.4 },
    { x: -1.0, z: -2.1 }, { x:  0.6, z:  0.8 }, { x: -2.4, z:  0.4 },
    { x:  2.4, z: -0.1 }, { x:  0.1, z: -1.7 }, { x: -1.6, z:  2.0 },
  ];
  for (let i = 0; i < groundPetals.length; i++) {
    const p = groundPetals[i];
    const petal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.05), petalMat);
    petal.position.set(p.x, 0.055, p.z);
    petal.rotation.y = i * 0.52;
    group.add(petal);
  }

  // ── MOSS PATCHES ─────────────────────────────────────────────────────────────
  for (const [mx, mz] of [[-1.55, 2.0], [1.55, 2.0], [0.1, -2.4]]) {
    const moss = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 4), mossMat);
    moss.scale.y = 0.22;
    moss.position.set(mx, 0.04, mz);
    group.add(moss);
  }

  // ── CONTRIBUTOR PLAQUE ───────────────────────────────────────────────────────
  buildPlaque(group, building, 2.75, 1.2);
};

// ─── Custom Building: The NZ Beehive ───────────────────────────────────────

CUSTOM_BUILDERS['the-nz-beehive'] = function (group, building) {
  // Materials
  const concreteMat  = new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.75 });
  const slabMat      = new THREE.MeshStandardMaterial({ color: 0xd4c4a8, roughness: 0.8 });
  const groundMat    = new THREE.MeshStandardMaterial({ color: 0xc4b5a5, roughness: 0.9 });
  const poleMat      = new THREE.MeshStandardMaterial({ color: 0x888070, metalness: 0.3, roughness: 0.5 });
  const flagRedMat   = new THREE.MeshStandardMaterial({ color: 0xcc0000, side: THREE.DoubleSide });
  const flagBlueMat  = new THREE.MeshStandardMaterial({ color: 0x003399, side: THREE.DoubleSide });
  const winMat       = new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    emissive: 0x5c4d3d,
    emissiveIntensity: 0.1,
    transparent: true,
    opacity: 0.4,
    metalness: 0.3,
    roughness: 0.15,
  });

  // ── FORECOURT PLAZA ──
  const plazaGeo = new THREE.CylinderGeometry(4.0, 4.0, 0.06, 32);
  const plaza = new THREE.Mesh(plazaGeo, groundMat);
  plaza.position.set(0, 0.03, 0);
  plaza.receiveShadow = true;
  group.add(plaza);

  // ── FLAGPOLE ──
  const flagpole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 5.5, 8), poleMat);
  flagpole.position.set(0, 2.75, 4.5);
  flagpole.castShadow = true;
  group.add(flagpole);

  // NZ flag — two simple rectangles (blue top, red bottom)
  const flagBlue = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.28), flagBlueMat);
  flagBlue.position.set(0.45, 5.36, 4.5);
  group.add(flagBlue);
  const flagRed = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.18), flagRedMat);
  flagRed.position.set(0.45, 5.09, 4.5);
  group.add(flagRed);

  // ── MAIN TOWER — 10 stacked rings ──
  // Base diameter 5.0, top diameter 3.0, height 9.0
  // Each ring slightly smaller; slight flare at ground level
  const numFloors = 10;
  const towerH = 9.0;
  const floorH = towerH / numFloors;         // 0.9 per floor
  const slabThick = 0.12;
  const glassH = floorH - slabThick;
  const baseR = 5.0;
  const topR = 3.0;
  const numSegs = 24;  // smooth enough cylinder, half the geometry

  for (let i = 0; i < numFloors; i++) {
    const t = i / (numFloors - 1);
    // Smooth taper from base to top
    const r = baseR - (baseR - topR) * t;
    // Slight flare at bottom two floors
    const flare = i < 2 ? (2 - i) * 0.15 : 0;
    const outerR = r + flare;
    const yBase = i * floorH + 0.06;

    // Floor slab (visible horizontal band)
    const slabGeo = new THREE.CylinderGeometry(outerR + 0.08, outerR + 0.08, slabThick, numSegs);
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = yBase + slabThick / 2;
    slab.castShadow = true;
    slab.receiveShadow = i === 0;
    group.add(slab);

    // Glass band (ground floor less glazed: narrower band)
    const bandH = i === 0 ? glassH * 0.35 : glassH;
    const bandY = yBase + slabThick + bandH / 2;
    const glassGeo = new THREE.CylinderGeometry(outerR + 0.02, outerR + 0.02, bandH, numSegs, 1, true);
    const glass = new THREE.Mesh(glassGeo, winMat);
    glass.position.y = bandY;
    glass.renderOrder = 1;
    group.add(glass);

    // Concrete backing wall (slightly inset inside glass)
    if (i === 0) {
      // Ground floor: solid concrete lower portion
      const baseWallGeo = new THREE.CylinderGeometry(outerR - 0.05, outerR - 0.05, glassH * 0.65, numSegs, 1, true);
      const baseWall = new THREE.Mesh(baseWallGeo, concreteMat);
      baseWall.position.y = yBase + slabThick + glassH * 0.325;
      group.add(baseWall);
    }
  }

  // Top roof slab — flat circular cap
  const topRoofR = topR + 0.08;
  const roofY = numFloors * floorH + 0.06;
  const roofGeo = new THREE.CylinderGeometry(topRoofR + 0.25, topRoofR + 0.25, 0.18, numSegs);
  const roof = new THREE.Mesh(roofGeo, slabMat);
  roof.position.y = roofY + 0.09;
  roof.castShadow = true;
  group.add(roof);

  // Parapet ring
  const parapetGeo = new THREE.TorusGeometry(topRoofR + 0.22, 0.09, 6, numSegs);
  const parapet = new THREE.Mesh(parapetGeo, concreteMat);
  parapet.rotation.x = Math.PI / 2;
  parapet.position.y = roofY + 0.22;
  group.add(parapet);

  // Small mechanical structures on roof (setback from edge)
  const mechMat = new THREE.MeshStandardMaterial({ color: 0xd4c4a8, roughness: 0.9 });
  for (let m = 0; m < 3; m++) {
    const angle = (m / 3) * Math.PI * 2;
    const mr = topR * 0.35;
    const mech = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.5), mechMat);
    mech.position.set(Math.cos(angle) * mr, roofY + 0.27, Math.sin(angle) * mr);
    group.add(mech);
  }

  // ── VERTICAL CONCRETE RIBS (48 fins, full height) ──
  const ribMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.7 });
  const ribCount = 48;
  const ribH = towerH + 0.06;

  for (let ri = 0; ri < ribCount; ri++) {
    const angle = (ri / ribCount) * Math.PI * 2;
    // Approximate rib radius at mid-height
    const midT = 0.5;
    const midR = baseR - (baseR - topR) * midT + 0.12;
    const ribGeo = new THREE.BoxGeometry(0.12, ribH, 0.15);
    const rib = new THREE.Mesh(ribGeo, ribMat);
    rib.position.set(
      Math.cos(angle) * midR,
      ribH / 2 + 0.06,
      Math.sin(angle) * midR
    );
    rib.rotation.y = -angle;
    rib.castShadow = true;
    group.add(rib);
  }

  // ── GROUND FLOOR COLUMNS (entry level, 4 cardinal directions) ──
  const colMat = new THREE.MeshStandardMaterial({ color: 0xe0d4bc, roughness: 0.7 });
  const entryR = baseR + 0.15;
  for (let ci = 0; ci < 8; ci++) {
    const angle = (ci / 8) * Math.PI * 2;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, floorH * 1.4, 10), colMat);
    col.position.set(Math.cos(angle) * (entryR - 0.3), floorH * 0.7 + 0.06, Math.sin(angle) * (entryR - 0.3));
    col.castShadow = true;
    group.add(col);
  }

  // ── INTERIOR — CABINET ROOM (visible on floor 8, ~top) ──
  const cabinetFloorY = 8 * floorH + 0.06 + slabThick;
  const woodMat  = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.8 });
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.6 });

  // Wood-paneled circular floor (inner core)
  const floorGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.05, 24);
  const cabinetFloor = new THREE.Mesh(floorGeo, woodMat);
  cabinetFloor.position.y = cabinetFloorY;
  group.add(cabinetFloor);

  // Round table
  const tableGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.07, 16);
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.y = cabinetFloorY + 0.33;
  group.add(table);

  // Table leg (single central pedestal)
  const legGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.28, 8);
  const leg = new THREE.Mesh(legGeo, tableMat);
  leg.position.y = cabinetFloorY + 0.14;
  group.add(leg);

  // Chairs around table (12 executive chairs)
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 });
  for (let ch = 0; ch < 12; ch++) {
    const ang = (ch / 12) * Math.PI * 2;
    const cr = 1.15;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.2), chairMat);
    seat.position.set(Math.cos(ang) * cr, cabinetFloorY + 0.26, Math.sin(ang) * cr);
    seat.rotation.y = ang;
    group.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.25, 0.04), chairMat);
    back.position.set(Math.cos(ang) * (cr + 0.1), cabinetFloorY + 0.38, Math.sin(ang) * (cr + 0.1));
    back.rotation.y = ang;
    group.add(back);
  }

  // ── INTERIOR ELEVATOR CORE ──
  const coreMat = new THREE.MeshStandardMaterial({ color: 0xd4c4a8, roughness: 0.85 });
  const coreGeo = new THREE.CylinderGeometry(0.9, 0.9, towerH, 12);
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = towerH / 2 + 0.06;
  group.add(core);

  // ── WARM INTERIOR GLOW (executive amber) ──
  const glow = createGlowOrb(0xf59e0b);
  glow.position.set(0, towerH * 0.6, 0);
  group.add(glow);
  const groundGlow = createGlowOrb(0xfbbf24);
  groundGlow.position.set(0, 1.0, 0);
  group.add(groundGlow);

  // ── CONTRIBUTOR PLAQUE ──
  buildPlaque(group, building, baseR + 0.5, 3.5);
};

// ─── Custom Building: The Verdant Fitness Grove ────────────────────────────

CUSTOM_BUILDERS['verdant-fitness-grove'] = function (group, building) {
  // Materials
  const lawnMat     = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.9 });
  const rubberMat   = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.85 });
  const pathMat     = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.85 });
  const trunkMat    = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
  const canopy1Mat  = new THREE.MeshStandardMaterial({ color: 0xa3b18a, roughness: 0.85 });
  const canopy2Mat  = new THREE.MeshStandardMaterial({ color: 0x6b8f5e, roughness: 0.85 });
  const shrubMat    = new THREE.MeshStandardMaterial({ color: 0xa3b18a, roughness: 0.9 });
  const planterMat  = new THREE.MeshStandardMaterial({ color: 0x8b6c42, roughness: 0.85 });
  const stemMat     = new THREE.MeshStandardMaterial({ color: 0x3a7d44, roughness: 0.9 });
  const flowerMats  = [
    new THREE.MeshStandardMaterial({ color: 0xb57edc }),
    new THREE.MeshStandardMaterial({ color: 0xf2cc60 }),
    new THREE.MeshStandardMaterial({ color: 0xf0f0f0 }),
  ];
  const steelMat    = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.4 });
  const woodGripMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 });
  const cedarMat    = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 });
  const darkCedarMat = new THREE.MeshStandardMaterial({ color: 0xb8956a, roughness: 0.75 });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 });
  const grassMat    = new THREE.MeshStandardMaterial({ color: 0xa3b18a, roughness: 0.9 });

  // ── GROUND (lawn base) ─────────────────────────────────────────────────────
  const lawn = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 6), lawnMat);
  lawn.position.y = 0.025;
  lawn.receiveShadow = true;
  group.add(lawn);

  // ── RUBBERIZED WORKOUT PADS (2) ───────────────────────────────────────────
  const pad1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 1.2), rubberMat);
  pad1.position.set(-0.8, 0.048, -0.3);
  pad1.receiveShadow = true;
  group.add(pad1);

  const pad2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 1.2), rubberMat);
  pad2.position.set(-0.8, 0.048, 1.2);
  pad2.receiveShadow = true;
  group.add(pad2);

  // ── WINDING PATH (S-curve from front to back-right) ───────────────────────
  const pathSegments = [
    { x:  0.3, z:  2.7, ry: 0.0 },
    { x:  0.5, z:  2.1, ry: 0.1 },
    { x:  0.8, z:  1.5, ry: 0.2 },
    { x:  1.1, z:  0.8, ry: -0.1 },
    { x:  1.3, z:  0.1, ry: 0.15 },
    { x:  1.5, z: -0.6, ry: 0.05 },
    { x:  1.7, z: -1.3, ry: 0.0 },
  ];
  for (const seg of pathSegments) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.38), pathMat);
    p.position.set(seg.x, 0.047, seg.z);
    p.rotation.y = seg.ry;
    group.add(p);
  }

  // ── PERIMETER TREES (6) ───────────────────────────────────────────────────
  const treeData = [
    { x: -2.5, z: -2.5, trunkH: 0.9, c1r: 0.38, c2r: 0.32, c3r: 0.28 },
    { x:  2.5, z: -2.5, trunkH: 0.9, c1r: 0.40, c2r: 0.30, c3r: 0.26 },
    { x: -2.5, z:  0.0, trunkH: 0.7, c1r: 0.35, c2r: 0.28, c3r: 0.22 },
    { x:  2.5, z:  0.0, trunkH: 0.7, c1r: 0.35, c2r: 0.30, c3r: 0.24 },
    { x: -2.4, z:  2.5, trunkH: 0.7, c1r: 0.32, c2r: 0.26, c3r: 0.20 },
    { x:  2.4, z:  2.5, trunkH: 0.7, c1r: 0.34, c2r: 0.28, c3r: 0.22 },
  ];
  for (const t of treeData) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, t.trunkH, 7), trunkMat);
    trunk.position.set(t.x, t.trunkH / 2, t.z);
    trunk.castShadow = true;
    group.add(trunk);
    const c1 = new THREE.Mesh(new THREE.SphereGeometry(t.c1r, 8, 6), canopy1Mat);
    c1.position.set(t.x, t.trunkH + t.c1r * 0.7, t.z);
    c1.castShadow = true;
    group.add(c1);
    const c2 = new THREE.Mesh(new THREE.SphereGeometry(t.c2r, 8, 6), canopy2Mat);
    c2.position.set(t.x + 0.15, t.trunkH + t.c2r * 0.9, t.z + 0.12);
    group.add(c2);
    const c3 = new THREE.Mesh(new THREE.SphereGeometry(t.c3r, 7, 5), canopy1Mat);
    c3.position.set(t.x - 0.12, t.trunkH + t.c3r * 1.1, t.z - 0.10);
    group.add(c3);
  }

  // ── SHRUB BORDER (8 low hedge spheres) ───────────────────────────────────
  const shrubPos = [
    { x: -2.5, z: -1.3 }, { x: -2.5, z:  1.2 },
    { x:  2.5, z: -1.3 }, { x:  2.5, z:  1.2 },
    { x: -1.2, z: -2.6 }, { x:  1.2, z: -2.6 },
    { x: -1.2, z:  2.6 }, { x:  1.2, z:  2.6 },
  ];
  for (const s of shrubPos) {
    const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), shrubMat);
    shrub.scale.y = 0.6;
    shrub.position.set(s.x, 0.06, s.z);
    group.add(shrub);
  }

  // ── CORNER GARDEN BEDS (4 corners) ──────────────────────────────────────
  const cornerBeds = [
    { x: -2.2, z: -2.2 }, { x:  2.2, z: -2.2 },
    { x: -2.2, z:  2.2 }, { x:  2.2, z:  2.2 },
  ];
  for (const b of cornerBeds) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.4), planterMat);
    box.position.set(b.x, 0.04, b.z);
    group.add(box);
    // Flowers (3 per bed, different colors)
    for (let fi = 0; fi < 3; fi++) {
      const angle = (fi / 3) * Math.PI * 2;
      const fx = b.x + Math.cos(angle) * 0.1;
      const fz = b.z + Math.sin(angle) * 0.1;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.07, 4), stemMat);
      stem.position.set(fx, 0.12, fz);
      group.add(stem);
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), flowerMats[fi]);
      flower.position.set(fx, 0.17, fz);
      group.add(flower);
    }
  }

  // ── ENTRANCE SIGN (front-center) ─────────────────────────────────────────
  for (const px of [-0.2, 0.2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 5), trunkMat);
    post.position.set(px, 0.1, 2.75);
    group.add(post);
  }
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.06), cedarMat);
  sign.position.set(0, 0.22, 2.75);
  group.add(sign);

  // ── CALISTHENICS ZONE — PULL-UP RIG ──────────────────────────────────────
  for (const px of [-1.05, -0.55]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 7), steelMat);
    post.position.set(px, 0.37, 0.35);
    post.castShadow = true;
    group.add(post);
  }
  const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 7), steelMat);
  crossbar.rotation.z = Math.PI / 2;
  crossbar.position.set(-0.8, 0.69, 0.35);
  group.add(crossbar);
  for (const px of [-1.05, -0.55]) {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 6), woodGripMat);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(px + (px < -0.8 ? 0.035 : -0.035), 0.69, 0.35);
    group.add(grip);
  }

  // ── CALISTHENICS ZONE — PARALLEL BARS ────────────────────────────────────
  const pbOffsets = [{ z: 0.7 }, { z: 1.1 }];
  for (const pb of pbOffsets) {
    for (const px of [-1.15, -0.45]) {
      const vp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), steelMat);
      vp.position.set(px, 0.2, pb.z);
      group.add(vp);
    }
    const hbar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), steelMat);
    hbar.rotation.z = Math.PI / 2;
    hbar.position.set(-0.8, 0.38, pb.z);
    group.add(hbar);
    const centerGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 5), woodGripMat);
    centerGrip.rotation.z = Math.PI / 2;
    centerGrip.position.set(-0.8, 0.38, pb.z);
    group.add(centerGrip);
  }

  // ── CALISTHENICS ZONE — CLIMBING A-FRAME ─────────────────────────────────
  // Front A-frame
  const aFrameData = [
    { bx: -1.05, bz: -0.5, tx: -0.8, tz: -0.3 },
    { bx: -0.55, bz: -0.5, tx: -0.8, tz: -0.3 },
  ];
  for (const af of aFrameData) {
    const dx = af.tx - af.bx;
    const dy = 0.7;
    const dz = af.tz - af.bz;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, len, 6), steelMat);
    leg.position.set((af.bx + af.tx) / 2, 0.5, (af.bz + af.tz) / 2);
    leg.rotation.z = Math.atan2(dx, dy);
    leg.castShadow = true;
    group.add(leg);
  }
  // Apex cap
  const apex = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), steelMat);
  apex.position.set(-0.8, 1.04, -0.3);
  group.add(apex);
  // Rungs (4)
  for (let ri = 0; ri < 4; ri++) {
    const ry = 0.18 + ri * 0.18;
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.36, 5), steelMat);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(-0.8, ry, -0.5 + ri * 0.05);
    group.add(rung);
  }
  // Tiny bird on apex (two cones joined at base)
  const birdMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 });
  for (const bx of [-0.03, 0.03]) {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 4), birdMat);
    wing.rotation.z = bx < 0 ? Math.PI / 4 : -Math.PI / 4;
    wing.position.set(-0.8 + bx, 1.10, -0.3);
    group.add(wing);
  }

  // ── STRETCHING DECK (back-right corner) ──────────────────────────────────
  // Legs
  for (const [lx, lz] of [[-0.55, -2.35], [0.55, -2.35], [-0.55, -1.65], [0.55, -1.65]]) {
    const dleg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), trunkMat);
    dleg.position.set(lx, 0.03, lz);
    group.add(dleg);
  }
  // Platform
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.8), cedarMat);
  deck.position.set(0, 0.1, -2.0);
  deck.castShadow = true;
  group.add(deck);
  // Plank grooves (2 thin strips)
  for (const gz of [-2.07, -1.97]) {
    const groove = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.005, 0.01), darkCedarMat);
    groove.position.set(0, 0.145, gz);
    group.add(groove);
  }
  // Ornamental grasses (border of deck)
  for (let gi = 0; gi < 5; gi++) {
    const gx = -0.7 + gi * 0.35;
    for (const gz of [-2.45, -1.55]) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.15, 4), grassMat);
      blade.position.set(gx, 0.15, gz);
      blade.rotation.x = (Math.random() - 0.5) * 0.4;
      group.add(blade);
    }
  }

  // ── HYDRATION STATION (front-right) ─────────────────────────────────────
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 0.15), concreteMat);
  pedestal.position.set(1.8, 0.175, 2.2);
  group.add(pedestal);
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 10), concreteMat);
  basin.position.set(1.8, 0.365, 2.2);
  group.add(basin);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 6), steelMat);
  spout.position.set(1.8, 0.42, 2.2);
  group.add(spout);
  // Water droplet orb
  const dropMat = new THREE.MeshStandardMaterial({ color: 0xbfdbfe, roughness: 0.2 });
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), dropMat);
  drop.position.set(1.8, 0.47, 2.2);
  group.add(drop);

  // ── BENCH-PLANTERS (2) ───────────────────────────────────────────────────
  const benchPlanterData = [
    { x: 1.6, z: 1.6 },
    { x: 1.6, z: 0.7 },
  ];
  for (const b of benchPlanterData) {
    // Legs
    for (const lx of [-0.22, 0.22]) {
      const bleg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.18), concreteMat);
      bleg.position.set(b.x + lx, 0.075, b.z);
      group.add(bleg);
    }
    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.18), cedarMat);
    seat.position.set(b.x, 0.17, b.z);
    group.add(seat);
    // Planter box
    const pbox = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.18, 0.18), planterMat);
    pbox.position.set(b.x + 0.33, 0.09, b.z);
    group.add(pbox);
    // Shrub spheres in planter
    for (let si = 0; si < 3; si++) {
      const sh = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), canopy2Mat);
      sh.position.set(b.x + 0.28 + si * 0.05, 0.22, b.z + (si - 1) * 0.04);
      group.add(sh);
    }
    // Flower
    const bf = new THREE.Mesh(new THREE.SphereGeometry(0.02, 5, 4), flowerMats[1]);
    bf.position.set(b.x + 0.34, 0.27, b.z);
    group.add(bf);
  }

  // ── BOLLARD LIGHTS (6) ────────────────────────────────────────────────────
  const bollardPos = [
    { x:  0.3, z:  2.55 }, { x: -0.3, z:  2.55 },   // flanking entrance
    { x:  0.9, z:  1.55 }, { x:  1.1, z:  0.3 },     // mid-path
    { x:  0.8, z: -1.6  }, { x: -0.5, z: -1.8  },    // near stretching deck
  ];
  for (const bp of bollardPos) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6), rubberMat);
    post.position.set(bp.x, 0.075, bp.z);
    group.add(post);
    const glow = createGlowOrb(0xfbbf24);
    glow.position.set(bp.x, 0.165, bp.z);
    group.add(glow);
  }

  // ── CONTRIBUTOR PLAQUE ────────────────────────────────────────────────────
  buildPlaque(group, building, 2.85, 1.1);
};

// ─── Custom Building: S̄wạs̄dī Bāan Thai ─────────────────────────────────────

CUSTOM_BUILDERS['sawasdi-baan-thai'] = function (group, building) {
  const W = 2.6;        // main building width
  const D = 2.0;        // main building depth
  const wallH = 1.7;    // wall height
  const baseH = 0.12;   // foundation slab height
  const verandaD = 0.8; // veranda depth (extends in +Z / front direction)

  // Materials
  const wallMat     = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.85 });
  const foundMat    = new THREE.MeshStandardMaterial({ color: 0x8B6F4E, roughness: 0.9 });
  const roofMat     = new THREE.MeshStandardMaterial({ color: 0x5D3A1A, roughness: 0.8 });
  const doorMat     = new THREE.MeshStandardMaterial({ color: 0x2E1A0E, roughness: 0.8 });
  const darkOakMat  = new THREE.MeshStandardMaterial({ color: 0x4A2E0E, roughness: 0.8 });
  const goldMat     = new THREE.MeshStandardMaterial({ color: 0xF6A623, roughness: 0.4, metalness: 0.3 });
  const signMat     = new THREE.MeshStandardMaterial({ color: 0xC2185B, roughness: 0.6 });
  const creamMat    = new THREE.MeshStandardMaterial({ color: 0xFEF3C7, roughness: 0.7 });
  const woodMat     = new THREE.MeshStandardMaterial({ color: 0x8B6F4E, roughness: 0.85 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x6B3A1F, roughness: 0.9 });
  const ironMat     = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.6 });
  const winMat      = new THREE.MeshStandardMaterial({
    color: 0xbfdbfe, emissive: 0x3b82f6, emissiveIntensity: 0.15,
    transparent: true, opacity: 0.35, roughness: 0.1,
  });
  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0xFEF3C7, emissive: 0xfbbf24, emissiveIntensity: 0.12,
  });

  // ── FOUNDATION (spans main building + veranda) ─────────────────────────
  const found = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.2, baseH, D + verandaD + 0.1),
    foundMat
  );
  found.position.set(0, baseH / 2, verandaD / 2);
  found.castShadow = true;
  found.receiveShadow = true;
  group.add(found);

  // ── MAIN WALLS ─────────────────────────────────────────────────────────
  const walls = new THREE.Mesh(new THREE.BoxGeometry(W, wallH, D), wallMat);
  walls.position.y = baseH + wallH / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // Interior warm back wall (visible through windows)
  const iWall = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, wallH - 0.2, 0.04), interiorMat);
  iWall.position.set(0, baseH + wallH / 2, -D / 2 + 0.1);
  group.add(iWall);

  // ── HORIZONTAL TIMBER TRIM BANDS (front facade) ────────────────────────
  for (const trimY of [baseH, baseH + wallH * 0.5, baseH + wallH]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(W + 0.04, 0.05, 0.04), darkOakMat);
    trim.position.set(0, trimY + 0.025, D / 2 + 0.02);
    group.add(trim);
  }

  // ── DOOR (offset right to leave room for windows on left) ──────────────
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.06), doorMat);
  door.position.set(0.5, baseH + 0.36, D / 2 + 0.04);
  group.add(door);

  // ── FRONT WINDOWS (left half of facade) ────────────────────────────────
  for (const wx of [-0.9, -0.3]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.05), winMat);
    win.position.set(wx, baseH + wallH * 0.6, D / 2 + 0.04);
    group.add(win);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.39, 0.03), darkOakMat);
    frame.position.set(wx, baseH + wallH * 0.6, D / 2 + 0.02);
    group.add(frame);
  }

  // ── OPEN KITCHEN COUNTER (left side of facade) ─────────────────────────
  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.5), darkWoodMat);
  counter.position.set(-W / 2 + 0.45, baseH + 0.55, D / 2 + 0.06);
  counter.castShadow = true;
  group.add(counter);

  // ── MAIN ROOF (low-pitched gable) ──────────────────────────────────────
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 0.12, D + 0.3), roofMat);
  roofSlab.position.set(0, baseH + wallH + 0.06, 0);
  roofSlab.castShadow = true;
  group.add(roofSlab);

  const ridge = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 0.14, 0.12), roofMat);
  ridge.position.set(0, baseH + wallH + 0.19, 0);
  group.add(ridge);

  // Upswept eave tips (chofa silhouette) at each roof corner
  for (const [ex, ez, rx, rz] of [
    [-W / 2 - 0.18,  D / 2 + 0.14, -0.45,  0.5],
    [ W / 2 + 0.18,  D / 2 + 0.14,  0.45,  0.5],
    [-W / 2 - 0.18, -D / 2 - 0.14, -0.45, -0.5],
    [ W / 2 + 0.18, -D / 2 - 0.14,  0.45, -0.5],
  ]) {
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.25, 6), goldMat);
    tip.position.set(ex, baseH + wallH + 0.13, ez);
    tip.rotation.z = rx;
    tip.rotation.x = rz;
    group.add(tip);
  }

  // ── VERANDA PLATFORM ───────────────────────────────────────────────────
  const verandaFloor = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 0.06, verandaD), foundMat);
  verandaFloor.position.set(0, baseH + 0.03, D / 2 + verandaD / 2);
  verandaFloor.receiveShadow = true;
  group.add(verandaFloor);

  // Veranda roof
  const verandaRoof = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 0.08, verandaD + 0.15), roofMat);
  verandaRoof.position.set(0, baseH + wallH + 0.04, D / 2 + verandaD / 2);
  verandaRoof.castShadow = true;
  group.add(verandaRoof);

  // Veranda posts (4 corners)
  for (const [px, pz] of [
    [-W / 2 + 0.2, D / 2 + 0.1],
    [ W / 2 - 0.2, D / 2 + 0.1],
    [-W / 2 + 0.2, D / 2 + verandaD - 0.1],
    [ W / 2 - 0.2, D / 2 + verandaD - 0.1],
  ]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, wallH, 8), darkWoodMat);
    post.position.set(px, baseH + wallH / 2, pz);
    post.castShadow = true;
    group.add(post);
  }

  // ── SIGNBOARD ──────────────────────────────────────────────────────────
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 0.05), signMat);
  sign.position.set(0, baseH + wallH * 0.85, D / 2 + 0.08);
  group.add(sign);
  // Gold border
  for (const [bw, bh, bx, by] of [
    [1.06, 0.03,   0,    baseH + wallH * 0.85 + 0.19],
    [1.06, 0.03,   0,    baseH + wallH * 0.85 - 0.19],
    [0.03, 0.41, -0.52,  baseH + wallH * 0.85],
    [0.03, 0.41,  0.52,  baseH + wallH * 0.85],
  ]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.04), goldMat);
    b.position.set(bx, by, D / 2 + 0.09);
    group.add(b);
  }
  // Subtitle bar
  const subtitle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.04), creamMat);
  subtitle.position.set(0, baseH + wallH * 0.85 - 0.28, D / 2 + 0.08);
  group.add(subtitle);

  // ── HANGING PAPER LANTERNS (along veranda roof edge) ───────────────────
  for (let i = 0; i < 4; i++) {
    const lx = -W / 2 + 0.3 + i * (W - 0.45) / 3;
    const lz = D / 2 + verandaD - 0.05;
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 4), ironMat);
    string.position.set(lx, baseH + wallH - 0.1, lz);
    group.add(string);
    const lantern = createGlowOrb(0xF6A623);
    lantern.scale.set(1.2, 1.6, 1.2);
    lantern.position.set(lx, baseH + wallH - 0.28, lz);
    group.add(lantern);
  }

  // ── STRING LIGHTS (veranda front edge) ─────────────────────────────────
  for (let i = 0; i < 6; i++) {
    const lx = -W / 2 + 0.22 + i * (W - 0.35) / 5;
    const orb = createGlowOrb(0xFBBF24);
    orb.scale.setScalar(0.32);
    orb.position.set(lx, baseH + wallH + 0.02, D / 2 + verandaD + 0.05);
    group.add(orb);
  }

  // ── VERANDA DINING TABLES & BENCHES ────────────────────────────────────
  for (const tx of [-0.65, 0.65]) {
    const tbl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.25), woodMat);
    tbl.position.set(tx, baseH + 0.06 + 0.075, D / 2 + 0.44);
    group.add(tbl);
    for (const bz of [-0.22, 0.22]) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.08), darkWoodMat);
      bench.position.set(tx, baseH + 0.06 + 0.03, D / 2 + 0.44 + bz);
      group.add(bench);
    }
  }

  // ── POTTED PLANTS (flanking door) ──────────────────────────────────────
  for (const px of [0.1, 1.05]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.08, 8), wallMat);
    pot.position.set(px, baseH + 0.04, D / 2 + 0.12);
    group.add(pot);
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 5),
      new THREE.MeshStandardMaterial({ color: 0x2E7D32 }));
    foliage.position.set(px, baseH + 0.18, D / 2 + 0.12);
    foliage.castShadow = true;
    group.add(foliage);
  }

  // ── ACCESSIBILITY RAMP ─────────────────────────────────────────────────
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xD1D5DB }));
  ramp.position.set(0, 0.03, D / 2 + verandaD + 0.1);
  group.add(ramp);

  // ── STREET-FOOD CART (right side +X) ───────────────────────────────────
  const cartX = W / 2 + 0.42;
  const cartZ = D / 2 - 0.1;
  const cart = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.5), woodMat);
  cart.position.set(cartX, baseH + 0.225, cartZ);
  cart.castShadow = true;
  group.add(cart);
  // Wheels
  for (const wz of [cartZ - 0.22, cartZ + 0.22]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 10), ironMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(cartX + 0.32, 0.1, wz);
    group.add(wheel);
  }
  // Striped awning (3 strips, alternating red/white)
  for (let i = 0; i < 3; i++) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.14),
      new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xDC2626 : 0xFAFAFA, roughness: 0.7 }));
    strip.position.set(cartX, baseH + 0.57 + i * 0.045, cartZ - 0.12 + i * 0.04);
    strip.rotation.x = -0.25;
    group.add(strip);
  }
  // Chalkboard menu
  const chalk = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x1F2937 }));
  chalk.position.set(cartX, baseH + 0.45 + 0.075, cartZ + 0.28);
  group.add(chalk);

  // ── INTERIOR: WOK STATION (left side, behind kitchen counter) ──────────
  const stove = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.28), ironMat);
  stove.position.set(-W / 2 + 0.45, baseH + 0.57, 0.1);
  group.add(stove);
  for (const wox of [-0.1, 0.1]) {
    const wok = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.04, 0.025, 8), ironMat);
    wok.position.set(-W / 2 + 0.45 + wox, baseH + 0.595, 0.1);
    group.add(wok);
    // Steam orbs rising above wok
    for (let s = 0; s < 3; s++) {
      const steam = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 - s * 0.04 }));
      steam.position.set(-W / 2 + 0.45 + wox, baseH + 0.67 + s * 0.1, 0.1);
      group.add(steam);
    }
  }

  // Spice jar shelf + jars
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.06), darkWoodMat);
  shelf.position.set(-W / 2 + 0.45, baseH + wallH * 0.56, -D / 2 + 0.18);
  group.add(shelf);
  for (let j = 0; j < 4; j++) {
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.04, 6),
      new THREE.MeshStandardMaterial({ color: [0xDC2626, 0x2E7D32, 0xF6A623, 0x8B4513][j] }));
    jar.position.set(-W / 2 + 0.34 + j * 0.065, baseH + wallH * 0.56 + 0.03, -D / 2 + 0.18);
    group.add(jar);
  }

  // Hanging pans (from ceiling)
  for (const px of [-0.25, 0.0]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.2, 4), ironMat);
    rod.position.set(-W / 2 + 0.45 + px, baseH + wallH - 0.1, 0.1);
    group.add(rod);
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 8), ironMat);
    pan.position.set(-W / 2 + 0.45 + px, baseH + wallH - 0.21, 0.1);
    group.add(pan);
  }

  // ── INTERIOR: DINING TABLES + BOWLS + PENDANT LAMPS ────────────────────
  for (const [dtx, dtz] of [[0.3, 0.25], [0.3, -0.3]]) {
    const dtable = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.25), woodMat);
    dtable.position.set(dtx, baseH + 0.45, dtz);
    group.add(dtable);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0xF0F9FF }));
    bowl.scale.y = 0.5;
    bowl.position.set(dtx, baseH + 0.515, dtz);
    group.add(bowl);
    // Pendant lamp
    const lampRod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.28, 4), ironMat);
    lampRod.position.set(dtx, baseH + wallH - 0.14, dtz);
    group.add(lampRod);
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.05, 7, 5),
      new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.7 }));
    shade.position.set(dtx, baseH + wallH - 0.31, dtz);
    group.add(shade);
    const lampGlow = createGlowOrb(0xFBBF24);
    lampGlow.scale.setScalar(0.45);
    lampGlow.position.set(dtx, baseH + wallH - 0.31, dtz);
    group.add(lampGlow);
  }

  // ── INTERIOR: BAMBOO STEAMER BASKETS ───────────────────────────────────
  for (let bs = 0; bs < 3; bs++) {
    const stmr = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 8),
      new THREE.MeshStandardMaterial({ color: 0xC4A35A }));
    stmr.position.set(-W / 2 + 0.3, baseH + 0.49 + bs * 0.034, -D / 2 + 0.2);
    group.add(stmr);
  }

  // ── INTERIOR: BACK MENU BOARD ───────────────────────────────────────────
  const mboard = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.02), ironMat);
  mboard.position.set(W / 2 - 0.2, baseH + wallH * 0.5, -D / 2 + 0.06);
  group.add(mboard);
  const mtext = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.015, 0.015), creamMat);
  mtext.position.set(W / 2 - 0.2, baseH + wallH * 0.5 + 0.02, -D / 2 + 0.08);
  group.add(mtext);

  // ── AMBIENT INTERIOR GLOW ──────────────────────────────────────────────
  const glow = createGlowOrb(0xFBBF24);
  glow.scale.setScalar(0.8);
  glow.position.set(0, baseH + wallH * 0.5, 0);
  group.add(glow);

  // ── PLAQUE ANCHOR ──────────────────────────────────────────────────────
  buildPlaque(group, building, D / 2 + verandaD, baseH + wallH * 0.65);
};

// Distant hills
export function createHills() {
  const group = new THREE.Group();
  const cx = TOWN_CENTER_X;
  const cz = TOWN_CENTER_Z;
  const hillData = [
    { x: cx - 70, z: cz - 80, r: 25, h: 12, color: 0x5b8c3e },
    { x: cx,      z: cz - 90, r: 35, h: 18, color: 0x4a7c31 },
    { x: cx + 60, z: cz - 75, r: 20, h: 10, color: 0x6b9e4a },
    { x: cx - 55, z: cz - 60, r: 18, h: 8,  color: 0x5d9040 },
    { x: cx + 80, z: cz - 85, r: 30, h: 15, color: 0x4f8535 },
    { x: cx - 40, z: cz + 90, r: 22, h: 10, color: 0x5b8c3e },
    { x: cx + 35, z: cz + 95, r: 30, h: 14, color: 0x4a7c31 },
    { x: cx + 85, z: cz + 65, r: 20, h: 9,  color: 0x6b9e4a },
    { x: cx - 75, z: cz + 55, r: 25, h: 11, color: 0x4f8535 },
    { x: cx - 85, z: cz,      r: 28, h: 13, color: 0x5d9040 },
    { x: cx + 90, z: cz,      r: 24, h: 11, color: 0x5b8c3e },
  ];

  for (const h of hillData) {
    const geo = new THREE.ConeGeometry(h.r, h.h, 8);
    const mat = new THREE.MeshStandardMaterial({
      color: h.color,
      roughness: 0.9,
      flatShading: true,
    });
    const hill = new THREE.Mesh(geo, mat);
    hill.position.set(h.x, h.h / 2 - 2, h.z);
    hill.receiveShadow = true;
    group.add(hill);
  }

  return group;
}

// Highlight a building (glow effect)
export function highlightBuilding(group, highlight) {
  group.traverse((child) => {
    if (child.isMesh && child.material) {
      if (highlight) {
        child.material._origEmissive = child.material.emissive?.clone();
        child.material.emissive = child.material.emissive || new THREE.Color(0);
        child.material.emissiveIntensity = (child.material.emissiveIntensity || 0) + 0.3;
      } else if (child.material._origEmissive) {
        child.material.emissive.copy(child.material._origEmissive);
        child.material.emissiveIntensity = Math.max(0, (child.material.emissiveIntensity || 0) - 0.3);
        delete child.material._origEmissive;
      }
    }
  });
}
