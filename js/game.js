/* WAR GUILD II · SHADOW MONARCH — game shell, camera, renderer */
(() => {
  'use strict';
  const WG = window.WG;
  const { clamp, lerp, rand, randi, dist, TAU, $ } = WG;

  class Game {
    constructor() {
      this.canvas = $('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.mode = 'title';
      this.time = 0;
      this.runTime = 0;
      this.W = 0; this.H = 0; this.dpr = 1; this.zoom = 1;
      this.cam = { x: 0, y: 0, zoom: 1 };
      this.shakeMag = 0; this.shakeX = 0; this.shakeY = 0;
      this.hurtFlash = 0; this.soulFlash = 0; this.goldFlash = 0;
      this.ambientTimer = 0;
      this.particles = [];
      this.floaters = [];
      this.rings = [];
      this.enemies = [];
      this.shadows = [];
      this.corpses = [];
      this.projectiles = [];
      this.decor = [];
      this.waveIndex = 0;
      this.waveState = null;
      this.domainTime = 0;
      this.cooldowns = { arise: 0, step: 0, nova: 0, domain: 0 };
      this.kills = 0;
      this.raised = 0;
      this.level = 1;
      this.xp = 0;
      this.xpNext = 55;
      this.player = null;
      this.core = null;
      this.boss = null;
      this.best = { wave: 0, kills: 0 };
      this.settings = { sound: true, tilt: false };
      this.loadSettings();
      this.audio = new WG.AudioEngine();
      this.audio.enabled = this.settings.sound;
      this.input = new WG.Input(this);
      this.ui = this.collectUI();
      this.bindUI();
      this.arena = WG.Art.buildArena();
      this.setupDecor();
      this.resize();
      this.setupTitle();
      this.applySoundUI();
      this.syncArmyPips();
      this.syncHUD();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    collectUI() {
      const ids = [
        'titleScreen','hud','pauseScreen','howScreen','endScreen','startBtn','howBtn','titleSound',
        'hudSound','pauseBtn','soundToggle','tiltToggle','calibrateBtn','tiltNote','tiltDesc',
        'resumeBtn','restartBtn','quitBtn','howClose','howDone','againBtn','hallBtn',
        'hpFill','hpText','manaFill','manaText','levelBadge','levelText','waveNum','waveFill',
        'waveSub','relicText','relicFill','armyCount','armyMax','armyPips','corpseCount',
        'arisePrompt','skillBar','bossBar','bossName','bossFill','toast','levelBanner',
        'levelBannerNum','battleHint','controlNote','bestRecord','endKicker','endTitle',
        'endCopy','endWave','endKills','endRaised','endTime','endBest','rotateHint','titleScreen'
      ];
      const o = {};
      ids.forEach(id => o[id] = $(id));
      o.skills = {};
      document.querySelectorAll('[data-skill]').forEach(btn => o.skills[btn.dataset.skill] = btn);
      o.relic = document.querySelector('.relic-mini');
      o.relicSvg = document.querySelector('.relic-mini svg use');
      o.joy = $('joystick');
      return o;
    }

    loadSettings() {
      try {
        const s = JSON.parse(localStorage.getItem('wg2-shadow-monarch') || '{}');
        if (typeof s.sound === 'boolean') this.settings.sound = s.sound;
        if (s.best && typeof s.best.wave === 'number') this.best = s.best;
        if (typeof s.tilt === 'boolean') this.settings.tilt = false; // motion always requires a fresh gesture
      } catch (_) {}
    }

    saveSettings() {
      try {
        localStorage.setItem('wg2-shadow-monarch', JSON.stringify({ sound: this.settings.sound, best: this.best }));
      } catch (_) {}
    }

    resize() {
      this.W = window.innerWidth;
      this.H = window.innerHeight;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.W * this.dpr);
      this.canvas.height = Math.round(this.H * this.dpr);
      this.canvas.style.width = this.W + 'px';
      this.canvas.style.height = this.H + 'px';
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      if (this.W < 560) this.zoom = clamp(this.W / 330, .98, 1.25);
      else this.zoom = clamp(Math.min(this.W / 1000, this.H / 680), .94, 1.35);
      this.cam.zoom = this.zoom;
      this.clampCamera(true);
      if (this.mode === 'title') this._titlePainted = false;
    }

    setupDecor() {
      this.decor = [
        { kind: 'gate', x: 0, y: WG.WORLD.gateY },
        { kind: 'pillar', x: -615, y: -176, phase: .2 },
        { kind: 'pillar', x: 615, y: -176, phase: 2.1 },
        { kind: 'pillar', x: -655, y: 194, phase: 4.2 },
        { kind: 'pillar', x: 655, y: 194, phase: 1.3 },
        { kind: 'brazier', x: -388, y: -306, phase: .4 },
        { kind: 'brazier', x: 388, y: -306, phase: 2.7 },
        { kind: 'brazier', x: -478, y: 236, phase: 1.8 },
        { kind: 'brazier', x: 478, y: 236, phase: 4.7 }
      ];
    }

    project(x, y, z = 0) {
      const zz = this.cam.zoom;
      return {
        x: (x - this.cam.x) * zz + this.W / 2 + this.shakeX,
        y: (y - this.cam.y) * zz * WG.WORLD.yScale + this.H / 2 + this.shakeY - z * zz
      };
    }

    setupTitle() {
      this.mode = 'title';
      this._titlePainted = false;
      this.enemies = [];
      this.projectiles = [];
      this.corpses = [];
      this.particles = [];
      this.floaters = [];
      this.rings = [];
      this.domainTime = 0;
      this.boss = null;
      this.player = this.createPlayer();
      this.player.x = this.W > 820 ? 258 : 92;
      this.player.y = 72;
      this.player.facing = -1;
      this.player.moving = false;
      this.core = { x: 0, y: WG.WORLD.coreY, hp: 360, maxHp: 360 };
      const defs = [
        { type: 'knight', x: 316, y: 104, facing: -1 },
        { type: 'knight', x: 178, y: 148, facing: 1 },
        { type: 'archer', x: 386, y: 34, facing: -1 },
        { type: 'mage', x: 354, y: 178, facing: -1 },
        { type: 'brute', x: 452, y: 116, facing: -1 }
      ];
      this.shadows = defs.map((d, i) => this.makeShadow(d.type, d.x, d.y, i));
      this.shadows.forEach(s => { s.facing = s.x > this.player.x ? 1 : -1; });
      this.corpses = [
        { x: 140, y: 28, type: 'raider', corpse: 'knight', life: 15, maxLife: 15, age: 2, phase: 1.1, rot: .4 },
        { x: 430, y: 246, type: 'mage', corpse: 'mage', life: 15, maxLife: 15, age: 2, phase: 3.2, rot: -.5 },
        { x: 48, y: 190, type: 'raider', corpse: 'knight', life: 15, maxLife: 15, age: 2, phase: 5.1, rot: .9 }
      ];
      this.cam.x = this.W > 820 ? 22 : 0;
      this.cam.y = 0;
      this.ui.hud.classList.add('is-hidden');
      this.ui.pauseScreen.classList.add('is-hidden');
      this.ui.howScreen.classList.add('is-hidden');
      this.ui.endScreen.classList.add('is-hidden');
      this.updateRecordText();
    }

    createPlayer() {
      return {
        x: WG.PLAYER_START.x, y: WG.PLAYER_START.y, vx: 0, vy: 0,
        hp: 120, maxHp: 120, mana: 100, maxMana: 100, damage: 16,
        speed: 190, radius: 18, facing: 1, moving: false,
        attackTimer: .35, atkRate: .58, attackRange: 550,
        invuln: 0, dashTime: 0, dashVX: 0, dashVY: 0,
        castFlash: 0, armyMax: 6, anim: 0, hurt: 0
      };
    }

    makeShadow(type, x, y, i) {
      const base = WG.SHADOW_TYPES[type] || WG.SHADOW_TYPES.knight;
      return {
        ...base, type, x, y, vx: 0, vy: 0, hp: base.hp, maxHp: base.hp,
        attackTimer: rand(0, .4), facing: 1, moving: false, seed: i * 1.7 + .4,
        flash: 0, slot: i
      };
    }

    clampCamera(snap = false) {
      const halfView = this.W / (2 * this.cam.zoom);
      const maxX = Math.max(0, WG.WORLD.halfW - halfView + 22);
      let tx = this.cam.x;
      if (this.player) tx = this.mode === 'title' ? (this.W > 820 ? 22 : 0) : this.player.x + clamp(this.player.vx * .18, -58, 58);
      tx = clamp(tx, -maxX, maxX);
      this.cam.x = snap ? tx : lerp(this.cam.x, tx, .12);
      this.cam.y = this.mode === 'title' ? 0 : (this.W > 560 ? -24 : -8);
      this.cam.zoom = this.zoom;
    }

    loop(now) {
      const dt = Math.min(.045, Math.max(0, (now - (this._last || now)) / 1000));
      this._last = now;
      this.time += dt;
      if (this.mode === 'title') {
        // The title is a painted tableau: draw it once so low-power devices and
        // software-rendered browsers are not stuck repainting a static scene.
        if (!this._titlePainted) {
          this._titlePainted = true;
          this.paintTitle(false);
          clearTimeout(this._titleHQTimer);
          this._titleHQTimer = setTimeout(() => {
            if (this.mode === 'title') this.paintTitle(true);
          }, 4000);
        }
      } else {
        this.update(dt);
        this.render();
      }
      requestAnimationFrame(this.loop);
    }

    paintTitle(highQuality) {
      const scale = highQuality ? this.dpr : Math.min(this.dpr, .5);
      this.canvas.width = Math.max(1, Math.round(this.W * scale));
      this.canvas.height = Math.max(1, Math.round(this.H * scale));
      this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
      this.render();
    }

    isPlaying() { return this.mode === 'playing'; }

    update(dt) {
      this.updateAmbient(dt);
      this.updateParticles(dt);
      this.hurtFlash = Math.max(0, this.hurtFlash - dt * 2.4);
      this.soulFlash = Math.max(0, this.soulFlash - dt * 1.8);
      this.goldFlash = Math.max(0, this.goldFlash - dt * 1.4);
      this.shakeMag = Math.max(0, this.shakeMag - dt * 28);
      this.shakeX = this.shakeMag ? rand(-1, 1) * this.shakeMag : 0;
      this.shakeY = this.shakeMag ? rand(-1, 1) * this.shakeMag : 0;

      if (this.mode === 'title') {
        this.updateTitle(dt);
        this.clampCamera();
        return;
      }
      if (this.mode !== 'playing') return;

      this.runTime += dt;
      this.updatePlayer(dt);
      this.updateWaves(dt);
      this.updateShadows(dt);
      this.updateEnemies(dt);
      this.updateCorpses(dt);
      this.updateProjectiles(dt);
      if (this.domainTime > 0) this.domainTime = Math.max(0, this.domainTime - dt);
      this.clampCamera();
      this.syncHUD();
    }

    updateTitle(dt) {
      this.player.castFlash = 0;
      this.player.facing = -1;
      this.player.moving = false;
      if (this.W > 820) {
        this.cam.x = 22 + Math.sin(this.time * .12) * 12;
      } else this.cam.x = 0;
      // Occasional soul mote drifting from the fallen.
      if (Math.random() < dt * 4.2) {
        const c = this.corpses[randi(0, this.corpses.length - 1)];
        if (c) this.spawnParticle(c.x + rand(-6, 6), c.y + rand(-3, 3), rand(8, 20), rand(-6, 6), rand(-8, -2), rand(9, 22), rand(1.6, 2.8), rand(.8, 1.8), 'rgba(186,142,255,.7)', { glow: true });
      }
    }

    // ── Ambient, particles, effects ─────────────────────────
    updateAmbient(dt) {
      this.ambientTimer -= dt;
      if (this.ambientTimer <= 0) {
        this.ambientTimer = .055;
        const braziers = this.decor.filter(d => d.kind === 'brazier');
        const b = braziers[randi(0, braziers.length - 1)];
        if (b) {
          this.spawnParticle(b.x + rand(-7, 7), b.y + rand(-3, 3), rand(32, 44), rand(-5, 5), rand(-4, 2), rand(12, 26), rand(1.5, 2.9), rand(.7, 1.6), Math.random() < .6 ? 'rgba(216,147,255,.7)' : 'rgba(242,177,103,.65)', { glow: true });
        }
        if (Math.random() < .35) {
          this.spawnParticle(rand(-620, 620), rand(-350, 340), rand(2, 16), rand(-4, 4), rand(-5, 2), rand(4, 10), rand(2, 4), rand(.6, 1.2), 'rgba(124,96,180,.2)');
        }
      }
    }

    spawnParticle(x, y, z, vx, vy, vz, life, size, color, opts = {}) {
      if (this.particles.length > 620) this.particles.shift();
      this.particles.push({
        x, y, z, vx, vy, vz, life, max: life, size, color,
        gravity: opts.gravity ?? 38, drag: opts.drag ?? .985,
        shrink: opts.shrink ?? true, glow: opts.glow ?? false, alpha: opts.alpha ?? .9
      });
    }

    burst(x, y, count, color, opts = {}) {
      const z = opts.z ?? 30;
      const speed = opts.speed ?? 90;
      for (let i = 0; i < count; i++) {
        const a = rand(0, TAU), sp = rand(speed * .3, speed);
        this.spawnParticle(x + rand(-4, 4), y + rand(-4, 4), z + rand(-4, 4),
          Math.cos(a) * sp, Math.sin(a) * sp * .55, rand(10, 80),
          rand(.4, 1.1), rand(1.1, 3.1), color,
          { glow: true, gravity: opts.gravity ?? 60, speed });
      }
    }

    addRing(x, y, r, color, opts = {}) {
      this.rings.push({ x, y, r, max: opts.life ?? .55, life: opts.life ?? .55, color, width: opts.width ?? 2.2, fill: opts.fill ?? false, grow: opts.grow ?? 0 });
    }

    addFloater(x, y, text, color, opts = {}) {
      this.floaters.push({ x, y, z: opts.z ?? 48, text, color, life: opts.life ?? .8, max: opts.life ?? .8, big: opts.big ?? false });
      if (this.floaters.length > 55) this.floaters.shift();
    }

    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) { this.particles.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.vz -= p.gravity * dt;
        p.vx *= p.drag; p.vy *= p.drag;
        if (p.z < 0) { p.z = 0; p.vz *= -.24; p.vx *= .7; p.vy *= .7; }
      }
      for (let i = this.floaters.length - 1; i >= 0; i--) {
        const f = this.floaters[i]; f.life -= dt; f.z += dt * 24;
        if (f.life <= 0) this.floaters.splice(i, 1);
      }
      for (let i = this.rings.length - 1; i >= 0; i--) {
        const r = this.rings[i]; r.life -= dt;
        if (r.grow) r.r += r.grow * dt;
        if (r.life <= 0) this.rings.splice(i, 1);
      }
    }

    shake(v) { this.shakeMag = Math.max(this.shakeMag, v); }
    flash(color) {
      if (color === 'hurt') this.hurtFlash = 1;
      else if (color === 'soul') this.soulFlash = 1;
      else this.goldFlash = 1;
    }

    // ── Rendering ────────────────────────────────────────────
    render() {
      const ctx = this.ctx, W = this.W, H = this.H;
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // Deep backdrop.
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#080810');
      bg.addColorStop(.46, '#0b0b13');
      bg.addColorStop(1, '#05060a');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const upperGlow = ctx.createRadialGradient(W * .5, H * .22, 20, W * .5, H * .22, Math.max(W, H) * .62);
      upperGlow.addColorStop(0, 'rgba(62,39,114,.12)');
      upperGlow.addColorStop(.5, 'rgba(24,16,49,.04)');
      upperGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = upperGlow; ctx.fillRect(0, 0, W, H);

      // Ground.
      const z = this.cam.zoom;
      ctx.save();
      ctx.translate(W / 2 - this.cam.x * z + this.shakeX, H / 2 - this.cam.y * z * WG.WORLD.yScale + this.shakeY);
      ctx.scale(z, z * WG.WORLD.yScale);
      ctx.drawImage(this.arena, -WG.WORLD.halfW, -WG.WORLD.halfH, WG.WORLD.halfW * 2, WG.WORLD.halfH * 2);
      ctx.restore();

      WG.Art.drawDomain(ctx, this);

      // Fallen first.
      for (const c of this.corpses) WG.Art.drawCorpse(ctx, this, c);

      // Depth sorted battlefield objects.
      const list = [];
      for (const d of this.decor) {
        if (d.kind === 'gate') list.push({ y: d.y, draw: () => WG.Art.drawGate(ctx, this) });
        else if (d.kind === 'pillar') list.push({ y: d.y, draw: () => WG.Art.drawPillar(ctx, this, d) });
        else if (d.kind === 'brazier') list.push({ y: d.y, draw: () => WG.Art.drawBrazier(ctx, this, d) });
      }
      if (this.core) list.push({ y: this.core.y, draw: () => WG.Art.drawCore(ctx, this) });
      for (const s of this.shadows) list.push({ y: s.y, draw: () => WG.Art.drawShadow(ctx, this, s) });
      for (const e of this.enemies) list.push({ y: e.y, draw: () => WG.Art.drawEnemy(ctx, this, e) });
      if (this.player) list.push({ y: this.player.y, draw: () => WG.Art.drawPlayer(ctx, this, this.player) });
      list.sort((a, b) => a.y - b.y);
      for (const item of list) item.draw();

      // Projectiles.
      for (const p of this.projectiles) WG.Art.drawProjectile(ctx, this, p);

      // Magic circles & bursts.
      WG.Art.drawRings(ctx, this);
      WG.Art.drawParticles(ctx, this);

      // Atmospheric fog.
      this.drawFog(ctx);

      // Damage overlays.
      if (this.hurtFlash > 0) {
        const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .2, W / 2, H / 2, Math.max(W, H) * .72);
        g.addColorStop(0, 'rgba(150,20,35,0)');
        g.addColorStop(.72, `rgba(174,25,43,${.16 * this.hurtFlash})`);
        g.addColorStop(1, `rgba(105,8,20,${.5 * this.hurtFlash})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      if (this.soulFlash > 0 || this.goldFlash > 0) {
        const col = this.soulFlash > this.goldFlash ? `rgba(117,72,223,${.11 * this.soulFlash})` : `rgba(201,173,117,${.08 * this.goldFlash})`;
        ctx.fillStyle = col; ctx.fillRect(0, 0, W, H);
      }

      if (this.mode === 'title') this.drawTitleAtmosphere(ctx);
    }

    drawFog(ctx) {
      const W = this.W, H = this.H, t = this.time;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 3; i++) {
        const x = W * (.22 + i * .31) + Math.sin(t * (.055 + i * .012) + i * 2) * 80;
        const y = H * (.32 + i * .12) + Math.cos(t * .05 + i) * 38;
        const r = Math.min(W, H) * (.24 + i * .07);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(92,72,132,${.026 + i * .006})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      // Gate haze.
      if (this.mode !== 'title') {
        const gate = this.project(0, WG.WORLD.gateY, 0);
        const g = ctx.createRadialGradient(gate.x, gate.y, 5, gate.x, gate.y, 210 * this.cam.zoom);
        g.addColorStop(0, 'rgba(103,61,184,.055)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }

    drawTitleAtmosphere(ctx) {
      const W = this.W, H = this.H, t = this.time;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      // Pale moon shaft.
      const sx = W * .74, sy = -H * .18;
      const shaft = ctx.createLinearGradient(sx, sy, sx - W * .13, H * .82);
      shaft.addColorStop(0, 'rgba(205,194,232,.07)');
      shaft.addColorStop(.5, 'rgba(135,113,186,.022)');
      shaft.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shaft;
      ctx.beginPath();
      ctx.moveTo(sx - W * .05, sy); ctx.lineTo(sx + W * .06, sy);
      ctx.lineTo(sx - W * .06, H * .86); ctx.lineTo(sx - W * .22, H * .86);
      ctx.closePath(); ctx.fill();

      // Drifting golden motes.
      for (let i = 0; i < 13; i++) {
        const x = (W * .66 + Math.sin(t * .18 + i * 1.7) * W * .16 + i * 17) % W;
        const y = (H * (.2 + ((i * .073 + t * .008) % .7)));
        ctx.fillStyle = `rgba(203,175,118,${.08 + Math.sin(t + i) * .03})`;
        ctx.beginPath(); ctx.arc(x, y, .8 + (i % 3) * .4, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }

    updateRecordText() {
      if (!this.ui?.bestRecord) return;
      this.ui.bestRecord.textContent = this.best.wave > 0
        ? `PERSONAL BEST · WAVE ${WG.pad2(this.best.wave)} · ${this.best.kills} KILLS`
        : 'NO RECORD YET · CLAIM THE GATE';
    }

    endRun(victory) {
      if (this.mode === 'ended') return;
      this.mode = 'ended';
      const reached = victory ? 5 : Math.max(1, this.waveIndex + 1);
      const scored = victory || this.kills > 0;
      const newRecord = scored && (reached > this.best.wave || (reached === this.best.wave && this.kills > this.best.kills));
      if (scored && reached > this.best.wave) this.best.wave = reached;
      if (scored && this.kills > this.best.kills) this.best.kills = this.kills;
      this.saveSettings();
      this.audio.play(victory ? 'win' : 'lose');
      this.ui.bossBar.classList.add('is-hidden');
      this.ui.endKicker.textContent = victory ? 'THE GATE FALLS SILENT' : (this.core.hp <= 0 ? 'THE RELIC IS LOST' : 'THE MONARCH HAS FALLEN');
      this.ui.endTitle.textContent = victory ? 'VICTORY' : 'DEFEATED';
      this.ui.endTitle.classList.toggle('is-defeat', !victory);
      this.ui.endCopy.textContent = victory
        ? 'The Dread Legion breaks. Another guild kneels before the Shadow Monarch.'
        : this.core.hp <= 0
          ? 'The relic fractures. The Obsidian Court retreats into the dark — for now.'
          : 'Your body falls, but the shadows remember. Rise again.';
      this.ui.endWave.textContent = reached;
      this.ui.endKills.textContent = this.kills;
      this.ui.endRaised.textContent = this.raised;
      this.ui.endTime.textContent = this.formatTime(this.runTime);
      this.ui.endBest.textContent = newRecord
        ? 'NEW PERSONAL RECORD'
        : this.best.wave > 0
          ? `BEST · WAVE ${WG.pad2(this.best.wave)} / ${this.best.kills} KILLS`
          : 'NO RECORD YET · CLAIM THE GATE';
      this.ui.endBest.classList.toggle('is-new', newRecord);
      setTimeout(() => {
        if (this.mode === 'ended') this.ui.endScreen.classList.remove('is-hidden');
      }, victory ? 900 : 700);
    }

    formatTime(s) {
      const m = Math.floor(s / 60), sec = Math.floor(s % 60);
      return `${m}:${String(sec).padStart(2, '0')}`;
    }
  }

  WG.Game = Game;
})();
