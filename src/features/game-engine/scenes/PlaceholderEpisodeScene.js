import BasePlayerScene from './BasePlayerScene';
import { getEpisodeById, EPISODES } from '../config/episodes';
import { completeEpisode } from '../utils/progressStore';
import { WORLD_WIDTH } from '../config/gameConfig';

// Dipakai sementara oleh episode 2-9 selagi background asli belum jadi.
// Begitu aset latar tersedia, cara menggantinya:
// 1. Buat file scene baru (contoh: Episode2Scene.js) meniru pola
//    Episode1Scene.js (extend BasePlayerScene, override createBackground
//    supaya load gambar asli lewat this.add.image).
// 2. Daftarkan scene baru itu di PhaserGame.jsx (array `scene`).
// 3. Ganti `sceneKey` episode terkait di config/episodes.js dari
//    'PlaceholderEpisodeScene' menjadi nama scene baru itu.
// Tidak ada bagian lain yang perlu diubah — EpisodeSelectScene,
// EpisodeIntroScene, dan progressStore semuanya baca dari episodes.js.
export default class PlaceholderEpisodeScene extends BasePlayerScene {
  constructor() {
    super('PlaceholderEpisodeScene');
  }

  init(data) {
    this.episodeId = data?.episodeId ?? 2;
    this.episodeData = getEpisodeById(this.episodeId);
    this.finished = false;
  }

  createBackground(width, height) {
    const color = this.episodeData?.placeholderColor ?? 0x222222;

    this.add.rectangle(width / 2, height / 2, width, height, color).setDepth(0);

    // Penanda jelas bahwa ini masih placeholder, supaya tidak
    // terkira aset final saat demo/testing.
    this.add
      .text(width / 2, 60, `EPISODE ${this.episodeId} — ${this.episodeData?.title ?? ''}`, {
        fontFamily: '"Pixelify Sans", monospace',
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(1);

    this.add
      .text(width / 2, 92, '(Background placeholder — menunggu aset final)', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#cccccc',
      })
      .setOrigin(0.5)
      .setDepth(1);

    this.add
      .text(width - 20, height - 20, 'Jalan ke kanan untuk lanjut ->', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#ffdd57',
      })
      .setOrigin(1, 1)
      .setDepth(1);
  }

  onSceneUpdate() {
    if (this.finished) return;
    if (this.player.x > WORLD_WIDTH - 60) {
      this.finished = true;
      completeEpisode(this.episodeId);

      const isLastEpisode = this.episodeId >= EPISODES.length;
      if (isLastEpisode) {
        // Belum ada scene "tamat" khusus — untuk sementara kembali ke
        // daftar episode dulu.
        this.scene.start('EpisodeSelectScene');
      } else {
        this.scene.start('EpisodeIntroScene', { episodeId: this.episodeId + 1 });
      }
    }
  }
}
