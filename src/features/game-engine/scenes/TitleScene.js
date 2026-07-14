import Phaser from 'phaser';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../config/gameConfig';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    // Dunia game tetap di WORLD_WIDTH x WORLD_HEIGHT (mode ENVELOP di
    // PhaserGame.jsx yang mengurus pembesaran tampilan ke layar penuh),
    // jadi tidak perlu lagi listener resize manual di sini.
    const width = WORLD_WIDTH;
    const height = WORLD_HEIGHT;

    this.bg = this.add
      .image(width / 2, height / 2, 'press-start-bg')
      .setOrigin(0.5)
      .setDisplaySize(width, height)
      .setDepth(0);

    if (this.textures.exists('title-logo')) {
      this.logo = this.add.image(width / 2, height / 3, 'title-logo').setOrigin(0.5);
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

    const goToMenu = () => {
      // Minta browser masuk mode fullscreen di sini karena ini dipanggil
      // langsung dari gesture pengguna (tekan Space / tap layar), yang
      // merupakan syarat wajib Fullscreen API di kebanyakan browser.
      // Dibungkus try/catch karena beberapa konteks (mis. iframe tanpa
      // izin, atau browser yang menolak) bisa gagal — kalau gagal, game
      // tetap lanjut jalan seperti biasa tanpa fullscreen.
      if (!this.scale.isFullscreen) {
        try {
          this.scale.startFullscreen();
        } catch (e) {
          console.warn('Fullscreen tidak didukung/ditolak browser.', e);
        }
      }
      this.scene.start('MenuScene');
    };

    this.input.keyboard.once('keydown-SPACE', goToMenu);

    // Supaya bisa ditekan/tap lewat HP juga: seluruh area layar jadi
    // area tap, bukan cuma tombol keyboard.
    this.input.once('pointerdown', goToMenu);
  }
}
