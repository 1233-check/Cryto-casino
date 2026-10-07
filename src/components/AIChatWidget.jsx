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
    <div className="fixed bottom-6 right-6 z-50">
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-[#0F212E] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col overflow-hidden"
            style={{ height: '500px' }}
          >
            {/* Header */}
            <div className="bg-[#1A2C38] p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-[#1475E1] flex items-center justify-center shadow-[0_0_15px_rgba(20,117,225,0.5)]">
                   <Bot className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <h3 className="font-bold text-white text-sm">AI Support</h3>
                   <div className="flex items-center gap-1">
                     <div className="w-2 h-2 bg-[#00E701] rounded-full animate-pulse" />
                     <span className="text-[10px] text-[#00E701] uppercase tracking-wider font-bold">Online</span>
                   </div>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#B1BAD3] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-[#0F212E]/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#1475E1] text-white rounded-br-none shadow-[0_5px_15px_rgba(20,117,225,0.2)]' 
                      : 'bg-[#1A2C38] text-[#B1BAD3] rounded-bl-none border border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#1A2C38] rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 border border-white/5">
                    <div className="w-2 h-2 bg-[#B1BAD3] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#B1BAD3] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-2 h-2 bg-[#B1BAD3] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#1A2C38] border-t border-white/5">
              <div className="flex items-center gap-2 bg-[#0F212E] p-1 rounded-xl border border-white/10 focus-within:border-[#1475E1] transition-colors">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none placeholder:text-[#B1BAD3]"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="bg-[#1475E1] p-2 rounded-lg text-white hover:bg-[#1475E1]/80 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#1475E1] rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(20,117,225,0.6)] hover:scale-110 transition-transform"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
