import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { FinancePanel } from './components/FinancePanel';
import { ReportView } from './components/ReportView';
import { useFinance } from './store/finance';
import { useSpeech } from './hooks/useSpeech';
import { initChat } from './services/ai';
import { ChatMessage, Category, TabType } from './types';

export default function App() {
  const { transactions, addTransaction, getSummary, exportToExcel } = useFinance();
  const { isListening, isSpeaking, transcript, startListening, stopListening, speak, stopSpeaking, resetTranscript } = useSpeech();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSession, setChatSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');

  useEffect(() => {
    initChat().then((session) => setChatSession(session));
  }, []);

  // Effect to automatically send voice transcript when listening stops and we have something
  useEffect(() => {
    if (!isListening && transcript.trim() !== '') {
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !chatSession) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    try {
      if (!apiKey) {
        throw new Error("API_KEY_MISSING");
      }
      let result = await chatSession.sendMessage({ message: text });
      
      // Handle Tool Calls
      if (result.functionCalls && result.functionCalls.length > 0) {
        let functionResponses: any[] = [];
        
        for (const call of result.functionCalls) {
          if (call.name === 'update_excel_finance') {
            const args = call.args as any;
            addTransaction({
              date: args.date || new Date().toLocaleDateString('id-ID'),
              category: (args.category as Category) || 'Lain-lain',
              description: args.description || 'Transaksi',
              income: Number(args.income) || 0,
              expense: Number(args.expense) || 0,
            });
            functionResponses.push({
              functionResponse: {
                name: 'update_excel_finance',
                id: call.id,
                response: { status: 'success', message: 'Transaksi berhasil dicatat.' }
              }
            });
          } else if (call.name === 'get_summary') {
            const summary = getSummary();
            functionResponses.push({
              functionResponse: {
                name: 'get_summary',
                id: call.id,
                response: { 
                  status: 'success', 
                  summary: {
                    totalIncome: summary.totalIncome,
                    totalExpense: summary.totalExpense,
                    balance: summary.balance,
                    categoryTotals: summary.categoryTotals
                  }
                }
              }
            });
          }
        }
        
        // Send function responses back to the model to get final text
        if (functionResponses.length > 0) {
          result = await chatSession.sendMessage({ message: functionResponses });
        }
      }

      const replyText = result.text;
      
      if (replyText) {
        const aiMsg: ChatMessage = { id: crypto.randomUUID(), role: 'model', content: replyText };
        setMessages(prev => [...prev, aiMsg]);
        speak(replyText);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      let errMsg = "Bos, gue lagi pusing. Server error atau otak gue ngehang. Tar lagi aja deh.";
      
      if (error?.message?.includes("API_KEY_MISSING")) {
        errMsg = "Woi Bos! API Key lo bodong atau belum di-set tuh! Gimana gue mau kerja kalau lo pelit begitu? Bikin file .env dulu sana!";
      } else if (error?.message?.includes("429") || error?.message?.includes("quota") || error?.status === 429) {
        errMsg = "Woi Bos! Quota API-nya abis noh! Jangan ngajak ngobrol mulu kalau modal tipis.";
      }
      
      const errorMsg: ChatMessage = { id: crypto.randomUUID(), role: 'model', content: `[${errMsg}]` };
      setMessages(prev => [...prev, errorMsg]);
      speak(errMsg);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden">
      <div className="hidden md:flex shrink-0">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900 relative">
        {activeTab === 'chat' && (
          <div className="absolute inset-0">
            <ChatArea 
              messages={messages}
              isListening={isListening}
              isSpeaking={isSpeaking}
              transcript={transcript}
              onSendMessage={handleSendMessage}
              startListening={startListening}
              stopListening={stopListening}
              stopSpeaking={stopSpeaking}
            />
          </div>
        )}
        
        {activeTab === 'report' && (
          <div className="absolute inset-0">
            <ReportView 
              transactions={transactions} 
              onExport={exportToExcel} 
            />
          </div>
        )}
      </div>

      <div className="hidden lg:flex shrink-0">
        <FinancePanel 
          summary={getSummary()}
          onExport={exportToExcel}
        />
      </div>
    </div>
  );
}
