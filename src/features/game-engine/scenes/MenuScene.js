import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;
    const options = ['Start Story', 'Settings', 'Exit'];
    let selectedIndex = 0;

    const menuTexts = options.map((label, i) =>
      this.add
        .text(width / 2, height / 2 + i * 40, label, {
          fontFamily: '"Pixelify Sans", monospace',
          fontSize: '22px',
          fontStyle: '600',
          color: i === 0 ? '#ffdd57' : '#ffffff',
        })
        .setOrigin(0.5),
    );

    const updateSelection = () => {
      menuTexts.forEach((text, i) => {
        text.setColor(i === selectedIndex ? '#ffdd57' : '#ffffff');
      });
    };

    this.input.keyboard.on('keydown-DOWN', () => {
      selectedIndex = (selectedIndex + 1) % options.length;
      updateSelection();
    });

    this.input.keyboard.on('keydown-UP', () => {
      selectedIndex = (selectedIndex - 1 + options.length) % options.length;
      updateSelection();
    });

    this.input.keyboard.on('keydown-ENTER', () => {
      if (options[selectedIndex] === 'Start Story') {
        this.scene.start('ClassroomScene');
      } else if (options[selectedIndex] === 'Settings') {
        console.log('buka settings — bisa dibuat scene/modal terpisah nanti');
      } else if (options[selectedIndex] === 'Exit') {
        console.log(
          'exit — di web browser biasanya diarahkan ke halaman lain, bukan close app',
        );
      }
    });

    // Reposisi menu ke tengah saat kanvas resize.
    const handleResize = (gameSize) => {
      const w = gameSize.width;
      const h = gameSize.height;
      menuTexts.forEach((text, i) => {
        text.setPosition(w / 2, h / 2 + i * 40);
      });
    };
    this.scale.on('resize', handleResize);
    this.events.once('shutdown', () => {
      this.scale.off('resize', handleResize);
    });
  }
}
