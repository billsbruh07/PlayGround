/* WAR GUILD II · SHADOW MONARCH — interface, settings, lifecycle */
(() => {
  'use strict';
  const WG = window.WG;
  const { clamp, dist, pad2 } = WG;
  const COSTS = { arise: 30, step: 12, nova: 30, domain: 45 };
  const CDS = { arise: 2.4, step: 5.2, nova: 8.5, domain: 15.5 };

  WG.Game.prototype.bindUI = function () {
    const ui = this.ui;
    const tap = (el, fn) => {
      if (!el) return;
      el.addEventListener('click', e => {
        e.preventDefault();
        this.audio.init();
        this.audio.play('click');
        fn(e);
      });
    };

    tap(ui.startBtn, () => this.startRun());
    tap(ui.howBtn, () => this.showHow());
    tap(ui.howClose, () => this.hideHow());
    tap(ui.howDone, () => this.hideHow());
    tap(ui.titleSound, () => this.toggleSound());
    tap(ui.hudSound, () => this.toggleSound());
    tap(ui.pauseBtn, () => this.togglePause());
    tap(ui.resumeBtn, () => this.resume());
    tap(ui.restartBtn, () => this.restartRun());
    tap(ui.quitBtn, () => this.showTitle());
    tap(ui.soundToggle, () => this.toggleSound());
    tap(ui.tiltToggle, () => this.toggleTilt());
    tap(ui.calibrateBtn, () => {
      this.input.recalibrate();
      this.showToast('TILT NEUTRAL RECALIBRATED', 1400);
    });
    tap(ui.againBtn, () => this.restartRun());
    tap(ui.hallBtn, () => this.showTitle());

    Object.entries(ui.skills).forEach(([name, btn]) => {
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (this.mode === 'playing') this.useSkill(name);
      });
      btn.addEventListener('contextmenu', e => e.preventDefault());
    });

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 120));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.mode === 'playing') this.pause();
    });
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyP' && this.mode === 'playing') this.pause();
      else if (e.code === 'KeyP' && this.mode === 'paused') this.resume();
    });
    this.updateTiltUI();
    this.applySoundUI();
  };

  WG.Game.prototype.startRun = function () {
    this.audio.init();
    this.mode = 'playing';
    clearTimeout(this._titleHQTimer);
    this.resize();
    this.ui.titleScreen.classList.add('is-leaving');
    setTimeout(() => {
      if (this.mode !== 'title') this.ui.titleScreen.classList.add('is-hidden');
    }, 620);
    this.ui.hud.classList.remove('is-hidden');
    this.ui.endScreen.classList.add('is-hidden');
    this.ui.pauseScreen.classList.add('is-hidden');
    this.ui.howScreen.classList.add('is-hidden');
    this.ui.bossBar.classList.add('is-hidden');
    this.ui.battleHint.classList.add('is-visible');
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => this.ui.battleHint.classList.remove('is-visible'), 7500);
    this.resetRun();
    this.startWave(0);
    this.showToast('THE IRONFOOT CLAN ASSAULTS THE RELIC', 3200);
  };

  WG.Game.prototype.restartRun = function () {
    this.ui.pauseScreen.classList.add('is-hidden');
    this.ui.endScreen.classList.add('is-hidden');
    this.ui.levelBanner.classList.add('is-hidden');
    this.startRun();
  };

  WG.Game.prototype.showTitle = function () {
    this.mode = 'title';
    this.ui.hud.classList.add('is-hidden');
    this.ui.pauseScreen.classList.add('is-hidden');
    this.ui.endScreen.classList.add('is-hidden');
    this.ui.howScreen.classList.add('is-hidden');
    this.ui.bossBar.classList.add('is-hidden');
    this.ui.titleScreen.classList.remove('is-hidden');
    this.ui.titleScreen.classList.remove('is-leaving');
    this.audio.setEnabled(this.settings.sound);
    this.setupTitle();
    this.updateRecordText();
    this.syncHUD();
  };

  WG.Game.prototype.showHow = function () {
    this.ui.howScreen.classList.remove('is-hidden');
  };

  WG.Game.prototype.hideHow = function () {
    this.ui.howScreen.classList.add('is-hidden');
  };

  WG.Game.prototype.pause = function () {
    if (this.mode !== 'playing') return;
    this.mode = 'paused';
    this.ui.pauseScreen.classList.remove('is-hidden');
    this.updateTiltUI();
    if (this.input.joy.active) this.input.resetJoystick();
  };

  WG.Game.prototype.resume = function () {
    if (this.mode !== 'paused') return;
    this.mode = 'playing';
    this.ui.pauseScreen.classList.add('is-hidden');
    this._last = performance.now();
  };

  WG.Game.prototype.togglePause = function () {
    if (this.mode === 'playing') this.pause();
    else if (this.mode === 'paused') this.resume();
  };

  WG.Game.prototype.toggleSound = function () {
    this.audio.init();
    this.settings.sound = !this.settings.sound;
    this.audio.setEnabled(this.settings.sound);
    this.saveSettings();
    this.applySoundUI();
    if (this.settings.sound) this.audio.play('click');
    if (this.mode === 'playing') this.showToast(this.settings.sound ? 'SOUND ON' : 'SOUND OFF', 1000);
  };

  WG.Game.prototype.applySoundUI = function () {
    const on = this.settings.sound;
    const icon = on ? '#i-sound' : '#i-mute';
    [this.ui.titleSound, this.ui.hudSound].forEach(btn => {
      if (!btn) return;
      const use = btn.querySelector('use');
      if (use) use.setAttribute('href', icon);
      btn.setAttribute('aria-label', on ? 'Mute sound' : 'Enable sound');
    });
    if (this.ui.soundToggle) this.ui.soundToggle.querySelector('.toggle')?.classList.toggle('is-on', on);
  };

  WG.Game.prototype.toggleTilt = async function () {
    if (this.input.tilt.enabled) {
      this.input.disableTilt();
      this.showToast('TILT CONTROLS OFF', 1300);
      this.updateTiltUI();
      return;
    }
    this.ui.tiltNote.textContent = 'REQUESTING MOTION ACCESS…';
    const result = await this.input.enableTilt();
    if (result.ok) {
      this.updateTiltUI();
      this.showToast('TILT CONTROLS ONLINE · HOLD DEVICE COMFORTABLY', 2600);
    } else {
      this.updateTiltUI();
      if (result.reason === 'denied') {
        this.showToast('MOTION PERMISSION DENIED · USE TOUCH', 2400);
        this.ui.tiltNote.textContent = 'Motion access was denied. Enable Motion & Orientation in browser settings, or keep using touch.';
      } else if (result.reason === 'unsupported') {
        this.showToast('MOTION SENSOR NOT AVAILABLE · USE TOUCH', 2200);
        this.ui.tiltNote.textContent = 'This device does not expose motion sensors. Touch controls remain fully active.';
      } else {
        this.ui.tiltNote.textContent = 'Motion access is unavailable in this browser. Touch controls remain fully active.';
      }
    }
  };

  WG.Game.prototype.updateTiltUI = function () {
    if (!this.ui) return;
    const on = this.input.tilt.enabled;
    this.ui.tiltToggle?.querySelector('.toggle')?.classList.toggle('is-on', on);
    this.ui.calibrateBtn?.classList.toggle('is-hidden', !on);
    if (this.ui.tiltDesc) this.ui.tiltDesc.textContent = on ? 'Tilt active · hold to steer' : 'Use device motion to move';
    if (this.ui.tiltNote && on) {
      this.ui.tiltNote.textContent = 'Tilt is active. Hold the device in a comfortable position, then use Calibrate to reset neutral.';
    }
    if (this.ui.controlNote) {
      this.ui.controlNote.classList.toggle('is-on', on);
      const span = this.ui.controlNote.querySelector('span');
      if (span) span.textContent = on ? 'TILT ACTIVE' : 'TILT OFF';
    }
  };

  WG.Game.prototype.syncArmyPips = function () {
    if (!this.ui?.armyPips) return;
    const max = this.player?.armyMax || 6;
    let html = '';
    for (let i = 0; i < max; i++) html += '<i></i>';
    this.ui.armyPips.innerHTML = html;
    if (this.ui.armyMax) this.ui.armyMax.textContent = max;
    this.syncArmyFill();
  };

  WG.Game.prototype.syncArmyFill = function () {
    if (!this.ui?.armyPips) return;
    const count = Math.min(this.shadows.length, this.player?.armyMax || 6);
    [...this.ui.armyPips.children].forEach((el, i) => el.classList.toggle('is-filled', i < count));
    if (this.ui.armyCount) this.ui.armyCount.textContent = count;
  };

  WG.Game.prototype.syncHUD = function () {
    const p = this.player, core = this.core;
    const ui = this.ui;
    if (!ui || !p) return;

    const hp = clamp(p.hp / p.maxHp, 0, 1);
    ui.hpFill.style.width = (hp * 100) + '%';
    ui.hpText.textContent = `${Math.ceil(p.hp)} / ${Math.ceil(p.maxHp)}`;
    ui.manaFill.style.width = (clamp(p.mana / p.maxMana, 0, 1) * 100) + '%';
    ui.manaText.textContent = `${Math.floor(p.mana)} ESSENCE`;
    ui.levelBadge.textContent = this.level;
    ui.levelText.textContent = `LV ${this.level}`;

    if (core) {
      const relic = clamp(core.hp / core.maxHp, 0, 1);
      ui.relicFill.style.width = (relic * 100) + '%';
      ui.relicText.textContent = Math.ceil(relic * 100) + '%';
      ui.relic?.classList.toggle('is-low', relic < .35);
    }

    ui.waveNum.textContent = pad2(this.waveIndex + 1);
    if (this.waveState) {
      const total = this.waveState.total || 1;
      const pct = clamp(this.waveState.killed / total, 0, 1);
      ui.waveFill.style.width = (pct * 100) + '%';
      const foes = this.enemies.length + this.waveState.queue.length;
      ui.waveSub.textContent = `${foes} FOE${foes === 1 ? '' : 'S'} REMAIN · ${WG.WAVES[this.waveIndex].short}`;
      ui.waveSub.style.color = 'rgba(238,232,218,.42)';
    } else if (this.nextWaveTimer > 0) {
      ui.waveFill.style.width = '100%';
      ui.waveSub.textContent = `WAVE ${pad2(this.waveIndex + 2)} IN ${Math.ceil(this.nextWaveTimer)}s`;
      ui.waveSub.style.color = 'rgba(201,173,117,.55)';
    } else {
      ui.waveFill.style.width = '0%';
      ui.waveSub.textContent = WG.WAVES[this.waveIndex]?.short || '';
    }

    // Boss.
    if (this.boss && !this.boss.dead) {
      ui.bossBar.classList.remove('is-hidden');
      ui.bossFill.style.width = (clamp(this.boss.hp / this.boss.maxHp, 0, 1) * 100) + '%';
    } else ui.bossBar.classList.add('is-hidden');

    // Skills.
    for (const name of Object.keys(ui.skills)) {
      const btn = ui.skills[name];
      const cd = this.cooldowns[name] || 0;
      const max = CDS[name];
      btn.style.setProperty('--cd', `${(cd / max) * 360}deg`);
      btn.classList.toggle('is-cooling', cd > 0);
      btn.classList.toggle('is-ready', cd <= 0 && p.mana >= COSTS[name]);
    }
    const nearCorpses = this.corpses.filter(c => dist(p.x, p.y, c.x, c.y) < 390).length;
    const slots = Math.max(0, p.armyMax - this.shadows.length);
    const readyRaise = nearCorpses > 0 && slots > 0 && this.cooldowns.arise <= 0 && p.mana >= COSTS.arise;
    ui.skills.arise?.classList.toggle('is-urgent', readyRaise);
    ui.arisePrompt?.classList.toggle('is-visible', nearCorpses > 0 && slots > 0);
    if (ui.corpseCount) ui.corpseCount.textContent = nearCorpses;

    this.syncArmyFill();
  };

  WG.Game.prototype.showToast = function (text, duration = 1600) {
    const el = this.ui?.toast;
    if (!el) return;
    el.textContent = text;
    el.classList.add('is-visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('is-visible'), duration);
  };
})();
