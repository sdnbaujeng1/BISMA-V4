import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';

export default function IframePage({ title, src, onNavigate, backTo = 'main' }: { title: string, src: string, onNavigate: (page: string) => void, backTo?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (document.fullscreenElement && window.screen.orientation && window.screen.orientation.lock) {
        window.screen.orientation.lock('landscape').catch(e => console.log('Orientation lock failed', e));
      } else if (!document.fullscreenElement && window.screen.orientation && window.screen.orientation.unlock) {
        window.screen.orientation.unlock();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div ref={containerRef} className={`min-h-screen w-full flex flex-col bg-slate-50 ${isFullscreen ? 'fixed inset-0 z-[200]' : ''}`}>
      {!isFullscreen && (
        <header className="sticky top-0 z-30 bg-green-600 px-4 pb-4 pt-6 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate(backTo)}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
            {(title.toLowerCase().includes('game') || title.toLowerCase().includes('edugame')) && (
              <button 
                onClick={toggleFullscreen}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                title="Full Screen"
              >
                <Maximize2 className="w-6 h-6" />
              </button>
            )}
          </div>
        </header>
      )}
      <main className="flex-grow flex flex-col relative w-full h-full">
        <iframe src={src} className="w-full h-full flex-grow border-0" title={title} allow="fullscreen; orientation" />
        {isFullscreen && (
          <button 
            onClick={toggleFullscreen} 
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-[210]"
          >
            <Minimize2 className="w-6 h-6" />
          </button>
        )}
      </main>
    </div>
  );
}
