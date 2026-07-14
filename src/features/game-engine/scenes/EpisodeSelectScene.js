import Phaser from 'phaser';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../config/gameConfig';
import { EPISODES } from '../config/episodes';
import { isEpisodeUnlocked } from '../utils/progressStore';

export default class EpisodeSelectScene extends Phaser.Scene {
  constructor() {
    super('EpisodeSelectScene');
  }

  create() {
    const width = WORLD_WIDTH;
    const height = WORLD_HEIGHT;

    this.add.rectangle(width / 2, height / 2, width, height, 0x12101c).setDepth(0);

    this.add
      .text(width / 2, 44, 'PILIH EPISODE', {
        fontFamily: '"Jersey 15", monospace',
        fontSize: '30px',
        color: '#ffdd57',
      })
      .setOrigin(0.5)
      .setDepth(1);

    const backBtn = this.add
      .text(24, 24, '< Menu', {
        fontFamily: '"Pixelify Sans", monospace',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setInteractive({ useHandCursor: true })
      .setDepth(1);
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    const listTop = 90;
    const rowHeight = 60;

    EPISODES.forEach((ep, index) => {
      const y = listTop + index * rowHeight;
      const unlocked = isEpisodeUnlocked(ep.id);

      const rowBg = this.add
        .rectangle(width / 2, y, width * 0.7, rowHeight - 10, unlocked ? 0x2a2540 : 0x1a1a24, 1)
        .setStrokeStyle(1, unlocked ? 0xffdd57 : 0x3a3a44, unlocked ? 0.8 : 0.5)
        .setDepth(1);

      const label = unlocked
        ? `Episode ${ep.id} — ${ep.title}`
        : `🔒 Episode ${ep.id} — Terkunci`;

      const labelText = this.add
        .text(width / 2, y, label, {
          fontFamily: '"Pixelify Sans", monospace',
          fontSize: '17px',
          color: unlocked ? '#ffffff' : '#777788',
        })
        .setOrigin(0.5)
        .setDepth(2);

      if (unlocked) {
        rowBg.setInteractive({ useHandCursor: true });
        const goToIntro = () => this.scene.start('EpisodeIntroScene', { episodeId: ep.id });
        rowBg.on('pointerdown', goToIntro);
        rowBg.on('pointerover', () => rowBg.setFillStyle(0x3a3560, 1));
        rowBg.on('pointerout', () => rowBg.setFillStyle(0x2a2540, 1));
        labelText.setInteractive({ useHandCursor: true });
        labelText.on('pointerdown', goToIntro);
      }
    });
  }
}
