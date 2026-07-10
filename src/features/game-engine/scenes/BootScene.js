import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Catatan: title-logo.png belum ada di aset proyek. TitleScene sudah
    // punya fallback teks pixel kalau texture ini tidak ditemukan, jadi
    // baris load-nya sengaja tidak diaktifkan sampai asetnya tersedia.
    // Kalau logo sudah siap, taruh filenya di public/ui/title-logo.png lalu
    // aktifkan lagi baris di bawah ini:
    // this.load.image('title-logo', '/ui/title-logo.png');

    this.load.image('press-start-bg', '/ui/press-start-bg.png');

    // Background scene Episode 1 - koridor sekolah
    this.load.image('episode1-bg', '/scenes/episode-1-corridor.png');

    this.load.spritesheet(
      'player-walk-sheet',
      '/sprites/player/spritesheets/walk_spritesheet.png',
      {
        frameWidth: 254,
        frameHeight: 598,
      },
    );
  }

  async create() {
    // Pastikan font pixel (Jersey 15, Pixelify Sans) sudah dimuat browser
    // sebelum scene teks dibuat, supaya tidak fallback ke font default sesaat.
    try {
      await Promise.all([
        document.fonts.load('16px "Jersey 15"'),
        document.fonts.load('16px "Pixelify Sans"'),
      ]);
      await document.fonts.ready;
    } catch (e) {
      // Kalau gagal load (mis. offline), tetap lanjut dengan fallback monospace
      console.warn('Pixel font gagal dimuat, pakai fallback.', e);
    }

    this.scene.start('TitleScene');
  }
}
