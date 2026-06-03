import React from 'react';
import { Mic, Send, Square, Volume2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { ChatMessage } from '../types';

interface ChatAreaProps {
  messages: ChatMessage[];
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  onSendMessage: (text: string) => void;
  startListening: () => void;
  stopListening: () => void;
  stopSpeaking: () => void;
}

export function ChatArea({
  messages,
  isListening,
  isSpeaking,
  transcript,
  onSendMessage,
  startListening,
  stopListening,
  stopSpeaking
}: ChatAreaProps) {
  const [inputText, setInputText] = React.useState('');
  const endOfMessagesRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 border-r border-slate-700">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
            <h1 className="text-3xl font-bold text-slate-400 mb-2">Asep</h1>
            <p>Oi, ada yang bisa gue bantu? Jangan bikin repot ya.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex flex-col max-w-[80%] rounded-2xl p-4",
              msg.role === 'user' 
                ? "bg-blue-600/20 border border-blue-500/30 text-blue-100 self-end ml-auto rounded-tr-sm"
                : "bg-slate-800 border border-slate-700 text-slate-300 self-start mr-auto rounded-tl-sm"
            )}
          >
            <span className="text-xs opacity-50 mb-1 uppercase tracking-wider font-semibold">
              {msg.role === 'user' ? 'Bos' : 'Asep'}
            </span>
            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
          </div>
        ))}
        
        {isListening && transcript && (
          <div className="flex flex-col max-w-[80%] rounded-2xl p-4 bg-blue-600/10 border border-blue-500/20 text-blue-200 self-end ml-auto rounded-tr-sm opacity-70 italic">
            <span className="text-xs opacity-50 mb-1 uppercase tracking-wider font-semibold">Bos (Listening...)</span>
            <p>{transcript}</p>
          </div>
        )}
        
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-700 flex flex-col gap-2 relative z-10 shrink-0">
        {isSpeaking && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-blue-900/80 border border-blue-500/50 backdrop-blur-md text-blue-100 px-4 py-2 rounded-full shadow-lg shadow-blue-900/20 text-sm">
            <Volume2 size={16} className="animate-pulse" />
            <span>Asep lagi ngomong...</span>
            <button 
              onClick={stopSpeaking}
              className="ml-2 hover:text-white p-1 bg-blue-800/50 rounded-md transition-colors"
            >
              <Square size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={cn(
              "p-4 rounded-xl flex items-center justify-center transition-all",
              isListening 
                ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse" 
                : "bg-slate-700 hover:bg-slate-600 text-slate-300 ring-1 ring-inset ring-slate-600"
            )}
            title="Bicara sekarang"
          >
            {isListening ? <Square size={20} className="fill-current" /> : <Mic size={20} />}
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ketik aja di sini atau klik mic buat ngomong..."
            className="flex-1 bg-slate-900 text-slate-200 rounded-xl px-4 py-3 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500 transition-all"
            disabled={isListening}
          />
          
          <button
            type="submit"
            disabled={!inputText.trim() || isListening}
            className="p-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
