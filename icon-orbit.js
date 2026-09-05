/**
 * IconOrbit
 * ---------
 * Renders a ring of billboarded icon sprites orbiting in 3D around the
 * character, using Three.js. Transparent canvas — sits as an overlay behind
 * or around the character-sequence canvas.
 *
 * ICONS: swap `icons` for your real logo files (SVG/PNG, square, ideally
 * with transparent backgrounds). Get official brand marks from each
 * product's press/brand page, or a neutral icon set like simpleicons.org
 * (SVG, free to use) if you want a consistent style instead of mixed
 * official logos. Until you provide real files, this generates placeholder
 * badges (initials on a colored circle) purely as a stand-in.
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
    this.mouse = { x: 0, y: 0 };

    this._initScene();
    this._buildIcons();
    this._bindEvents();
  }

  _initScene() {
    const { clientWidth: w, clientHeight: h } = this.container;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
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
    const radius = 3.4;

    this.sprites = this.icons.map((icon, i) => {
      const texture = icon.src
        ? loader.load(icon.src)
        : this._makePlaceholderTexture(icon.label, icon.color || '#4b5563');

      const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(material);

      const scale = 0.9;
      sprite.scale.set(scale, scale, 1);

      const angle = (i / count) * Math.PI * 2;
      sprite.userData.angle = angle;
      sprite.userData.radius = radius;
      sprite.userData.bobOffset = Math.random() * Math.PI * 2;

      sprite.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      this.group.add(sprite);
      return sprite;
    });
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._onResize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    });
  }

  _onResize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  start() {
    const animate = () => {
      const t = this.clock.getElapsedTime();

      this.group.rotation.y = t * 0.18; // slow continuous orbit

      this.sprites.forEach(sprite => {
        const { angle, radius, bobOffset } = sprite.userData;
        sprite.position.y = Math.sin(t * 0.8 + bobOffset) * 0.25; // gentle float
      });

      // subtle parallax tilt toward the cursor
      this.group.rotation.x += (this.mouse.y * 0.15 - this.group.rotation.x) * 0.04;
      const targetZRot = this.mouse.x * 0.08;
      this.group.rotation.z += (targetZRot - this.group.rotation.z) * 0.04;

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(animate);
    };
    animate();
  }
}

window.IconOrbit = IconOrbit;
