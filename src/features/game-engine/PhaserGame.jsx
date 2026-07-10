'use client';

import { useEffect, useRef } from 'react';
import BootScene from './scenes/BootScene';
import TitleScene from './scenes/TitleScene';
import MenuScene from './scenes/MenuScene';
import ClassroomScene from './scenes/ClassroomScene';

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
        scene: [BootScene, TitleScene, MenuScene, ClassroomScene],
        physics: {
          default: 'arcade',
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        scale: {
          // RESIZE membuat kanvas selalu mengikuti ukuran elemen parent,
          // jadi latar belakang benar-benar penuh satu layar/web, bukan
          // kotak 960x540 di tengah dikelilingi border hitam.
          mode: Phaser.Scale.RESIZE,
          parent: gameRef.current,
          width: '100%',
          height: '100%',
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
