import dynamic from 'next/dynamic';
import { GeminiAssistant } from '../components/GeminiAssistant';

const Canvas = dynamic(() => import('../components/Canvas').then(mod => mod.Canvas), {
  ssr: false,
  loading: () => <div className="w-full h-screen bg-[#181625] flex items-center justify-center text-[#5B5680]">Loading Void...</div>
});

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-[#181625] text-[#E2E0EC]">
      <Canvas />
      <GeminiAssistant />
    </main>
  );
}
