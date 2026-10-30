/* WAR GUILD II · SHADOW MONARCH — combat, waves, shadow army */
(() => {
  'use strict';
  const WG = window.WG;
  const { clamp, rand, randi, dist, TAU, choice } = WG;
  const COSTS = { arise: 30, step: 12, nova: 30, domain: 45 };
  const CDS = { arise: 2.4, step: 5.2, nova: 8.5, domain: 15.5 };

  WG.Game.prototype.resetRun = function () {
    this.player = this.createPlayer();
    this.core = { x: 0, y: WG.WORLD.coreY, hp: 360, maxHp: 360 };
    this.enemies = [];
    this.shadows = [];
    this.corpses = [];
    this.projectiles = [];
    this.particles = [];
    this.floaters = [];
    this.rings = [];
    this.decor = this.decor.filter(d => d.kind !== 'fake');
    this.domainTime = 0;
    this.level = 1;
    this.xp = 0;
    this.xpNext = 55;
    this.kills = 0;
    this.raised = 0;
    this.runTime = 0;
    this.waveIndex = 0;
    this.waveState = null;
    this.nextWaveTimer = 0;
    this.boss = null;
    this.cooldowns = { arise: 0, step: 0, nova: 0, domain: 0 };
    this.cam.x = 0;
    this.player.armyMax = 6;
    this.syncArmyPips();
    this.syncHUD();
    this.ui.levelBanner.classList.add('is-hidden');
  };

  // ── Waves ──────────────────────────────────────────────────
  WG.Game.prototype.startWave = function (index) {
    const wave = WG.WAVES[index];
    if (!wave) return;
    this.waveIndex = index;
    this.nextWaveTimer = 0;
    const queue = wave.units.slice();
    this.waveState = { queue, total: queue.length, killed: 0, spawnTimer: .1, clearTimer: 0 };
    // First three open the assault together.
    for (let i = 0; i < 3 && queue.length; i++) {
      const type = queue.shift();
      this.spawnEnemy(type, rand(-150, 150), WG.WORLD.gateY + rand(38, 72), true);
    }
    this.showToast(`WAVE ${WG.pad2(index + 1)} · ${wave.name}`, 3200);
    this.audio.play('wave');
    this.syncHUD();
  };

  WG.Game.prototype.takeSpawnType = function () {
    const q = this.waveState.queue;
    if (!q.length) return null;
    // The champion always enters last.
    let idx = 0;
    while (idx < q.length - 1 && q[idx] === 'boss') idx++;
    return q.splice(idx, 1)[0];
  };

  WG.Game.prototype.spawnEnemy = function (type, x, y, opening = false) {
    const base = WG.ENEMY_TYPES[type];
    if (!base) return null;
    const scale = 1 + this.waveIndex * .16;
    const hp = type === 'boss' ? base.hp * (1 + this.waveIndex * .07) : base.hp * scale;
    const e = {
      type, ...base,
      hp, maxHp: hp,
      damage: base.damage * (1 + this.waveIndex * .1),
      x, y,
      vx: 0, vy: 0,
      facing: 1, moving: false, seed: rand(0, 9),
      attackTimer: rand(.5, 1.4), swing: 0, flash: 0, charge: 0,
      slow: 1, dead: false,
      slamTimer: type === 'boss' ? 3.2 : 0
    };
    this.enemies.push(e);
    if (type === 'boss') {
      this.boss = e;
      this.ui.bossBar.classList.remove('is-hidden');
      this.ui.bossName.textContent = base.label.toUpperCase();
      this.shake(7);
      this.addRing(x, y, 24, 'rgba(219,79,91,.8)', { life: .9, width: 3, grow: 150 });
      this.burst(x, y, 30, 'rgba(219,79,91,.8)', { speed: 120, z: 20 });
      this.showToast('GUILD CHAMPION · DREAD KNIGHT VAREK', 3800);
    }
    this.addRing(x, y, 18, type === 'boss' ? 'rgba(226,79,94,.7)' : 'rgba(129,82,224,.5)', { life: .65, width: 2, grow: opening ? 55 : 30 });
    this.burst(x, y, type === 'boss' ? 24 : 8, 'rgba(129,82,224,.6)', { speed: type === 'boss' ? 130 : 45, z: 8 });
    return e;
  };

  WG.Game.prototype.updateWaves = function (dt) {
    if (this.nextWaveTimer > 0) {
      this.nextWaveTimer -= dt;
      if (this.nextWaveTimer <= 0) this.startWave(this.waveIndex + 1);
      return;
    }
    const ws = this.waveState;
    if (!ws) return;

    if (ws.queue.length) {
      ws.spawnTimer -= dt;
      if (ws.spawnTimer <= 0) {
        ws.spawnTimer = .62;
        const type = this.takeSpawnType();
        if (type) {
          if (type === 'boss') this.spawnEnemy(type, 0, WG.WORLD.gateY + 55);
          else {
            const side = Math.random();
            if (side < .18) this.spawnEnemy(type, -610, -138 + rand(-40, 40));
            else if (side < .36) this.spawnEnemy(type, 610, -138 + rand(-40, 40));
            else this.spawnEnemy(type, rand(-210, 210), WG.WORLD.gateY + rand(-6, 30));
          }
        }
      }
    }

    if (!ws.queue.length && this.enemies.length === 0) {
      ws.clearTimer += dt;
      if (ws.clearTimer > 2.3) this.completeWave();
    } else ws.clearTimer = 0;
  };

  WG.Game.prototype.completeWave = function () {
    this.waveState = null;
    if (this.waveIndex >= WG.WAVES.length - 1) {
      this.endRun(true);
      return;
    }
    const wave = WG.WAVES[this.waveIndex];
    this.nextWaveTimer = 4.4;
    this.shadows.forEach(s => { s.hp = Math.min(s.maxHp, s.hp + s.maxHp * .28); });
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 10);
    this.player.mana = Math.min(this.player.maxMana, this.player.mana + 32);
    this.corpses = this.corpses.filter(c => c.life > 5);
    this.showToast(`WAVE ${WG.pad2(this.waveIndex + 1)} CLEARED · ${wave.name} BROKEN`, 3000);
    this.addRing(this.player.x, this.player.y, 20, 'rgba(201,173,117,.75)', { life: 1, width: 2.5, grow: 170, fill: true });
    this.audio.play('level');
    this.syncHUD();
  };

  // ── Player ─────────────────────────────────────────────────
  WG.Game.prototype.updatePlayer = function (dt) {
    const p = this.player;
    if (!p) return;
    p.invuln = Math.max(0, p.invuln - dt);
    p.castFlash = Math.max(0, p.castFlash - dt * 2.8);
    p.attackTimer -= dt;
    p.anim += dt;
    for (const k in this.cooldowns) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);

    const move = this.input.getMove();
    if (p.dashTime > 0) {
      p.dashTime -= dt;
      p.vx = p.dashVX; p.vy = p.dashVY;
      if (Math.random() < .8) {
        this.spawnParticle(p.x + rand(-12, 12), p.y + rand(-10, 10), rand(12, 48), rand(-15, 15), rand(-10, 10), rand(-5, 10), .55, rand(1.3, 3.2), 'rgba(139,89,255,.55)', { glow: true, gravity: 0 });
      }
    } else {
      p.vx = move.x * p.speed;
      p.vy = move.y * p.speed;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.moving = Math.hypot(p.vx, p.vy) > 12;
    if (p.moving) p.facing = p.vx < -3 ? -1 : p.vx > 3 ? 1 : p.facing;

    // Field limits.
    p.x = clamp(p.x, -694, 694);
    p.y = clamp(p.y, -372, 402);
    if (this.core) {
      const d = dist(p.x, p.y, this.core.x, this.core.y);
      if (d < 45) {
        const a = Math.atan2(p.y - this.core.y, p.x - this.core.x);
        p.x = this.core.x + Math.cos(a) * 45;
        p.y = this.core.y + Math.sin(a) * 45;
      }
    }
    // Mana regeneration.
    p.mana = Math.min(p.maxMana, p.mana + (6.5 + this.level * .25) * dt);

    // Auto-attack the nearest foe.
    const target = this.nearestEnemy(p.x, p.y, p.attackRange);
    if (target) {
      p.facing = target.x >= p.x ? 1 : -1;
      if (p.attackTimer <= 0) {
        p.attackTimer = p.atkRate;
        this.firePlayerBolt(target);
      }
    }
  };

  WG.Game.prototype.nearestEnemy = function (x, y, range = Infinity, includeDead = false) {
    let best = null, bd = range;
    for (const e of this.enemies) {
      if (e.dead && !includeDead) continue;
      const d = dist(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  };

  WG.Game.prototype.firePlayerBolt = function (target) {
    const p = this.player;
    const dx = target.x - p.x, dy = target.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const sp = 680;
    this.projectiles.push({
      x: p.x + dx / len * 18, y: p.y + dy / len * 18 - 2, z: 34,
      vx: dx / len * sp, vy: dy / len * sp, life: 1.25,
      damage: p.damage, radius: 4.6, color: 'rgba(192,151,255,.95)',
      color2: 'rgba(97,49,196,.28)', from: 'player'
    });
    p.castFlash = .26;
    this.burst(p.x + dx / len * 17, p.y + dy / len * 17, 3, 'rgba(186,143,255,.75)', { speed: 36, z: 34, gravity: 0 });
    this.audio.play('bolt');
  };

  // ── Enemies ────────────────────────────────────────────────
  WG.Game.prototype.updateEnemies = function (dt) {
    const p = this.player, core = this.core;
    const slow = this.domainTime > 0 ? .52 : 1;
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.flash = Math.max(0, e.flash - dt * 5);
      e.swing = Math.max(0, e.swing - dt * 4.6);
      e.charge = Math.max(0, e.charge - dt * 3);
      e.attackTimer -= dt * slow;
      e.moving = false;

      // Choose a target: nearby shadow, nearby monarch, otherwise the relic.
      let target = { kind: 'core', x: core.x, y: core.y - 10, radius: 28 };
      let bestD = dist(e.x, e.y, core.x, core.y);
      const dPlayer = p ? dist(e.x, e.y, p.x, p.y) : 1e9;
      if (p && dPlayer < 248 && (dPlayer < bestD + 45 || e.type === 'boss')) {
        target = { kind: 'player', x: p.x, y: p.y, radius: 17 };
        bestD = dPlayer;
      }
      for (const s of this.shadows) {
        const d = dist(e.x, e.y, s.x, s.y);
        if (d < 176 && d < bestD + 70) {
          target = { kind: 'shadow', obj: s, x: s.x, y: s.y, radius: 16 };
          bestD = d;
        }
      }
      e.target = target;

      let speed = e.speed * slow * (e.type === 'boss' ? 1 : 1);
      let desired = 0;
      let range = e.range;
      if (e.kind === 'ranged') range = e.range * .84;
      const towardX = target.x - e.x, towardY = target.y - e.y;
      const td = Math.hypot(towardX, towardY) || 1;
      e.facing = towardX >= 0 ? 1 : -1;

      if (td > range) {
        e.x += towardX / td * speed * dt;
        e.y += towardY / td * speed * dt;
        e.moving = true;
      } else if (e.attackTimer <= 0) {
        e.attackTimer = e.atkRate;
        e.swing = .6;
        if (e.kind === 'ranged' || e.type === 'mage') {
          e.charge = 1;
          this.fireEnemyBolt(e, target);
        } else {
          this.enemyMelee(e, target);
        }
      }

      // Separation.
      for (const o of this.enemies) {
        if (o === e || o.dead) continue;
        const dx = e.x - o.x, dy = e.y - o.y;
        const min = (e.radius + o.radius) * .62;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < min) {
          const push = (min - d) / min;
          e.x += dx / d * push * 26 * dt * 3;
          e.y += dy / d * push * 26 * dt * 3;
        }
      }
      e.x = clamp(e.x, -700, 700);
      e.y = clamp(e.y, -392, 410);

      // Champion's ground rupture.
      if (e.type === 'boss') {
        e.slamTimer -= dt * slow;
        if (e.slamTimer <= 0) {
          const near = p && dist(e.x, e.y, p.x, p.y) < 230;
          if (near) {
            e.slamTimer = 4.2;
            this.bossSlam(e);
          } else e.slamTimer = 1;
        }
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);
    if (this.boss && this.boss.dead) this.boss = null;
  };

  WG.Game.prototype.enemyMelee = function (e, target) {
    this.burst(target.x, target.y, 5, 'rgba(255,108,88,.7)', { speed: 55, z: 20 });
    this.addRing(target.x, target.y, 6, 'rgba(255,125,94,.5)', { life: .3, width: 2, grow: 38 });
    if (target.kind === 'player') this.damagePlayer(e.damage);
    else if (target.kind === 'shadow') this.damageShadow(target.obj, e.damage);
    else this.damageCore(e.damage);
    this.audio.play('hit');
    this.shake(2.3);
  };

  WG.Game.prototype.fireEnemyBolt = function (e, target) {
    const dx = target.x - e.x, dy = target.y - e.y;
    const len = Math.hypot(dx, dy) || 1;
    const sp = e.type === 'boss' ? 300 : e.type === 'mage' ? 330 : 390;
    this.projectiles.push({
      x: e.x + dx / len * 15, y: e.y + dy / len * 15, z: 32,
      vx: dx / len * sp, vy: dy / len * sp, life: 1.8,
      damage: e.damage, radius: 4.2,
      color: e.type === 'mage' || e.magic ? 'rgba(221,112,255,.95)' : 'rgba(255,180,110,.9)',
      color2: e.type === 'mage' || e.magic ? 'rgba(106,39,165,.28)' : 'rgba(190,79,32,.25)',
      from: 'enemy'
    });
    this.burst(e.x + dx / len * 14, e.y + dy / len * 14, 3, e.type === 'mage' ? 'rgba(212,113,255,.6)' : 'rgba(255,176,96,.55)', { speed: 34, z: 30, gravity: 0 });
  };

  WG.Game.prototype.bossSlam = function (e) {
    this.addRing(e.x, e.y, 24, 'rgba(230,68,83,.9)', { life: .7, width: 4, grow: 270, fill: true });
    this.burst(e.x, e.y, 38, 'rgba(238,94,72,.8)', { speed: 165, z: 6 });
    this.shake(10);
    this.audio.play('core');
    const p = this.player;
    if (p && dist(e.x, e.y, p.x, p.y) < 195) this.damagePlayer(e.damage * 1.4);
    for (const s of this.shadows) if (dist(e.x, e.y, s.x, s.y) < 195) this.damageShadow(s, e.damage * 1.15);
  };

  // ── Shadows ────────────────────────────────────────────────
  WG.Game.prototype.updateShadows = function (dt) {
    const p = this.player;
    const dmgBoost = this.domainTime > 0 ? 1.35 : 1;
    for (const sh of this.shadows) {
      sh.attackTimer -= dt;
      sh.flash = Math.max(0, sh.flash - dt * 4);
      sh.moving = false;
      const target = this.nearestEnemy(sh.x, sh.y, 620);
      if (target) {
        const dx = target.x - sh.x, dy = target.y - sh.y;
        const d = Math.hypot(dx, dy) || 1;
        const range = sh.kind === 'ranged' ? sh.range * .82 : sh.range;
        sh.facing = dx >= 0 ? 1 : -1;
        if (d > range) {
          sh.x += dx / d * sh.speed * dt;
          sh.y += dy / d * sh.speed * dt;
          sh.moving = true;
        } else if (sh.attackTimer <= 0) {
          sh.attackTimer = sh.atkRate;
          if (sh.kind === 'ranged') this.fireShadowBolt(sh, target, dmgBoost);
          else {
            this.damageEnemy(target, sh.damage * dmgBoost, 'shadow');
            this.addRing(target.x, target.y, 5, 'rgba(146,104,255,.55)', { life: .25, width: 1.5, grow: 32 });
          }
        }
      } else {
        // Fall into a loose formation around the monarch.
        const slot = sh.slot || 0;
        const a = (slot / Math.max(1, this.shadows.length)) * TAU + this.time * .12;
        const rad = 58 + (slot % 2) * 18;
        const tx = p.x + Math.cos(a) * rad;
        const ty = p.y + Math.sin(a) * rad * .72 + 10;
        const dx = tx - sh.x, dy = ty - sh.y;
        const d = Math.hypot(dx, dy);
        if (d > 12) {
          sh.x += dx / d * sh.speed * .62 * dt;
          sh.y += dy / d * sh.speed * .62 * dt;
          sh.facing = dx >= 0 ? 1 : -1;
          sh.moving = true;
        }
      }
      // Keep shadows on the field.
      sh.x = clamp(sh.x, -706, 706);
      sh.y = clamp(sh.y, -390, 412);
      if (sh.hp <= 0) sh.dead = true;
    }
    const before = this.shadows.length;
    this.shadows = this.shadows.filter(s => !s.dead);
    if (this.shadows.length !== before) this.syncArmyPips();
    // Maintain stable formation slots.
    this.shadows.forEach((s, i) => {
      s.slot = i;
      if (s.type === 'boss') s.size = 1.55;
    });
  };

  WG.Game.prototype.fireShadowBolt = function (sh, target, boost) {
    const dx = target.x - sh.x, dy = target.y - sh.y;
    const len = Math.hypot(dx, dy) || 1;
    const sp = 520;
    this.projectiles.push({
      x: sh.x + dx / len * 14, y: sh.y + dy / len * 14, z: 33,
      vx: dx / len * sp, vy: dy / len * sp, life: 1.5,
      damage: sh.damage * boost, radius: 3.6,
      color: 'rgba(180,139,255,.92)', color2: 'rgba(78,38,155,.25)',
      from: 'shadow'
    });
  };

  // ── Corpses, projectiles, damage ───────────────────────────
  WG.Game.prototype.updateCorpses = function (dt) {
    for (const c of this.corpses) {
      c.life -= dt; c.age += dt;
    }
    this.corpses = this.corpses.filter(c => c.life > 0);
    if (this.corpses.length > 34) this.corpses.splice(0, this.corpses.length - 34);
  };

  WG.Game.prototype.updateProjectiles = function (dt) {
    const p = this.player, core = this.core;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      if (Math.random() < dt * 28) {
        this.spawnParticle(pr.x - pr.vx * .012, pr.y - pr.vy * .012, pr.z, rand(-5, 5), rand(-5, 5), rand(-3, 3), .32, rand(.7, 1.5), pr.color, { glow: true, gravity: 0 });
      }
      let hit = false;
      if (pr.from === 'player' || pr.from === 'shadow') {
        for (const e of this.enemies) {
          if (e.dead) continue;
          if (dist(pr.x, pr.y, e.x, e.y) < e.radius + 8) {
            this.damageEnemy(e, pr.damage, pr.from);
            this.burst(pr.x, pr.y, 7, 'rgba(176,133,255,.75)', { speed: 65, z: pr.z });
            this.addRing(pr.x, pr.y, 4, 'rgba(178,140,255,.7)', { life: .3, width: 1.4, grow: 45 });
            hit = true; break;
          }
        }
      } else {
        if (p && p.invuln <= 0 && dist(pr.x, pr.y, p.x, p.y) < 20) {
          this.damagePlayer(pr.damage); hit = true;
        }
        if (!hit) for (const s of this.shadows) {
          if (dist(pr.x, pr.y, s.x, s.y) < 18) { this.damageShadow(s, pr.damage); hit = true; break; }
        }
        if (!hit && core && dist(pr.x, pr.y, core.x, core.y) < 30) { this.damageCore(pr.damage); hit = true; }
      }
      if (hit || pr.life <= 0 || Math.abs(pr.x) > 780 || Math.abs(pr.y) > 500) this.projectiles.splice(i, 1);
    }
  };

  WG.Game.prototype.damageEnemy = function (e, amount, source = 'player') {
    if (e.dead) return;
    e.hp -= amount;
    e.flash = 1;
    this.addFloater(e.x + rand(-8, 8), e.y, Math.round(amount), source === 'shadow' ? '#b9a0ff' : '#f1d49c', { z: 50 + rand(0, 18) });
    this.burst(e.x, e.y, 3, source === 'shadow' ? 'rgba(150,108,255,.6)' : 'rgba(231,194,126,.6)', { speed: 30, z: 30, gravity: 30 });
    if (source === 'player') this.audio.play('hit');
    if (e.hp <= 0) this.killEnemy(e);
  };

  WG.Game.prototype.killEnemy = function (e) {
    if (e.dead) return;
    e.dead = true;
    this.kills++;
    if (this.waveState) this.waveState.killed++;
    this.player.mana = Math.min(this.player.maxMana, this.player.mana + e.mana);
    this.gainXP(e.xp);
    const big = e.type === 'boss';
    this.corpses.push({
      x: e.x + rand(-5, 5), y: e.y + rand(-3, 3), type: e.type,
      corpse: e.corpse || 'knight', life: big ? 60 : 20, maxLife: big ? 60 : 20,
      age: 0, phase: rand(0, TAU), rot: rand(-1, 1)
    });
    this.burst(e.x, e.y, big ? 60 : 14, big ? 'rgba(255,113,116,.85)' : 'rgba(143,95,238,.75)', { speed: big ? 190 : 60, z: 24 });
    this.addRing(e.x, e.y, big ? 40 : 12, big ? 'rgba(229,88,99,.9)' : 'rgba(137,91,236,.55)', { life: big ? 1.2 : .45, width: big ? 4 : 1.6, grow: big ? 240 : 50 });
    if (big) {
      this.shake(18);
      this.flash('soul');
      this.ui.bossBar.classList.add('is-hidden');
      this.boss = null;
      this.showToast('GUILD CHAMPION SLAIN', 2600);
    }
    this.audio.play('enemyDie');
    this.syncHUD();
  };

  WG.Game.prototype.damageShadow = function (sh, amount) {
    if (sh.dead) return;
    sh.hp -= amount;
    sh.flash = 1;
    this.burst(sh.x, sh.y, 3, 'rgba(141,99,247,.6)', { speed: 30, z: 28, gravity: 20 });
    if (sh.hp <= 0) {
      sh.dead = true;
      this.burst(sh.x, sh.y, 14, 'rgba(126,86,229,.7)', { speed: 70, z: 20 });
      this.addRing(sh.x, sh.y, 8, 'rgba(142,99,246,.55)', { life: .45, width: 1.5, grow: 55 });
      this.syncArmyPips();
    }
  };

  WG.Game.prototype.damagePlayer = function (amount) {
    const p = this.player;
    if (!p || p.invuln > 0 || this.mode !== 'playing') return;
    p.hp -= amount;
    p.invuln = .35;
    p.hurt = 1;
    this.hurtFlash = 1;
    this.shake(6);
    this.audio.play('hurt');
    this.addFloater(p.x, p.y, Math.round(amount), '#ff8e96', { z: 58 });
    this.burst(p.x, p.y, 8, 'rgba(225,72,85,.65)', { speed: 60, z: 32 });
    if (p.hp <= 0) {
      p.hp = 0;
      this.showToast('THE MONARCH FALLS', 2000);
      this.endRun(false);
    }
    this.syncHUD();
  };

  WG.Game.prototype.damageCore = function (amount) {
    const c = this.core;
    if (!c || this.mode !== 'playing') return;
    c.hp -= amount;
    this.shake(4.5);
    this.audio.play('core');
    this.addFloater(c.x, c.y - 20, Math.round(amount), '#ff8e96', { z: 80 });
    this.burst(c.x, c.y - 24, 6, 'rgba(225,72,85,.55)', { speed: 48, z: 50 });
    if (c.hp <= 0) {
      c.hp = 0;
      this.addRing(c.x, c.y, 20, 'rgba(225,72,85,.9)', { life: 1, width: 4, grow: 240, fill: true });
      this.showToast('THE RELIC SHATTERS', 2200);
      this.endRun(false);
    }
    this.syncHUD();
  };

  WG.Game.prototype.gainXP = function (amount) {
    this.xp += amount;
    while (this.xp >= this.xpNext && this.level < 12) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = Math.round(this.xpNext * 1.32);
      const p = this.player;
      p.maxHp += 14; p.hp = Math.min(p.maxHp, p.hp + p.maxHp * .24);
      p.maxMana += 8; p.mana = Math.min(p.maxMana, p.mana + 30);
      p.damage += 3;
      if (this.level === 3 || this.level === 6 || this.level === 9) {
        p.armyMax = Math.min(9, p.armyMax + 1);
        this.syncArmyPips();
      }
      this.ui.levelBanner.classList.remove('is-hidden');
      this.ui.levelBannerNum.textContent = this.level;
      this.ui.levelBanner.style.animation = 'none';
      void this.ui.levelBanner.offsetWidth;
      this.ui.levelBanner.style.animation = '';
      clearTimeout(this._levelTimer);
      this._levelTimer = setTimeout(() => this.ui.levelBanner.classList.add('is-hidden'), 2300);
      this.addRing(p.x, p.y, 25, 'rgba(202,164,255,.9)', { life: 1.1, width: 3, grow: 160, fill: true });
      this.audio.play('level');
      this.flash('gold');
    }
  };

  // ── Skills ─────────────────────────────────────────────────
  WG.Game.prototype.useSkill = function (name) {
    if (this.mode !== 'playing') return;
    if (!COSTS[name]) return;
    if (this.cooldowns[name] > 0) { this.audio.play('deny'); return; }
    const p = this.player;
    if (p.mana < COSTS[name]) {
      this.showToast('NOT ENOUGH ESSENCE', 1200);
      this.audio.play('deny');
      return;
    }
    if (name === 'arise') {
      const near = this.corpses
        .map((c, i) => ({ c, i, d: dist(p.x, p.y, c.x, c.y) }))
        .filter(o => o.d < 390)
        .sort((a, b) => a.d - b.d);
      const slots = Math.max(0, p.armyMax - this.shadows.length);
      if (!near.length) { this.showToast('NO FALLEN SOULS NEARBY', 1300); this.audio.play('deny'); return; }
      if (!slots) { this.showToast('SHADOW ARMY AT FULL STRENGTH', 1400); this.audio.play('deny'); return; }
      const take = near.slice(0, slots);
      p.mana -= COSTS.arise;
      this.cooldowns.arise = CDS.arise;
      const indices = new Set(take.map(o => o.i));
      for (const { c } of take) {
        const sh = this.makeShadow(c.corpse || 'knight', c.x, c.y, this.shadows.length);
        sh.facing = p.facing;
        this.shadows.push(sh);
        this.raised++;
        this.addRing(c.x, c.y, 10, 'rgba(177,132,255,.85)', { life: .9, width: 2.4, grow: 90, fill: true });
        this.burst(c.x, c.y, 18, 'rgba(163,116,255,.8)', { speed: 74, z: 18 });
        for (let i = 0; i < 8; i++) {
          this.spawnParticle(c.x + rand(-10, 10), c.y + rand(-8, 8), rand(2, 60), rand(-5, 5), rand(-5, 5), rand(15, 45), rand(.5, 1.1), rand(1, 2.5), 'rgba(197,161,255,.8)', { glow: true, gravity: 0 });
        }
      }
      this.corpses = this.corpses.filter((c, i) => !indices.has(i));
      this.flash('soul');
      this.shake(4);
      this.audio.play('raise');
      this.showToast(`ARISE · ${take.length} SHADOW${take.length > 1 ? 'S' : ''} BOUND`, 1800);
      this.syncArmyPips();
    } else if (name === 'step') {
      const move = this.input.getMove();
      let dx = move.x, dy = move.y;
      if (Math.hypot(dx, dy) < .12) { dx = p.facing; dy = 0; }
      const len = Math.hypot(dx, dy) || 1;
      p.dashTime = .2;
      p.dashVX = dx / len * 860;
      p.dashVY = dy / len * 860;
      p.invuln = .55;
      p.mana -= COSTS.step;
      this.cooldowns.step = CDS.step;
      this.flash('soul');
      this.audio.play('dash');
      this.burst(p.x, p.y, 14, 'rgba(137,91,255,.7)', { speed: 80, z: 26 });
      this.addRing(p.x, p.y, 8, 'rgba(185,146,255,.8)', { life: .4, width: 2, grow: 85 });
    } else if (name === 'nova') {
      p.mana -= COSTS.nova;
      this.cooldowns.nova = CDS.nova;
      const radius = 235;
      this.addRing(p.x, p.y, 20, 'rgba(188,129,255,.95)', { life: .65, width: 5, grow: 390, fill: true });
      this.burst(p.x, p.y, 46, 'rgba(177,111,255,.85)', { speed: 190, z: 20 });
      this.shake(11);
      this.flash('soul');
      for (const e of this.enemies) {
        const d = dist(p.x, p.y, e.x, e.y);
        if (d < radius) {
          this.damageEnemy(e, 58 + this.level * 8, 'player');
          const a = Math.atan2(e.y - p.y, e.x - p.x);
          e.x += Math.cos(a) * 46;
          e.y += Math.sin(a) * 46;
        }
      }
      this.audio.play('nova');
      this.showToast('DEATH NOVA', 1000);
    } else if (name === 'domain') {
      p.mana -= COSTS.domain;
      this.cooldowns.domain = CDS.domain;
      this.domainTime = 6;
      this.addRing(p.x, p.y, 30, 'rgba(192,151,255,.9)', { life: 1.1, width: 4, grow: 460, fill: true });
      this.burst(p.x, p.y, 40, 'rgba(139,91,255,.72)', { speed: 160, z: 16 });
      this.shake(6);
      this.flash('soul');
      this.audio.play('domain');
      this.showToast("MONARCH'S DOMAIN · THE HORDE KNEELS", 2200);
    }
    this.syncHUD();
  };
})();
