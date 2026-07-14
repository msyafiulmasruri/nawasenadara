import Phaser from 'phaser';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../config/gameConfig';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    // Dunia game tetap di WORLD_WIDTH x WORLD_HEIGHT, jadi posisi menu
    // tidak perlu lagi reposisi manual saat resize.
    const width = WORLD_WIDTH;
    const height = WORLD_HEIGHT;
    const options = ['Start Story', 'Settings', 'Exit'];
    let selectedIndex = 0;

    const confirmSelection = () => {
      if (options[selectedIndex] === 'Start Story') {
        this.scene.start('EpisodeSelectScene');
      } else if (options[selectedIndex] === 'Settings') {
        console.log('buka settings — bisa dibuat scene/modal terpisah nanti');
      } else if (options[selectedIndex] === 'Exit') {
        console.log(
          'exit — di web browser biasanya diarahkan ke halaman lain, bukan close app',
        );
      }
    };

    const updateSelection = () => {
      menuTexts.forEach((text, i) => {
        text.setColor(i === selectedIndex ? '#ffdd57' : '#ffffff');
      });
    };

    const menuTexts = options.map((label, i) =>
      this.add
        .text(width / 2, height / 2 + i * 40, label, {
          fontFamily: '"Pixelify Sans", monospace',
          fontSize: '22px',
          fontStyle: '600',
          color: i === 0 ? '#ffdd57' : '#ffffff',
        })
        .setOrigin(0.5)
        // Supaya tiap opsi bisa di-tap langsung lewat HP (atau diklik
        // mouse), bukan cuma dipilih lewat panah keyboard.
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          selectedIndex = i;
          updateSelection();
        })
        .on('pointerdown', () => {
          selectedIndex = i;
          updateSelection();
          confirmSelection();
        }),
    );

    this.input.keyboard.on('keydown-DOWN', () => {
      selectedIndex = (selectedIndex + 1) % options.length;
      updateSelection();
    });

    this.input.keyboard.on('keydown-UP', () => {
      selectedIndex = (selectedIndex - 1 + options.length) % options.length;
      updateSelection();
    });

    this.input.keyboard.on('keydown-ENTER', confirmSelection);
  }
}
