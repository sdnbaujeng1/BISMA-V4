import { ArrowLeft } from 'lucide-react';

export default function IframePage({ title, src, onNavigate, backTo = 'main' }: { title: string, src: string, onNavigate: (page: string) => void, backTo?: string }) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50">
      <header className="sticky top-0 z-30 bg-green-600 px-4 pb-4 pt-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => onNavigate(backTo)}
            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
      </header>
      <main className="flex-grow flex flex-col">
        <iframe src={src} className="w-full h-full flex-grow border-0" title={title} />
      </main>
    </div>
  );
}
