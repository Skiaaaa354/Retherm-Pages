/*
 * RETHERM – 3D-Hero (Three.js + GSAP ScrollTrigger)
 *
 * Modelliert nach den Produktbildern: Kamineingang hinten, Kaminausgang mit
 * Saugzug-Motor vorne, Vor-/Rücklauf seitlich, Pufferspeicher mit
 * Temperaturschichtung. Das Innenleben wird bewusst nur BEISPIELHAFT als
 * generische Leuchtspur gezeigt – nie die echte Tauschergeometrie.
 *
 * Fällt ohne WebGL oder bei prefers-reduced-motion sauber auf den
 * statischen Hero zurück (Sektion .hero bleibt dann sichtbar).
 */

'use strict';

import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

(() => {

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroEl = document.getElementById('hero3d');
  const stage = document.getElementById('hero3d-stage');
  const canvas = document.getElementById('hero3d-canvas');
  if (!heroEl || !canvas || reduced || !window.gsap) return;

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
  scene.fog = new THREE.FogExp2(0x131519, 0.035);

  const camera = new THREE.PerspectiveCamera(42, 2, 0.1, 100);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* ---------------- Licht ---------------- */

  scene.add(new THREE.HemisphereLight(0x9fb2c2, 0x14161a, 0.55));

  const key = new THREE.DirectionalLight(0xfff1e2, 2.2);
  key.position.set(6, 9, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -8; key.shadow.camera.right = 10;
  key.shadow.camera.top = 8; key.shadow.camera.bottom = -4;
  key.shadow.radius = 6;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x7da2b8, 0.8);
  rim.position.set(-7, 4, -6);
  scene.add(rim);

  // bewegte Akzent-Lichtquelle (warmes Glühen, kreist langsam)
  const ember = new THREE.PointLight(0xff5a1e, 14, 9, 2);
  scene.add(ember);

  /* ---------------- Materialien ---------------- */

  const steel = new THREE.MeshStandardMaterial({ color: 0xd8dadd, metalness: 1.0, roughness: 0.28 });
  const steelDuct = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 1.0, roughness: 0.34 });
  const steelDark = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 1.0, roughness: 0.4 });
  const black = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, metalness: 0.6, roughness: 0.55 });
  const bandDark = new THREE.MeshStandardMaterial({ color: 0x2b2f33, metalness: 0.2, roughness: 0.7 });
  const bandHeat = new THREE.MeshStandardMaterial({ color: 0xe8760f, metalness: 0.15, roughness: 0.6 });

  // Gehäuse: wird im Röntgen-Kapitel transparent
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xd8dadd, metalness: 1.0, roughness: 0.26,
    transparent: true, opacity: 1.0, side: THREE.DoubleSide,
  });

  /* ---------------- Geometrie-Helfer ---------------- */

  const pickables = [];
  function tag(mesh, tipKey) {
    mesh.userData.tip = tipKey;
    pickables.push(mesh);
    return mesh;
  }

  function tube(points, radius, material, closed) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const geo = new THREE.TubeGeometry(curve, 96, radius, 20, !!closed);
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    return { mesh, curve };
  }

  /* ---------------- RETHERM-Einheit ---------------- */

  const unit = new THREE.Group();
  scene.add(unit);

  // Hauptgehäuse (hinten) + Saugzugkasten (vorne), wie auf den Renderings
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 1.0), bodyMat);
  body.position.set(-0.2, 1.8, 0);
  body.castShadow = true;
  unit.add(tag(body, 'unit'));

  const front = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.86, 0.86), steel);
  front.position.set(1.78, 1.78, 0);
  front.castShadow = true;
  unit.add(tag(front, 'fan'));

  // Kragen hinten (Kamineingang) und vorne (Kaminausgang)
  const collarGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.34, 40);
  collarGeo.rotateZ(Math.PI / 2);
  const collarIn = new THREE.Mesh(collarGeo, steelDark);
  collarIn.position.set(-1.95, 1.8, 0);
  unit.add(tag(collarIn, 'in'));
  const collarOut = new THREE.Mesh(collarGeo.clone(), steelDark);
  collarOut.position.set(2.28, 1.78, 0);
  unit.add(tag(collarOut, 'out'));

  // Saugzug-Motor: schwarzer, gerippter Knauf am vorderen Kasten
  const motor = new THREE.Group();
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 24), black);
  knob.rotation.z = Math.PI / 2;
  motor.add(knob);
  for (let i = 0; i < 8; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.06), black);
    fin.rotation.x = (i / 8) * Math.PI;
    fin.position.set(0, 0, 0);
    motor.add(fin);
  }
  motor.position.set(2.52, 1.55, 0.3);
  unit.add(tag(motor.children[0], 'fan'));
  unit.add(motor);

  // Bypassklappe: kleiner Stellantrieb oben auf dem Saugzugkasten
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.22), bandDark);
  flap.position.set(1.78, 2.28, 0);
  unit.add(tag(flap, 'bypass'));

  // Markenband + Schriftzug (Canvas-Textur)
  const bandD = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 0.02), bandDark);
  bandD.position.set(-0.2, 1.66, 0.505);
  unit.add(bandD);
  const bandH = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.02), bandHeat);
  bandH.position.set(0.85, 1.66, 0.506);
  unit.add(bandH);

  const decalCanvas = document.createElement('canvas');
  decalCanvas.width = 1024; decalCanvas.height = 192;
  const dcx = decalCanvas.getContext('2d');
  function drawDecal() {
    dcx.clearRect(0, 0, 1024, 192);
    dcx.fillStyle = '#ffffff';
    dcx.font = '700 108px "Barlow Condensed", "Arial Narrow", sans-serif';
    dcx.fillText('RETHERM', 18, 108);
    dcx.font = '400 40px "Barlow", sans-serif';
    dcx.fillStyle = 'rgba(255,255,255,.82)';
    dcx.fillText('powered by Ganzenmüller', 22, 168);
  }
  drawDecal();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawDecal(); decalTex.needsUpdate = true; });
  const decalTex = new THREE.CanvasTexture(decalCanvas);
  decalTex.colorSpace = THREE.SRGBColorSpace;
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.28),
    new THREE.MeshBasicMaterial({ map: decalTex, transparent: true })
  );
  decal.position.set(-0.95, 1.96, 0.512);
  unit.add(decal);

  /* ---------------- Rohrleitungen ---------------- */

  // Kamineingang: kommt von hinten links unten (aus Richtung der Öfen)
  const inlet = tube([[-6.2, 0.7, -2.6], [-4.6, 0.9, -2.1], [-3.2, 1.35, -1.1], [-2.5, 1.7, -0.3], [-2.12, 1.8, 0]], 0.3, steelDuct);
  scene.add(inlet.mesh);
  tag(inlet.mesh, 'in');

  // Kaminausgang: steigt vorne zum Kamin auf
  const outlet = tube([[2.45, 1.78, 0], [2.95, 1.82, 0], [3.35, 2.2, 0], [3.5, 3.0, 0], [3.52, 5.2, 0]], 0.28, steelDuct);
  scene.add(outlet.mesh);
  tag(outlet.mesh, 'out');

  // Beispielhafte Innenspur (generische S-Kurve – bewusst NICHT die reale Geometrie)
  const gasInterior = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.78, 1.8, 0), new THREE.Vector3(-0.9, 2.05, 0.18),
    new THREE.Vector3(0.0, 1.55, -0.18), new THREE.Vector3(0.9, 2.02, 0.14),
    new THREE.Vector3(1.78, 1.78, 0),
  ]);
  const waterInterior = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.6, 1.5, 0.22), new THREE.Vector3(0.7, 1.42, -0.12),
    new THREE.Vector3(-0.2, 1.95, 0.2), new THREE.Vector3(-1.1, 1.5, -0.08),
    new THREE.Vector3(-1.55, 1.75, 0.1),
  ]);
  const xray = new THREE.Group();
  const gasTrace = new THREE.Mesh(new THREE.TubeGeometry(gasInterior, 80, 0.075, 14),
    new THREE.MeshBasicMaterial({ color: 0xff6a24, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  const waterTrace = new THREE.Mesh(new THREE.TubeGeometry(waterInterior, 80, 0.06, 14),
    new THREE.MeshBasicMaterial({ color: 0x3fd2c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  xray.add(gasTrace, waterTrace);
  scene.add(xray);

  // Wasseranschlüsse: Rücklauf (kalt, rein) und Vorlauf (warm, raus) an der Vorderseite
  const portGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.3, 20);
  portGeo.rotateX(Math.PI / 2);
  const portR = new THREE.Mesh(portGeo, steelDark);
  portR.position.set(-0.1, 1.42, 0.62);
  unit.add(tag(portR, 'ret'));
  const portV = new THREE.Mesh(portGeo.clone(), steelDark);
  portV.position.set(0.55, 1.42, 0.62);
  unit.add(tag(portV, 'flow'));

  // Pufferspeicher rechts vorne
  const tank = new THREE.Group();
  tank.position.set(5.6, 0, 2.0);
  scene.add(tank);

  const tankShader = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime;
      void main(){
        vec3 cold = vec3(0.075, 0.20, 0.30);
        vec3 warm = vec3(0.22, 0.45, 0.47);
        vec3 hot  = vec3(0.91, 0.34, 0.12);
        float wob = sin(vUv.x*12.566 + uTime*0.7)*0.018 + sin(vUv.x*31.4 - uTime*1.1)*0.01;
        vec3 col = mix(cold, warm, smoothstep(0.0, 0.55, vUv.y));
        col = mix(col, hot, smoothstep(0.52 + wob, 0.72 + wob, vUv.y));
        col += smoothstep(0.985, 1.0, fract(vUv.y*7.0)) * 0.03;  // feine Schichtlinien
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const tankBody = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 2.1, 48, 1, true), tankShader);
  tankBody.position.y = 1.15;
  tank.add(tag(tankBody, 'tank'));
  const capGeo = new THREE.SphereGeometry(0.62, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  const capTop = new THREE.Mesh(capGeo, steel);
  capTop.position.y = 2.2; capTop.castShadow = true;
  const capBot = new THREE.Mesh(capGeo.clone(), steel);
  capBot.rotation.x = Math.PI; capBot.position.y = 0.12;
  tank.add(capTop, capBot);
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.625, 0.02, 12, 60), steelDark);
  ring1.rotation.x = Math.PI / 2; ring1.position.y = 0.35; tank.add(ring1);
  const ring2 = ring1.clone(); ring2.position.y = 1.95; tank.add(ring2);

  // Wasserleitungen Einheit <-> Speicher
  const retPipe = tube([[5.15, 0.6, 1.75], [3.6, 0.55, 1.6], [1.6, 0.75, 1.25], [0.15, 1.1, 0.9], [-0.1, 1.42, 0.75]], 0.085, steelDuct);
  scene.add(retPipe.mesh);
  tag(retPipe.mesh, 'ret');
  const flowPipe = tube([[0.55, 1.42, 0.75], [0.9, 1.5, 1.1], [2.4, 1.75, 1.55], [4.3, 1.95, 1.85], [5.15, 1.9, 1.95]], 0.085, steelDuct);
  scene.add(flowPipe.mesh);
  tag(flowPipe.mesh, 'flow');

  /* ---------------- Boden & weicher Schatten ---------------- */

  const groundCanvas = document.createElement('canvas');
  groundCanvas.width = groundCanvas.height = 256;
  const gcx = groundCanvas.getContext('2d');
  const grad = gcx.createRadialGradient(128, 128, 20, 128, 128, 128);
  grad.addColorStop(0, 'rgba(30,33,37,1)');
  grad.addColorStop(1, 'rgba(19,21,25,0)');
  gcx.fillStyle = grad; gcx.fillRect(0, 0, 256, 256);
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(14, 48),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(groundCanvas), transparent: true, roughness: 0.95, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ---------------- Partikelströme ---------------- */

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
    constructor(curves, count, size, speed, colorFn, jitter) {
      this.path = new THREE.CurvePath();
      curves.forEach(c => this.path.add(c));
      this.count = count; this.speed = speed; this.colorFn = colorFn; this.jitter = jitter;
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
        size, vertexColors: true, map: dotTex, transparent: true, opacity: 0.9,
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

  // Abgas: rot -> orange -> hellgrau (Wärmeabgabe), danach kühl zum Kamin
  const gasCurves = [inlet.curve, gasInterior, outlet.curve];
  const gasPath = new THREE.CurvePath(); gasCurves.forEach(c => gasPath.add(c));
  const lenIn = inlet.curve.getLength(), lenMid = gasInterior.getLength(), lenOut = outlet.curve.getLength();
  const gTotal = lenIn + lenMid + lenOut;
  const g1 = lenIn / gTotal, g2 = (lenIn + lenMid) / gTotal;
  const cHot = new THREE.Color(0xff3a00), cMid = new THREE.Color(0xff8a2a), cCool = new THREE.Color(0xb9bcbc);
  const gasFlow = new Flow(gasCurves, isMobile ? 380 : 720, 0.11, 0.055, (u, out) => {
    if (u < g1) out.copy(cHot).lerp(cMid, u / g1 * 0.6);
    else if (u < g2) out.copy(cMid).lerp(cCool, (u - g1) / (g2 - g1));
    else out.copy(cCool);
  }, 0.16);
  scene.add(gasFlow.points);

  // Wasser im Gegenstrom: dunkelblau -> türkis -> gold
  const waterCurves = [retPipe.curve, waterInterior, flowPipe.curve];
  const wLens = waterCurves.map(c => c.getLength());
  const wTotal = wLens[0] + wLens[1] + wLens[2];
  const w1 = wLens[0] / wTotal, w2 = (wLens[0] + wLens[1]) / wTotal;
  const cCold = new THREE.Color(0x1b4a78), cTurq = new THREE.Color(0x35c2b0), cGold = new THREE.Color(0xffb340);
  const waterFlow = new Flow(waterCurves, isMobile ? 260 : 500, 0.085, 0.045, (u, out) => {
    if (u < w1) out.copy(cCold);
    else if (u < w2) {
      const v = (u - w1) / (w2 - w1);
      if (v < 0.5) out.copy(cCold).lerp(cTurq, v * 2);
      else out.copy(cTurq).lerp(cGold, (v - 0.5) * 2);
    } else out.copy(cGold);
  }, 0.1);
  scene.add(waterFlow.points);

  /* ---------------- Glüh-Sprites & Dampf ---------------- */

  function glowSprite(hex, scale) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dotTex, color: hex, transparent: true, opacity: 0.0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    s.scale.setScalar(scale);
    scene.add(s);
    return s;
  }
  const glowIn = glowSprite(0xff4400, 1.6); glowIn.position.set(-2.05, 1.8, 0); glowIn.material.opacity = 0.35;
  const glowCore = glowSprite(0xff6a24, 2.6); glowCore.position.set(0, 1.8, 0);
  const glowFlow = glowSprite(0xffb340, 1.0); glowFlow.position.set(0.55, 1.45, 0.8); glowFlow.material.opacity = 0.2;

  const steamGroup = new THREE.Group();
  scene.add(steamGroup);
  const steams = [];
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dotTex, color: 0xcfd3d6, transparent: true, opacity: 0.12, depthWrite: false,
    }));
    s.position.set(3.52 + (Math.random() - 0.5) * 0.3, 5.2 + Math.random() * 1.4, (Math.random() - 0.5) * 0.3);
    s.scale.setScalar(0.5 + Math.random() * 0.8);
    s.userData.v = 0.25 + Math.random() * 0.3;
    steamGroup.add(s); steams.push(s);
  }

  /* ---------------- Kamera-Reise (Scroll) ---------------- */

  const CHAPTERS = [
    { pos: [8.2, 3.4, 9.6], look: [1.4, 1.9, 0.4] },   // Auftakt: Gesamtszene
    { pos: [-4.9, 2.1, 3.6], look: [-2.2, 1.7, -0.2] }, // Kamineingang
    { pos: [0.2, 2.5, 3.2], look: [0.0, 1.78, 0.0] },   // Wärmeübertragung (Röntgen)
    { pos: [4.9, 2.8, 3.6], look: [2.9, 2.3, 0.0] },    // Kaminausgang + Saugzug
    { pos: [1.7, 1.05, 3.4], look: [0.35, 1.42, 0.5] }, // Vor-/Rücklauf
    { pos: [8.0, 1.9, 5.0], look: [5.6, 1.25, 2.0] },   // Pufferspeicher
    { pos: [8.8, 3.6, 10.2], look: [1.8, 1.8, 0.6] },   // Finale
  ];

  const camState = {
    px: CHAPTERS[0].pos[0], py: CHAPTERS[0].pos[1], pz: CHAPTERS[0].pos[2],
    lx: CHAPTERS[0].look[0], ly: CHAPTERS[0].look[1], lz: CHAPTERS[0].look[2],
    xray: 0,
  };

  gsap.registerPlugin(ScrollTrigger);
  const tl = gsap.timeline({
    scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
    defaults: { ease: 'power1.inOut' },
  });

  const captions = [...document.querySelectorAll('.hero3d__caption')];
  const intro = document.getElementById('hero3d-intro');
  const hint = document.getElementById('hero3d-hint');

  CHAPTERS.forEach((ch, i) => {
    if (i === 0) return;
    tl.to(camState, {
      px: ch.pos[0], py: ch.pos[1], pz: ch.pos[2],
      lx: ch.look[0], ly: ch.look[1], lz: ch.look[2],
      duration: 1,
    }, i - 1);
  });
  // Intro-Overlay & Scrollhinweis ausblenden
  if (intro) tl.to(intro, { autoAlpha: 0, y: -40, duration: 0.35, ease: 'power1.in' }, 0.05);
  if (hint) tl.to(hint, { autoAlpha: 0, duration: 0.2 }, 0.1);
  // Röntgenblick, solange die Kamera im Kapitel Wärmeübertragung steht
  // (Kamera erreicht Kapitel i+1 zum Timeline-Zeitpunkt i+1)
  tl.to(camState, { xray: 1, duration: 0.5 }, 1.7)
    .to(camState, { xray: 0, duration: 0.45 }, 2.85);
  // Kapiteltexte: einblenden zur Ankunft, halten, kurz vor dem nächsten raus
  captions.forEach((el, i) => {
    tl.fromTo(el, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.3 }, i + 0.7)
      .to(el, { autoAlpha: 0, y: -20, duration: 0.22 }, i + 1.72);
  });

  /* ---------------- Parallax & Tooltips ---------------- */

  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const tooltip = document.getElementById('hero3d-tooltip');
  let tipVisible = null;

  stage.addEventListener('pointermove', (ev) => {
    const r = stage.getBoundingClientRect();
    pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = ((ev.clientY - r.top) / r.height) * 2 - 1;
    mouse.set(pointer.x, -pointer.y);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(pickables, true)[0];
    const key = hit ? (hit.object.userData.tip || hit.object.parent?.userData?.tip) : null;
    if (key && tooltip) {
      const data = TIPS[key];
      if (data && tipVisible !== key) {
        tooltip.querySelector('.tt-title').textContent = data[0];
        tooltip.querySelector('.tt-text').textContent = data[1];
        tooltip.hidden = false;
        tipVisible = key;
      }
      tooltip.style.transform = `translate(${ev.clientX - r.left + 16}px, ${ev.clientY - r.top + 14}px)`;
      stage.style.cursor = 'pointer';
    } else if (tooltip) {
      tooltip.hidden = true; tipVisible = null;
      stage.style.cursor = '';
    }
  });
  stage.addEventListener('pointerleave', () => {
    if (tooltip) { tooltip.hidden = true; tipVisible = null; }
  });

  // Tooltip-Texte zweisprachig; Sprache folgt dem html-lang-Attribut
  const TIP_TEXTS = {
    de: {
      unit: ['RETHERM-Einheit', 'Abgaswärmetauscher, Saugzug und Bypassklappe in einem Gehäuse – montiert ohne Bodenstellplatz.'],
      in: ['Kamineingang', 'Heißes Abgas strömt hinten ein – typisch 150–250 °C, am BHKW deutlich mehr.'],
      out: ['Kaminausgang', 'Auf rund 60 °C gekühlt geht das Abgas in den Kamin.'],
      fan: ['Saugzug', 'Regelt den Kaminzug zentral – gleichmäßiger Betrieb bei jedem Wetter.'],
      bypass: ['Bypassklappe', 'Bei Wartung, Störung oder vollem Speicher: Abgas direkt zum Kamin. Die Produktion läuft immer.'],
      ret: ['Rücklauf', 'Kaltes Wasser strömt im Gegenstrom in den Wärmetauscher.'],
      flow: ['Vorlauf', 'Erwärmtes Wasser mit rund 70 °C versorgt Speicher und Betrieb.'],
      tank: ['Pufferspeicher', 'Temperaturschichtung: unten kalt, oben heiß – Wärme auf Abruf.'],
    },
    en: {
      unit: ['RETHERM unit', 'Flue gas heat exchanger, induced-draft fan and bypass damper in one housing – mounted without floor space.'],
      in: ['Flue inlet', 'Hot flue gas enters at the rear – typically 150–250 °C, far more at CHP units.'],
      out: ['Flue outlet', 'Cooled to around 60 °C, the gas continues into the chimney.'],
      fan: ['Induced-draft fan', 'Controls the chimney draft centrally – steady operation in any weather.'],
      bypass: ['Bypass damper', 'During maintenance, faults or a full tank: flue gas goes straight to the chimney. Production always runs.'],
      ret: ['Return line', 'Cold water flows into the heat exchanger in counterflow.'],
      flow: ['Flow line', 'Heated water at around 70 °C supplies tank and site.'],
      tank: ['Buffer tank', 'Temperature stratification: cold below, hot on top – heat on demand.'],
    },
  };
  const TIPS = new Proxy({}, {
    get(_, key) {
      const lang = document.documentElement.lang === 'en' ? 'en' : 'de';
      return TIP_TEXTS[lang][key];
    },
  });

  /* ---------------- Render-Loop ---------------- */

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // schmale Viewports: weiteres Sichtfeld, damit die Anlage neben dem Text Platz hat
    camera.fov = camera.aspect < 1.15 ? 54 : 42;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  let running = true;
  const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; }, { rootMargin: '200px' });
  io.observe(heroEl);

  const look = new THREE.Vector3();
  const clock = new THREE.Clock();

  function frame() {
    requestAnimationFrame(frame);
    if (!running || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    gasFlow.update(dt);
    waterFlow.update(dt);

    tankShader.uniforms.uTime.value = t;
    ember.position.set(Math.cos(t * 0.4) * 4.5, 2.6 + Math.sin(t * 0.7) * 0.6, Math.sin(t * 0.4) * 4.5);
    glowCore.material.opacity = camState.xray * (0.5 + Math.sin(t * 2.4) * 0.12);
    gasTrace.material.opacity = camState.xray * 0.85;
    waterTrace.material.opacity = camState.xray * 0.7;
    bodyMat.opacity = 1 - camState.xray * 0.82;
    bodyMat.depthWrite = camState.xray < 0.4;

    steams.forEach((s) => {
      s.position.y += s.userData.v * dt;
      s.material.opacity = Math.max(0, 0.14 - (s.position.y - 5.2) * 0.05);
      if (s.position.y > 7.6) s.position.y = 5.2;
    });

    // sanftes Maus-Parallax auf die Kamerafahrt aufgesetzt
    pointer.sx += (pointer.x - pointer.sx) * 0.04;
    pointer.sy += (pointer.y - pointer.sy) * 0.04;
    camera.position.set(
      camState.px + pointer.sx * 0.35,
      camState.py - pointer.sy * 0.25,
      camState.pz
    );
    look.set(camState.lx, camState.ly, camState.lz);
    camera.lookAt(look);

    renderer.render(scene, camera);
  }

  /* ---------------- Start ---------------- */

  // Intro-Inhalte (H1, Lead, CTAs) aus dem Fallback-Hero übernehmen
  const fallback = document.querySelector('.hero');
  if (fallback && intro) {
    const inner = fallback.querySelector('.hero__inner');
    ['.tag', 'h1', '.hero__lead', '.hero__cta'].forEach((sel) => {
      const el = inner && inner.querySelector(sel);
      if (el) intro.appendChild(el);
    });
  }
  document.body.classList.add('has-3d');
  heroEl.hidden = false;
  resize();
  ScrollTrigger.refresh();
  frame();
  window.__scene3dReady = true;
  window.__hero3d = { camState, renderer };

})();
