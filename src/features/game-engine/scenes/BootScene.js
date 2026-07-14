import Phaser from 'phaser';
import { createPlayerAnimations } from '../config/playerAnimations';

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

    // Sprite karakter: setiap pose disimpan sebagai file gambar terpisah,
    // dikelompokkan per folder animasi (idle/, walk/), bukan satu
    // spritesheet gabungan. Supaya gampang diganti/ditambah pose satu-satu
    // tanpa perlu re-export spritesheet, dan gampang nambah folder baru
    // (mis. talk/, blink/) mengikuti pola yang sama nanti.
    this.load.image('player-idle', '/sprites/player/idle/idle.png');

    this.load.image('player-walk-1', '/sprites/player/walk/walk_1.png');
    this.load.image('player-walk-2', '/sprites/player/walk/walk_2.png');
    this.load.image('player-walk-3', '/sprites/player/walk/walk_3.png');
    this.load.image('player-walk-4', '/sprites/player/walk/walk_4.png');
    this.load.image('player-walk-5', '/sprites/player/walk/walk_5.png');

    this.load.image('player-run-1', '/sprites/player/run/run_1.png');
    this.load.image('player-run-2', '/sprites/player/run/run_2.png');
    this.load.image('player-run-3', '/sprites/player/run/run_3.png');
    this.load.image('player-run-4', '/sprites/player/run/run_4.png');

    this.load.image('player-jump-1', '/sprites/player/jump/jump_1.png');
    this.load.image('player-jump-2', '/sprites/player/jump/jump_2.png');
    this.load.image('player-jump-3', '/sprites/player/jump/jump_3.png');

    this.load.image('player-jump-run-1', '/sprites/player/jump_run/jump_run_1.png');
    this.load.image('player-jump-run-2', '/sprites/player/jump_run/jump_run_2.png');

    // Catatan: sound effect & BGM TIDAK di-load sebagai file di sini.
    // Sekarang dipakai AudioManager (src/features/game-engine/audio/AudioManager.js)
    // yang generate suara secara real-time via Web Audio API langsung
    // di browser, jadi tidak butuh file audio sama sekali.
  }

  async create() {
    // Animasi player dibuat SEKALI di sini, bukan di tiap scene episode
    // (lihat catatan lengkap di config/playerAnimations.js soal kenapa).
    createPlayerAnimations(this);

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
