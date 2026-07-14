'use client';

import { useEffect, useRef } from 'react';
import BootScene from './scenes/BootScene';
import TitleScene from './scenes/TitleScene';
import MenuScene from './scenes/MenuScene';
import EpisodeSelectScene from './scenes/EpisodeSelectScene';
import EpisodeIntroScene from './scenes/EpisodeIntroScene';
import Episode1Scene from './scenes/Episode1Scene';
import PlaceholderEpisodeScene from './scenes/PlaceholderEpisodeScene';
import { WORLD_WIDTH, WORLD_HEIGHT } from './config/gameConfig';

export default function PhaserGame() {
  const gameRef = useRef(null);
  const phaserInstance = useRef(null);

  useEffect(() => {
    // Phaser mengakses `window`, jadi wajib di-load secara dinamis
    // di sisi client saja (tidak boleh di-import biasa di top-level).
    let destroyed = false;

    import('phaser').then((PhaserModule) => {
      if (destroyed || phaserInstance.current) return;

      const Phaser = PhaserModule.default ?? PhaserModule;

      const config = {
        type: Phaser.AUTO,
        parent: gameRef.current,
        scene: [
          BootScene,
          TitleScene,
          MenuScene,
          EpisodeSelectScene,
          EpisodeIntroScene,
          Episode1Scene,
          PlaceholderEpisodeScene,
        ],
        physics: {
          default: 'arcade',
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        input: {
          // Default Phaser cuma lacak 1 pointer aktif -> tombol kiri/kanan
          // + jump tidak bisa ditekan bersamaan di HP. Dinaikkan supaya
          // beberapa jari bisa terdeteksi sekaligus (arah + run + jump).
          activePointers: 4,
        },
        scale: {
          // ENVELOP mempertahankan resolusi dunia game TETAP di
          // WORLD_WIDTH x WORLD_HEIGHT, lalu membesarkan tampilan kanvas
          // lewat CSS supaya selalu menutupi seluruh layar (mirip
          // background-size: cover) — kelebihan area dipotong, bukan
          // dikasih letterbox hitam. Ini juga yang memperbaiki bug
          // "karakter ikut mengecil saat di-zoom out", karena dulu mode
          // RESIZE membuat ukuran dunia game ikut berubah mengikuti
          // ukuran viewport (yang berubah saat zoom), sedangkan ENVELOP
          // menjaga dunia game selalu di ukuran yang sama persis.
          mode: Phaser.Scale.ENVELOP,
          parent: gameRef.current,
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      };

      phaserInstance.current = new Phaser.Game(config);
    });

    return () => {
      destroyed = true;
      if (phaserInstance.current) {
        phaserInstance.current.destroy(true);
        phaserInstance.current = null;
      }
    };
  }, []);

  return <div ref={gameRef} className="fixed inset-0 w-screen h-screen overflow-hidden" />;
}
