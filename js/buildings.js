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
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xbfdbfe,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.15,
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
  const winMat = new THREE.MeshStandardMaterial({ color: 0xbfdbfe, emissive: 0x3b82f6, emissiveIntensity: 0.12 });
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
  const winMat     = new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xfbbf24, emissiveIntensity: 0.35 }); // warm amber glow
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
