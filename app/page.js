'use client';

import { InteractiveWorldMap } from '../components/InteractiveWorldMap';

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-white">
      <InteractiveWorldMap />
    </main>
  );
}
