import PhaserGame from '@/features/game-engine/PhaserGameLoader';

export default function GamePage() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-black">
      <PhaserGame />
    </main>
  );
}
