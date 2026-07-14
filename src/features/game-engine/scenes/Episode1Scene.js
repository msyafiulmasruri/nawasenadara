import BasePlayerScene from './BasePlayerScene';
import { completeEpisode } from '../utils/progressStore';
import { WORLD_WIDTH } from '../config/gameConfig';

// Episode 1 - Awal yang Baru. Dulu bernama ClassroomScene; sekarang
// meng-extend BasePlayerScene supaya logic gerakan tidak dobel dengan
// PlaceholderEpisodeScene (episode 2-9).
export default class Episode1Scene extends BasePlayerScene {
  constructor() {
    super('Episode1Scene');
  }

  createBackground(width, height) {
    this.bg = this.add.image(width / 2, height / 2, 'episode1-bg');
    this.bg.setDisplaySize(width, height);
    this.bg.setDepth(0);

    this.finished = false;
  }

  // Zona "selesai episode" sederhana: jalan sampai ke ujung kanan layar.
  // Nanti kalau sudah ada desain trigger yang lebih spesifik (mis. masuk
  // pintu kelas), tinggal ganti kondisi di sini.
  onSceneUpdate() {
    if (this.finished) return;
    if (this.player.x > WORLD_WIDTH - 60) {
      this.finished = true;
      completeEpisode(1);
      this.scene.start('EpisodeIntroScene', { episodeId: 2 });
    }
  }
}
