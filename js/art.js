/* WAR GUILD II · SHADOW MONARCH — art & battlefield rendering */
(() => {
  'use strict';
  const WG = window.WG;
  const { clamp, rand, TAU, mulberry32 } = WG;
  const Art = {};

  const X = 740, Y = 460; // world-to-cache offset

  // ── Static arena texture ───────────────────────────────────
  Art.buildArena = function () {
    const cv = document.createElement('canvas');
    cv.width = 1480; cv.height = 920;
    const g = cv.getContext('2d');
    const rng = mulberry32(0x51A0D0);
    const R = (a, b) => a + rng() * (b - a);

    // Void beyond the field.
    const voidGrad = g.createRadialGradient(X, Y + 30, 100, X, Y, 880);
    voidGrad.addColorStop(0, '#0b0b12');
    voidGrad.addColorStop(.62, '#07080d');
    voidGrad.addColorStop(1, '#030408');
    g.fillStyle = voidGrad; g.fillRect(0, 0, 1480, 920);

    // Outer raised stone lip.
    g.save();
    g.translate(X, Y);
    const outer = new Path2D();
    outer.roundRect(-706, -434, 1412, 868, 42);
    const edge = g.createLinearGradient(0, -434, 0, 434);
    edge.addColorStop(0, '#181a23'); edge.addColorStop(.5, '#0d0f16'); edge.addColorStop(1, '#12131b');
    g.fillStyle = edge; g.fill(outer);
    g.strokeStyle = 'rgba(198,177,132,.18)'; g.lineWidth = 2; g.stroke(outer);

    // Field floor.
    const floor = new Path2D();
    floor.roundRect(-680, -410, 1360, 820, 28);
    const ground = g.createLinearGradient(0, -410, 0, 410);
    ground.addColorStop(0, '#1b1d28'); ground.addColorStop(.45, '#151721'); ground.addColorStop(1, '#0f1119');
    g.fillStyle = ground; g.fill(floor);
    g.save(); g.clip(floor);

    // Stone slabs in staggered rows.
    const tw = 56, th = 40;
    for (let y = -420, row = 0; y < 420; y += th, row++) {
      for (let x = -700 - (row % 2) * tw / 2; x < 710; x += tw) {
        const v = R(-5, 7);
        const base = 22 + v;
        g.fillStyle = `rgb(${base + 4},${base + 5},${base + 11})`;
        g.fillRect(x + 1.5, y + 1.5, tw - 3, th - 3);
        g.strokeStyle = `rgba(3,3,6,${R(.38, .62)})`;
        g.lineWidth = 1.4;
        g.strokeRect(x + .7, y + .7, tw - 1.4, th - 1.4);
        // Faint worn highlight.
        g.strokeStyle = `rgba(198,198,214,${R(.02, .065)})`;
        g.beginPath(); g.moveTo(x + 5, y + 3); g.lineTo(x + tw - 7, y + 3); g.stroke();
      }
    }

    // Central approach — darker, larger flagstones.
    const aisle = g.createLinearGradient(-230, 0, 230, 0);
    aisle.addColorStop(0, 'rgba(5,5,10,0)');
    aisle.addColorStop(.18, 'rgba(9,9,15,.38)');
    aisle.addColorStop(.5, 'rgba(20,20,32,.28)');
    aisle.addColorStop(.82, 'rgba(9,9,15,.38)');
    aisle.addColorStop(1, 'rgba(5,5,10,0)');
    g.fillStyle = aisle; g.fillRect(-250, -410, 500, 820);
    for (let y = -410; y < 410; y += 92) {
      g.strokeStyle = 'rgba(4,4,8,.62)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-214, y); g.lineTo(214, y); g.stroke();
    }

    // Crack network.
    g.strokeStyle = 'rgba(3,3,6,.72)';
    for (let i = 0; i < 52; i++) {
      let cx = R(-665, 665), cy = R(-395, 395);
      g.beginPath(); g.moveTo(cx, cy);
      const segs = 2 + Math.floor(R(0, 4));
      for (let s = 0; s < segs; s++) {
        cx += R(-28, 28); cy += R(-17, 17);
        g.lineTo(cx, cy);
      }
      g.lineWidth = R(.45, 1.3); g.stroke();
    }

    // Old blood.
    for (let i = 0; i < 9; i++) {
      const bx = R(-560, 560), by = R(-310, 350), br = R(15, 47);
      const blood = g.createRadialGradient(bx, by, 0, bx, by, br);
      blood.addColorStop(0, `rgba(72,12,20,${R(.1,.22)})`);
      blood.addColorStop(1, 'rgba(40,5,10,0)');
      g.fillStyle = blood;
      g.beginPath(); g.ellipse(bx, by, br, br * .4, R(0, TAU), 0, TAU); g.fill();
    }

    // The Monarch's seal — inlaid concentric rune circle.
    g.save(); g.translate(0, 22);
    const aura = g.createRadialGradient(0, 0, 24, 0, 0, 225);
    aura.addColorStop(0, 'rgba(104,67,189,.085)');
    aura.addColorStop(.62, 'rgba(71,43,140,.035)');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = aura; g.beginPath(); g.arc(0, 0, 228, 0, TAU); g.fill();

    g.strokeStyle = 'rgba(140,105,213,.16)';
    g.lineWidth = 2;
    [214, 188, 118, 96].forEach((r, idx) => {
      g.beginPath(); g.arc(0, 0, r, 0, TAU);
      g.lineWidth = idx === 0 ? 2 : 1; g.stroke();
    });
    g.strokeStyle = 'rgba(184,150,96,.1)';
    g.beginPath(); g.arc(0, 0, 160, 0, TAU); g.stroke();
    for (let i = 0; i < 48; i++) {
      const a = i / 48 * TAU;
      const r1 = i % 3 === 0 ? 187 : 195, r2 = 207;
      g.beginPath();
      g.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      g.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      g.strokeStyle = `rgba(137,102,211,${i % 3 === 0 ? .2 : .09})`;
      g.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + .2;
      const x1 = Math.cos(a) * 145, y1 = Math.sin(a) * 145;
      const x2 = Math.cos(a + .2) * 174, y2 = Math.sin(a + .2) * 174;
      const x3 = Math.cos(a - .2) * 174, y3 = Math.sin(a - .2) * 174;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.closePath();
      g.strokeStyle = 'rgba(161,126,225,.16)'; g.stroke();
    }
    g.restore();

    // Gold processional lines + sigils.
    g.strokeStyle = 'rgba(186,155,98,.13)'; g.lineWidth = 2;
    [-252, 252].forEach(x => {
      g.beginPath(); g.moveTo(x, -385); g.lineTo(x, 335); g.stroke();
      for (let y = -350; y < 330; y += 76) {
        g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x, y + 7); g.lineTo(x + 6, y); g.stroke();
      }
    });

    // Scattered rubble and old shields.
    for (let i = 0; i < 30; i++) {
      const x = R(-640, 640), y = R(-380, 390);
      if (Math.abs(x) < 240 && y > -250) continue;
      g.fillStyle = `rgba(${R(35,55)},${R(34,50)},${R(38,55)},${R(.24,.55)})`;
      g.beginPath(); g.ellipse(x, y, R(2, 8), R(1, 4), R(0, TAU), 0, TAU); g.fill();
    }
    g.restore();

    // Inner floor rim.
    g.strokeStyle = 'rgba(201,173,117,.1)'; g.lineWidth = 1.5;
    g.stroke(floor);

    // Fog / shadow at the gate.
    const gateFog = g.createRadialGradient(X, 75, 8, X, 75, 320);
    gateFog.addColorStop(0, 'rgba(86,46,155,.16)');
    gateFog.addColorStop(.55, 'rgba(43,23,84,.07)');
    gateFog.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gateFog; g.fillRect(0, 0, 1480, 460);

    g.restore();
    return cv;
  };

  // ── Architecture ───────────────────────────────────────────
  Art.drawGate = function (ctx, game) {
    const p = game.project(0, WG.WORLD.gateY, 0);
    const s = game.cam.zoom;
    const t = game.time;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(s, s);

    // Ground shadow / mist.
    const mist = ctx.createRadialGradient(0, 0, 10, 0, 0, 185);
    mist.addColorStop(0, 'rgba(79,45,143,.22)');
    mist.addColorStop(.6, 'rgba(38,20,72,.08)');
    mist.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mist;
    ctx.beginPath(); ctx.ellipse(0, 2, 190, 38, 0, 0, TAU); ctx.fill();

    // Two basalt towers.
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side, 1);
      const tower = ctx.createLinearGradient(56, 0, 136, 0);
      tower.addColorStop(0, '#07070b'); tower.addColorStop(.55, '#1c1b23'); tower.addColorStop(1, '#0a0a10');
      ctx.fillStyle = tower;
      ctx.beginPath();
      ctx.moveTo(54, 1); ctx.lineTo(55, -118); ctx.lineTo(74, -143); ctx.lineTo(84, -128);
      ctx.lineTo(108, -130); ctx.lineTo(112, -150); ctx.lineTo(128, -122); ctx.lineTo(132, 1);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(201,173,117,.12)'; ctx.lineWidth = 1; ctx.stroke();
      // Violet window.
      const wg = ctx.createLinearGradient(0, -91, 0, -56);
      wg.addColorStop(0, 'rgba(159,108,255,.6)'); wg.addColorStop(1, 'rgba(65,34,128,.18)');
      ctx.fillStyle = wg;
      ctx.beginPath(); ctx.roundRect(82, -91, 18, 35, 9); ctx.fill();
      ctx.fillStyle = 'rgba(3,3,6,.9)';
      for (let y = -84; y < -60; y += 8) ctx.fillRect(79, y, 24, 2);
      // Blocks.
      ctx.strokeStyle = 'rgba(0,0,0,.45)';
      for (let y = -44; y < 0; y += 16) { ctx.beginPath(); ctx.moveTo(58, y); ctx.lineTo(130, y); ctx.stroke(); }
      ctx.restore();
    }

    // Arch.
    const archGrad = ctx.createLinearGradient(0, -158, 0, 0);
    archGrad.addColorStop(0, '#24222d'); archGrad.addColorStop(.45, '#131219'); archGrad.addColorStop(1, '#08080d');
    ctx.fillStyle = archGrad;
    ctx.beginPath();
    ctx.moveTo(-91, 0); ctx.lineTo(-91, -88);
    ctx.quadraticCurveTo(-90, -152, 0, -169);
    ctx.quadraticCurveTo(90, -152, 91, -88);
    ctx.lineTo(91, 0); ctx.lineTo(54, 0); ctx.lineTo(54, -83);
    ctx.quadraticCurveTo(0, -126, -54, -83);
    ctx.lineTo(-54, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(201,173,117,.15)'; ctx.lineWidth = 1.2; ctx.stroke();

    // Keystone skull.
    ctx.save(); ctx.translate(0, -147);
    ctx.fillStyle = '#0a090d';
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(198,157,81,.5)';
    ctx.beginPath(); ctx.arc(-3.5, -1, 2.2, 0, TAU); ctx.arc(3.5, -1, 2.2, 0, TAU); ctx.fill();
    ctx.fillRect(-2, 4, 4, 3);
    ctx.restore();

    // Rune etchings.
    ctx.strokeStyle = `rgba(151,112,231,${.2 + Math.sin(t * 1.3) * .05})`; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(i * 18 - 4, -76); ctx.lineTo(i * 18, -67); ctx.lineTo(i * 18 + 4, -76); ctx.stroke();
    }

    // The rift.
    const portal = ctx.createRadialGradient(0, -47, 4, 0, -42, 52);
    portal.addColorStop(0, `rgba(210,177,255,${.5 + Math.sin(t * 2.2) * .08})`);
    portal.addColorStop(.24, 'rgba(120,73,221,.48)');
    portal.addColorStop(.68, 'rgba(55,23,109,.28)');
    portal.addColorStop(1, 'rgba(18,8,39,0)');
    ctx.fillStyle = portal;
    ctx.beginPath(); ctx.ellipse(0, -43, 48, 79, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = t * (.28 + i * .03) + i * 1.7;
      const rx = Math.cos(a) * (22 + i * 3), ry = -43 + Math.sin(a * 1.4) * 38;
      ctx.strokeStyle = `rgba(194,157,255,${.14 - i * .018})`;
      ctx.beginPath(); ctx.ellipse(rx, ry, 16, 34, a, 0, TAU); ctx.stroke();
    }
    // Gate chains.
    ctx.strokeStyle = 'rgba(104,93,82,.25)'; ctx.lineWidth = 1.3;
    for (const x of [-40, 40]) {
      ctx.beginPath(); ctx.moveTo(x, -118); ctx.quadraticCurveTo(x + (x > 0 ? 18 : -18), -64, x + (x > 0 ? 8 : -8), -25); ctx.stroke();
    }
    ctx.restore();
  };

  Art.drawPillar = function (ctx, game, pillar) {
    const p = game.project(pillar.x, pillar.y, 0);
    const s = game.cam.zoom;
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,.34)';
    ctx.beginPath(); ctx.ellipse(0, 2, 34, 9, 0, 0, TAU); ctx.fill();
    const grad = ctx.createLinearGradient(-22, 0, 23, 0);
    grad.addColorStop(0, '#09090f'); grad.addColorStop(.45, '#22212b'); grad.addColorStop(1, '#0a0a11');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-25, 0); ctx.lineTo(-18, -17); ctx.lineTo(-14, -156); ctx.lineTo(0, -172);
    ctx.lineTo(14, -156); ctx.lineTo(18, -17); ctx.lineTo(25, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(201,173,117,.1)'; ctx.lineWidth = .9; ctx.stroke();
    // Base rings.
    ctx.fillStyle = '#15141c';
    ctx.fillRect(-27, -7, 54, 7);
    ctx.fillStyle = '#1d1b25'; ctx.fillRect(-20, -21, 40, 6);
    // Floating rune band.
    const glow = .35 + Math.sin(game.time * 1.6 + pillar.phase) * .12;
    ctx.strokeStyle = `rgba(155,111,244,${glow})`;
    ctx.beginPath(); ctx.arc(0, -86, 17, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -111); ctx.lineTo(5, -97); ctx.lineTo(0, -86); ctx.lineTo(-5, -97); ctx.closePath(); ctx.stroke();
    ctx.restore();
  };

  Art.drawBrazier = function (ctx, game, brazier) {
    const p = game.project(brazier.x, brazier.y, 0);
    const s = game.cam.zoom;
    const t = game.time + brazier.phase;
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
    const glow = ctx.createRadialGradient(0, -42, 2, 0, -42, 54);
    glow.addColorStop(0, 'rgba(255,176,94,.24)');
    glow.addColorStop(.45, 'rgba(173,78,235,.1)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, -42, 54, 0, TAU); ctx.fill();
    // Stand.
    ctx.fillStyle = '#14121a';
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-7, -19); ctx.lineTo(7, -19); ctx.lineTo(4, 0); ctx.fill();
    ctx.fillStyle = '#25202b'; ctx.beginPath(); ctx.ellipse(0, -21, 15, 5, 0, 0, TAU); ctx.fill();
    // Bowl.
    ctx.fillStyle = '#15121a';
    ctx.beginPath(); ctx.moveTo(-16, -25); ctx.quadraticCurveTo(0, -11, 16, -25); ctx.lineTo(11, -35); ctx.lineTo(-11, -35); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(201,173,117,.18)'; ctx.stroke();
    // Flame.
    for (let i = 0; i < 3; i++) {
      const h = 19 + Math.sin(t * 7 + i * 2.3) * 8 + i * 3;
      const sway = Math.sin(t * 4.2 + i) * 3;
      const fg = ctx.createLinearGradient(0, -36, 0, -36 - h);
      fg.addColorStop(0, 'rgba(153,75,255,.55)'); fg.addColorStop(.55, 'rgba(216,124,255,.36)'); fg.addColorStop(1, 'rgba(255,226,173,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-6 - i * 2, -34); ctx.quadraticCurveTo(sway - 2, -34 - h * .6, sway, -37 - h);
      ctx.quadraticCurveTo(sway + 3, -34 - h * .5, 6 + i * 2, -34); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };

  Art.drawCore = function (ctx, game) {
    const core = game.core;
    if (!core) return;
    const p = game.project(core.x, core.y, 0);
    const s = game.cam.zoom;
    const t = game.time;
    const health = clamp(core.hp / core.maxHp, 0, 1);
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);

    // Base ring.
    ctx.strokeStyle = `rgba(167,123,255,${.28 + Math.sin(t * 2) * .08})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 5, 37, 13, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(201,173,117,.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 5, 28, 9, 0, 0, TAU); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = t * .4 + i / 6 * TAU;
      ctx.fillStyle = 'rgba(184,143,255,.7)';
      ctx.fillRect(Math.cos(a) * 33 - 1, 4 + Math.sin(a) * 11, 2, 2);
    }
    // Pedestal.
    const ped = ctx.createLinearGradient(-24, 0, 24, 0);
    ped.addColorStop(0, '#09090e'); ped.addColorStop(.5, '#27232e'); ped.addColorStop(1, '#08080d');
    ctx.fillStyle = ped;
    ctx.beginPath(); ctx.moveTo(-24, 3); ctx.lineTo(-14, -17); ctx.lineTo(14, -17); ctx.lineTo(24, 3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(201,173,117,.16)'; ctx.stroke();
    // Crystal.
    const pulse = .72 + Math.sin(t * 2.7) * .14;
    const glow = ctx.createRadialGradient(0, -51, 2, 0, -51, 49);
    glow.addColorStop(0, `rgba(213,181,255,${.34 * pulse})`);
    glow.addColorStop(.4, `rgba(128,74,237,${.18 * pulse})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, -51, 49, 0, TAU); ctx.fill();
    if (health < .35) {
      ctx.fillStyle = `rgba(215,55,70,${.16 + Math.sin(t * 8) * .06})`;
      ctx.beginPath(); ctx.arc(0, -51, 39, 0, TAU); ctx.fill();
    }
    const crys = ctx.createLinearGradient(0, -84, 0, -22);
    crys.addColorStop(0, health < .35 ? '#ffb0b7' : '#e7d5ff');
    crys.addColorStop(.45, health < .35 ? '#c6283d' : '#8d5ce7');
    crys.addColorStop(1, '#251040');
    ctx.fillStyle = crys;
    ctx.beginPath();
    ctx.moveTo(0, -90); ctx.lineTo(18, -62); ctx.lineTo(11, -29); ctx.lineTo(-10, -25); ctx.lineTo(-19, -62); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(245,230,255,.42)'; ctx.lineWidth = .9; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.2)';
    ctx.beginPath(); ctx.moveTo(0, -86); ctx.lineTo(-3, -59); ctx.lineTo(8, -34); ctx.stroke();
    // Orbiting runes.
    for (let i = 0; i < 3; i++) {
      const a = t * (.55 + i * .12) + i * 2.1;
      const rx = Math.cos(a) * (26 + i * 5), ry = -53 + Math.sin(a) * 9;
      ctx.fillStyle = `rgba(194,158,255,${.28 + i * .1})`;
      ctx.fillRect(rx - 2, ry - 2, 4, 4);
    }
    ctx.restore();

    // Relic marker for clarity.
    const top = game.project(core.x, core.y, 96);
    ctx.save();
    ctx.strokeStyle = 'rgba(201,173,117,.36)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(top.x, top.y - 5); ctx.lineTo(top.x, top.y - 14); ctx.stroke();
    ctx.fillStyle = 'rgba(201,173,117,.6)';
    ctx.beginPath(); ctx.moveTo(top.x, top.y - 20); ctx.lineTo(top.x + 5, top.y - 16); ctx.lineTo(top.x, top.y - 12); ctx.lineTo(top.x - 5, top.y - 16); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  // ── Characters ─────────────────────────────────────────────
  function drawGroundShadow(ctx, sx, sy, s, width = 17, alpha = .5) {
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, width * s);
    grad.addColorStop(0, `rgba(0,0,0,${alpha})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(sx, sy + 2, width * s, width * .38 * s, 0, 0, TAU); ctx.fill();
  }

  function drawHumanoid(ctx, sx, sy, s, o) {
    const t = o.time || 0;
    const moving = o.moving;
    const facing = o.facing || 1;
    const pal = o.palette;
    const boss = o.type === 'boss' || o.boss;
    const hero = o.hero;
    const shadow = o.shadow;
    const step = moving ? Math.sin(t * 11 + (o.seed || 0)) : 0;
    const bob = moving ? Math.abs(Math.sin(t * 11 + (o.seed || 0))) * -1.7 : Math.sin(t * 2.1 + (o.seed || 0)) * .7;
    const swing = o.swing || 0;

    drawGroundShadow(ctx, sx, sy, s, boss ? 40 : shadow ? 21 : 18, o.alpha || .55);

    // Aura for player and shadows.
    if (hero || shadow) {
      const auraR = (hero ? 27 : 20) * s;
      const ag = ctx.createRadialGradient(sx, sy, 0, sx, sy, auraR);
      ag.addColorStop(0, hero ? 'rgba(128,79,255,.24)' : 'rgba(106,67,196,.16)');
      ag.addColorStop(.65, hero ? 'rgba(80,41,170,.07)' : 'rgba(66,35,132,.05)');
      ag.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ag;
      ctx.beginPath(); ctx.ellipse(sx, sy + 1, auraR, auraR * .34, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = hero ? `rgba(168,125,255,${.2 + Math.sin(t * 2.2) * .06})` : 'rgba(128,93,205,.12)';
      ctx.lineWidth = .8 * s;
      ctx.beginPath(); ctx.ellipse(sx, sy, (hero ? 23 : 17) * s, (hero ? 7 : 5.5) * s, 0, 0, TAU); ctx.stroke();
    }

    ctx.save();
    ctx.translate(sx, sy + bob * s);
    ctx.scale(s * facing, s);
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    const outline = shadow ? 'rgba(132,91,230,.48)' : 'rgba(0,0,0,.55)';

    // Cape / cloak behind.
    ctx.beginPath();
    ctx.moveTo(-10, -55); ctx.lineTo(-22 - (moving ? 4 : 0), -7 + step * 1.4);
    ctx.quadraticCurveTo(-11, -2, 1, -8);
    ctx.lineTo(12, -56); ctx.closePath();
    const cg = ctx.createLinearGradient(-20, -54, 16, -4);
    cg.addColorStop(0, pal.cloak); cg.addColorStop(.62, pal.cloak2); cg.addColorStop(1, '#050508');
    ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = outline; ctx.lineWidth = .8; ctx.stroke();
    if (!shadow) {
      ctx.strokeStyle = boss ? 'rgba(225,180,101,.36)' : 'rgba(201,173,117,.2)';
      ctx.lineWidth = .9;
      ctx.beginPath(); ctx.moveTo(-12, -49); ctx.lineTo(-17, -18); ctx.stroke();
    }

    // Legs.
    const legSwing = moving ? step * 4 : 0;
    ctx.fillStyle = pal.cloak2;
    ctx.beginPath();
    ctx.moveTo(-9, -27); ctx.lineTo(-10, -3 + legSwing * .4); ctx.lineTo(-3, -2 + legSwing * .4); ctx.lineTo(-1, -26); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2, -27); ctx.lineTo(3, -2 - legSwing * .4); ctx.lineTo(10, -3 - legSwing * .4); ctx.lineTo(10, -26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#07070a';
    ctx.fillRect(-11, -5 + legSwing * .4, 9, 5);
    ctx.fillRect(2, -5 - legSwing * .4, 9, 5);
    if (shadow) {
      ctx.fillStyle = 'rgba(143,100,240,.18)';
      ctx.fillRect(-10, -4 + legSwing * .4, 7, 1);
      ctx.fillRect(3, -4 - legSwing * .4, 7, 1);
    }

    // Torso.
    ctx.beginPath();
    ctx.moveTo(-14, -55); ctx.lineTo(-11, -27); ctx.lineTo(11, -27); ctx.lineTo(15, -55);
    ctx.quadraticCurveTo(1, -61, -14, -55); ctx.closePath();
    const tg = ctx.createLinearGradient(-14, -55, 15, -28);
    tg.addColorStop(0, pal.armor2); tg.addColorStop(.48, pal.armor); tg.addColorStop(1, pal.armor2);
    ctx.fillStyle = tg; ctx.fill();
    ctx.strokeStyle = shadow ? 'rgba(153,113,244,.36)' : 'rgba(0,0,0,.6)'; ctx.lineWidth = 1; ctx.stroke();

    // Armor detail.
    ctx.strokeStyle = pal.trim; ctx.globalAlpha = (o.alpha ?? 1) * (shadow ? .5 : .75); ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-10, -51); ctx.lineTo(0, -44); ctx.lineTo(10, -51); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9, -31); ctx.lineTo(9, -31); ctx.stroke();
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.fillStyle = pal.trim;
    ctx.fillRect(-2.2, -48, 4.4, 3.4);
    if (hero) {
      ctx.fillStyle = 'rgba(156,110,255,.6)';
      ctx.beginPath(); ctx.moveTo(0, -49); ctx.lineTo(3, -44); ctx.lineTo(0, -39); ctx.lineTo(-3, -44); ctx.closePath(); ctx.fill();
    }

    // Belt + tabard.
    ctx.fillStyle = pal.cloak2;
    ctx.beginPath(); ctx.moveTo(-10, -28); ctx.lineTo(10, -28); ctx.lineTo(8, -13); ctx.lineTo(0, -8); ctx.lineTo(-8, -13); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = pal.trim; ctx.globalAlpha = shadow ? .3 : .55; ctx.stroke(); ctx.globalAlpha = o.alpha ?? 1;

    // Rear arm.
    ctx.strokeStyle = pal.armor2; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, -51); ctx.lineTo(-17, -35); ctx.lineTo(-14, -22); ctx.stroke();

    // Shoulders.
    for (const side of [-1, 1]) {
      const sw = 1 + (boss ? .32 : 0);
      ctx.save(); ctx.scale(side * sw, sw);
      ctx.fillStyle = pal.armor;
      ctx.beginPath();
      ctx.moveTo(8, -57); ctx.quadraticCurveTo(19, -62, 21, -50); ctx.quadraticCurveTo(18, -44, 10, -46); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shadow ? 'rgba(158,120,255,.45)' : pal.trim; ctx.globalAlpha = shadow ? .4 : .65; ctx.stroke();
      ctx.globalAlpha = o.alpha ?? 1;
      // Spike.
      if (boss) {
        ctx.fillStyle = pal.trim;
        ctx.beginPath(); ctx.moveTo(16, -57); ctx.lineTo(21, -66); ctx.lineTo(19, -52); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    // Head / hood.
    ctx.beginPath();
    ctx.moveTo(-11, -56); ctx.quadraticCurveTo(-13, -73, 0, -78);
    ctx.quadraticCurveTo(13, -73, 11, -56); ctx.closePath();
    const hg = ctx.createLinearGradient(0, -78, 0, -55);
    hg.addColorStop(0, shadow ? '#0d0819' : pal.cloak); hg.addColorStop(1, pal.cloak2);
    ctx.fillStyle = hg; ctx.fill();
    ctx.strokeStyle = shadow ? 'rgba(164,127,255,.4)' : 'rgba(0,0,0,.6)'; ctx.lineWidth = .9; ctx.stroke();

    // Face void.
    ctx.fillStyle = shadow ? '#020104' : pal.skin;
    ctx.beginPath(); ctx.ellipse(1.5, -64, 6.4, 8.1, 0, 0, TAU); ctx.fill();
    // Eyes.
    const eyeGlow = o.flash ? '#fff' : pal.glow;
    ctx.save();
    ctx.shadowColor = eyeGlow; ctx.shadowBlur = shadow ? 9 : 5;
    ctx.fillStyle = eyeGlow;
    ctx.beginPath(); ctx.ellipse(-1, -65, 1.35, 1.05, -.15, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -65, 1.35, 1.05, .15, 0, TAU); ctx.fill();
    ctx.restore();

    // Hood brim / crown.
    if (boss || hero) {
      ctx.fillStyle = boss ? pal.trim : '#1b1625';
      ctx.strokeStyle = boss ? 'rgba(240,202,128,.68)' : 'rgba(201,173,117,.55)';
      ctx.lineWidth = .8;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 6 - 2, -75); ctx.lineTo(i * 8 + 1, -86 + Math.abs(i) * 3); ctx.lineTo(i * 6 + 3, -75);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    } else {
      ctx.strokeStyle = shadow ? 'rgba(151,111,243,.34)' : pal.trim;
      ctx.globalAlpha = shadow ? .4 : .4;
      ctx.beginPath(); ctx.moveTo(-10, -70); ctx.quadraticCurveTo(0, -82, 10, -70); ctx.stroke();
      ctx.globalAlpha = o.alpha ?? 1;
    }

    // Horns for raider/brute/boss.
    if (o.horns) {
      ctx.strokeStyle = pal.trim; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 8, -71);
        ctx.quadraticCurveTo(side * 17, -77, side * 15, -85);
        ctx.stroke();
      }
    }

    // Weapon arm & weapon.
    ctx.save();
    ctx.translate(9, -48);
    ctx.rotate(swing * .5);
    ctx.strokeStyle = pal.armor; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, 12); ctx.stroke();
    ctx.restore();

    if (o.weapon === 'staff' || hero) {
      const handX = 16, handY = -37;
      ctx.strokeStyle = o.weaponWood || '#20160f'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(handX - 4, handY + 10); ctx.lineTo(handX + 3, handY - 38); ctx.stroke();
      const oy = handY - 43 + Math.sin(t * 2.4) * 1.1;
      const orb = ctx.createRadialGradient(handX + 4, oy, 0, handX + 4, oy, 11);
      orb.addColorStop(0, '#fff7ff'); orb.addColorStop(.22, shadow ? '#c9a7ff' : '#efc6ff');
      orb.addColorStop(.5, shadow ? 'rgba(139,89,255,.8)' : 'rgba(165,91,255,.7)');
      orb.addColorStop(1, 'rgba(84,29,175,0)');
      ctx.fillStyle = orb; ctx.beginPath(); ctx.arc(handX + 4, oy, 11, 0, TAU); ctx.fill();
      ctx.strokeStyle = o.weaponWood || '#20160f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(handX + 4, oy + 5); ctx.lineTo(handX + 4, oy - 7); ctx.stroke();
      if (boss) {
        ctx.strokeStyle = pal.trim; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(handX + 4, oy, 9, 0, TAU); ctx.stroke();
      }
    } else if (o.weapon === 'axe') {
      ctx.strokeStyle = '#241a12'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(18, -32); ctx.lineTo(19, -3); ctx.stroke();
      ctx.fillStyle = '#797b82';
      ctx.beginPath(); ctx.moveTo(18, -45); ctx.quadraticCurveTo(32, -48, 33, -35); ctx.lineTo(18, -32); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(220,224,235,.4)'; ctx.lineWidth = .8; ctx.stroke();
      ctx.strokeStyle = '#2b1d14'; ctx.beginPath(); ctx.moveTo(18, -45); ctx.lineTo(18, -32); ctx.stroke();
    } else if (o.weapon === 'bow') {
      ctx.strokeStyle = '#6d4f2d'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(25, -42, 18, -1.2, 1.2); ctx.stroke();
      ctx.strokeStyle = 'rgba(225,215,185,.4)'; ctx.lineWidth = .65;
      ctx.beginPath(); ctx.moveTo(31.5, -58.5); ctx.lineTo(31.5, -25.5); ctx.stroke();
      ctx.strokeStyle = pal.trim; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(18, -42); ctx.lineTo(31, -42); ctx.stroke();
    } else if (o.weapon === 'club') {
      ctx.strokeStyle = '#261910'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(17, -35); ctx.lineTo(25, -4); ctx.stroke();
      ctx.fillStyle = '#3f3229';
      ctx.beginPath(); ctx.ellipse(19, -39, 7, 12, .3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#75624e';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(15 + i * 4, -43 + (i % 2) * 4, 1.6, 0, TAU); ctx.fill(); }
    } else if (o.weapon === 'sword') {
      ctx.strokeStyle = '#2b1b12'; ctx.lineWidth = 2.3;
      ctx.beginPath(); ctx.moveTo(18, -35); ctx.lineTo(26, -9); ctx.stroke();
      const blade = ctx.createLinearGradient(24, -50, 35, -14);
      blade.addColorStop(0, '#d7d8df'); blade.addColorStop(.5, '#7c7d88'); blade.addColorStop(1, '#33343c');
      ctx.fillStyle = blade;
      ctx.beginPath(); ctx.moveTo(23, -39); ctx.lineTo(36, -60); ctx.lineTo(31, -36); ctx.lineTo(19, -32); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = pal.trim; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(17, -34); ctx.lineTo(27, -31); ctx.stroke();
    }

    // Front arm.
    ctx.strokeStyle = hero ? '#21172f' : pal.armor; ctx.lineWidth = 4.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(11, -52); ctx.lineTo(17, -42); ctx.lineTo(15, -34); ctx.stroke();
    ctx.fillStyle = shadow ? '#1a102b' : pal.skin;
    ctx.beginPath(); ctx.arc(15, -33, 2.8, 0, TAU); ctx.fill();
    if (hero) {
      // Monarch's signet.
      ctx.fillStyle = '#b08aff'; ctx.beginPath(); ctx.arc(15, -33, 1.2, 0, TAU); ctx.fill();
    }

    // Shadow smoke / rim.
    if (shadow) {
      ctx.strokeStyle = 'rgba(145,101,247,.34)'; ctx.lineWidth = .8;
      for (let i = 0; i < 3; i++) {
        const a = t * 1.3 + i * 2.1;
        ctx.beginPath();
        ctx.arc(-14 + Math.cos(a) * 3, -42 + i * 10, 8 + Math.sin(a) * 2, -.7, 1.7);
        ctx.stroke();
      }
      // Violet hem.
      ctx.strokeStyle = 'rgba(164,124,255,.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-22, -8 + step * 1.4); ctx.quadraticCurveTo(-11, -2, 1, -8); ctx.stroke();
    }

    // Flash outline.
    if (o.flash && !shadow) {
      ctx.globalAlpha = .35 * o.flash;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(0, -52, 22, 35, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  Art.drawPlayer = function (ctx, game, player) {
    const p = game.project(player.x, player.y, 0);
    const s = game.cam.zoom * 1.16;
    const halo = ctx.createRadialGradient(p.x, p.y - 2, 2, p.x, p.y - 2, 52 * s);
    halo.addColorStop(0, 'rgba(129,83,255,.16)');
    halo.addColorStop(.55, 'rgba(83,45,172,.07)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.ellipse(p.x, p.y - 2, 52 * s, 17 * s, 0, 0, TAU); ctx.fill();
    const moving = Math.hypot(player.vx || 0, player.vy || 0) > 10;
    drawHumanoid(ctx, p.x, p.y, s, {
      time: game.time, seed: .8, moving, facing: player.facing || 1,
      palette: {
        cloak: '#191126', cloak2: '#08060d', armor: '#241b38', armor2: '#0d0915',
        trim: '#c9ad75', glow: '#d8bcff', skin: '#07050c'
      },
      hero: true, weapon: 'staff', flash: player.castFlash, horns: false
    });

    // Staff charge / domain halo.
    if (player.castFlash > 0) {
      const a = 1 - player.castFlash;
      ctx.save();
      ctx.globalAlpha = player.castFlash * .8;
      ctx.strokeStyle = 'rgba(189,146,255,.7)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(p.x, p.y - 40 * s, (18 + a * 35) * s, 0, TAU); ctx.stroke();
      ctx.restore();
    }
  };

  Art.drawEnemy = function (ctx, game, e) {
    const p = game.project(e.x, e.y, 0);
    const s = game.cam.zoom * e.size * 1.07;
    const type = e.type;
    drawHumanoid(ctx, p.x, p.y, s, {
      time: game.time, seed: e.seed, moving: e.moving, facing: e.facing || -1,
      palette: e.palette, type,
      weapon: type === 'archer' ? 'bow' : type === 'mage' ? 'staff' : type === 'brute' ? 'club' : type === 'boss' ? 'sword' : 'axe',
      horns: type === 'raider' || type === 'brute' || type === 'boss',
      boss: type === 'boss', swing: e.swing, flash: e.flash
    });

    // Ranged charge glow.
    if (e.charge > 0) {
      const c = game.project(e.x, e.y, 51 * e.size);
      ctx.save();
      ctx.globalAlpha = e.charge * .8;
      const col = type === 'mage' ? 'rgba(221,120,255,.6)' : 'rgba(255,190,110,.55)';
      const gr = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 16 * s);
      gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, 16 * s, 0, TAU); ctx.fill();
      ctx.restore();
    }

    // Health bar.
    if (e.hp < e.maxHp || e.boss) {
      const hw = e.boss ? 76 : 34, hh = e.boss ? 4 : 2.5;
      const hp = clamp(e.hp / e.maxHp, 0, 1);
      const y = p.y - (e.boss ? 112 : 76) * s;
      const x = p.x - hw * s / 2;
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillRect(x, y, hw * s, hh * s);
      ctx.fillStyle = e.boss ? '#c64e58' : hp > .55 ? '#b94b53' : '#e26068';
      ctx.fillRect(x, y, hw * s * hp, hh * s);
      if (e.boss) {
        ctx.strokeStyle = 'rgba(201,173,117,.35)'; ctx.lineWidth = .6;
        ctx.strokeRect(x - .5, y - .5, hw * s + 1, hh * s + 1);
      }
    }
  };

  Art.drawShadow = function (ctx, game, sh) {
    const p = game.project(sh.x, sh.y, 0);
    const s = game.cam.zoom * sh.size;
    drawHumanoid(ctx, p.x, p.y, s, {
      time: game.time, seed: sh.seed, moving: sh.moving, facing: sh.facing || 1,
      palette: { cloak: '#0c0618', cloak2: '#040207', armor: '#100a22', armor2: '#050208', trim: '#8c66e6', glow: '#d8bcff', skin: '#000' },
      shadow: true, weapon: sh.kind === 'ranged' ? (sh.type === 'mage' ? 'staff' : 'bow') : (sh.type === 'brute' ? 'club' : 'sword'),
      type: sh.type === 'boss' ? 'boss' : sh.type, boss: sh.type === 'boss'
    });
    // Health bar (only when damaged).
    if (sh.hp < sh.maxHp) {
      const hw = 26, y = p.y - 74 * s;
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(p.x - hw * s / 2, y, hw * s, 2 * s);
      ctx.fillStyle = 'rgba(145,102,245,.85)'; ctx.fillRect(p.x - hw * s / 2, y, hw * s * clamp(sh.hp / sh.maxHp, 0, 1), 2 * s);
    }
  };

  Art.drawCorpse = function (ctx, game, c) {
    const p = game.project(c.x, c.y, 0);
    const s = game.cam.zoom;
    const fade = clamp(c.life / 3, 0, 1) * clamp(c.age / .35, 0, 1);
    const t = game.time;
    ctx.save(); ctx.globalAlpha = fade;
    // Remains.
    ctx.fillStyle = 'rgba(3,2,6,.7)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 15 * s, 5 * s, c.rot, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(16,9,27,.9)';
    ctx.beginPath(); ctx.ellipse(p.x - 3 * s, p.y - 2 * s, 9 * s, 3.5 * s, c.rot, 0, TAU); ctx.fill();
    // Weapon remains.
    ctx.strokeStyle = 'rgba(88,72,73,.4)'; ctx.lineWidth = 1.2 * s;
    ctx.beginPath(); ctx.moveTo(p.x + 6 * s, p.y + 2 * s); ctx.lineTo(p.x + 18 * s, p.y - 5 * s); ctx.stroke();

    // Soul flame.
    const pulse = .55 + Math.sin(t * 4 + c.phase) * .22;
    const fy = p.y - 8 * s;
    const gr = ctx.createRadialGradient(p.x, fy, 0, p.x, fy, 20 * s);
    gr.addColorStop(0, `rgba(222,191,255,${.5 * pulse})`);
    gr.addColorStop(.32, `rgba(139,89,255,${.24 * pulse})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, fy, 20 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(226,202,255,${.8 * pulse})`;
    ctx.beginPath();
    ctx.moveTo(p.x, fy - 12 * s);
    ctx.quadraticCurveTo(p.x + 6 * s, fy - 3 * s, p.x + 2 * s, fy + 3 * s);
    ctx.quadraticCurveTo(p.x - 1 * s, fy - 2 * s, p.x - 4 * s, fy + 2 * s);
    ctx.quadraticCurveTo(p.x - 5 * s, fy - 4 * s, p.x, fy - 12 * s);
    ctx.fill();
    ctx.restore();
  };

  Art.drawProjectile = function (ctx, game, pr) {
    const p = game.project(pr.x, pr.y, pr.z || 0);
    const s = game.cam.zoom;
    const col = pr.color;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pr.radius * 2.6 * s);
    gr.addColorStop(0, 'rgba(255,255,255,.9)');
    gr.addColorStop(.18, col);
    gr.addColorStop(.55, pr.color2 || 'rgba(99,47,194,.28)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(p.x, p.y, pr.radius * 2.6 * s, 0, TAU); ctx.fill();
    // Trail.
    for (let i = 1; i <= 4; i++) {
      const q = game.project(pr.x - pr.vx * i * .008, pr.y - pr.vy * i * .008, pr.z || 0);
      ctx.globalAlpha = .22 / i;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(q.x, q.y, pr.radius * (1 - i * .16) * s, 0, TAU); ctx.fill();
    }
    ctx.restore();
  };

  Art.drawParticles = function (ctx, game) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of game.particles) {
      const q = game.project(p.x, p.y, p.z);
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = a * (p.alpha || .8);
      ctx.fillStyle = p.color;
      const r = Math.max(.35, p.size * (p.shrink ? a : 1) * game.cam.zoom);
      ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill();
      if (p.glow) {
        ctx.globalAlpha = a * .18;
        ctx.beginPath(); ctx.arc(q.x, q.y, r * 3, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();

    // Floating combat text.
    ctx.save();
    ctx.textAlign = 'center';
    for (const f of game.floaters) {
      const q = game.project(f.x, f.y, f.z);
      const a = clamp(f.life / f.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = `${f.big ? 700 : 600} ${Math.round((f.big ? 15 : 11) * Math.min(1.22, game.cam.zoom))}px "Rajdhani", sans-serif`;
      ctx.fillStyle = f.color;
      ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
      ctx.fillText(f.text, q.x, q.y - (1 - a) * 22);
    }
    ctx.restore();
  };

  Art.drawRings = function (ctx, game) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const r of game.rings) {
      const q = game.project(r.x, r.y, 0);
      const a = clamp(r.life / r.max, 0, 1);
      const rad = r.r * game.cam.zoom;
      ctx.globalAlpha = a * .8;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = Math.max(.7, r.width * game.cam.zoom * a);
      ctx.beginPath(); ctx.ellipse(q.x, q.y, rad, rad * .34, 0, 0, TAU); ctx.stroke();
      if (r.fill) {
        ctx.globalAlpha = a * .08;
        ctx.fillStyle = r.color;
        ctx.beginPath(); ctx.ellipse(q.x, q.y, rad, rad * .34, 0, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  };

  Art.drawDomain = function (ctx, game) {
    if (!game.domainTime || !game.player) return;
    const p = game.project(game.player.x, game.player.y, 0);
    const s = game.cam.zoom;
    const t = game.time;
    const rad = 430 * s;
    const alpha = clamp(game.domainTime / .7, 0, 1) * clamp((6 - game.domainTime) / .5 + .1, 0, 1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(p.x, p.y);
    ctx.scale(1, .36);
    const gr = ctx.createRadialGradient(0, 0, rad * .1, 0, 0, rad);
    gr.addColorStop(0, `rgba(80,32,168,${.06 * alpha})`);
    gr.addColorStop(.7, `rgba(93,49,200,${.12 * alpha})`);
    gr.addColorStop(.94, `rgba(172,124,255,${.16 * alpha})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, rad, 0, TAU); ctx.fill();
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(177,136,255,${(.18 - i * .03) * alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, rad * (.32 + i * .18) + Math.sin(t * 2 + i) * 5, 0, TAU); ctx.stroke();
    }
    ctx.strokeStyle = `rgba(205,171,255,${.3 * alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, rad * .91, 0, TAU); ctx.stroke();
    for (let i = 0; i < 24; i++) {
      const a = t * .15 + i / 24 * TAU;
      const x1 = Math.cos(a) * rad * .92, y1 = Math.sin(a) * rad * .92;
      const x2 = Math.cos(a) * rad * (i % 3 ? .96 : .88), y2 = Math.sin(a) * rad * (i % 3 ? .96 : .88);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.restore();
  };

  WG.Art = Art;
})();
