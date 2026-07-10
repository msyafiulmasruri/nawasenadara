import Phaser from 'phaser';

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

    this.player = this.physics.add.sprite(300, height - 320, 'player-walk-sheet');
    this.player.setDepth(1);
    this.player.setCollideWorldBounds(true);

    // Frame asli walk_spritesheet berukuran besar (254x598, gaya ilustrasi
    // karakter), jadi di-scale down supaya proporsional dengan latar
    // belakang koridor dan tidak memenuhi layar.
    const targetHeight = 280;
    const spriteScale = targetHeight / 598;
    this.player.setScale(spriteScale);

    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('player-walk-sheet', {
        start: 0,
        end: 2,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    // Reposisi latar & pemain saat kanvas resize.
    this.scale.on('resize', this.handleResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.handleResize, this);
    });
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;
    this.bg.setPosition(width / 2, height / 2).setDisplaySize(width, height);
    if (this.physics?.world) {
      this.physics.world.setBounds(0, 0, width, height);
    }
  }

  update() {
    const speed = 150;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      this.player.play('walk', true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      this.player.play('walk', true);
    } else {
      this.player.setVelocityX(0);
      this.player.stop();
      this.player.setFrame(0); // kembali ke frame diam
    }
  }
}
