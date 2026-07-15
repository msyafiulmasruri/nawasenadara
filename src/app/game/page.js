'use client';

import PhaserGame from '@/features/game-engine/PhaserGameLoader';
import RequireAuth from '@/features/auth/components/RequireAuth';
import GameAuthBridge from '@/features/auth/components/GameAuthBridge';

export default function GamePage() {
  return (
    <RequireAuth>
      <GameAuthBridge />
      <main>
        <PhaserGame />
      </main>
    </RequireAuth>
  );
}

