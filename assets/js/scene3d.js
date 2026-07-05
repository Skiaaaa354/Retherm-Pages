/*
 * RETHERM – 3D-Hero (Three.js), Version 2: ruhig und reduziert.
 *
 * Ein fester Kamerablick auf die Einheit, orthogonale Rohrführung wie im
 * echten Anlagenbau (gerade Läufe, 90°-Bogen), dezente Partikelströme,
 * Maus-Parallax und Tooltips. Keine Scroll-Entführung.
 *
 * Das Innenleben des Wärmetauschers wird bewusst nicht gezeigt
 * (Wettbewerbsschutz). Fällt ohne WebGL oder bei prefers-reduced-motion
 * sauber auf den statischen Hero zurück.
 */

'use strict';

import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

(() => {

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroEl = document.getElementById('hero3d');
  const stage = document.getElementById('hero3d-stage');
  const canvas = document.getElementById('hero3d-canvas');
  if (!heroEl || !canvas || reduced) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    return; // Fallback-Hero bleibt aktiv
  }

  /* ---------------- Grundgerüst ---------------- */

  const isMobile = matchMedia('(max-width: 760px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x131519);
  scene.fog = new THREE.FogExp2(0x131519, 0.032);

  const camera = new THREE.PerspectiveCamera(40, 2, 0.1, 80);
  const camBase = new THREE.Vector3(4.7, 2.55, 6.4);
  camera.position.copy(camBase);
  const lookBase = new THREE.Vector3(-1.0, 2.0, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* ---------------- Licht ---------------- */

  scene.add(new THREE.HemisphereLight(0x9fb2c2, 0x14161a, 0.5));

  const key = new THREE.DirectionalLight(0xfff1e2, 2.1);
  key.position.set(6, 9, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -8; key.shadow.camera.right = 9;
  key.shadow.camera.top = 8; key.shadow.camera.bottom = -4;
  key.shadow.radius = 6;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x7da2b8, 0.7);
  rim.position.set(-7, 4, -6);
  scene.add(rim);

  const ember = new THREE.PointLight(0xff5a1e, 7, 8, 2);
  scene.add(ember);

  /* ---------------- Materialien ---------------- */

  const steel = new THREE.MeshStandardMaterial({ color: 0xd8dadd, metalness: 1.0, roughness: 0.27 });
  const steelDuct = new THREE.MeshStandardMaterial({ color: 0xccced2, metalness: 1.0, roughness: 0.33 });
  const steelDark = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 1.0, roughness: 0.4 });
  const black = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, metalness: 0.6, roughness: 0.55 });
  const bandDark = new THREE.MeshStandardMaterial({ color: 0x2b2f33, metalness: 0.2, roughness: 0.7 });
  const bandHeat = new THREE.MeshStandardMaterial({ color: 0xe8760f, metalness: 0.15, roughness: 0.6 });
  const ringCold = new THREE.MeshStandardMaterial({ color: 0x35729e, metalness: 0.4, roughness: 0.5 });
  const ringWarm = new THREE.MeshStandardMaterial({ color: 0xd98a2b, metalness: 0.4, roughness: 0.5 });

  /* ---------------- Anlage (alles Gruppe, atmet leicht) ---------------- */

  const rig = new THREE.Group();
  scene.add(rig);

  const pickables = [];
  function tag(mesh, tipKey) {
    mesh.userData.tip = tipKey;
    pickables.push(mesh);
    return mesh;
  }

  function cast(m) { m.castShadow = true; return m; }

  // Hauptgehäuse + Saugzugkasten
  const body = cast(new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 1.0), steel));
  body.position.set(-0.2, 1.8, 0);
  rig.add(tag(body, 'unit'));

  const front = cast(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.86, 0.86), steel));
  front.position.set(1.78, 1.78, 0);
  rig.add(tag(front, 'fan'));

  // Kragen hinten/vorne
  const collarGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.34, 40);
  collarGeo.rotateZ(Math.PI / 2);
  const collarIn = new THREE.Mesh(collarGeo, steelDark);
  collarIn.position.set(-1.95, 1.8, 0);
  rig.add(tag(collarIn, 'in'));
  const collarOut = new THREE.Mesh(collarGeo.clone(), steelDark);
  collarOut.position.set(2.28, 1.78, 0);
  rig.add(tag(collarOut, 'out'));

  // Saugzug-Motor (schwarzer Knauf mit Rippen)
  const motor = new THREE.Group();
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 24), black);
  knob.rotation.z = Math.PI / 2;
  tag(knob, 'fan');
  motor.add(knob);
  for (let i = 0; i < 8; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.06), black);
    fin.rotation.x = (i / 8) * Math.PI;
    motor.add(fin);
  }
  motor.position.set(1.78, 1.58, 0.54);
  motor.rotation.y = Math.PI / 2;   // Knauf zeigt nach vorn aus dem Saugzugkasten
  rig.add(motor);

  // Bypassklappen-Stellantrieb
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.22), bandDark);
  flap.position.set(1.78, 2.28, 0);
  rig.add(tag(flap, 'bypass'));

  // Abhängung: zwei Gewindestangen zur (unsichtbaren) Decke – Montage ohne Stellfläche
  const rodGeo = new THREE.CylinderGeometry(0.025, 0.025, 5.4, 10);
  const rod1 = new THREE.Mesh(rodGeo, steelDark);
  rod1.position.set(-1.35, 2.3 + 2.7, 0);
  rig.add(tag(rod1, 'unit'));
  const rod2 = new THREE.Mesh(rodGeo.clone(), steelDark);
  rod2.position.set(0.95, 2.3 + 2.7, 0);
  rig.add(tag(rod2, 'unit'));

  // Markenband + Schriftzug
  const bandD = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 0.02), bandDark);
  bandD.position.set(-0.2, 1.66, 0.505);
  rig.add(bandD);
  const bandH = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.02), bandHeat);
  bandH.position.set(0.85, 1.66, 0.506);
  rig.add(bandH);

  const decalCanvas = document.createElement('canvas');
  decalCanvas.width = 1024; decalCanvas.height = 192;
  const dcx = decalCanvas.getContext('2d');
  const decalTex = new THREE.CanvasTexture(decalCanvas);
  decalTex.colorSpace = THREE.SRGBColorSpace;
  function drawDecal() {
    dcx.clearRect(0, 0, 1024, 192);
    dcx.fillStyle = '#ffffff';
    dcx.font = '700 108px "Barlow Condensed", "Arial Narrow", sans-serif';
    dcx.fillText('RETHERM', 18, 108);
    dcx.font = '400 40px "Barlow", sans-serif';
    dcx.fillStyle = 'rgba(255,255,255,.82)';
    dcx.fillText('powered by Ganzenmüller', 22, 168);
    decalTex.needsUpdate = true;
  }
  drawDecal();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawDecal);
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.28),
    new THREE.MeshBasicMaterial({ map: decalTex, transparent: true })
  );
  decal.position.set(-0.95, 1.96, 0.512);
  rig.add(decal);

  /* ---------------- Orthogonale Rohrführung ---------------- */

  const R_PIPE = 0.28;    // Rohrradius
  const R_BEND = 0.5;     // Bogenradius (90°-Bogen)

  function pipeX(x1, x2, y, z, r, mat) {
    const m = cast(new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.abs(x2 - x1), 28), mat));
    m.rotation.z = Math.PI / 2;
    m.position.set((x1 + x2) / 2, y, z);
    return m;
  }
  function pipeY(y1, y2, x, z, r, mat) {
    const m = cast(new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.abs(y2 - y1), 28), mat));
    m.position.set(x, (y1 + y2) / 2, z);
    return m;
  }

  // Kamineingang: gerader Lauf von links (aus der Wand) zum hinteren Kragen
  rig.add(tag(pipeX(-5.6, -2.1, 1.8, 0, R_PIPE + 0.01, steelDuct), 'in'));
  // Wandflansch
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 36), steelDark);
  flange.rotation.z = Math.PI / 2;
  flange.position.set(-5.6, 1.8, 0);
  rig.add(flange);

  // Kaminausgang: kurzer Lauf, 90°-Bogen, senkrechter Kamin
  rig.add(tag(pipeX(2.45, 2.7, 1.78, 0, R_PIPE, steelDuct), 'out'));
  const elbow = cast(new THREE.Mesh(new THREE.TorusGeometry(R_BEND, R_PIPE, 22, 32, Math.PI / 2), steelDuct));
  elbow.position.set(2.7, 1.78 + R_BEND, 0);
  elbow.rotation.z = -Math.PI / 2;   // Bogen: von +X kommend nach +Y drehend
  rig.add(tag(elbow, 'out'));
  const riserX = 2.7 + R_BEND;
  rig.add(tag(pipeY(2.28, 6.0, riserX, 0, R_PIPE, steelDuct), 'out'));
  // Kaminmündung
  const rimTop = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.1, 32), steelDark);
  rimTop.position.set(riserX, 6.0, 0);
  rig.add(rimTop);

  // Vor-/Rücklauf: kurze Stutzen mit Farbring (mehr braucht der Blick nicht)
  const portGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.3, 20);
  portGeo.rotateX(Math.PI / 2);
  const portR = new THREE.Mesh(portGeo, steelDark);
  portR.position.set(-0.1, 1.42, 0.62);
  rig.add(tag(portR, 'ret'));
  const portV = new THREE.Mesh(portGeo.clone(), steelDark);
  portV.position.set(0.55, 1.42, 0.62);
  rig.add(tag(portV, 'flow'));
  const ringGeo = new THREE.TorusGeometry(0.1, 0.022, 12, 28);
  const ringR = new THREE.Mesh(ringGeo, ringCold);
  ringR.position.set(-0.1, 1.42, 0.74);
  rig.add(tag(ringR, 'ret'));
  const ringV = new THREE.Mesh(ringGeo.clone(), ringWarm);
  ringV.position.set(0.55, 1.42, 0.74);
  rig.add(tag(ringV, 'flow'));

  /* ---------------- Boden & weicher Schatten ---------------- */

  const groundCanvas = document.createElement('canvas');
  groundCanvas.width = groundCanvas.height = 256;
  const gcx = groundCanvas.getContext('2d');
  const grad = gcx.createRadialGradient(128, 128, 20, 128, 128, 128);
  grad.addColorStop(0, 'rgba(30,33,37,1)');
  grad.addColorStop(1, 'rgba(19,21,25,0)');
  gcx.fillStyle = grad; gcx.fillRect(0, 0, 256, 256);
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(13, 48),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(groundCanvas), transparent: true, roughness: 0.95, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ---------------- Dezente Partikelströme ---------------- */

  function softDot() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const dotTex = softDot();

  class Flow {
    constructor(path, count, size, speed, colorFn, jitter) {
      this.path = path;
      this.count = count; this.speed = speed; this.colorFn = colorFn;
      this.t = new Float32Array(count);
      this.off = [];
      for (let i = 0; i < count; i++) {
        this.t[i] = Math.random();
        this.off.push(new THREE.Vector3((Math.random() - 0.5) * jitter, (Math.random() - 0.5) * jitter, (Math.random() - 0.5) * jitter));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      this.points = new THREE.Points(geo, new THREE.PointsMaterial({
        size, vertexColors: true, map: dotTex, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      }));
      this.points.frustumCulled = false;
      this.tmp = new THREE.Vector3();
      this.col = new THREE.Color();
    }
    update(dt) {
      const pos = this.points.geometry.attributes.position.array;
      const col = this.points.geometry.attributes.color.array;
      for (let i = 0; i < this.count; i++) {
        this.t[i] = (this.t[i] + dt * this.speed * (0.75 + (i % 7) * 0.08)) % 1;
        const u = this.t[i];
        this.path.getPointAt(u, this.tmp);
        pos[i * 3] = this.tmp.x + this.off[i].x;
        pos[i * 3 + 1] = this.tmp.y + this.off[i].y;
        pos[i * 3 + 2] = this.tmp.z + this.off[i].z;
        this.colorFn(u, this.col);
        col[i * 3] = this.col.r; col[i * 3 + 1] = this.col.g; col[i * 3 + 2] = this.col.b;
      }
      this.points.geometry.attributes.position.needsUpdate = true;
      this.points.geometry.attributes.color.needsUpdate = true;
    }
  }

  // Heißes Abgas strömt ein (verschwindet in der Einheit)
  const inPath = new THREE.CurvePath();
  inPath.add(new THREE.LineCurve3(new THREE.Vector3(-5.6, 1.8, 0), new THREE.Vector3(-1.9, 1.8, 0)));
  const cHot = new THREE.Color(0xff3a00), cWarm = new THREE.Color(0xff8a2a);
  const inFlow = new Flow(inPath, isMobile ? 130 : 220, 0.1, 0.11, (u, out) => {
    out.copy(cHot).lerp(cWarm, u * 0.5);
  }, 0.15);
  scene.add(inFlow.points);

  // Gekühltes Abgas verlässt den Kamin (grau, dezent)
  const outPath = new THREE.CurvePath();
  outPath.add(new THREE.LineCurve3(new THREE.Vector3(2.4, 1.78, 0), new THREE.Vector3(2.7, 1.78, 0)));
  outPath.add(new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.7, 1.78, 0), new THREE.Vector3(3.06, 1.92, 0), new THREE.Vector3(3.2, 2.28, 0),
  ]));
  outPath.add(new THREE.LineCurve3(new THREE.Vector3(3.2, 2.28, 0), new THREE.Vector3(3.2, 6.2, 0)));
  const cCool = new THREE.Color(0xa8acae);
  const outFlow = new Flow(outPath, isMobile ? 110 : 190, 0.09, 0.08, (u, out) => {
    out.copy(cCool).multiplyScalar(1 - u * 0.45);
  }, 0.13);
  scene.add(outFlow.points);

  // Glühen am Eingang, warmer Puls am Vorlauf
  function glowSprite(hex, scale, opacity) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dotTex, color: hex, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    s.scale.setScalar(scale);
    scene.add(s);
    return s;
  }
  const glowIn = glowSprite(0xff4400, 1.5, 0.3);
  glowIn.position.set(-2.05, 1.8, 0);
  const glowFlow = glowSprite(0xffb340, 0.7, 0.18);
  glowFlow.position.set(0.55, 1.44, 0.8);

  // Etwas Dampf über der Kaminmündung
  const steams = [];
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dotTex, color: 0xcfd3d6, transparent: true, opacity: 0.1, depthWrite: false,
    }));
    s.position.set(3.5 + (Math.random() - 0.5) * 0.25, 6.1 + Math.random() * 1.2, (Math.random() - 0.5) * 0.25);
    s.scale.setScalar(0.5 + Math.random() * 0.7);
    s.userData.v = 0.22 + Math.random() * 0.25;
    scene.add(s); steams.push(s);
  }

  /* ---------------- Tooltips & Parallax ---------------- */

  const TIP_TEXTS = {
    de: {
      unit: ['RETHERM-Einheit', 'Abgaswärmetauscher, Saugzug und Bypassklappe in einem Gehäuse – montiert ohne Bodenstellplatz.'],
      in: ['Kamineingang', 'Heißes Abgas strömt hinten ein – typisch 150–250 °C, am BHKW deutlich mehr.'],
      out: ['Kaminausgang', 'Auf rund 60 °C gekühlt geht das Abgas in den Kamin.'],
      fan: ['Saugzug', 'Regelt den Kaminzug zentral – gleichmäßiger Betrieb bei jedem Wetter.'],
      bypass: ['Bypassklappe', 'Bei Wartung, Störung oder vollem Speicher: Abgas direkt zum Kamin. Die Produktion läuft immer.'],
      ret: ['Rücklauf', 'Kaltes Wasser strömt im Gegenstrom in den Wärmetauscher.'],
      flow: ['Vorlauf', 'Erwärmtes Wasser mit rund 70 °C versorgt Speicher und Betrieb.'],
    },
    en: {
      unit: ['RETHERM unit', 'Flue gas heat exchanger, induced-draft fan and bypass damper in one housing – mounted without floor space.'],
      in: ['Flue inlet', 'Hot flue gas enters at the rear – typically 150–250 °C, far more at CHP units.'],
      out: ['Flue outlet', 'Cooled to around 60 °C, the gas continues into the chimney.'],
      fan: ['Induced-draft fan', 'Controls the chimney draft centrally – steady operation in any weather.'],
      bypass: ['Bypass damper', 'During maintenance, faults or a full tank: flue gas goes straight to the chimney. Production always runs.'],
      ret: ['Return line', 'Cold water flows into the heat exchanger in counterflow.'],
      flow: ['Flow line', 'Heated water at around 70 °C supplies tank and site.'],
    },
  };
  const tips = (key) => TIP_TEXTS[document.documentElement.lang === 'en' ? 'en' : 'de'][key];

  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const tooltip = document.getElementById('hero3d-tooltip');
  let tipKeyShown = null;

  stage.addEventListener('pointermove', (ev) => {
    const r = stage.getBoundingClientRect();
    pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = ((ev.clientY - r.top) / r.height) * 2 - 1;
    if (!tooltip) return;
    mouse.set(pointer.x, -pointer.y);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(pickables, true)[0];
    const key = hit ? (hit.object.userData.tip || hit.object.parent?.userData?.tip) : null;
    const data = key ? tips(key) : null;
    if (data) {
      if (tipKeyShown !== key) {
        tooltip.querySelector('.tt-title').textContent = data[0];
        tooltip.querySelector('.tt-text').textContent = data[1];
        tooltip.hidden = false;
        tipKeyShown = key;
      }
      tooltip.style.transform = `translate(${ev.clientX - r.left + 16}px, ${ev.clientY - r.top + 14}px)`;
      stage.style.cursor = 'pointer';
    } else {
      tooltip.hidden = true; tipKeyShown = null;
      stage.style.cursor = '';
    }
  });
  stage.addEventListener('pointerleave', () => {
    if (tooltip) { tooltip.hidden = true; tipKeyShown = null; }
  });

  /* ---------------- Render-Loop ---------------- */

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 1.15 ? 52 : 40;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  let running = true;
  const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; }, { rootMargin: '100px' });
  io.observe(heroEl);

  const look = new THREE.Vector3();
  const clock = new THREE.Clock();

  function frame() {
    requestAnimationFrame(frame);
    if (!running || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    inFlow.update(dt);
    outFlow.update(dt);

    // die Anlage atmet kaum merklich
    rig.rotation.y = Math.sin(t * 0.14) * 0.02;
    rig.position.y = Math.sin(t * 0.35) * 0.015;

    ember.position.set(Math.cos(t * 0.3) * 4.2, 2.8 + Math.sin(t * 0.5) * 0.5, Math.sin(t * 0.3) * 4.2);
    glowIn.material.opacity = 0.26 + Math.sin(t * 1.7) * 0.07;
    glowFlow.material.opacity = 0.14 + Math.sin(t * 1.1 + 2) * 0.06;

    steams.forEach((s) => {
      s.position.y += s.userData.v * dt;
      s.material.opacity = Math.max(0, 0.12 - (s.position.y - 6.1) * 0.05);
      if (s.position.y > 8.2) s.position.y = 6.1;
    });

    pointer.sx += (pointer.x - pointer.sx) * 0.04;
    pointer.sy += (pointer.y - pointer.sy) * 0.04;
    camera.position.set(camBase.x + pointer.sx * 0.28, camBase.y - pointer.sy * 0.2, camBase.z);
    look.copy(lookBase);
    camera.lookAt(look);

    renderer.render(scene, camera);
  }

  /* ---------------- Start ---------------- */

  const fallback = document.querySelector('.hero');
  const intro = document.getElementById('hero3d-intro');
  if (fallback && intro) {
    const inner = fallback.querySelector('.hero__inner');
    ['.tag', 'h1', '.hero__lead', '.hero__cta'].forEach((sel) => {
      const el = inner && inner.querySelector(sel);
      if (el) intro.appendChild(el);
    });
    const stats = inner && inner.querySelector('.hero__stats');
    const statsSlot = document.getElementById('hero3d-stats');
    if (stats && statsSlot) statsSlot.appendChild(stats);
  }
  document.body.classList.add('has-3d');
  heroEl.hidden = false;
  resize();
  frame();
  window.__scene3dReady = true;

})();
