'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { RefreshCw, Play, Square, Activity } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Dashboard() {
  const [status, setStatus] = useState({ running: false });
  const [image, setImage] = useState<string | null>(null);
  
  useEffect(() => {
    const tick = async () => {
      try {
        const s = await fetch(`${API_URL}/api/control/status`).then(r => r.json());
        setStatus(s);
      } catch(e) {}

      try {
        const i = await fetch(`${API_URL}/api/images/current`).then(r => r.json());
        setImage(i.image);
      } catch(e) {}
    };
    
    tick();
    const interval = setInterval(tick, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleBot = async (cmd: 'start' | 'stop') => {
    await fetch(`${API_URL}/api/control/${cmd}`, { method: 'POST' });
  };

  const rotateImage = async () => {
    await fetch(`${API_URL}/api/images/rotate`, { method: 'POST' });
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
      <header className="mb-12 flex justify-between items-end border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            SUPER-APP v1.0
          </h1>
          <p className="text-neutral-500 mt-2">Unified Command Center</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${status.running ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          <Activity size={14} />
          {status.running ? 'BOT ACTIVE' : 'BOT IDLE'}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PANEL 1: Scraper Control */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
          <h2 className="text-xs font-bold text-neutral-500 tracking-widest mb-6">SURVEILLANCE</h2>
          <div className="space-y-4">
            <button 
              onClick={() => toggleBot('start')}
              disabled={status.running}
              className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 disabled:opacity-20 text-white font-bold py-4 rounded-xl transition-all"
            >
              <Play fill="currentColor" /> START BOT
            </button>
            <button 
              onClick={() => toggleBot('stop')}
              disabled={!status.running}
              className="w-full flex items-center justify-center gap-3 bg-red-900/50 hover:bg-red-900 disabled:opacity-20 text-red-200 font-bold py-4 rounded-xl transition-all border border-red-900"
            >
              <Square fill="currentColor" /> STOP BOT
            </button>
          </div>
        </section>

        {/* PANEL 2: Media Queue */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col">
          <h2 className="text-xs font-bold text-neutral-500 tracking-widest mb-6">MEDIA QUEUE</h2>
          <div className="relative w-full aspect-video bg-black/50 rounded-xl mb-6 flex items-center justify-center overflow-hidden border border-neutral-800">
            {image ? (
              <Image 
                src={`${API_URL}/images/${image}`} 
                alt="Queue" 
                fill 
                className="object-contain"
                unoptimized 
              />
            ) : (
              <span className="text-neutral-700 text-sm">QUEUE EMPTY</span>
            )}
          </div>
          <button 
            onClick={rotateImage}
            className="mt-auto w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            <RefreshCw size={18} /> NEXT IMAGE
          </button>
        </section>

      </div>
    </main>
  );
}