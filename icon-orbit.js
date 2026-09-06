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
    this.radius = 3.0; // screen-facing circle radius, in world units

    this.sprites = this.icons.map((icon, i) => {
      const texture = icon.src
        ? loader.load(icon.src)
        : this._makePlaceholderTexture(icon.label, icon.color || '#4b5563');

      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
      const sprite = new THREE.Sprite(material);

      const scale = 0.85;
      sprite.scale.set(scale, scale, 1);

      const angle = (i / count) * Math.PI * 2;
      sprite.userData.baseAngle = angle;
      sprite.renderOrder = 2;

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
      const angularSpeed = 0.35; // radians/sec

      this.sprites.forEach(sprite => {
        const angle = sprite.userData.baseAngle + t * angularSpeed;
        // Screen-facing circle: x/y trace a ring around the character; z stays 0
        // so every icon renders in front, never clipped by the character layer beneath.
        sprite.position.x = Math.cos(angle) * this.radius;
        sprite.position.y = Math.sin(angle) * this.radius * 0.92; // slight vertical compression to match portrait framing
      });

      // subtle parallax tilt toward the cursor (whole ring shifts slightly, stays screen-facing)
      const targetX = this.mouse.x * 0.25;
      const targetY = -this.mouse.y * 0.2;
      this.group.position.x += (targetX - this.group.position.x) * 0.05;
      this.group.position.y += (targetY - this.group.position.y) * 0.05;

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(animate);
    };
    animate();
  }
}

window.IconOrbit = IconOrbit;