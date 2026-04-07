import { useState } from 'react';
import { ArrowLeft, Send, MessageSquare, Bot } from 'lucide-react';

export default function ChatbotPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [messages, setMessages] = useState<{ text: string, sender: 'user' | 'bot' }[]>([
    { text: 'Halo! Saya adalah asisten virtual BISMA. Ada yang bisa saya bantu?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input;
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { text: data.reply, sender: 'bot' }]);
      } else {
        setMessages(prev => [...prev, { text: `Maaf, terjadi kesalahan: ${data.message}`, sender: 'bot' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { text: 'Maaf, gagal terhubung ke server.', sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans">
      <header className="bg-white dark:bg-slate-800 shadow-sm px-4 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => onNavigate('main')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-white">Asisten BISMA</h1>
            <p className="text-xs text-green-500 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
            </p>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'
            }`}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
      </main>

      <footer className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 sticky bottom-0">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ketik pesan..."
            className="flex-grow border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
          />
          <button 
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
