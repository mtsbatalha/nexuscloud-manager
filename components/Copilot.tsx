import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, Loader2 } from 'lucide-react';
import { getAIChatResponse } from '../services/gemini';
import { ChatMessage, Connection, FileItem } from '../types';

interface CopilotProps {
  currentConnection: Connection | null;
  currentFiles: FileItem[];
  isOpen: boolean;
  onClose: () => void;
}

const Copilot: React.FC<CopilotProps> = ({ currentConnection, currentFiles, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'model', text: 'Olá! Eu sou o Nexus AI. Posso ajudar a encontrar arquivos, sugerir organizações de pastas ou resumir documentos. Como posso ajudar hoje?', timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    const responseText = await getAIChatResponse(userMsg.text, { currentConnection: currentConnection || undefined, currentFiles });

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900 to-slate-900 p-4 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2 text-white">
          <Sparkles size={18} className="text-purple-400" />
          <span className="font-semibold">Nexus Copilot</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'model' ? 'bg-purple-600/20 text-purple-400' : 'bg-slate-700 text-slate-300'}`}>
              {msg.role === 'model' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`rounded-xl p-3 text-sm max-w-[80%] ${
              msg.role === 'model' 
                ? 'bg-slate-800 text-slate-200 border border-slate-700' 
                : 'bg-primary-600 text-white'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center">
               <Bot size={16} />
             </div>
             <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex items-center gap-2">
               <Loader2 size={14} className="animate-spin text-slate-400" />
               <span className="text-xs text-slate-400">Pensando...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte algo sobre seus arquivos..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-4 pr-12 py-3 text-sm text-white focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-slate-500"
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-md transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="text-[10px] text-slate-500 text-center mt-2">
          IA pode cometer erros. Verifique informações importantes.
        </div>
      </div>
    </div>
  );
};

export default Copilot;