/* WAR GUILD II · SHADOW MONARCH — core systems */
(() => {
  'use strict';
  const WG = window.WG = window.WG || {};

  // ── Math / helpers ─────────────────────────────────────────
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const choice = arr => arr[Math.floor(Math.random() * arr.length)];
  const dist = (a, b, c, d) => Math.hypot(a - c, b - d);
  const pad2 = n => String(n).padStart(2, '0');
  const smooth = t => t * t * (3 - 2 * t);
  const $ = id => document.getElementById(id);
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  WG.TAU = TAU;
  WG.clamp = clamp;
  WG.lerp = lerp;
  WG.rand = rand;
  WG.randi = randi;
  WG.choice = choice;
  WG.dist = dist;
  WG.pad2 = pad2;
  WG.smooth = smooth;
  WG.$ = $;
  WG.mulberry32 = mulberry32;

  // ── World constants ────────────────────────────────────────
  WG.WORLD = { halfW: 740, halfH: 460, gateY: -405, coreY: 334, yScale: 0.78 };
  WG.PLAYER_START = { x: 0, y: 128 };

  WG.WAVES = [
    {
      name: 'THE IRONFOOT CLAN', short: 'IRONFOOT RAIDERS',
      units: ['raider','raider','archer','raider','raider','archer','raider','raider','archer','raider'],
      brief: 'A raiding clan breaches the gate.'
    },
    {
      name: 'THE ASHEN CHOIR', short: 'ASHEN CULTISTS',
      units: ['raider','archer','mage','raider','brute','archer','raider','mage','raider','archer','raider','brute'],
      brief: 'Cultists feed the gate with blood.'
    },
    {
      name: 'THE CRIMSON VANGUARD', short: 'CRIMSON VANGUARD',
      units: ['raider','brute','archer','raider','mage','brute','raider','archer','mage','raider','brute','archer','raider','mage'],
      brief: 'A seasoned guild marches on the relic.'
    },
    {
      name: 'THE GILDED TYRANTS', short: 'GILDED TYRANTS',
      units: ['brute','archer','mage','raider','brute','mage','archer','brute','raider','mage','brute','archer','raider','brute','mage'],
      brief: 'Gold-armored tyrants seek to break the Court.'
    },
    {
      name: 'THE DREAD LEGION', short: 'DREAD LEGION',
      units: ['raider','archer','mage','brute','raider','archer','mage','brute','raider','archer','boss'],
      brief: 'Their champion comes to end the Shadow Monarch.'
    }
  ];

  WG.ENEMY_TYPES = {
    raider: {
      label: 'Ironfoot Raider', hp: 52, speed: 58, damage: 8, range: 44, atkRate: 1.05,
      radius: 18, size: 1, xp: 14, mana: 5, corpse: 'knight', kind: 'melee',
      palette: { cloak:'#3b161d', cloak2:'#160b10', armor:'#4d3032', armor2:'#211516', trim:'#a36e4e', glow:'#ffb26b', skin:'#180e0e' }
    },
    archer: {
      label: 'Ashwood Archer', hp: 38, speed: 48, damage: 6, range: 265, atkRate: 1.85,
      radius: 16, size: .94, xp: 16, mana: 6, corpse: 'archer', kind: 'ranged',
      palette: { cloak:'#26301e', cloak2:'#0d110a', armor:'#3c422c', armor2:'#181b12', trim:'#928257', glow:'#e8d47b', skin:'#140f0d' }
    },
    brute: {
      label: 'Ironbound Brute', hp: 155, speed: 38, damage: 16, range: 56, atkRate: 1.45,
      radius: 26, size: 1.34, xp: 34, mana: 10, corpse: 'brute', kind: 'melee',
      palette: { cloak:'#351b1b', cloak2:'#130909', armor:'#4b3d37', armor2:'#201815', trim:'#80664e', glow:'#ff8f5a', skin:'#190e0a' }
    },
    mage: {
      label: 'Cinder Acolyte', hp: 68, speed: 42, damage: 9, range: 255, atkRate: 2.15,
      radius: 17, size: 1.02, xp: 26, mana: 9, corpse: 'mage', kind: 'ranged', magic: true,
      palette: { cloak:'#2d1638', cloak2:'#100912', armor:'#422551', armor2:'#1b0e22', trim:'#a06ac0', glow:'#df7cff', skin:'#160c17' }
    },
    boss: {
      label: 'Dread Knight Varek', hp: 1180, speed: 35, damage: 23, range: 78, atkRate: 1.3,
      radius: 42, size: 1.9, xp: 220, mana: 40, corpse: 'boss', kind: 'boss', boss: true,
      palette: { cloak:'#3c0b14', cloak2:'#130409', armor:'#443b3a', armor2:'#181312', trim:'#c39b58', glow:'#ff4b5d', skin:'#100909' }
    }
  };

  WG.SHADOW_TYPES = {
    knight: { label:'Shadow Knight', hp:120, damage:13, speed:138, range:50, atkRate:.9, size:1.02, kind:'melee', color:'#9d78ff' },
    archer: { label:'Shadow Archer', hp:78, damage:10, speed:128, range:265, atkRate:1.35, size:.95, kind:'ranged', color:'#ad92ff' },
    brute: { label:'Shadow Brute', hp:230, damage:25, speed:104, range:62, atkRate:1.35, size:1.3, kind:'melee', color:'#7e5aff' },
    mage: { label:'Shadow Mage', hp:96, damage:17, speed:118, range:250, atkRate:1.65, size:1.02, kind:'ranged', color:'#c596ff' },
    boss: { label:'Shadow Marshal', hp:520, damage:42, speed:112, range:80, atkRate:1.05, size:1.55, kind:'melee', color:'#d8b6ff' }
  };

  // ── Procedural audio ───────────────────────────────────────
  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.ambientGain = null;
      this.enabled = true;
      this.started = false;
    }
    init() {
      if (this.started) {
        if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.enabled ? .72 : 0;
        this.master.connect(this.ctx.destination);
        this.started = true;
        this.startAmbient();
      } catch (_) { this.ctx = null; }
    }
    setEnabled(on) {
      this.enabled = on;
      if (this.master && this.ctx) {
        this.master.gain.cancelScheduledValues(this.ctx.currentTime);
        this.master.gain.linearRampToValueAtTime(on ? .72 : 0, this.ctx.currentTime + .12);
      }
    }
    startAmbient() {
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime;
      const bus = c.createGain();
      bus.gain.value = .13;
      bus.connect(this.master);
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 210;
      filter.Q.value = .8;
      filter.connect(bus);

      const freqs = [43.65, 65.41, 87.31];
      freqs.forEach((f, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = i === 2 ? 'triangle' : 'sine';
        o.frequency.value = f;
        g.gain.value = i === 0 ? .16 : i === 1 ? .09 : .022;
        const lfo = c.createOscillator();
        const lg = c.createGain();
        lfo.frequency.value = .055 + i * .021;
        lg.gain.value = i === 0 ? 1.2 : .5;
        lfo.connect(lg); lg.connect(o.frequency);
        o.connect(g); g.connect(filter);
        o.start(t); lfo.start(t);
      });

      // Air / distant wind.
      const buffer = c.createBuffer(1, c.sampleRate * 4, c.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        last = last * .985 + white * .015;
        data[i] = last * 3.2;
      }
      const noise = c.createBufferSource();
      noise.buffer = buffer; noise.loop = true;
      const nf = c.createBiquadFilter();
      nf.type = 'bandpass'; nf.frequency.value = 420; nf.Q.value = .35;
      const ng = c.createGain(); ng.gain.value = .11;
      noise.connect(nf); nf.connect(ng); ng.connect(bus);
      noise.start(t);
      this.ambientGain = bus;
    }
    tone(freq = 220, dur = .14, type = 'sine', vol = .07, slide = 0, delay = 0) {
      if (!this.ctx || !this.enabled) return;
      const c = this.ctx, t = c.currentTime + delay;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(Math.max(20, freq), t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + .008);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + .03);
    }
    noise(dur = .13, freq = 620, vol = .05, q = 1) {
      if (!this.ctx || !this.enabled) return;
      const c = this.ctx, t = c.currentTime;
      const size = Math.max(1, Math.floor(c.sampleRate * dur));
      const buffer = c.createBuffer(1, size, c.sampleRate);
      const d = buffer.getChannelData(0);
      for (let i = 0; i < size; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / size);
      const src = c.createBufferSource(); src.buffer = buffer;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      const g = c.createGain(); g.gain.value = vol;
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t);
    }
    play(name) {
      if (!this.ctx || !this.enabled) return;
      switch (name) {
        case 'click': this.tone(520, .045, 'sine', .035, 60); break;
        case 'bolt': this.tone(360, .13, 'triangle', .035, -170); break;
        case 'hit': this.noise(.09, 1500, .035, 1.2); this.tone(120, .08, 'sine', .035, -40); break;
        case 'enemyDie': this.tone(150, .24, 'sawtooth', .025, -80); this.noise(.18, 320, .03, .8); break;
        case 'hurt': this.tone(110, .22, 'square', .045, -55); this.noise(.18, 280, .04, .7); break;
        case 'raise': this.tone(95, .65, 'sawtooth', .045, 140); this.tone(190, .55, 'sine', .04, 180); break;
        case 'dash': this.noise(.24, 900, .05, .7); this.tone(220, .18, 'triangle', .04, 500); break;
        case 'nova': this.tone(80, .5, 'sine', .10, -30); this.noise(.45, 240, .08, .6); this.tone(540, .35, 'triangle', .03, -300); break;
        case 'domain': this.tone(55, .9, 'sine', .10, -10); this.tone(164, .8, 'triangle', .04, 340); break;
        case 'level': [392, 523, 659, 784].forEach((f, i) => this.tone(f, .32, 'sine', .05, 0, i * .09)); break;
        case 'wave': this.tone(98, .8, 'sawtooth', .05, 40); this.tone(196, .7, 'sine', .035, 20); break;
        case 'win': [261,330,392,523,659].forEach((f,i)=>this.tone(f,.55,'sine',.06,0,i*.13)); break;
        case 'lose': [196,164,131,98].forEach((f,i)=>this.tone(f,.7,'sawtooth',.035,0,i*.19)); break;
        case 'deny': this.tone(140, .1, 'square', .03, -30); break;
        case 'core': this.tone(70, .45, 'sawtooth', .06, -20); this.noise(.3, 220, .04, .6); break;
      }
    }
  }

  // ── Input (keyboard, joystick, tilt) ───────────────────────
  class Input {
    constructor(game) {
      this.game = game;
      this.keys = new Set();
      this.joy = { x: 0, y: 0, active: false, pointer: null };
      this.tilt = { enabled: false, calibrated: false, x: 0, y: 0, neutralX: 0, neutralY: 0, last: 0 };
      this.tiltHandler = null;
      this.joyEl = $('joystick');
      this.knobEl = $('joyKnob');
      this.bind();
    }
    bind() {
      window.addEventListener('keydown', e => {
        if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
        this.keys.add(e.code);
        if (e.code === 'Escape') this.game.togglePause();
        if (e.code === 'Digit1' || e.code === 'KeyQ') this.game.useSkill('arise');
        if (e.code === 'Digit2' || e.code === 'KeyE') this.game.useSkill('step');
        if (e.code === 'Digit3' || e.code === 'KeyR') this.game.useSkill('nova');
        if (e.code === 'Digit4' || e.code === 'KeyF') this.game.useSkill('domain');
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
      });
      window.addEventListener('keyup', e => this.keys.delete(e.code));
      window.addEventListener('blur', () => { this.keys.clear(); this.resetJoystick(); });

      const el = this.joyEl;
      el.addEventListener('pointerdown', e => {
        if (!this.game.isPlaying() && this.game.mode !== 'title') return;
        e.preventDefault(); e.stopPropagation();
        this.joy.active = true; this.joy.pointer = e.pointerId;
        el.setPointerCapture(e.pointerId);
        this.moveJoystick(e);
      });
      el.addEventListener('pointermove', e => {
        if (!this.joy.active || e.pointerId !== this.joy.pointer) return;
        e.preventDefault(); this.moveJoystick(e);
      });
      const end = e => {
        if (e.pointerId !== this.joy.pointer) return;
        this.resetJoystick();
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('lostpointercapture', end);
      window.addEventListener('contextmenu', e => e.preventDefault());
    }
    moveJoystick(e) {
      const r = this.joyEl.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const max = r.width * .31;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const len = Math.hypot(dx, dy) || 1;
      const amount = Math.min(len, max);
      dx = dx / len * amount; dy = dy / len * amount;
      this.joy.x = dx / max; this.joy.y = dy / max;
      this.knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    resetJoystick() {
      this.joy.active = false; this.joy.pointer = null; this.joy.x = 0; this.joy.y = 0;
      this.knobEl.style.transform = '';
    }
    async requestMotionPermission() {
      try {
        const DOE = window.DeviceOrientationEvent;
        const DME = window.DeviceMotionEvent;
        if (DOE && typeof DOE.requestPermission === 'function') {
          return await DOE.requestPermission();
        }
        if (DME && typeof DME.requestPermission === 'function') {
          return await DME.requestPermission();
        }
        return 'granted';
      } catch (_) { return 'denied'; }
    }
    async enableTilt() {
      if (!window.DeviceOrientationEvent) return { ok: false, reason: 'unsupported' };
      const permission = await this.requestMotionPermission();
      if (permission !== 'granted') return { ok: false, reason: permission };
      if (!this.tiltHandler) {
        this.tiltHandler = e => {
          if (!this.tilt.enabled || e.beta == null || e.gamma == null) return;
          const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
          let mx = e.gamma, my = e.beta;
          if (angle === 90) { mx = e.beta; my = -e.gamma; }
          else if (angle === -90 || angle === 270) { mx = -e.beta; my = e.gamma; }
          else if (Math.abs(angle) === 180) { mx = -e.gamma; my = -e.beta; }
          if (!this.tilt.calibrated) {
            this.tilt.neutralX = mx; this.tilt.neutralY = my; this.tilt.calibrated = true;
          }
          this.tilt.x = clamp((mx - this.tilt.neutralX) / 21, -1, 1);
          this.tilt.y = clamp((my - this.tilt.neutralY) / 21, -1, 1);
          this.tilt.last = performance.now();
        };
        window.addEventListener('deviceorientation', this.tiltHandler);
        window.addEventListener('devicemotion', this.tiltHandler);
      }
      this.tilt.enabled = true;
      this.tilt.calibrated = false;
      return { ok: true };
    }
    disableTilt() {
      this.tilt.enabled = false; this.tilt.x = 0; this.tilt.y = 0; this.tilt.calibrated = false;
    }
    recalibrate() { this.tilt.calibrated = false; this.tilt.x = 0; this.tilt.y = 0; }
    getMove() {
      let x = 0, y = 0;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
      if (this.joy.active) { x += this.joy.x; y += this.joy.y; }
      if (this.tilt.enabled) {
        const dead = v => Math.abs(v) < .07 ? 0 : (v - Math.sign(v) * .07) / .93;
        x += dead(this.tilt.x) * 1.05;
        y += dead(this.tilt.y) * 1.05;
      }
      const len = Math.hypot(x, y);
      if (len > 1) { x /= len; y /= len; }
      return { x, y, len: Math.min(1, len) };
    }
  }

  WG.AudioEngine = AudioEngine;
  WG.Input = Input;
})();
