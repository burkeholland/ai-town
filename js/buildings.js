// buildings.js — 3D building construction for Three.js

import * as THREE from 'three';

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
  // ─── Town Square ───
  { x: 25,   z: 25,   facing: 0 },             // 0: center (fountain/park)
  { x: 21,   z: 21.5, facing: 0.85 },          // 1: NW of square, faces SE
  { x: 29,   z: 21.5, facing: -0.85 },         // 2: NE of square, faces SW
  { x: 21,   z: 28.5, facing: 2.29 },          // 3: SW of square, faces NE
  { x: 29,   z: 28.5, facing: -2.29 },         // 4: SE of square, faces NW

  // ─── Main Street West ───
  { x: 15,   z: 23,   facing: 0 },             // 5
  { x: 10,   z: 24,   facing: 0 },             // 6
  { x: 15,   z: 29,   facing: Math.PI },       // 7
  { x: 10,   z: 29,   facing: Math.PI },       // 8
  { x: 5,    z: 26,   facing: Math.PI / 2 },   // 9

  // ─── Main Street East ───
  { x: 35,   z: 23,   facing: 0 },             // 10
  { x: 40,   z: 23,   facing: 0 },             // 11
  { x: 35,   z: 29,   facing: Math.PI },       // 12
  { x: 40,   z: 28,   facing: Math.PI },       // 13
  { x: 45,   z: 26,   facing: -Math.PI / 2 },  // 14

  // ─── North Path ───
  { x: 22,   z: 17,   facing: Math.PI / 2 },   // 15
  { x: 28,   z: 16,   facing: -Math.PI / 2 },  // 16
  { x: 21,   z: 11,   facing: Math.PI / 2 },   // 17
  { x: 27,   z: 10,   facing: -Math.PI / 2 },  // 18
  { x: 24,   z: 5,    facing: 0 },             // 19

  // ─── South Path ───
  { x: 22,   z: 33,   facing: Math.PI / 2 },   // 20
  { x: 28,   z: 34,   facing: -Math.PI / 2 },  // 21
  { x: 21,   z: 39,   facing: Math.PI / 2 },   // 22
  { x: 27,   z: 40,   facing: -Math.PI / 2 },  // 23
  { x: 24,   z: 45,   facing: Math.PI },       // 24

  // ─── Scattered Cottages ───
  { x: 17,   z: 18,   facing: 0.4 },           // 25
  { x: 33,   z: 17,   facing: Math.PI - 0.4 }, // 26
  { x: 17,   z: 32,   facing: -0.3 },          // 27
  { x: 33,   z: 33,   facing: Math.PI + 0.3 }, // 28
  { x: 7,    z: 20,   facing: 0 },             // 29
  { x: 43,   z: 20,   facing: Math.PI },       // 30
  { x: 7,    z: 32,   facing: 0 },             // 31
  { x: 43,   z: 32,   facing: Math.PI },       // 32
  { x: 13,   z: 15,   facing: Math.PI / 4 },   // 33
  { x: 37,   z: 15,   facing: Math.PI * 3 / 4 }, // 34
  { x: 13,   z: 37,   facing: -Math.PI / 4 },  // 35
  { x: 37,   z: 37,   facing: -Math.PI * 3 / 4 }, // 36
  { x: 25,   z: 14,   facing: Math.PI },       // 37
  { x: 25,   z: 36,   facing: 0 },             // 38
  { x: 19,   z: 25,   facing: Math.PI / 2 },   // 39
];

export function plotToWorld(plotIndex) {
  const plot = PLOTS[plotIndex] || PLOTS[0];
  return { x: plot.x, z: plot.z, facing: plot.facing };
}

export function getAvailablePlots() {
  return PLOTS.map((p, i) => ({ plot: i, x: p.x, z: p.z }));
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
  const winMat = new THREE.MeshPhysicalMaterial({
    color: 0xbfdbfe,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.35,
    transmission: 0.6,
    roughness: 0.1,
    thickness: 0.05,
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
  const winMat = new THREE.MeshPhysicalMaterial({ color: 0xbfdbfe, emissive: 0x3b82f6, emissiveIntensity: 0.12, transparent: true, opacity: 0.35, transmission: 0.6, roughness: 0.1, thickness: 0.05 });
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
    const lanternLight = new THREE.PointLight(0xfbbf24, 0.3, 3);
    lanternLight.position.set(lx, baseH + 1.42, D / 2 + 0.25);
    group.add(lanternLight);
  }

  // ── INTERIOR GLOW ──
  const glow = new THREE.PointLight(0xfbbf24, 0.8, 8);
  glow.position.set(0, baseH + 1.5, 0);
  group.add(glow);

  const towerGlow = new THREE.PointLight(0xfef3c7, 0.5, 10);
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
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.9,
    transparent: true,
    opacity: 0.2,
    roughness: 0.05,
    thickness: 0.02,
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
  const glow = new THREE.PointLight(0xfbbf24, 0.5, 4);
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
  const winMat      = new THREE.MeshStandardMaterial({ color: 0xc4b5fd, emissive: 0x8b5cf6, emissiveIntensity: 0.3 }); // lavender glow
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
  const winMat     = new THREE.MeshPhysicalMaterial({ color: 0xfde68a, emissive: 0xfbbf24, emissiveIntensity: 0.35, transparent: true, opacity: 0.4, transmission: 0.5, roughness: 0.1, thickness: 0.05 }); // warm amber glow
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
  const glow = new THREE.PointLight(0xfbbf24, 0.8, 5);
  glow.position.set(0, baseH + wallH * 0.5, 0);
  group.add(glow);

  // Lantern above door
  const lanternBodyGeo = new THREE.BoxGeometry(0.1, 0.14, 0.1);
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
  const lantern = new THREE.Mesh(lanternBodyGeo, lanternMat);
  lantern.position.set(-0.35, baseH + wallH * 0.88, D / 2 + 0.12);
  group.add(lantern);
  const lanternLight = new THREE.PointLight(0xfbbf24, 0.5, 2.5);
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
  const glassMat     = new THREE.MeshStandardMaterial({ color: 0xbfdbfe, transparent: true, opacity: 0.38, roughness: 0.05 });
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
  const glow = new THREE.PointLight(0xe0f2fe, 1.2, 6);
  glow.position.set(0, baseH + wallH * 0.7, 0);
  group.add(glow);
  // Sign glow
  const signGlow = new THREE.PointLight(0x00e676, 0.4, 1.5);
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
  const W = 3.8;       // facade width
  const D = 2.8;       // depth
  const baseH = 0.18;  // foundation

  // ── MATERIALS ──
  const stoneMat    = new THREE.MeshStandardMaterial({ color: 0xf0e8dc, roughness: 0.85 });
  const brickMat    = new THREE.MeshStandardMaterial({ color: 0xb07048, roughness: 0.9 });
  const trimMat     = new THREE.MeshStandardMaterial({ color: 0xe0d0bc, roughness: 0.7 });
  const columnMat   = new THREE.MeshStandardMaterial({ color: 0xede4d8, roughness: 0.6 });
  const roofMat     = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.8 });
  const doorMat     = new THREE.MeshStandardMaterial({ color: 0x1a0e06, roughness: 0.6 });
  const winMat      = new THREE.MeshPhysicalMaterial({ color: 0xbfdbfe, emissive: 0x3b82f6, emissiveIntensity: 0.15, transparent: true, opacity: 0.35, transmission: 0.6, roughness: 0.1, thickness: 0.05 });
  const goldMat     = new THREE.MeshStandardMaterial({ color: 0xd4a843, metalness: 0.6, roughness: 0.3 });
  const marqueeBodyMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 });
  const bannerMat   = new THREE.MeshStandardMaterial({ color: 0xc0102e, roughness: 0.85, side: THREE.DoubleSide });
  const bannerTextMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.7 });
  const deco1Mat    = new THREE.MeshStandardMaterial({ color: 0xd4a843, metalness: 0.4, roughness: 0.5 });
  const deco2Mat    = new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: 0.8 });
  const glowWinMat  = new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xfbbf24, emissiveIntensity: 0.5 });

  // ── FOUNDATION ──
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, baseH, D + 0.4), stoneMat);
  base.position.y = baseH / 2;
  base.castShadow = true; base.receiveShadow = true;
  group.add(base);

  // Wide steps up to entrance
  for (let i = 0; i < 3; i++) {
    const sW = W * 0.55 - i * 0.12;
    const step = new THREE.Mesh(new THREE.BoxGeometry(sW, 0.09, 0.35), stoneMat);
    step.position.set(0, baseH + i * 0.09 + 0.045, D / 2 + 0.55 - i * 0.3);
    step.castShadow = true; step.receiveShadow = true;
    group.add(step);
  }

  // ── GROUND FLOOR (brick) ──
  const floor1H = 1.8;
  const wall1 = new THREE.Mesh(new THREE.BoxGeometry(W, floor1H, D), brickMat);
  wall1.position.y = baseH + floor1H / 2;
  wall1.castShadow = true; wall1.receiveShadow = true;
  group.add(wall1);

  // Ground floor stone cladding on front face (art-deco base panel)
  const clad = new THREE.Mesh(new THREE.BoxGeometry(W + 0.04, floor1H * 0.4, 0.08), stoneMat);
  clad.position.set(0, baseH + floor1H * 0.2, D / 2 + 0.04);
  group.add(clad);

  // Floor divider cornice
  const corn1 = new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, 0.1, D + 0.12), trimMat);
  corn1.position.y = baseH + floor1H + 0.05;
  group.add(corn1);

  // ── SECOND FLOOR (stone facade) ──
  const floor2H = 1.6;
  const wall2 = new THREE.Mesh(new THREE.BoxGeometry(W, floor2H, D), stoneMat);
  wall2.position.y = baseH + floor1H + 0.1 + floor2H / 2;
  wall2.castShadow = true; wall2.receiveShadow = true;
  group.add(wall2);

  const floor2Base = baseH + floor1H + 0.1;

  // Second floor cornice
  const corn2 = new THREE.Mesh(new THREE.BoxGeometry(W + 0.14, 0.12, D + 0.14), trimMat);
  corn2.position.y = floor2Base + floor2H + 0.06;
  group.add(corn2);

  // ── FLAT ROOF WITH PARAPET ──
  const roofBase = floor2Base + floor2H + 0.12;
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.14, D + 0.2), roofMat);
  roofSlab.position.y = roofBase + 0.07;
  roofSlab.castShadow = true;
  group.add(roofSlab);

  const parapetH = 0.35;
  // Front parapet
  const pFront = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, parapetH, 0.1), stoneMat);
  pFront.position.set(0, roofBase + 0.14 + parapetH / 2, D / 2 + 0.1);
  group.add(pFront);
  // Back parapet
  const pBack = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, parapetH, 0.1), stoneMat);
  pBack.position.set(0, roofBase + 0.14 + parapetH / 2, -D / 2 - 0.1);
  group.add(pBack);
  // Side parapets
  for (const sx of [-W / 2 - 0.1, W / 2 + 0.1]) {
    const pSide = new THREE.Mesh(new THREE.BoxGeometry(0.1, parapetH, D + 0.2), stoneMat);
    pSide.position.set(sx, roofBase + 0.14 + parapetH / 2, 0);
    group.add(pSide);
  }

  // Art-deco parapet finials (four corners + centre of front)
  const finialPositions = [-W / 2, -W / 4, 0, W / 4, W / 2];
  for (const fx of finialPositions) {
    const pedGeo = new THREE.BoxGeometry(0.18, 0.28, 0.18);
    const ped = new THREE.Mesh(pedGeo, stoneMat);
    ped.position.set(fx, roofBase + 0.14 + parapetH + 0.14, D / 2 + 0.05);
    group.add(ped);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 4), goldMat);
    spire.position.set(fx, roofBase + 0.14 + parapetH + 0.39, D / 2 + 0.05);
    spire.rotation.y = Math.PI / 4;
    group.add(spire);
  }

  // ── ART-DECO PILASTERS (front face) ──
  const pilH = floor1H + floor2H + 0.1;
  const pilPositions = [-W / 2 + 0.15, -W / 2 + 0.55, W / 2 - 0.55, W / 2 - 0.15];
  for (const px of pilPositions) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.12, pilH, 0.1), columnMat);
    pil.position.set(px, baseH + pilH / 2, D / 2 + 0.05);
    pil.castShadow = true;
    group.add(pil);
    // Capital
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.14), deco1Mat);
    cap.position.set(px, baseH + pilH + 0.05, D / 2 + 0.05);
    group.add(cap);
    // Art-deco fluting groove lines on each pilaster
    for (let fi = 0; fi < 3; fi++) {
      const groove = new THREE.Mesh(new THREE.BoxGeometry(0.018, pilH * 0.88, 0.015), brickMat);
      groove.position.set(px - 0.03 + fi * 0.03, baseH + pilH / 2, D / 2 + 0.11);
      group.add(groove);
    }
  }

  // ── GRAND ENTRANCE ARCH ──
  const archW = 1.1;
  const archH = 1.5;
  // Arch uprights
  for (const ax of [-archW / 2, archW / 2]) {
    const upright = new THREE.Mesh(new THREE.BoxGeometry(0.14, archH, 0.12), columnMat);
    upright.position.set(ax, baseH + archH / 2, D / 2 + 0.06);
    group.add(upright);
  }
  // Semi-circular arch
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(archW / 2 + 0.07, 0.07, 8, 16, Math.PI),
    trimMat
  );
  arch.position.set(0, baseH + archH, D / 2 + 0.06);
  group.add(arch);
  // Keystone above arch
  const keystone = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.1), deco1Mat);
  keystone.position.set(0, baseH + archH + (archW / 2 + 0.07), D / 2 + 0.06);
  group.add(keystone);

  // ── DOUBLE DOORS ──
  for (const dx of [-0.24, 0.24]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.1, 0.05), doorMat);
    door.position.set(dx, baseH + 0.55, D / 2 + 0.05);
    group.add(door);
    // Gold door panel detail
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.02), new THREE.MeshStandardMaterial({ color: 0x3a1a06 }));
    panel.position.set(dx, baseH + 0.72, D / 2 + 0.08);
    group.add(panel);
    // Gold handle
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), goldMat);
    handle.position.set(dx > 0 ? dx - 0.1 : dx + 0.1, baseH + 0.55, D / 2 + 0.08);
    group.add(handle);
  }

  // ── MARQUEE (theatre canopy with lights) ──
  const mW = W * 0.85;
  const mY = baseH + floor1H * 0.6;
  // Canopy body
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(mW, 0.12, 0.65), marqueeBodyMat);
  canopy.position.set(0, mY, D / 2 + 0.33);
  canopy.castShadow = true;
  group.add(canopy);
  // Canopy fascia (front face of canopy)
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(mW, 0.38, 0.08), marqueeBodyMat);
  fascia.position.set(0, mY - 0.25, D / 2 + 0.62);
  group.add(fascia);
  // Marquee support brackets
  for (const bx of [-mW / 2 + 0.1, 0, mW / 2 - 0.1]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.62), deco2Mat);
    bracket.position.set(bx, mY + 0.03, D / 2 + 0.32);
    group.add(bracket);
  }
  // Marquee bulb lights
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfbbf24, emissiveIntensity: 0.9 });
  const nBulbs = 9;
  for (let i = 0; i < nBulbs; i++) {
    const bx = -mW / 2 + 0.12 + (i / (nBulbs - 1)) * (mW - 0.24);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), bulbMat);
    bulb.position.set(bx, mY - 0.08, D / 2 + 0.62);
    group.add(bulb);
  }
  // Marquee name sign on fascia — gold text bars (art-deco style)
  const barHeights = [mY - 0.2, mY - 0.3];
  const barWidths = [mW * 0.55, mW * 0.38];
  for (let i = 0; i < 2; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(barWidths[i], 0.06, 0.025), goldMat);
    bar.position.set(0, barHeights[i], D / 2 + 0.67);
    group.add(bar);
  }

  // ── SHOW BANNER ("Octocats Code") — large red banner between marquee and ground floor top ──
  const bannerY = baseH + floor1H * 0.87;
  const bannerW = W * 0.72;
  const bannerH2 = 0.38;
  // Banner backing
  const banner = new THREE.Mesh(new THREE.BoxGeometry(bannerW, bannerH2, 0.04), bannerMat);
  banner.position.set(0, bannerY, D / 2 + 0.06);
  group.add(banner);
  // Decorative text stand-ins — rows of gold bars to suggest "OCTOCATS CODE" lettering
  const letterRowY = [bannerY + 0.08, bannerY - 0.04];
  const letterWidths = [0.12, 0.08, 0.12, 0.08, 0.12, 0.08, 0.12, 0.08];
  let lx = -bannerW / 2 + 0.1;
  for (const lw of letterWidths) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.05, 0.025), bannerTextMat);
    bar.position.set(lx + lw / 2, letterRowY[0], D / 2 + 0.09);
    group.add(bar);
    lx += lw + 0.06;
  }
  lx = -bannerW / 2 + 0.14;
  const letterWidths2 = [0.14, 0.08, 0.14, 0.08, 0.14];
  for (const lw of letterWidths2) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.05, 0.025), bannerTextMat);
    bar.position.set(lx + lw / 2, letterRowY[1], D / 2 + 0.09);
    group.add(bar);
    lx += lw + 0.08;
  }
  // Gold border around banner
  for (const [bw, bh, bx, by] of [
    [bannerW + 0.06, 0.04, 0, bannerY + bannerH2 / 2 + 0.02],
    [bannerW + 0.06, 0.04, 0, bannerY - bannerH2 / 2 - 0.02],
    [0.04, bannerH2 + 0.08, -bannerW / 2 - 0.03, bannerY],
    [0.04, bannerH2 + 0.08, bannerW / 2 + 0.03, bannerY],
  ]) {
    const border = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.025), goldMat);
    border.position.set(bx, by, D / 2 + 0.07);
    group.add(border);
  }

  // ── GROUND FLOOR WINDOWS (flanking entrance) ──
  for (const wx of [-W / 2 + 0.8, W / 2 - 0.8]) {
    // Arched window
    const wBody = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.65, 0.05), winMat);
    wBody.position.set(wx, baseH + 0.55, D / 2 + 0.04);
    group.add(wBody);
    const wArch = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 12, Math.PI), trimMat);
    wArch.position.set(wx, baseH + 0.88, D / 2 + 0.04);
    group.add(wArch);
    const wSill = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.1), trimMat);
    wSill.position.set(wx, baseH + 0.2, D / 2 + 0.06);
    group.add(wSill);
  }

  // ── SECOND FLOOR WINDOWS (ornate, with pediment) ──
  const sf2Y = floor2Base + floor2H * 0.48;
  for (const wx of [-W / 2 + 0.75, 0, W / 2 - 0.75]) {
    const wGeo = new THREE.BoxGeometry(0.42, 0.6, 0.06);
    const w = new THREE.Mesh(wGeo, glowWinMat);
    w.position.set(wx, sf2Y, D / 2 + 0.04);
    group.add(w);
    // Window pediment (triangular)
    const pedShape = new THREE.Shape();
    pedShape.moveTo(-0.24, 0);
    pedShape.lineTo(0.24, 0);
    pedShape.lineTo(0, 0.18);
    pedShape.closePath();
    const pedGeo = new THREE.ExtrudeGeometry(pedShape, { depth: 0.08, bevelEnabled: false });
    const ped = new THREE.Mesh(pedGeo, trimMat);
    ped.position.set(wx - 0.24, sf2Y + 0.33, D / 2 + 0.03);
    group.add(ped);
    // Window sill
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.12), trimMat);
    sill.position.set(wx, sf2Y - 0.33, D / 2 + 0.06);
    group.add(sill);
  }

  // ── ART-DECO GEOMETRIC RELIEF on upper facade ──
  // Central sunburst / fan above main arch
  const nRays = 9;
  for (let i = 0; i < nRays; i++) {
    const angle = (-Math.PI / 2) + (i / (nRays - 1)) * Math.PI;
    const r1 = 0.22, r2 = 0.55;
    const rayGeo = new THREE.BoxGeometry(0.025, r2 - r1, 0.04);
    const ray = new THREE.Mesh(rayGeo, deco1Mat);
    ray.position.set(
      Math.cos(angle) * (r1 + (r2 - r1) / 2),
      floor2Base + 0.55 + Math.sin(angle) * (r1 + (r2 - r1) / 2),
      D / 2 + 0.055
    );
    ray.rotation.z = angle + Math.PI / 2;
    group.add(ray);
  }
  // Outer arc of sunburst
  const sunArc = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.025, 6, 24, Math.PI), deco1Mat);
  sunArc.position.set(0, floor2Base + 0.55, D / 2 + 0.055);
  group.add(sunArc);

  // Horizontal art-deco banding strips between floors (front)
  for (const stripY of [baseH + floor1H * 0.42, baseH + floor1H * 0.72]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.02, 0.04, 0.06), deco1Mat);
    strip.position.set(0, stripY, D / 2 + 0.055);
    group.add(strip);
  }

  // ── SIDE WINDOWS ──
  for (const side of [-1, 1]) {
    for (let fl = 0; fl < 2; fl++) {
      const wy = fl === 0 ? baseH + floor1H * 0.55 : floor2Base + floor2H * 0.5;
      for (let i = 0; i < 2; i++) {
        const wz = -D / 4 + i * D / 2;
        const sw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.38), winMat);
        sw.position.set(side * (W / 2 + 0.04), wy, wz);
        group.add(sw);
      }
    }
  }

  // ── BOX OFFICE WINDOW (ground floor, right side of entrance) ──
  const boxW = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.05), glowWinMat);
  boxW.position.set(W / 2 - 0.38, baseH + floor1H * 0.3, D / 2 + 0.05);
  group.add(boxW);
  const boCorn = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.08), trimMat);
  boCorn.position.set(W / 2 - 0.38, baseH + floor1H * 0.3 + 0.16, D / 2 + 0.06);
  group.add(boCorn);

  // ── ENTRANCE LANTERNS ──
  for (const lx of [-0.7, 0.7]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 6), deco2Mat);
    pole.position.set(lx, baseH + 0.28, D / 2 + 0.15);
    group.add(pole);
    const lBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.1), marqueeBodyMat);
    lBody.position.set(lx, baseH + 0.65, D / 2 + 0.15);
    group.add(lBody);
    const lTop = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.1, 4), deco1Mat);
    lTop.position.set(lx, baseH + 0.8, D / 2 + 0.15);
    lTop.rotation.y = Math.PI / 4;
    group.add(lTop);
    const lanternLight = new THREE.PointLight(0xfbbf24, 0.4, 2.5);
    lanternLight.position.set(lx, baseH + 0.65, D / 2 + 0.22);
    group.add(lanternLight);
  }

  // ── INTERIOR GLOW ──
  const glow = new THREE.PointLight(0xc4b5fd, 0.9, 7);
  glow.position.set(0, baseH + floor1H * 0.5, 0);
  group.add(glow);
  const glow2 = new THREE.PointLight(0xfbbf24, 0.5, 4);
  glow2.position.set(0, floor2Base + floor2H * 0.4, 0);
  group.add(glow2);

  // ── PLAQUE ANCHOR ──
  buildPlaque(group, building, D / 2 + 0.07, 4.2);
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
  const winMat      = new THREE.MeshStandardMaterial({ color: 0x93c5fd, emissive: 0x3b82f6, emissiveIntensity: 0.28 });
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
  const glow = new THREE.PointLight(0x7c3aed, 0.55, 9);
  glow.position.set(0, baseH + totalWallH * 0.45, 0);
  group.add(glow);
  const roofGlow = new THREE.PointLight(0xd4a843, 0.45, 4);
  roofGlow.position.set(0, roofY + 1.1, D / 2 + 0.1);
  group.add(roofGlow);

  // ── PLAQUE ──
  buildPlaque(group, building, D / 2 + 0.04, 2.8);
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
  const villageGeo = new THREE.CircleGeometry(28, 32);
  const villageMat = new THREE.MeshStandardMaterial({ color: 0x8fce4a, roughness: 0.9 });
  const village = new THREE.Mesh(villageGeo, villageMat);
  village.rotation.x = -Math.PI / 2;
  village.position.set(TOWN_CENTER_X, 0.0, TOWN_CENTER_Z);
  village.receiveShadow = true;
  group.add(village);

  // Town square — cobblestone circle in the center
  const squareGeo = new THREE.CircleGeometry(5, 24);
  const squareMat = new THREE.MeshStandardMaterial({ color: 0xc9b896, roughness: 0.95 });
  const square = new THREE.Mesh(squareGeo, squareMat);
  square.rotation.x = -Math.PI / 2;
  square.position.set(TOWN_CENTER_X, 0.015, TOWN_CENTER_Z);
  square.receiveShadow = true;
  group.add(square);

  // Winding roads
  const roadMat = new THREE.MeshStandardMaterial({ color: 0xb8a88a, roughness: 1.0, side: THREE.DoubleSide });
  const roads = [
    // Main Street (east-west curve)
    { points: [
      { x: 0, z: 27 }, { x: 8, z: 26.5 }, { x: 15, z: 25.5 },
      { x: 22, z: 25 }, { x: 25, z: 25 }, { x: 28, z: 25 },
      { x: 35, z: 25.5 }, { x: 42, z: 26.5 }, { x: 50, z: 27 },
    ], width: 2.8 },
    // North Path
    { points: [
      { x: 25, z: 25 }, { x: 25, z: 20 }, { x: 24.5, z: 15 },
      { x: 24, z: 10 }, { x: 24, z: 3 },
    ], width: 2.2 },
    // South Path
    { points: [
      { x: 25, z: 25 }, { x: 25, z: 30 }, { x: 24.5, z: 35 },
      { x: 24, z: 40 }, { x: 24, z: 47 },
    ], width: 2.2 },
  ];

  for (const road of roads) {
    group.add(createRoadStrip(road.points, road.width, roadMat));
  }

  // Wildflowers in countryside
  const seeded = seedRandom(123);
  const flowerColors = [0xff6b9d, 0xfbbf24, 0xf472b6, 0xa78bfa, 0xfb923c, 0xfde68a];
  for (let i = 0; i < 600; i++) {
    const fx = seeded() * 200 - 75 + TOWN_CENTER_X;
    const fz = seeded() * 200 - 75 + TOWN_CENTER_Z;
    const dx = fx - TOWN_CENTER_X;
    const dz = fz - TOWN_CENTER_Z;
    if (Math.sqrt(dx * dx + dz * dz) < 30) continue;
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
  for (let i = 0; i < 150; i++) {
    const angle = seeded() * Math.PI * 2;
    const dist = 5 + seeded() * 22;
    const gx = Math.cos(angle) * dist + TOWN_CENTER_X;
    const gz = Math.sin(angle) * dist + TOWN_CENTER_Z;
    const d2c = Math.sqrt((gx - 25) ** 2 + (gz - 25) ** 2);
    if (d2c < 5.5) continue;
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
export function createSceneryTree(x, z, scale = 1) {
  const group = new THREE.Group();
  const rand = seedRandom(Math.floor(x * 100 + z * 7));

  const trunkH = (1.2 + rand() * 0.8) * scale;
  const trunkGeo = new THREE.CylinderGeometry(0.08 * scale, 0.14 * scale, trunkH, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b3a1f });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  group.add(trunk);

  // Single large canopy (cone shape — like an evergreen)
  const canopyH = (1.5 + rand() * 1.0) * scale;
  const canopyR = (0.7 + rand() * 0.4) * scale;
  const canopyGeo = new THREE.ConeGeometry(canopyR, canopyH, 7);
  const greens = [0x2d7d32, 0x388e3c, 0x43a047, 0x4caf50];
  const canopyMat = new THREE.MeshStandardMaterial({
    color: greens[Math.floor(rand() * greens.length)],
    roughness: 0.9,
    flatShading: true,
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.y = trunkH + canopyH * 0.35;
  canopy.castShadow = true;
  group.add(canopy);

  // Second smaller layer on top
  const topH = canopyH * 0.6;
  const topR = canopyR * 0.55;
  const topGeo = new THREE.ConeGeometry(topR, topH, 7);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    roughness: 0.9,
    flatShading: true,
  });
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.y = trunkH + canopyH * 0.7;
  top.castShadow = true;
  group.add(top);

  group.position.set(x, 0, z);
  return group;
}

// Rock
export function createRock(x, z, scale = 1) {
  const geo = new THREE.DodecahedronGeometry(0.3 * scale, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.95,
    flatShading: true,
  });
  const rock = new THREE.Mesh(geo, mat);
  rock.position.set(x, 0.12 * scale, z);
  const s = Math.floor(x * 7 + z * 13);
  rock.rotation.set(s * 0.3, s * 0.7, s * 0.5);
  rock.scale.set(1, 0.5 + (s % 5) * 0.1, 1);
  rock.castShadow = true;
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
