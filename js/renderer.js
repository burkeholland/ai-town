// renderer.js — Three.js town renderer with WASD walk controls + mouse look

import * as THREE from 'three';
import { createBuilding, createGround, highlightBuilding, plotToWorld,
         createSceneryTree, createRock, createPond, createCloud, createHills,
         TOWN_CENTER_X, TOWN_CENTER_Z } from './buildings.js';

const WALK_SPEED = 3.5;
const LOOK_SPEED = 0.0008;
const EYE_HEIGHT = 1.8;
const SPRINT_MULTIPLIER = 1.8;
const SMOOTHING = 4; // lower = smoother/slower response

export class TownRenderer {
  constructor(container, buildings) {
    this.container = container;
    this.buildings = buildings;
    this.buildingGroups = [];
    this.hoveredGroup = null;
    this.selectedBuilding = null;
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Movement state
    this.keys = {};
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.euler.y = Math.PI / 4; // initial look direction
    this.euler.x = -0.1;
    this.isPointerLocked = false;
    this.clock = new THREE.Clock();
    this.velocity = new THREE.Vector3();

    this.initScene();
    this.initLights();
    this.initCamera();
    if (this.isMobile) {
      this.initTouchControls();
    } else {
      this.initWalkControls();
    }
    this.initRaycaster();

    this.buildTown();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();

    // Gradient sky via a large sphere
    const skyGeo = new THREE.SphereGeometry(150, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x4a9ede) },
        bottomColor: { value: new THREE.Color(0xd4f1ff) },
        offset: { value: 20 },
        exponent: { value: 0.4 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);

    // Soft fog blending into horizon
    this.scene.fog = new THREE.FogExp2(0xc8e6f5, 0.008);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.updateSize();
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.updateSize();
    });
  }

  updateSize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  initLights() {
    const ambient = new THREE.AmbientLight(0xfef3c7, 0.6);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x84cc16, 0.4);
    this.scene.add(hemi);

    this.sun = new THREE.DirectionalLight(0xfff5e6, 1.2);
    this.sun.position.set(15, 20, 10);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 2048;
    this.sun.shadow.mapSize.height = 2048;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 60;
    this.sun.shadow.camera.left = -25;
    this.sun.shadow.camera.right = 25;
    this.sun.shadow.camera.top = 25;
    this.sun.shadow.camera.bottom = -25;
    this.sun.shadow.bias = -0.001;
    this.scene.add(this.sun);
  }

  initCamera() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 400);

    // Start at the edge of town, looking toward center
    const center = this.getTownCenter();
    this.camera.position.set(center.x - 6, EYE_HEIGHT, center.z + 8);
  }

  getTownCenter() {
    return { x: TOWN_CENTER_X, z: TOWN_CENTER_Z };
  }

  initWalkControls() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Pointer lock for mouse look
    this.renderer.domElement.addEventListener('click', (e) => {
      if (!this.isPointerLocked) {
        this.renderer.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
      const hint = document.getElementById('controls-hint');
      if (hint) hint.classList.toggle('hidden', this.isPointerLocked);
      // Clear all keys when pointer lock is released (prevents stuck movement after alt-tab)
      if (!this.isPointerLocked) {
        this.keys = {};
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) {
        // Still track mouse for raycasting when not locked
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.mouseScreen = { x: e.clientX, y: e.clientY };
        this.checkHover();
        return;
      }

      this.euler.y -= e.movementX * LOOK_SPEED;
      this.euler.x -= e.movementY * LOOK_SPEED;
      this.euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 3, this.euler.x));
    });

    // Click to interact when pointer is locked — use crosshair raycast
    this.renderer.domElement.addEventListener('mousedown', (e) => {
      if (this.isPointerLocked) {
        this.checkCrosshairInteraction();
      }
    });

    // Release pointer lock when info panel opens so user can click links
    this.container.addEventListener('building-select', (e) => {
      if (e.detail && this.isPointerLocked) {
        document.exitPointerLock();
      }
    });

    // ESC hint
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        const panel = document.getElementById('info-panel');
        if (panel && !panel.classList.contains('hidden')) {
          panel.classList.add('hidden');
        }
      }
    });
  }

  initTouchControls() {
    const center = this.getTownCenter();
    this.orbit = {
      angle: Math.PI / 4,
      height: 18,
      radius: 30,
      baseAutoSpeed: 0.12,
      lastInteraction: 0,
      centerX: center.x,
      centerZ: center.z,
    };

    // Position camera for orbit view
    this.camera.position.set(
      this.orbit.centerX + this.orbit.radius * Math.cos(this.orbit.angle),
      this.orbit.height,
      this.orbit.centerZ + this.orbit.radius * Math.sin(this.orbit.angle)
    );
    this.camera.lookAt(this.orbit.centerX, 1.5, this.orbit.centerZ);

    let touchStart = null;
    let touchStartPos = null;
    let lastTouchDist = null;
    let lastTouchAngle = null;

    const canvas = this.renderer.domElement;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        touchStartPos = { ...touchStart, time: Date.now() };
      } else if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        lastTouchAngle = Math.atan2(
          e.touches[1].clientY - e.touches[0].clientY,
          e.touches[1].clientX - e.touches[0].clientX
        );
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.orbit.lastInteraction = Date.now();
      if (e.touches.length === 1 && touchStart) {
        const dx = e.touches[0].clientX - touchStart.x;
        const dy = e.touches[0].clientY - touchStart.y;

        // Pan: move orbit center opposite to drag (world follows finger)
        const panSpeed = this.orbit.radius * 0.002;
        const sinA = Math.sin(this.orbit.angle);
        const cosA = Math.cos(this.orbit.angle);
        this.orbit.centerX -= (dx * sinA + dy * (-cosA)) * panSpeed;
        this.orbit.centerZ -= (dx * (-cosA) + dy * (-sinA)) * panSpeed;

        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        // Pinch to zoom
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastTouchDist) {
          const delta = dist - lastTouchDist;
          this.orbit.radius = Math.max(10, Math.min(60, this.orbit.radius - delta * 0.08));
        }
        lastTouchDist = dist;

        // Twist to rotate orbit angle
        const angle = Math.atan2(
          e.touches[1].clientY - e.touches[0].clientY,
          e.touches[1].clientX - e.touches[0].clientX
        );
        if (lastTouchAngle !== null) {
          let da = angle - lastTouchAngle;
          if (da > Math.PI) da -= 2 * Math.PI;
          if (da < -Math.PI) da += 2 * Math.PI;
          this.orbit.angle -= da;
        }
        lastTouchAngle = angle;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      if (touchStartPos && e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        const dt = Date.now() - touchStartPos.time;
        const dx = Math.abs(t.clientX - touchStartPos.x);
        const dy = Math.abs(t.clientY - touchStartPos.y);
        if (dt < 300 && dx < 10 && dy < 10) {
          this.handleTap(t);
        }
      }
      touchStart = null;
      touchStartPos = null;
      lastTouchDist = null;
      lastTouchAngle = null;
    });

    // Close info panel on ESC
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        const panel = document.getElementById('info-panel');
        if (panel && !panel.classList.contains('hidden')) {
          panel.classList.add('hidden');
        }
      }
    });
  }

  handleTap(touch) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    const intersects = this.raycaster.intersectObjects(this.buildingGroups, true);

    let hitGroup = null;
    for (const hit of intersects) {
      let obj = hit.object;
      while (obj.parent && !obj.userData?.id) {
        obj = obj.parent;
      }
      if (obj.userData?.id) {
        hitGroup = obj;
        break;
      }
    }

    if (hitGroup) {
      if (this.hoveredGroup) highlightBuilding(this.hoveredGroup, false);
      this.hoveredGroup = hitGroup;
      highlightBuilding(hitGroup, true);
      this.selectedBuilding = hitGroup.userData;
      this.container.dispatchEvent(new CustomEvent('building-select', {
        detail: this.selectedBuilding,
        bubbles: true,
      }));
    } else {
      if (this.hoveredGroup) highlightBuilding(this.hoveredGroup, false);
      this.hoveredGroup = null;
      this.selectedBuilding = null;
      this.container.dispatchEvent(new CustomEvent('building-select', {
        detail: null,
        bubbles: true,
      }));
    }
  }

  updateOrbit(dt) {
    // Gradually resume auto-orbit after interaction
    const timeSinceInteraction = (Date.now() - this.orbit.lastInteraction) / 1000;
    const autoFactor = Math.min(1, Math.max(0, (timeSinceInteraction - 0.5) / 2));
    this.orbit.angle += this.orbit.baseAutoSpeed * autoFactor * dt;

    this.camera.position.set(
      this.orbit.centerX + this.orbit.radius * Math.cos(this.orbit.angle),
      this.orbit.height,
      this.orbit.centerZ + this.orbit.radius * Math.sin(this.orbit.angle)
    );
    this.camera.lookAt(this.orbit.centerX, 1.5, this.orbit.centerZ);

    // Shadow follows camera
    this.sun.position.set(this.camera.position.x + 15, 20, this.camera.position.z + 10);
    this.sun.target.position.set(this.orbit.centerX, 0, this.orbit.centerZ);
    this.sun.target.updateMatrixWorld();
  }

  updateMovement(dt) {
    const speed = WALK_SPEED * (this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? SPRINT_MULTIPLIER : 1);

    // Apply rotation from euler
    this.camera.quaternion.setFromEuler(this.euler);

    // Get forward/right from camera orientation, projected onto XZ plane
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(this.camera.quaternion);
    right.y = 0;
    right.normalize();

    const input = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp'])    input.add(forward);
    if (this.keys['KeyS'] || this.keys['ArrowDown'])   input.sub(forward);
    if (this.keys['KeyD'] || this.keys['ArrowRight'])  input.add(right);
    if (this.keys['KeyA'] || this.keys['ArrowLeft'])   input.sub(right);
    if (this.keys['Space'])                            input.y += 1;
    if (this.keys['KeyQ'])                             input.y -= 1;

    const target = new THREE.Vector3();
    if (input.lengthSq() > 0) {
      input.normalize();
      target.copy(input).multiplyScalar(speed);
    }

    // Smooth acceleration/deceleration (framerate-independent)
    const alpha = 1 - Math.exp(-SMOOTHING * dt);
    this.velocity.lerp(target, alpha);
    if (this.velocity.lengthSq() < 0.0001) this.velocity.set(0, 0, 0);

    this.camera.position.addScaledVector(this.velocity, dt);
    // Prevent going below ground
    if (this.camera.position.y < EYE_HEIGHT) this.camera.position.y = EYE_HEIGHT;

    // Shadow follows player
    this.sun.position.set(this.camera.position.x + 15, 20, this.camera.position.z + 10);
    this.sun.target.position.copy(this.camera.position);
    this.sun.target.updateMatrixWorld();
  }

  initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.mouseScreen = null;
  }

  checkCrosshairInteraction() {
    // Raycast from center of screen — only against buildings, not full scene
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this.raycaster.intersectObjects(this.buildingGroups, true);

    let hitGroup = null;
    for (const hit of intersects) {
      if (hit.distance > 15) break; // interaction range
      let obj = hit.object;
      while (obj.parent && !obj.userData?.id) {
        obj = obj.parent;
      }
      if (obj.userData?.id) {
        hitGroup = obj;
        break;
      }
    }

    if (hitGroup) {
      this.selectedBuilding = hitGroup.userData;
      this.container.dispatchEvent(new CustomEvent('building-select', {
        detail: this.selectedBuilding,
        bubbles: true,
      }));
    } else {
      this.selectedBuilding = null;
      this.container.dispatchEvent(new CustomEvent('building-select', {
        detail: null,
        bubbles: true,
      }));
    }
  }

  checkHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.buildingGroups, true);

    let hitGroup = null;
    for (const hit of intersects) {
      let obj = hit.object;
      while (obj.parent && !obj.userData?.id) {
        obj = obj.parent;
      }
      if (obj.userData?.id) {
        hitGroup = obj;
        break;
      }
    }

    if (hitGroup !== this.hoveredGroup) {
      if (this.hoveredGroup) highlightBuilding(this.hoveredGroup, false);
      this.hoveredGroup = hitGroup;
      if (this.hoveredGroup) {
        highlightBuilding(this.hoveredGroup, true);
        this.renderer.domElement.style.cursor = 'pointer';
      } else {
        this.renderer.domElement.style.cursor = 'default';
      }
    }

    // Tooltip when not pointer-locked
    const tooltip = document.getElementById('tooltip');
    if (tooltip && !this.isPointerLocked) {
      if (this.hoveredGroup && this.mouseScreen) {
        tooltip.textContent = this.hoveredGroup.userData.name;
        tooltip.classList.remove('hidden');
        tooltip.style.left = this.mouseScreen.x + 15 + 'px';
        tooltip.style.top = this.mouseScreen.y - 10 + 'px';
      } else {
        tooltip.classList.add('hidden');
      }
    }
  }

  // When pointer locked, highlight building at crosshair
  checkCrosshairHover() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this.raycaster.intersectObjects(this.buildingGroups, true);

    let hitGroup = null;
    for (const hit of intersects) {
      if (hit.distance > 15) break;
      let obj = hit.object;
      while (obj.parent && !obj.userData?.id) {
        obj = obj.parent;
      }
      if (obj.userData?.id) {
        hitGroup = obj;
        break;
      }
    }

    if (hitGroup !== this.hoveredGroup) {
      if (this.hoveredGroup) highlightBuilding(this.hoveredGroup, false);
      this.hoveredGroup = hitGroup;
      if (this.hoveredGroup) highlightBuilding(this.hoveredGroup, true);
    }

    // Show building name at crosshair
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
      if (this.hoveredGroup) {
        tooltip.textContent = this.hoveredGroup.userData.name;
        tooltip.classList.remove('hidden');
        tooltip.style.left = '50%';
        tooltip.style.top = '55%';
        tooltip.style.transform = 'translate(-50%, 0)';
      } else {
        tooltip.classList.add('hidden');
        tooltip.style.transform = '';
      }
    }
  }

  buildTown() {
    const ground = createGround();
    this.scene.add(ground);

    // Distant hills
    this.scene.add(createHills());

    // Scenery trees — only outside the town area
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    };
    const rand = rng(42);

    // Trees — countryside and village (avoiding buildings and square)
    for (let i = 0; i < 150; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 12 + rand() * 80;
      const x = Math.cos(angle) * dist + TOWN_CENTER_X;
      const z = Math.sin(angle) * dist + TOWN_CENTER_Z;
      // Skip if in town square area
      const cdx = x - TOWN_CENTER_X;
      const cdz = z - TOWN_CENTER_Z;
      if (cdx * cdx + cdz * cdz < 64) continue;
      // Skip if too close to a building
      let skip = false;
      for (const b of this.buildings) {
        const pw = plotToWorld(b.plot);
        const dx = x - pw.x;
        const dz = z - pw.z;
        if (dx * dx + dz * dz < 25) { skip = true; break; }
      }
      if (skip) continue;
      const scale = (dist < 45) ? 0.4 + rand() * 0.5 : 0.8 + rand() * 1.0;
      this.scene.add(createSceneryTree(x, z, scale));
    }

    // Rocks in countryside
    for (let i = 0; i < 30; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 45 + rand() * 50;
      const x = Math.cos(angle) * dist + TOWN_CENTER_X;
      const z = Math.sin(angle) * dist + TOWN_CENTER_Z;
      this.scene.add(createRock(x, z, 0.5 + rand() * 1.5));
    }

    // Pond outside town
    this.scene.add(createPond(TOWN_CENTER_X - 50, TOWN_CENTER_Z + 15));

    // Clouds
    this.clouds = [];
    for (let i = 0; i < 12; i++) {
      const x = TOWN_CENTER_X - 80 + rand() * 160;
      const y = 25 + rand() * 15;
      const z = TOWN_CENTER_Z - 80 + rand() * 160;
      const scale = 1.5 + rand() * 2;
      const cloud = createCloud(x, y, z, scale);
      cloud.userData.speed = 0.3 + rand() * 0.5;
      this.scene.add(cloud);
      this.clouds.push(cloud);
    }

    // Buildings
    for (const b of this.buildings) {
      const group = createBuilding(b);
      this.scene.add(group);
      this.buildingGroups.push(group);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = this.clock.getDelta();

    if (this.isMobile) {
      this.updateOrbit(dt);
    } else {
      this.updateMovement(dt);
    }

    // Drift clouds
    if (this.clouds) {
      for (const cloud of this.clouds) {
        cloud.position.x += cloud.userData.speed * dt;
        if (cloud.position.x > 80) cloud.position.x = -80;
      }
    }

    // Throttle raycasting to every 3rd frame
    this._frameCount = (this._frameCount || 0) + 1;
    if (!this.isMobile && this.isPointerLocked && this._frameCount % 3 === 0) {
      this.checkCrosshairHover();
    }

    this.renderer.render(this.scene, this.camera);

    // Update floating name labels
    this.updateLabels();
  }

  updateLabels() {
    if (!this.labelContainer) {
      this.labelContainer = document.getElementById('building-labels');
      if (!this.labelContainer) return;
    }

    // Create labels on first call
    if (!this.labels) {
      this.labels = [];
      for (const g of this.buildingGroups) {
        const b = g.userData;
        const label = document.createElement('div');
        label.className = 'building-label';
        const img = document.createElement('img');
        img.src = b.contributor.avatar;
        img.width = 32;
        img.height = 32;
        img.alt = b.contributor.username;
        const span = document.createElement('span');
        span.textContent = b.contributor.username;
        label.appendChild(img);
        label.appendChild(span);
        this.labelContainer.appendChild(label);
        this.labels.push({ el: label, group: g });
      }
    }

    const tempVec = new THREE.Vector3();
    const worldPos = new THREE.Vector3();
    for (const { el, group } of this.labels) {
      // Get sign world position
      const signLocal = group.userData.plaqueWorldPos;
      if (!signLocal) { el.style.display = 'none'; continue; }

      worldPos.copy(signLocal);
      group.localToWorld(worldPos);

      // Distance check in world space (before projection)
      const dist = this.camera.position.distanceTo(worldPos);

      // Project to screen
      tempVec.copy(worldPos);
      tempVec.project(this.camera);
      const x = (tempVec.x * 0.5 + 0.5) * this.container.clientWidth;
      const y = (-tempVec.y * 0.5 + 0.5) * this.container.clientHeight;

      // Hide if behind camera or too far
      if (tempVec.z > 1 || dist > 30) {
        el.style.display = 'none';
      } else {
        el.style.display = 'flex';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        // Fade with distance
        el.style.opacity = Math.max(0.3, Math.min(1, 1 - (dist - 5) / 25));
      }
    }
  }

  addBuilding(building) {
    this.buildings.push(building);
    const group = createBuilding(building);
    this.scene.add(group);
    this.buildingGroups.push(group);
    // Reset labels so they get recreated
    if (this.labels) {
      this.labels.forEach(l => l.el.remove());
      this.labels = null;
    }
  }
}
