import Phaser from 'phaser';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../config/gameConfig';
import { resetProgress } from '../utils/progressStore';
import AudioManager from '../audio/AudioManager';

const WALK_SPEED = 150;
const RUN_SPEED = 260;
const JUMP_HEIGHT = 90;
const JUMP_DURATION = 480;

// Scene dasar berisi seluruh logic gerakan karakter (walk/run/jump,
// keyboard + touch control) yang dipakai bersama oleh Episode1Scene dan
// PlaceholderEpisodeScene, supaya tidak ada kode gerakan yang
// dobel-tulis di banyak file. Episode/scene turunan cukup meng-override
// `createBackground()` untuk menentukan tampilan latar masing-masing,
// dan boleh menambah logic sendiri di `onSceneUpdate()` (dipanggil tiap
// frame dari update() bawaan kelas ini).
export default class BasePlayerScene extends Phaser.Scene {
  create() {
    const width = WORLD_WIDTH;
    const height = WORLD_HEIGHT;

    this.groundY = height - 120;

    // Latar belakang: ditentukan oleh scene turunan (Episode1Scene pakai
    // gambar asli, PlaceholderEpisodeScene pakai warna polos + label).
    this.createBackground(width, height);

    this.player = this.physics.add.sprite(300, this.groundY, 'player-idle');
    this.player.setOrigin(0.5, 1);
    this.player.setDepth(1);
    this.player.setCollideWorldBounds(true);

    const targetHeight = 240;
    this.spriteScale = targetHeight / 400;
    this.player.setScale(this.spriteScale);

    // Catatan: animasi walk/run/jump TIDAK dibuat di sini lagi. Kalau
    // dulu dibuat ulang tiap scene episode create(), Phaser cuma
    // menerima pembuatan pertama karena this.anims itu global satu
    // instance game — perubahan frameRate jadi terasa "tidak
    // berpengaruh". Sekarang animasinya dibuat SEKALI di
    // BootScene.create() lewat config/playerAnimations.js — kalau mau
    // ubah kecepatan animasi, edit frameRate di file itu.

    // --- Audio Manager (procedural, tanpa file eksternal) ---
    // init() harus dipanggil dari konteks yang dipicu user interaction
    // (klik/tap Start Story sebelumnya), supaya AudioContext tidak kena
    // blokir kebijakan autoplay browser.
    this.audioManager = new AudioManager();
    this.audioManager.init();
    this.audioManager.startBGM();
    this.isMuted = false;

    // Daftarkan listener animasi footstep berbasis frame animasi Phaser.
    // Dengan cara ini, SFX bunyi langkah kaki selalu sinkron dengan
    // frame animasi — tidak tergantung frame rate game sama sekali.
    // Frame "kaki turun" pada walk: frame ke-1 dan ke-3 (index 0 & 2).
    // Frame "kaki turun" pada run : frame ke-1 dan ke-3 (index 0 & 2).
    this._registerFootstepListeners();

    // Pastikan AudioManager benar-benar berhenti & AudioContext ditutup
    // saat pindah scene (episode lain / balik ke menu), supaya tidak ada
    // BGM dobel menumpuk dan tidak menyisakan AudioContext yang terus
    // hidup di background.
    this.events.once('shutdown', () => {
      this.audioManager?.destroy();
    });

    // --- Input keyboard: Arrow keys + WASD + Space untuk lompat ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keysWASD = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shiftKeyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    this.touchState = { left: false, right: false, runToggle: false, jumpRequested: false };
    this.isJumping = false;
    this.jumpLocksMovement = false;

    this.createTouchControls(width, height);

    // --- Menu jeda (pause) ---
    this.isPaused = false;
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.createPauseButton(width, height);
    this.createPauseMenu(width, height);
  }

  // Ditimpa oleh scene turunan.
  createBackground(_width, _height) {
    // no-op default
  }

  // Ditimpa oleh scene turunan yang butuh logic tambahan tiap frame
  // (mis. cek zona finish episode). Dipanggil di akhir update().
  onSceneUpdate(_time, _delta) {
    // no-op default
  }

  /**
   * Daftarkan listener Phaser `animationupdate` pada sprite player.
   * SFX footstep hanya di-trigger pada frame tertentu (frame "kaki turun")
   * sehingga ritme bunyi selalu selaras dengan animasi,
   * tanpa bergantung pada frame rate game.
   */
  _registerFootstepListeners() {
    // Frame index kaki menyentuh tanah (0-based):
    //   walk (5 frame): index 1 dan 3  → kaki kiri & kanan turun
    //   run  (4 frame): index 1 dan 3  → kaki kiri & kanan turun
    const WALK_FOOT_FRAMES = new Set([1, 3]);
    const RUN_FOOT_FRAMES = new Set([1, 3]);

    this.player.on('animationupdate', (anim, frame) => {
      const idx = frame.index - 1; // Phaser frame.index dimulai dari 1
      if (anim.key === 'walk' && WALK_FOOT_FRAMES.has(idx)) {
        this.audioManager?.playFootstepWalk();
      } else if (anim.key === 'run' && RUN_FOOT_FRAMES.has(idx)) {
        this.audioManager?.playFootstepRun();
      }
    });
  }

  createTouchControls(width, height) {
    const buttonRadius = 42;
    const buttonY = height - 70;
    const leftX = 90;
    const rightX = 90 + buttonRadius * 2 + 24;
    const runX = width - 90;
    const jumpX = width - 90 - buttonRadius * 2 - 24;

    const makeButton = (x, y, label, onDown, onUp) => {
      const circle = this.add.circle(x, y, buttonRadius, 0x1a1a2e, 0.55);
      circle.setStrokeStyle(2, 0xffffff, 0.6);
      circle.setScrollFactor(0);
      circle.setDepth(10);
      circle.setInteractive({ useHandCursor: true });

      const text = this.add
        .text(x, y, label, {
          fontFamily: 'Silkscreen, monospace',
          fontSize: '18px',
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

    this.btnRun = makeButton(runX, buttonY, 'RUN', () => {
      this.touchState.runToggle = !this.touchState.runToggle;
    });

    this.btnJump = makeButton(jumpX, buttonY, 'JUMP', () => {
      this.touchState.jumpRequested = true;
    });
  }

  createPauseButton(width) {
    // Tombol jeda kecil di pojok kanan atas — selalu terlihat, terpisah
    // dari tombol gerak di bawah supaya tidak tertekan tidak sengaja.
    const btn = this.add.rectangle(width - 40, 36, 52, 40, 0x1a1a2e, 0.6);
    btn.setStrokeStyle(2, 0xffffff, 0.6);
    btn.setScrollFactor(0);
    btn.setDepth(20);
    btn.setInteractive({ useHandCursor: true });

    this.add
      .text(width - 40, 36, '☰', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(21);

    btn.on('pointerdown', () => this.togglePause());
  }

  createPauseMenu(width, height) {
    const container = this.add.container(0, 0).setDepth(100).setVisible(false);
    this.pauseMenuContainer = container;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    container.add(overlay);

    const panel = this.add.rectangle(width / 2, height / 2, 420, 400, 0x1a1a2e, 0.95);
    panel.setStrokeStyle(2, 0xffdd57, 0.8);
    container.add(panel);

    const title = this.add
      .text(width / 2, height / 2 - 160, 'JEDA', {
        fontFamily: '"Jersey 15", monospace',
        fontSize: '28px',
        color: '#ffdd57',
      })
      .setOrigin(0.5);
    container.add(title);

    // Label mute disimpan sebagai properti supaya teksnya bisa
    // diperbarui setiap kali status mute berubah.
    this.muteLabelText = this.add
      .text(width / 2, height / 2 + 130, this.getMuteLabel(), {
        fontFamily: '"Pixelify Sans", monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.muteLabelText.on('pointerdown', () => this.toggleMute());
    container.add(this.muteLabelText);

    const options = [
      { label: 'Lanjutkan', action: () => this.togglePause() },
      { label: 'Pilih Episode', action: () => this.goToEpisodeSelect() },
      { label: 'Menu Utama (Lobby)', action: () => this.goToMainMenu() },
      { label: 'Mulai Ulang dari Awal', action: () => this.restartFromBeginning() },
    ];

    options.forEach((opt, i) => {
      const y = height / 2 - 90 + i * 50;
      const optText = this.add
        .text(width / 2, y, opt.label, {
          fontFamily: '"Pixelify Sans", monospace',
          fontSize: '19px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      optText.on('pointerover', () => optText.setColor('#ffdd57'));
      optText.on('pointerout', () => optText.setColor('#ffffff'));
      optText.on('pointerdown', opt.action);

      container.add(optText);
    });
  }

  getMuteLabel() {
    return this.isMuted ? '🔇 Suara: Mati (tap untuk nyalakan)' : '🔊 Suara: Nyala (tap untuk matikan)';
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.audioManager?.setMasterVolume(this.isMuted ? 0 : 1);
    this.muteLabelText?.setText(this.getMuteLabel());
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.pauseMenuContainer.setVisible(this.isPaused);

    if (this.isPaused) {
      // Hentikan dulu suara langkah kaki yang mungkin sedang berbunyi,
      // dan bekukan fisika supaya karakter tidak diam-diam terus
      // bergerak/lompat di belakang menu jeda.
      // (Listener animationupdate otomatis berhenti saat animasi berhenti.)
      this.physics.world.pause();
    } else {
      this.physics.world.resume();
    }
  }

  goToEpisodeSelect() {
    this.isPaused = false;
    this.scene.start('EpisodeSelectScene');
  }

  goToMainMenu() {
    this.isPaused = false;
    this.scene.start('MenuScene');
  }

  restartFromBeginning() {
    this.isPaused = false;
    resetProgress();
    this.scene.start('TitleScene');
  }

  update(time, delta) {
    // ESC selalu dicek duluan, baik untuk membuka maupun menutup menu
    // jeda, jadi harus di atas early-return berikutnya.
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.togglePause();
    }
    if (this.isPaused) {
      return;
    }

    const jumpJustPressed =
      Phaser.Input.Keyboard.JustDown(this.jumpKey) || this.touchState.jumpRequested;
    this.touchState.jumpRequested = false;

    const goLeftInput = this.cursors.left.isDown || this.keysWASD.left.isDown || this.touchState.left;
    const goRightInput =
      this.cursors.right.isDown || this.keysWASD.right.isDown || this.touchState.right;
    const currentDirection = goLeftInput ? -1 : goRightInput ? 1 : 0;

    if (Phaser.Input.Keyboard.JustDown(this.shiftKeyLeft)) {
      this.touchState.runToggle = !this.touchState.runToggle;
    }
    const isRunning = this.touchState.runToggle;
    const speed = isRunning ? RUN_SPEED : WALK_SPEED;

    if (this.btnRun && this.lastRunVisual !== isRunning) {
      this.lastRunVisual = isRunning;
      this.btnRun.circle.setFillStyle(isRunning ? 0xffdd57 : 0x1a1a2e, isRunning ? 0.85 : 0.55);
      this.btnRun.text.setColor(isRunning ? '#1a1a2e' : '#ffffff');
    }

    if (jumpJustPressed && !this.isJumping) {
      this.isJumping = true;
      this.jumpLocksMovement = currentDirection === 0;
      this.audioManager?.playJump();

      if (this.jumpLocksMovement) {
        this.player.play('jump', true);
      } else {
        this.player.anims.stop();
        this.player.setTexture('player-jump-run-1');
      }

      this.tweens.add({
        targets: this.player,
        y: this.groundY - JUMP_HEIGHT,
        duration: JUMP_DURATION / 2,
        ease: 'Sine.easeOut',
        yoyo: true,
        onYoyo: () => {
          if (!this.jumpLocksMovement) {
            this.player.setTexture('player-jump-run-2');
          }
        },
        onComplete: () => {
          this.isJumping = false;
          this.jumpLocksMovement = false;
          this.player.y = this.groundY;
          // Catatan: AudioManager belum punya bunyi khusus "mendarat",
          // cuma playJump() untuk lepas landas. Kalau nanti mau
          // ditambah, tinggal buat method playLand() baru di
          // AudioManager.js lalu panggil di sini.
        },
      });
    }

    if (this.isJumping) {
      if (this.jumpLocksMovement) {
        this.player.setVelocityX(0);
      } else {
        if (goLeftInput) {
          this.player.setVelocityX(-speed);
          this.player.setFlipX(true);
        } else if (goRightInput) {
          this.player.setVelocityX(speed);
          this.player.setFlipX(false);
        } else {
          this.player.setVelocityX(0);
        }
      }
      this.player.setScale(this.spriteScale);
      this.onSceneUpdate(time, delta);
      return;
    }

    const animKey = isRunning ? 'run' : 'walk';

    if (currentDirection === -1) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      this.player.setScale(this.spriteScale);
      // SFX footstep di-trigger oleh listener animationupdate di
      // _registerFootstepListeners(), bukan di sini — jadi ritme bunyi
      // selalu selaras dengan frame animasi, bukan frame rate game.
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

    this.onSceneUpdate(time, delta);
  }
}
