import Phaser from 'phaser';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../config/gameConfig';
import { getEpisodeById } from '../config/episodes';

export default class EpisodeIntroScene extends Phaser.Scene {
  constructor() {
    super('EpisodeIntroScene');
  }

  init(data) {
    this.episodeId = data?.episodeId ?? 1;
    this.episodeData = getEpisodeById(this.episodeId);
  }

  create() {
    const width = WORLD_WIDTH;
    const height = WORLD_HEIGHT;

    this.add.rectangle(width / 2, height / 2, width, height, 0x05050f).setDepth(0);

    // Bintang-bintang kecil, posisi acak, tiap bintang berkedip dengan
    // kecepatan berbeda-beda supaya tidak terasa seragam/kaku.
    for (let i = 0; i < 80; i += 1) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(1, 2.4);
      const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 1));
      star.setDepth(1);

      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.15, 0.4),
        duration: Phaser.Math.Between(1200, 3200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    this.add
      .text(width / 2, height * 0.32, `EPISODE ${this.episodeId}`, {
        fontFamily: '"Jersey 15", monospace',
        fontSize: '40px',
        color: '#ffdd57',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.add
      .text(width / 2, height * 0.32 + 46, this.episodeData?.title ?? '', {
        fontFamily: '"Pixelify Sans", monospace',
        fontSize: '24px',
        fontStyle: '600',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.add
      .text(width / 2, height * 0.55, this.episodeData?.description ?? '', {
        fontFamily: '"Pixelify Sans", monospace',
        fontSize: '16px',
        color: '#dddddd',
        align: 'center',
        wordWrap: { width: width * 0.7 },
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(2);

    const promptText = this.add
      .text(width / 2, height * 0.85, 'TEKAN UNTUK MULAI', {
        fontFamily: '"Pixelify Sans", monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.tweens.add({
      targets: promptText,
      alpha: 0,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const startEpisode = () => {
      const sceneKey = this.episodeData?.sceneKey ?? 'Episode1Scene';
      this.scene.start(sceneKey, { episodeId: this.episodeId });
    };

    this.input.keyboard.once('keydown-SPACE', startEpisode);
    this.input.once('pointerdown', startEpisode);
  }
}
