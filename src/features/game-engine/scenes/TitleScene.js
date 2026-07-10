import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const { width, height } = this.scale;

    // Background di-stretch supaya selalu menutupi seluruh area kanvas,
    // termasuk saat kanvas resize mengikuti ukuran browser.
    this.bg = this.add
      .image(width / 2, height / 2, 'press-start-bg')
      .setOrigin(0.5)
      .setDisplaySize(width, height)
      .setDepth(0);

    // Jika belum ada aset title-logo.png, tampilkan judul sebagai teks pixel
    // sebagai fallback supaya scene tidak kosong.
    if (this.textures.exists('title-logo')) {
      this.logo = this.add
        .image(width / 2, height / 3, 'title-logo')
        .setOrigin(0.5);
    } else {
      this.logo = this.add
        .text(width / 2, height / 3, 'NAWASENA DARA', {
          fontFamily: '"Jersey 15", monospace',
          fontSize: '64px',
          color: '#ffffff',
          stroke: '#4b2e6b',
          strokeThickness: 6,
        })
        .setOrigin(0.5);
    }

    this.pressText = this.add
      .text(width / 2, height * 0.75, 'PRESS SPACE TO START', {
        fontFamily: '"Pixelify Sans", monospace',
        fontSize: '22px',
        fontStyle: '600',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // efek berkedip ala tombol arcade "insert coin"
    this.tweens.add({
      targets: this.pressText,
      alpha: 0,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('MenuScene');
    });

    // Reposisi & resize elemen saat ukuran kanvas berubah (mis. window
    // browser di-resize), supaya background selalu penuh satu layar.
    this.scale.on('resize', this.handleResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.handleResize, this);
    });
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;
    this.bg.setPosition(width / 2, height / 2).setDisplaySize(width, height);
    this.logo.setPosition(width / 2, height / 3);
    this.pressText.setPosition(width / 2, height * 0.75);
  }
}
