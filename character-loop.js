/** Scroll-controlled character frames. Existing index.html calls remain compatible.
 * The stage stays visible during the scroll sequence; scrolling back reverses it.
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

    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.running = false;
    this.hovered = false;
    this.images = [];
    this.ready = false;
    this.currentFrame = 0;
    this._lastTickTime = 0;

    this.pointer = { x: 0.5, y: 0.5 };     // normalized target, 0..1
    this.parallax = { x: 0, y: 0 };        // eased current offset

    canvas.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      this.hovered = true;
    });
    canvas.addEventListener('pointerleave', () => { this.hovered = false; });
    canvas.addEventListener('pointercancel', () => { this.hovered = false; });
    const stage = canvas.closest('.hero-3d-stage');
    this.scrollScene = document.createElement('div');
    this.scrollScene.className = 'character-scroll-scene';
    stage.before(this.scrollScene);
    this.scrollScene.appendChild(stage);
    this._resize();
    window.addEventListener('resize', () => { this._resize(); this._draw(); });
    this.motionQuery.addEventListener('change', () => {
      this.stop();
      this.currentFrame = 0;
      this.pointer = { x: 0.5, y: 0.5 };
      this.parallax = { x: 0, y: 0 };
      this._draw();
      if (!this.motionQuery.matches) this._loadFrames();
      this.start();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop(); else this.start();
    });

    window.addEventListener('pageshow', () => { this._resize(); this.start(); });
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => { this._resize(); this._draw(); });
      this.resizeObserver.observe(canvas);
    }
    this._loadFrames();
  }

  /** Normalized (0..1, 0..1) pointer position relative to the character's bounding box. */
  setPointer(nx, ny) {
    if (this.motionQuery.matches || this.hovered) return;
    this.pointer.x = Math.min(1, Math.max(0, nx));
    this.pointer.y = Math.min(1, Math.max(0, ny));
  }

  start() {
    if (this.running || document.hidden) return;
    if (this.motionQuery.matches) { this._draw(); return; }
    this.running = true;
    const loop = (t) => {
      if (!this.running) return;
      this._update(t);
      this._draw();
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this._raf);
  }

  // ---- internal ----

  async _loadFrames() {
    if (this.loading || this.loadedAll) return;
    this.loading = true;
    const attempted = new Set();
    let interrupted = false;
    const loadOne = (n) => new Promise((resolve) => {
      if (this.images[n]) { resolve(); return; }
      attempted.add(n);
      const img = new Image();
      let finished = false;
      const finish = (ok) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        img.onload = img.onerror = null;
        if (ok) {
          this.images[n] = img;
          this.ready = true;
          if (this.motionQuery.matches) this.currentFrame = 0;
          else this._update(performance.now());
          this._draw();
        }
        resolve();
      };
      const timeout = setTimeout(() => finish(false), 12000);
      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.src = this.framePattern.replace('{n}', String(n).padStart(this.padLength, '0'));
    });
    // Cover the whole animation early, instead of downloading only its start.
    const previews = Array.from(new Set(Array.from({ length: 16 }, (_, i) =>
      Math.round(i * (this.frameCount - 1) / 15))));
    const nextFrame = () => {
      // Every other request prioritizes the frame currently under the scroll.
      const target = Math.min(this.frameCount - 1, Math.max(0, this.currentFrame));
      this._requestCount = (this._requestCount || 0) + 1;
      if (this._requestCount % 2 && !attempted.has(target) && !this.images[target]) return target;
      const preview = previews.find(n => !attempted.has(n) && !this.images[n]);
      if (preview !== undefined) return preview;
      for (let distance = 0; distance < this.frameCount; distance++) {
        for (const n of [target + distance, target - distance]) {
          if (n >= 0 && n < this.frameCount && !attempted.has(n) && !this.images[n]) return n;
        }
      }
      return undefined;
    };
    try {
      await loadOne(0);
      const worker = async () => {
        while (!this.motionQuery.matches) {
          const n = nextFrame();
          if (n === undefined) return;
          await loadOne(n);
        }
        interrupted = true;
      };
      await Promise.all(Array.from({ length: 6 }, () => worker()));
      this.loadedAll = this.images.filter(Boolean).length === this.frameCount;
    } finally {
      this.loading = false;
      // Handle a preference change while the last pending request was finishing.
      if (interrupted && !this.motionQuery.matches && !this.loadedAll) this._loadFrames();
    }
  }

  _update(t) {
    if (this.hovered) return;
    const rect = this.scrollScene.getBoundingClientRect();
    const stage = this.canvas.closest('.hero-3d-stage');
    const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
    const travel = Math.max(1, this.scrollScene.offsetHeight - stage.offsetHeight);
    const progress = Math.min(1, Math.max(0, (stickyTop - rect.top) / travel));
    this.currentFrame = Math.round(progress * (this.frameCount - 1));

    // ease parallax toward cursor target (centered at 0.5, 0.5 => 0 offset)
    const targetX = (this.pointer.x - 0.5) * 2; // -1..1
    const targetY = (this.pointer.y - 0.5) * 2;
    this.parallax.x += (targetX - this.parallax.x) * 0.06;
    this.parallax.y += (targetY - this.parallax.y) * 0.06;
  }

  _draw() {
    if (this.hovered && this.hasPainted) return;
    const { ctx, canvas } = this;
    if (!this.ready) return;

    // While loading, use the closest available frame rather than a blank canvas.
    let img = this.images[this.currentFrame];
    if (!img) {
      for (let distance = 1; distance < this.frameCount; distance++) {
        img = this.images[this.currentFrame - distance] || this.images[this.currentFrame + distance];
        if (img) break;
      }
    }
    if (!img || !img.complete || img.naturalWidth === 0) return;

    ctx.clearRect(0, 0, this._cssW, this._cssH);
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
    this.hasPainted = true;
    const poster = this.canvas.parentElement.querySelector('.hero-3d-poster');
    if (poster) poster.hidden = true;
  }

  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (this.canvas.width === Math.round(rect.width * dpr) && this.canvas.height === Math.round(rect.height * dpr)) return;
    this.hasPainted = false;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._cssW = rect.width;
    this._cssH = rect.height;
  }
}

window.CharacterLoop = CharacterLoop;
