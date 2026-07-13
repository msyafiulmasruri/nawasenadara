import Phaser from 'phaser';

// Berapa lama tombol arah harus ditekan terus-menerus (ms) sebelum
// transisi otomatis dari jalan ke lari.
const RUN_TRANSITION_MS = 450;

const WALK_SPEED = 150;
const RUN_SPEED = 260;

export default class ClassroomScene extends Phaser.Scene {
  constructor() {
    super('ClassroomScene');
  }

  create() {
    const { width, height } = this.scale;

    // Background Episode 1: koridor sekolah (gaya A Space for the Unbound
    // - pixel art hangat, wide-shot, kamera diam dengan sedikit parallax)
    this.bg = this.add.image(width / 4, height / 4, 'episode1-bg');
    this.bg.setDisplaySize(width, height);
    this.bg.setDepth(0);

    // Karakter dibangun dari gambar-gambar terpisah (idle, walk_1-3,
    // run_1-6), bukan satu spritesheet gabungan. Origin diset ke
    // (0.5, 1) -> titik jangkar ada di tengah-bawah (kaki), supaya waktu
    // texture di-swap antar frame, posisi kaki di lantai tetap konsisten
    // walau lebar/tinggi tiap gambar sedikit berbeda.
    this.player = this.physics.add.sprite(300, height - 120, 'player-idle');
    this.player.setOrigin(0.5, 1);
    this.player.setDepth(1);
    this.player.setCollideWorldBounds(true);

    // Semua frame sudah di-resize seragam tinggi 400px saat proses aset,
    // jadi cukup satu skala target di sini supaya proporsional dengan
    // latar belakang koridor.
    const targetHeight = 280;
    this.spriteScale = targetHeight / 400;
    this.player.setScale(this.spriteScale);

    // Animasi walk: dirangkai dari 3 texture image terpisah.
    this.anims.create({
      key: 'walk',
      frames: [
        { key: 'player-walk-1' },
        { key: 'player-walk-2' },
        { key: 'player-walk-3' },
      ],
      frameRate: 8,
      repeat: -1,
    });

    // Animasi run: 6 texture image terpisah, frame rate lebih cepat
    // supaya terasa lebih ngebut dibanding walk.
    this.anims.create({
      key: 'run',
      frames: [
        { key: 'player-run-1' },
        { key: 'player-run-2' },
        { key: 'player-run-3' },
        { key: 'player-run-4' },
        { key: 'player-run-5' },
        { key: 'player-run-6' },
      ],
      frameRate: 14,
      repeat: -1,
    });

    // --- Input keyboard: Arrow keys + WASD sekaligus ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keysWASD = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // --- Tombol arah + tombol lari di layar untuk mobile/touch ---
    // holdTime melacak berapa lama arah yang sama ditekan terus, dipakai
    // untuk transisi otomatis walk -> run baik dari keyboard maupun dari
    // tombol arah touch (keduanya sama-sama "ditahan").
    // runToggle khusus untuk tombol lari mobile: BUKAN tekan-tahan,
    // melainkan tombol tap on/off (sekali tap aktif terus sampai di-tap lagi).
    this.touchState = { left: false, right: false, runToggle: false };
    this.holdTime = 0;
    this.holdDirection = 0; // -1 kiri, 1 kanan, 0 diam

    this.createTouchControls(width, height);

    // Reposisi latar, pemain, dan tombol saat kanvas resize.
    this.scale.on('resize', this.handleResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.handleResize, this);
    });
  }

  createTouchControls(width, height) {
    const buttonRadius = 42;
    const buttonY = height - 90;
    const leftX = 90;
    const rightX = 90 + buttonRadius * 2 + 24;
    const runX = width - 90;

    const makeButton = (x, y, label, onDown, onUp) => {
      const circle = this.add.circle(x, y, buttonRadius, 0x1a1a2e, 0.55);
      circle.setStrokeStyle(2, 0xffffff, 0.6);
      circle.setScrollFactor(0);
      circle.setDepth(10);
      circle.setInteractive({ useHandCursor: true });

      const text = this.add
        .text(x, y, label, {
          fontFamily: 'Silkscreen, monospace',
          fontSize: '20px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(11);

      if (onDown) circle.on('pointerdown', onDown);
      if (onUp) {
        circle.on('pointerup', onUp);
        circle.on('pointerout', onUp);
      }

      return { circle, text };
    };

    this.btnLeft = makeButton(
      leftX,
      buttonY,
      '<',
      () => {
        this.touchState.left = true;
      },
      () => {
        this.touchState.left = false;
      },
    );

    this.btnRight = makeButton(
      rightX,
      buttonY,
      '>',
      () => {
        this.touchState.right = true;
      },
      () => {
        this.touchState.right = false;
      },
    );

    // Tombol lari mobile: sengaja TIDAK pakai pointerup (tidak perlu
    // ditahan). Sekali tap -> toggle nyala/mati, warnanya berubah
    // supaya jelas statusnya aktif atau tidak.
    this.btnRun = makeButton(runX, buttonY, 'RUN', () => {
      this.touchState.runToggle = !this.touchState.runToggle;
      const active = this.touchState.runToggle;
      this.btnRun.circle.setFillStyle(active ? 0xffdd57 : 0x1a1a2e, active ? 0.85 : 0.55);
      this.btnRun.text.setColor(active ? '#1a1a2e' : '#ffffff');
    });
  }

  repositionTouchControls(width, height) {
    if (!this.btnLeft || !this.btnRight || !this.btnRun) return;
    const buttonRadius = 42;
    const buttonY = height - 90;
    const leftX = 90;
    const rightX = 90 + buttonRadius * 2 + 24;
    const runX = width - 90;

    this.btnLeft.circle.setPosition(leftX, buttonY);
    this.btnLeft.text.setPosition(leftX, buttonY);
    this.btnRight.circle.setPosition(rightX, buttonY);
    this.btnRight.text.setPosition(rightX, buttonY);
    this.btnRun.circle.setPosition(runX, buttonY);
    this.btnRun.text.setPosition(runX, buttonY);
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;
    this.bg.setPosition(width / 2, height / 2).setDisplaySize(width, height);
    if (this.physics?.world) {
      this.physics.world.setBounds(0, 0, width, height);
    }
    this.repositionTouchControls(width, height);
  }

  update(time, delta) {
    const goLeft = this.cursors.left.isDown || this.keysWASD.left.isDown || this.touchState.left;
    const goRight = this.cursors.right.isDown || this.keysWASD.right.isDown || this.touchState.right;

    const currentDirection = goLeft ? -1 : goRight ? 1 : 0;

    // Lacak berapa lama arah yang sama ditekan terus-menerus. Ganti arah
    // atau lepas tombol akan me-reset hitungan, jadi transisi ke lari
    // selalu butuh tekan-tahan yang baru, bukan akumulasi dari gerakan
    // sebelumnya.
    if (currentDirection !== 0 && currentDirection === this.holdDirection) {
      this.holdTime += delta;
    } else {
      this.holdTime = 0;
      this.holdDirection = currentDirection;
    }

    // Tombol lari mobile bersifat toggle (tap sekali, bukan tahan), jadi
    // begitu aktif langsung lari tanpa perlu menunggu ambang waktu.
    const isRunning = this.touchState.runToggle || this.holdTime >= RUN_TRANSITION_MS;
    const speed = isRunning ? RUN_SPEED : WALK_SPEED;
    const animKey = isRunning ? 'run' : 'walk';

    if (currentDirection === -1) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      this.player.setScale(this.spriteScale);
      this.player.play(animKey, true);
    } else if (currentDirection === 1) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      this.player.setScale(this.spriteScale);
      this.player.play(animKey, true);
    } else {
      this.player.setVelocityX(0);
      this.player.stop();
      this.player.setTexture('player-idle');
      this.player.setScale(this.spriteScale);
    }
  }
}
