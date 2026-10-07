import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBalance, addToBalance } from '../utils/balance';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_WALLET_SOL = 'AdminSolAddress123456789...';
const ADMIN_WALLET_ETH = '0xAdminEthAddress123456789...';

export default function WalletPage({ onNavigate }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState(0.1);
  const [status, setStatus] = useState(null); // 'loading', 'success', 'error'
  const [balance, setBalanceState] = useState(getBalance());

  const handlePhantomDeposit = async () => {
    if (!window.solana || !window.solana.isPhantom) {
      alert('Phantom wallet not found! Please install it.');
      window.open('https://phantom.app/', '_blank');
      return;
    }
    try {
      setStatus('loading');
      const response = await window.solana.connect();
      // Dummy logic simulating transaction
      setTimeout(() => {
        addToBalance(parseFloat(amount));
        setBalanceState(getBalance());
        setStatus('success');
        setTimeout(() => setStatus(null), 3000);
      }, 2000);
    } catch (err) {
      setStatus('error');
      console.error(err);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleMetaMaskDeposit = async () => {
    if (!window.ethereum) {
      alert('MetaMask not found! Please install it.');
      window.open('https://metamask.io/', '_blank');
      return;
    }
    try {
      setStatus('loading');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      // Dummy logic simulating transaction
      setTimeout(() => {
        addToBalance(parseFloat(amount));
        setBalanceState(getBalance());
        setStatus('success');
        setTimeout(() => setStatus(null), 3000);
      }, 2000);
    } catch (err) {
      setStatus('error');
      console.error(err);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0F212E] text-white p-4 sm:p-8 w-full max-w-4xl mx-auto">
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black font-display tracking-tight text-white">Wallet</h1>
        <div className="bg-[#1A2C38] px-6 py-3 rounded-xl border border-white/10 shadow-inner flex flex-col items-end">
           <span className="text-xs text-[#B1BAD3] font-bold uppercase tracking-widest mb-1">Total Balance</span>
           <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-display text-white tabular-nums">{balance.toFixed(8)}</span>
              <span className="text-[#00E701] font-bold">BTC</span>
           </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/10 mb-8 pb-4">
         <button 
           onClick={() => setActiveTab('deposit')}
           className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'deposit' ? 'bg-[#1475E1] text-white shadow-[0_0_20px_rgba(20,117,225,0.4)]' : 'bg-transparent text-[#B1BAD3] hover:bg-white/5'}`}
         >
           Deposit
         </button>
         <button 
           onClick={() => setActiveTab('withdraw')}
           className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'withdraw' ? 'bg-[#1475E1] text-white shadow-[0_0_20px_rgba(20,117,225,0.4)]' : 'bg-transparent text-[#B1BAD3] hover:bg-white/5'}`}
         >
           Withdraw
         </button>
      </div>

      <div className="bg-[#1A2C38] rounded-2xl p-6 sm:p-8 border border-white/5 shadow-2xl relative overflow-hidden">
        
        {activeTab === 'deposit' ? (
          <div className="flex flex-col gap-8">
             <div>
               <label className="text-sm font-bold text-[#B1BAD3] uppercase tracking-wider mb-2 block">Deposit Amount (Crypto)</label>
               <input 
                 type="number"
                 step="0.01"
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 className="w-full bg-[#0F212E] border border-white/10 rounded-xl px-6 py-4 text-xl font-bold focus:outline-none focus:border-[#1475E1] transition-colors"
               />
             </div>

             <div>
               <label className="text-sm font-bold text-[#B1BAD3] uppercase tracking-wider mb-4 block">Select Network to Deposit</label>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <button 
                    onClick={handlePhantomDeposit}
                    disabled={status === 'loading'}
                    className="relative group p-6 rounded-2xl border-2 border-transparent bg-gradient-to-br from-[#512DA8]/20 to-[#311B92]/20 hover:border-[#512DA8] transition-all flex flex-col items-center gap-4 hover:-translate-y-1"
                  >
                    <div className="w-16 h-16 bg-[#512DA8] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(81,45,168,0.5)]">
                      {/* Phantom ghost icon simplified */}
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                         <path d="M12 2C6.48 2 2 6.48 2 12v10l3.5-3.5 3.5 3.5 3-3.5 3 3.5 3.5-3.5L22 22V12c0-5.52-4.48-10-10-10z" fill="white"/>
                         <circle cx="8" cy="10" r="2" fill="#512DA8"/>
                         <circle cx="16" cy="10" r="2" fill="#512DA8"/>
                      </svg>
                    </div>
                    <div className="text-center">
                       <h3 className="font-bold text-lg text-white">Phantom Wallet</h3>
                       <p className="text-xs text-[#B1BAD3]">Deposit SOL / SPL</p>
                    </div>
                  </button>

                  <button 
                    onClick={handleMetaMaskDeposit}
                    disabled={status === 'loading'}
                    className="relative group p-6 rounded-2xl border-2 border-transparent bg-gradient-to-br from-[#F6851B]/20 to-[#E2761B]/20 hover:border-[#F6851B] transition-all flex flex-col items-center gap-4 hover:-translate-y-1"
                  >
                    <div className="w-16 h-16 bg-[#F6851B] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(246,133,27,0.5)]">
                      {/* Metamask fox icon simplified */}
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                         <path d="M22 12l-10-10L2 12l10 10 10-10z" fill="white"/>
                         <path d="M12 2L2 12h20L12 2z" fill="#E2761B"/>
                      </svg>
                    </div>
                    <div className="text-center">
                       <h3 className="font-bold text-lg text-white">MetaMask</h3>
                       <p className="text-xs text-[#B1BAD3]">Deposit ETH / ERC20</p>
                    </div>
                  </button>

               </div>
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
             <div className="w-20 h-20 bg-[#ED4163]/10 text-[#ED4163] rounded-full flex items-center justify-center mb-6 border-2 border-[#ED4163]/30">
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M21 12H3M21 12l-7-7M21 12l-7 7" />
               </svg>
             </div>
             <h2 className="text-2xl font-bold mb-2">Withdrawals Locked</h2>
             <p className="text-[#B1BAD3] max-w-sm">For security purposes, your account must complete KYC verification before initiating a withdrawal.</p>
             <button className="mt-8 bg-[#1475E1] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#1475E1]/90 transition-colors">Start Verification</button>
          </div>
        )}

        {/* Status Overlay */}
        <AnimatePresence>
          {status && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0F212E]/90 backdrop-blur-sm flex items-center justify-center z-50"
            >
              {status === 'loading' && (
                 <div className="flex flex-col items-center gap-4">
                   <div className="w-12 h-12 border-4 border-white/20 border-t-[#00E701] rounded-full animate-spin" />
                   <p className="font-bold animate-pulse text-[#00E701]">Confirming Transaction...</p>
                 </div>
              )}
              {status === 'success' && (
                 <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4">
                   <div className="w-16 h-16 bg-[#00E701] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,231,1,0.5)]">
                     <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M20 6L9 17l-5-5" />
                     </svg>
                   </div>
                   <p className="font-bold text-xl text-[#00E701]">Deposit Successful!</p>
                 </motion.div>
              )}
              {status === 'error' && (
                 <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4">
                   <div className="w-16 h-16 bg-[#ED4163] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(237,65,99,0.5)]">
                     <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M18 6L6 18M6 6l12 12" />
                     </svg>
                   </div>
                   <p className="font-bold text-xl text-[#ED4163]">Transaction Failed or Rejected</p>
                 </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
