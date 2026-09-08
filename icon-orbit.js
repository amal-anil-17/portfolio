/** Weightless tool icons above the head and on both sides of the character.
 * Keeps the IconOrbit name so existing index.html works unchanged.
 * Each icon has its own anchor, tilt and gentle bob; reduced motion is static.
 */
class IconOrbit {
  /**
   * @param {HTMLElement} container
   * @param {Array<{label:string, color:string, src?:string}>} icons
   */
  constructor(container, icons) {
    this.container = container;
    this.icons = icons;
    this.clock = new THREE.Clock();
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.running = false;
    this.mouse = { x: 0, y: 0 };
    this.hitPointer = new THREE.Vector2(2, 2);
    this.raycaster = new THREE.Raycaster();
    this.hoverSprite = null;

    this._initScene();
    this._buildIcons();
    this._bindEvents();
  }

  _initScene() {
    const { clientWidth: w, clientHeight: h } = this.container;

    this.scene = new THREE.Scene();
    const aspect = Math.max(w, 1) / Math.max(h, 1);
    this.camera = new THREE.OrthographicCamera(-4 * aspect, 4 * aspect, 4, -4, 0.1, 100);
    this.camera.position.set(0, 0, 9);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.group = new THREE.Group();
    this.scene.add(this.group);
  }

  _makePlaceholderTexture(label, color) {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');

    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '600 84px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, size / 2, size / 2 + 6);

    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  _buildIcons() {
    const loader = new THREE.TextureLoader();
    const count = this.icons.length;
    // Positions are fractions of the stage, measured from the top left.
    const anchors = [
      [0.13, 0.36, -0.16, 0.76], // left upper
      [0.12, 0.65,  0.12, 0.72], // left lower
      [0.37, 0.14, -0.10, 0.76], // above head, left
      [0.63, 0.13,  0.14, 0.72], // above head, right
      [0.87, 0.33, -0.12, 0.76], // right upper
      [0.89, 0.56,  0.16, 0.70], // right middle
      [0.84, 0.78, -0.10, 0.66], // right lower
    ];

    this.sprites = this.icons.map((icon, i) => {
      const material = new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false });
      const sprite = new THREE.Sprite(material);

      if (icon.src) {
        loader.load(
          icon.src,
          (texture) => { material.map = texture; material.needsUpdate = true; this.renderer.render(this.scene, this.camera); },
          undefined,
          (err) => {
            // Falls back to the placeholder badge so the arc never shows a
            // blank sprite, but logs the exact failing path so it's easy to
            // tell (via devtools console) whether it's a 404, a bad path,
            // or something else — rather than failing silently.
            console.error('[IconOrbit] failed to load icon texture:', icon.src, err);
            material.map = this._makePlaceholderTexture(icon.label, icon.color || '#4b5563');
            material.needsUpdate = true;
            this.renderer.render(this.scene, this.camera);
          }
        );
      } else {
        material.map = this._makePlaceholderTexture(icon.label, icon.color || '#4b5563');
        material.needsUpdate = true;
      }

      const anchor = anchors[i] || [0.15 + (i / Math.max(count - 1, 1)) * 0.7, 0.22, 0, 0.72];
      const scale = anchor[3];
      sprite.scale.set(scale, scale, 1);
      sprite.userData.baseScale = scale;

      sprite.userData.anchor = anchor;
      sprite.userData.phase = i * 1.73;
      sprite.userData.speed = 0.65 + (i % 3) * 0.11;
      sprite.renderOrder = 2;

      this.group.add(sprite);
      return sprite;
    });
  }

  _bindEvents() {
    this.motionQuery.addEventListener('change', () => { this.stop(); this.start(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop(); else this.start();
    });
    window.addEventListener('resize', () => this._onResize());
    const stage = this.container.closest('.hero-3d-stage');
    stage.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const rect = this.container.getBoundingClientRect();
      this.hitPointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1);
      this._updateHover();
      if (this.motionQuery.matches) this.renderer.render(this.scene, this.camera);
    });
    stage.addEventListener('pointerleave', () => {
      this.hitPointer.set(2, 2);
      this.hoverSprite = null;
      this._updateHover();
      if (this.motionQuery.matches) this.renderer.render(this.scene, this.camera);
    });
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    });
  }

  _onResize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    const aspect = Math.max(w, 1) / Math.max(h, 1);
    this.camera.left = -4 * aspect;
    this.camera.right = 4 * aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this._positionIcons(this.motionQuery.matches ? 0 : this.clock.getElapsedTime());
    this.renderer.render(this.scene, this.camera);
  }

  _positionIcons(t) {
    const reduced = this.motionQuery.matches;
    const width = this.camera.right - this.camera.left;
    this.sprites.forEach(sprite => {
      const { anchor, phase, speed } = sprite.userData;
      const wave = t * speed + phase;
      const dx = reduced ? 0 : Math.cos(wave * 0.8) * 0.065;
      const dy = reduced ? 0 : Math.sin(wave) * 0.13;
      sprite.position.set((anchor[0] - 0.5) * width + dx, (0.5 - anchor[1]) * 8 + dy, 0);
      sprite.material.rotation = anchor[2] + (reduced ? 0 : Math.sin(wave * 0.7) * 0.045);
    });
  }

  _updateHover() {
    this.scene.updateMatrixWorld(true);
    this.camera.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.hitPointer, this.camera);
    this.hoverSprite = this.raycaster.intersectObjects(this.sprites, false)[0]?.object || null;
    this.sprites.forEach(sprite => {
      const target = sprite.userData.baseScale * (sprite === this.hoverSprite ? 1.12 : 1);
      const scale = this.motionQuery.matches ? target : sprite.scale.x + (target - sprite.scale.x) * 0.18;
      sprite.scale.set(scale, scale, 1);
    });
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this._raf);
  }

  start() {
    if (this.running || document.hidden) return;
    this.running = true;
    const animate = () => {
      const reduced = this.motionQuery.matches;
      const t = reduced ? 0 : this.clock.getElapsedTime();
      this._positionIcons(t);

      // subtle parallax tilt toward the cursor (whole ring shifts slightly, stays screen-facing)
      const targetX = reduced ? 0 : this.mouse.x * 0.10;
      const targetY = reduced ? 0 : -this.mouse.y * 0.08;
      if (reduced) this.group.position.set(0, 0, 0);
      this.group.position.x += (targetX - this.group.position.x) * 0.05;
      this.group.position.y += (targetY - this.group.position.y) * 0.05;

      this._updateHover();
      this.renderer.render(this.scene, this.camera);
      if (!reduced) this._raf = requestAnimationFrame(animate);
      else this.running = false;
    };
    animate();
  }
}

window.IconOrbit = IconOrbit;