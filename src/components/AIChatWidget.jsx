import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { getBalance, getHistory } from '../utils/balance';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm your CryptoCasino AI Support. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response based on context
    setTimeout(() => {
      let response = "I'm sorry, I couldn't process that request.";
      const lowerInput = userMsg.toLowerCase();
      
      if (lowerInput.includes('balance')) {
        response = `Your current balance is ${getBalance().toFixed(4)} BTC.`;
      } else if (lowerInput.includes('deposit')) {
        response = "To deposit funds, go to the Wallet page and select either Phantom (SOL) or MetaMask (ETH). Direct Web3 deposits are supported!";
      } else if (lowerInput.includes('history') || lowerInput.includes('last bet')) {
        const history = getHistory();
        if (history.length > 0) {
           const last = history[history.length - 1];
           response = `Your last bet was on ${last.game} for ${last.bet} BTC. You ${last.profit >= 0 ? 'won' : 'lost'} ${Math.abs(last.profit).toFixed(4)} BTC.`;
        } else {
           response = "You don't have any recent betting history.";
        }
      } else if (lowerInput.includes('provably fair') || lowerInput.includes('fair')) {
        response = "All our games use an industry-standard provably fair system. The result is generated via a cryptographic hash before the game begins, ensuring we cannot manipulate outcomes.";
      } else {
        response = "I'm a smart AI support bot! I know about your balance, history, and how to use the casino. Ask me about your last bet or how to deposit!";
      }

      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  return (
    <div className="fixed bottom-16 right-3 md:bottom-6 md:right-6 z-40">
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed sm:absolute bottom-24 sm:bottom-16 right-3 sm:right-0 w-[calc(100vw-24px)] max-w-sm sm:w-96 bg-[#14171F] rounded-2xl shadow-2xl border border-white/[0.09] flex flex-col overflow-hidden z-50"
            style={{ maxHeight: 'calc(100vh - 130px)', height: '460px' }}
          >
            {/* Header */}
            <div className="bg-[#10131A] p-3.5 flex items-center justify-between border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                 <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-gray-950 shadow-sm font-bold">
                   <Bot className="w-4 h-4" />
                 </div>
                 <div>
                   <h3 className="font-bold text-white text-xs">AI Concierge Support</h3>
                   <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                     <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Online • 24/7</span>
                   </div>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3 custom-scrollbar bg-[#0B0D11]/60">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-emerald-500 text-gray-950 rounded-br-none font-medium shadow-sm' 
                      : 'bg-[#14171F] text-slate-200 rounded-bl-none border border-white/[0.07]'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#14171F] rounded-2xl rounded-bl-none px-3.5 py-2 flex gap-1 border border-white/[0.07]">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-2.5 bg-[#10131A] border-t border-white/[0.06]">
              <div className="flex items-center gap-2 bg-[#14171F] p-1 rounded-xl border border-white/[0.08] focus-within:border-emerald-500/50 transition-colors">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about deposits, odds, games..."
                  className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder:text-slate-500"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="bg-emerald-500 p-1.5 rounded-lg text-gray-950 hover:bg-emerald-400 transition-colors disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 sm:w-12 sm:h-12 bg-[#14171F] border border-white/[0.1] rounded-2xl flex items-center justify-center text-emerald-400 hover:text-gray-950 hover:bg-emerald-500 shadow-xl transition-all active:scale-95"
        title="AI Support"
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      </button>
    </div>
  );
}
