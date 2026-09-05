/**
 * CharacterLoop
 * -------------
 * For a single continuous idle-loop image sequence (head/eyes wander,
 * blinks and expression baked in throughout — e.g. a 186-frame turntable
 * or idle animation), rather than separate triggerable clips.
 *
 * What it does:
 *  1. Autoplays the frame sequence on loop at a configurable FPS.
 *  2. Layers a subtle cursor-reactive parallax on top (the whole character
 *     tilts/shifts slightly toward the cursor) via canvas transform — this
 *     gives interactivity without needing directional frame variants.
 *
 * If you later render a true direction-matrix (separate frames per gaze
 * angle), swap this out for a scrubbing player instead.
 */
class CharacterLoop {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} options
   * @param {string} options.framePattern - e.g. 'assets/character/frame_{n}.webp'
   * @param {number} options.frameCount - total frames, numbered 0..frameCount-1
   * @param {number} options.padLength - zero-padding width in filenames (e.g. 4 -> 0000)
   * @param {number} options.fps - playback speed
   * @param {number} options.parallaxStrength - 0..1, how much the cursor tilts the character
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.framePattern = options.framePattern;
    this.frameCount = options.frameCount;
    this.padLength = options.padLength ?? 4;
    this.fps = options.fps ?? 24;
    this.parallaxStrength = options.parallaxStrength ?? 1;

    this.images = [];
    this.ready = false;
    this.currentFrame = 0;
    this._lastTickTime = 0;

    this.pointer = { x: 0.5, y: 0.5 };     // normalized target, 0..1
    this.parallax = { x: 0, y: 0 };        // eased current offset

    this._resize();
    window.addEventListener('resize', () => this._resize());

    this._loadFrames().then(() => { this.ready = true; });
  }

  /** Normalized (0..1, 0..1) pointer position relative to the character's bounding box. */
  setPointer(nx, ny) {
    this.pointer.x = Math.min(1, Math.max(0, nx));
    this.pointer.y = Math.min(1, Math.max(0, ny));
  }

  start() {
    const loop = (t) => {
      this._update(t);
      this._draw();
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  // ---- internal ----

  async _loadFrames() {
    const loadOne = (n) => new Promise((resolve) => {
      const padded = String(n).padStart(this.padLength, '0');
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = this.framePattern.replace('{n}', padded);
      this.images[n] = img;
    });
    // Load sequentially in small batches so the first frame paints fast
    // instead of waiting on all 186 requests at once.
    const batchSize = 12;
    for (let i = 0; i < this.frameCount; i += batchSize) {
      const batch = [];
      for (let j = i; j < Math.min(i + batchSize, this.frameCount); j++) batch.push(loadOne(j));
      await Promise.all(batch);
    }
  }

  _update(t) {
    const frameDuration = 1000 / this.fps;
    if (t - this._lastTickTime >= frameDuration) {
      this._lastTickTime = t;
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
    }

    // ease parallax toward cursor target (centered at 0.5, 0.5 => 0 offset)
    const targetX = (this.pointer.x - 0.5) * 2; // -1..1
    const targetY = (this.pointer.y - 0.5) * 2;
    this.parallax.x += (targetX - this.parallax.x) * 0.06;
    this.parallax.y += (targetY - this.parallax.y) * 0.06;
  }

  _draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!this.ready) return;

    const img = this.images[this.currentFrame];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const maxShiftPx = 10 * this.parallaxStrength;
    const maxTiltDeg = 2.5 * this.parallaxStrength;

    const w = this._cssW, h = this._cssH;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((this.parallax.x * maxTiltDeg) * Math.PI / 180);
    ctx.translate(
      -w / 2 + this.parallax.x * maxShiftPx,
      -h / 2 + this.parallax.y * maxShiftPx * 0.5
    );
    ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();
  }

  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._cssW = rect.width;
    this._cssH = rect.height;
  }
}

window.CharacterLoop = CharacterLoop;
