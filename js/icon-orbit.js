/** Floating SVG images; no WebGL textures. Compatible with existing IconOrbit calls. */
class IconOrbit {
  constructor(container, icons) {
    this.container = container;
    this.items = [];
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.running = false;
    const anchors = [
      [13, 36, -9], [12, 65, 7], [37, 14, -6], [63, 13, 8],
      [87, 33, -7], [89, 56, 9], [84, 78, -6]
    ];
    if (!document.getElementById('floating-svg-styles')) {
      const style = document.createElement('style');
      style.id = 'floating-svg-styles';
      style.textContent = `
        .floating-tool { position:absolute; width:clamp(36px, 7vw, 78px);
          aspect-ratio:1; pointer-events:auto; transform:translate(-50%,-50%); }
        .floating-tool-visual { width:100%; height:100%; display:grid; place-items:center;
          transition:scale 180ms ease; }
        .floating-tool img { display:block; width:100%; height:100%; object-fit:contain; }
        .floating-tool-fallback { width:100%; height:100%; display:grid; place-items:center;
          border-radius:22%; color:white; font:600 20px Arial,sans-serif; }
        @media (hover:hover) and (pointer:fine) {
          .floating-tool:hover .floating-tool-visual { scale:1.12; }
        }
        @media (prefers-reduced-motion:reduce) { .floating-tool-visual { transition:none; } }
      `;
      document.head.appendChild(style);
    }
    container.replaceChildren();
    icons.forEach((icon, i) => {
      const [x, y, tilt] = anchors[i] || [50, 15, 0];
      const el = document.createElement('div');
      el.className = 'floating-tool';
      el.style.left = x + '%';
      el.style.top = y + '%';
      el.setAttribute('aria-hidden', 'true');
      const visual = document.createElement('div');
      visual.className = 'floating-tool-visual';
      const fallback = document.createElement('span');
      fallback.className = 'floating-tool-fallback';
      fallback.style.background = icon.color || '#343434';
      fallback.textContent = icon.label;
      visual.appendChild(fallback);
      if (icon.src) {
        const img = new Image();
        img.alt = '';
        img.decoding = 'async';
        img.onload = () => { visual.replaceChildren(img); };
        // Keep a readable badge if the file is missing or cannot be decoded.
        img.onerror = () => {};
        img.src = icon.src;
      }
      el.appendChild(visual);
      container.appendChild(el);
      this.items.push({ el, tilt, phase:i * 1.73, speed:0.65 + (i % 3) * 0.11 });
    });
    this._draw(0);
    this.motionQuery.addEventListener('change', () => { this.stop(); this.start(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop(); else this.start();
    });
  }
  _draw(time) {
    const reduced = this.motionQuery.matches;
    this.items.forEach(({ el, tilt, phase, speed }) => {
      const wave = time * speed + phase;
      const x = reduced ? 0 : Math.cos(wave * 0.8) * 3;
      const y = reduced ? 0 : Math.sin(wave) * 7;
      const rotation = tilt + (reduced ? 0 : Math.sin(wave * 0.7) * 2);
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg)`;
    });
  }
  start() {
    if (this.running || document.hidden) return;
    if (this.motionQuery.matches) { this._draw(0); return; }
    this.running = true;
    const animate = (time) => {
      if (!this.running) return;
      this._draw(time / 1000);
      this.raf = requestAnimationFrame(animate);
    };
    this.raf = requestAnimationFrame(animate);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
}
window.IconOrbit = IconOrbit;
