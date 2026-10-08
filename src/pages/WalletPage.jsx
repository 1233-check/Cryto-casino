import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWallet, CHAINS, DEPOSIT_ADDRESSES } from '../context/WalletContext';
import { getBalance } from '../utils/balance';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Copy, Check, ExternalLink, Shield, AlertTriangle, ChevronDown, X, LinkIcon, Unlink } from 'lucide-react';

const WALLET_OPTIONS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    desc: 'Popular EVM wallet for Chrome',
    chains: ['ethereum', 'polygon', 'bsc'],
    color: '#F6851B',
    gradient: 'from-[#F6851B]/20 to-[#E2761B]/20',
    borderColor: 'border-[#F6851B]',
    icon: (
      <svg width="32" height="32" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32.96 1L19.7 10.89l2.45-5.81L32.96 1z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2.04 1l13.14 9.98-2.33-5.9L2.04 1zM28.1 23.7l-3.53 5.4 7.55 2.08 2.17-7.35-6.19-.13zM.67 23.83l2.16 7.35 7.55-2.08-3.53-5.4-6.18.13z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.93 14.6l-2.1 3.17 7.48.34-.26-8.04-5.12 4.53zM25.07 14.6l-5.17-4.63-.18 8.14 7.48-.34-2.13-3.17zM10.38 29.1l4.5-2.19-3.89-3.04-.61 5.23zM20.12 26.91l4.5 2.19-.62-5.23-3.88 3.04z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'phantom',
    name: 'Phantom',
    desc: 'Best Solana wallet',
    chains: ['solana'],
    color: '#AB9FF2',
    gradient: 'from-[#512DA8]/20 to-[#311B92]/20',
    borderColor: 'border-[#AB9FF2]',
    icon: (
      <svg width="32" height="32" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="128" height="128" rx="26" fill="url(#phantom_grad)"/>
        <defs><linearGradient id="phantom_grad" x1="0" y1="0" x2="128" y2="128"><stop stopColor="#534BB1"/><stop offset="1" stopColor="#551BF9"/></linearGradient></defs>
        <path d="M110.5 64.6c-1.2 18.2-16.7 32.5-35 32.5H44.8c-2.6 0-4.8-2.1-4.8-4.8 0-.4.1-.8.1-1.2l4.8-29.4c.7-4.3 4.4-7.5 8.8-7.5h32c12.3 0 22.4 9.5 23.4 21.7.1.6.1 1.1.1 1.7 0-.4.2-.7.3-1l1-11.5c.8-9.4-6.4-17.6-15.9-17.6H60.3c-4.4 0-8.1 3.2-8.8 7.5L44 96.6c-.3 2-.1 3.9.5 5.7-9.9-3.5-17-13.1-17-24.3 0-14.3 11.6-25.9 25.9-25.9h33.2c13.9 0 24.9 11.7 23.9 25.5z" fill="#FFF"/>
        <circle cx="63" cy="72" r="5" fill="#4A3D8F"/>
        <circle cx="83" cy="72" r="5" fill="#4A3D8F"/>
      </svg>
    ),
  },
  {
    id: 'trustwallet',
    name: 'Trust Wallet',
    desc: 'Multi-chain mobile wallet',
    chains: ['ethereum', 'polygon', 'bsc', 'solana'],
    color: '#3375BB',
    gradient: 'from-[#3375BB]/20 to-[#1B4F7A]/20',
    borderColor: 'border-[#3375BB]',
    icon: (
      <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 4L6 12v12c0 11.1 7.7 21.5 18 24 10.3-2.5 18-12.9 18-24V12L24 4z" fill="#3375BB"/>
        <path d="M24 8l-14 6.2v9.7c0 9 6.3 17.5 14 19.6 7.7-2.1 14-10.6 14-19.6v-9.7L24 8z" fill="white"/>
        <path d="M24 12l-10 4.4v7c0 6.5 4.5 12.6 10 14.1 5.5-1.5 10-7.6 10-14.1v-7L24 12z" fill="#3375BB"/>
      </svg>
    ),
  },
];

export default function WalletPage({ onNavigate }) {
  const { user } = useAuth();
  const {
    connectedWallet, walletAddress, selectedChain, setSelectedChain,
    isConnecting, connectMetaMask, connectPhantom, connectTrustWallet,
    disconnect, sendEvmTransaction, sendSolanaTransaction, addTx, txHistory
  } = useWallet();

  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('0.01');
  const [status, setStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [balance, setBalanceState] = useState(getBalance());
  const [copied, setCopied] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [txHash, setTxHash] = useState('');

  useEffect(() => {
    const handleUpdate = () => setBalanceState(getBalance());
    window.addEventListener('balance-update', handleUpdate);
    return () => window.removeEventListener('balance-update', handleUpdate);
  }, []);

  const connectWallet = async (walletId) => {
    try {
      if (walletId === 'metamask') await connectMetaMask();
      else if (walletId === 'phantom') await connectPhantom();
      else if (walletId === 'trustwallet') await connectTrustWallet();
    } catch (err) {
      console.error('Wallet connection failed:', err);
    }
  };

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    if (!connectedWallet) return;

    setStatus('loading');
    setStatusMessage('Requesting transaction approval...');

    try {
      let hash;
      const depositAddr = DEPOSIT_ADDRESSES[selectedChain];
      
      if (selectedChain === 'solana') {
        hash = await sendSolanaTransaction(depositAddr, numAmount);
      } else {
        hash = await sendEvmTransaction(depositAddr, numAmount, selectedChain);
      }

      setTxHash(hash);
      setStatusMessage('Transaction submitted! Confirming...');

      // Record tx
      addTx({
        type: 'deposit',
        chain: selectedChain,
        amount: numAmount,
        hash,
        timestamp: Date.now(),
        status: 'confirmed',
      });

      setStatus('success');
      setStatusMessage(`Successfully deposited ${numAmount} ${CHAINS[selectedChain].symbol}`);

      setTimeout(() => {
        setStatus(null);
        setTxHash('');
      }, 5000);
    } catch (err) {
      console.error('Deposit failed:', err);
      setStatus('error');
      setStatusMessage(err?.message || 'Transaction failed or was rejected');
      setTimeout(() => setStatus(null), 4000);
    }
  };

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    if (!withdrawAddress) {
      setStatus('error');
      setStatusMessage('Please enter a withdrawal address');
      setTimeout(() => setStatus(null), 3000);
      return;
    }
    if (numAmount > balance) {
      setStatus('error');
      setStatusMessage('Insufficient balance');
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    setStatus('loading');
    setStatusMessage('Processing withdrawal...');

    // In production, this would call a backend endpoint that verifies the user
    // and initiates the withdrawal from the house wallet
    try {
      const { auth } = await import('../firebase');
      if (!auth.currentUser) throw new Error('Not authenticated');
      const token = await auth.currentUser.getIdToken();

      const response = await fetch('http://localhost:3001/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          chain: selectedChain,
          amount: numAmount,
          toAddress: withdrawAddress,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Withdrawal failed');

      addTx({
        type: 'withdrawal',
        chain: selectedChain,
        amount: numAmount,
        hash: data.txHash || 'pending',
        timestamp: Date.now(),
        status: 'processing',
      });

      setStatus('success');
      setStatusMessage(`Withdrawal of ${numAmount} ${CHAINS[selectedChain].symbol} is being processed`);
      setTimeout(() => setStatus(null), 5000);
    } catch (err) {
      setStatus('error');
      setStatusMessage(err?.message || 'Withdrawal failed');
      setTimeout(() => setStatus(null), 4000);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(DEPOSIT_ADDRESSES[selectedChain] || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const chainConfig = CHAINS[selectedChain];

  return (
    <div className="flex flex-col h-full bg-[#0F212E] text-white p-4 sm:p-8 w-full max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black font-display tracking-tight text-white flex items-center gap-3">
            <Wallet className="w-8 h-8 text-[#1475E1]" />
            Wallet
          </h1>
          <p className="text-[#B1BAD3] text-sm mt-1">Deposit and withdraw crypto across multiple chains</p>
        </div>
        <div className="bg-[#1A2C38] px-6 py-3 rounded-xl border border-white/10 shadow-inner flex flex-col items-end">
          <span className="text-xs text-[#B1BAD3] font-bold uppercase tracking-widest mb-1">Game Balance</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black font-display text-white tabular-nums">{balance.toFixed(8)}</span>
            <span className="text-[#00E701] font-bold">BTC</span>
          </div>
        </div>
      </div>

      {/* Connected Wallet Badge */}
      {connectedWallet && walletAddress && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#00E701]/10 to-[#1475E1]/10 border border-[#00E701]/20 rounded-xl px-5 py-3 mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-[#00E701] rounded-full animate-pulse shadow-[0_0_10px_#00E701]" />
            <span className="font-bold text-sm text-white">
              {connectedWallet === 'metamask' ? 'MetaMask' : connectedWallet === 'phantom' ? 'Phantom' : 'Trust Wallet'}
            </span>
            <span className="text-[#B1BAD3] font-mono text-sm">{formatAddress(walletAddress)}</span>
          </div>
          <button
            onClick={disconnect}
            className="flex items-center gap-2 text-xs font-bold text-[#ED4163] hover:text-white bg-[#ED4163]/10 hover:bg-[#ED4163]/20 px-3 py-2 rounded-lg transition-all"
          >
            <Unlink className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </motion.div>
      )}

      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'deposit'
              ? 'bg-[#00E701] text-black shadow-[0_0_20px_rgba(0,231,1,0.3)]'
              : 'bg-[#1A2C38] text-[#B1BAD3] hover:bg-[#213743] hover:text-white border border-white/5'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'withdraw'
              ? 'bg-[#1475E1] text-white shadow-[0_0_20px_rgba(20,117,225,0.4)]'
              : 'bg-[#1A2C38] text-[#B1BAD3] hover:bg-[#213743] hover:text-white border border-white/5'
          }`}
        >
          <ArrowUpFromLine className="w-4 h-4" />
          Withdraw
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Card */}
        <div className="lg:col-span-2 bg-[#1A2C38] rounded-2xl p-6 sm:p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          
          {/* Step 1: Connect Wallet (if not connected) */}
          {!connectedWallet && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-[#1475E1]" />
                Connect Your Wallet
              </h2>
              <p className="text-sm text-[#B1BAD3] mb-5">Choose a wallet to connect for deposits and withdrawals</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {WALLET_OPTIONS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => connectWallet(w.id)}
                    disabled={isConnecting}
                    className={`relative group p-5 rounded-2xl border-2 border-transparent bg-gradient-to-br ${w.gradient} hover:${w.borderColor} transition-all flex flex-col items-center gap-3 hover:-translate-y-1 hover:shadow-lg disabled:opacity-50`}
                  >
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: w.color + '30' }}>
                      {w.icon}
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-sm text-white">{w.name}</h3>
                      <p className="text-[10px] text-[#B1BAD3] mt-0.5">{w.desc}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-center">
                      {w.chains.map(c => (
                        <span key={c} className="text-[9px] bg-white/5 text-[#B1BAD3] px-2 py-0.5 rounded-full font-bold uppercase">
                          {CHAINS[c].symbol}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Chain Selector + Amount */}
          {connectedWallet && (
            <>
              {/* Chain Selector */}
              <div className="mb-6">
                <label className="text-xs font-bold text-[#B1BAD3] uppercase tracking-wider mb-3 block">Select Network</label>
                <div className="relative">
                  <button
                    onClick={() => setShowChainSelector(!showChainSelector)}
                    className="w-full bg-[#0F212E] border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{chainConfig.icon}</span>
                      <div className="text-left">
                        <div className="font-bold text-white">{chainConfig.name}</div>
                        <div className="text-xs text-[#B1BAD3]">{chainConfig.symbol}</div>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-[#B1BAD3] transition-transform ${showChainSelector ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showChainSelector && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full mt-2 left-0 right-0 bg-[#0F212E] border border-white/10 rounded-xl overflow-hidden z-30 shadow-2xl"
                      >
                        {Object.entries(CHAINS)
                          .filter(([key]) => {
                            const wallet = WALLET_OPTIONS.find(w => w.id === connectedWallet);
                            return wallet?.chains.includes(key);
                          })
                          .map(([key, chain]) => (
                          <button
                            key={key}
                            onClick={() => { setSelectedChain(key); setShowChainSelector(false); }}
                            className={`w-full px-5 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors ${selectedChain === key ? 'bg-white/5' : ''}`}
                          >
                            <span className="text-xl">{chain.icon}</span>
                            <div className="text-left">
                              <div className="font-bold text-white text-sm">{chain.name}</div>
                              <div className="text-xs text-[#B1BAD3]">{chain.symbol}</div>
                            </div>
                            {selectedChain === key && <Check className="w-4 h-4 text-[#00E701] ml-auto" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="text-xs font-bold text-[#B1BAD3] uppercase tracking-wider mb-3 block">
                  {activeTab === 'deposit' ? 'Deposit' : 'Withdraw'} Amount ({chainConfig.symbol})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#0F212E] border border-white/10 rounded-xl px-5 py-4 text-xl font-bold focus:outline-none focus:border-[#1475E1] transition-colors pr-20"
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B1BAD3] font-bold text-sm">{chainConfig.symbol}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {[0.01, 0.05, 0.1, 0.5, 1].map(val => (
                    <button
                      key={val}
                      onClick={() => setAmount(val.toString())}
                      className="flex-1 bg-[#0F212E] border border-white/5 rounded-lg py-2 text-xs font-bold text-[#B1BAD3] hover:text-white hover:border-white/20 transition-colors"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'deposit' && (
                <>
                  {/* Deposit Address */}
                  <div className="mb-6">
                    <label className="text-xs font-bold text-[#B1BAD3] uppercase tracking-wider mb-3 block">
                      Deposit Address ({chainConfig.name})
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-[#0F212E] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-[#B1BAD3] truncate">
                        {DEPOSIT_ADDRESSES[selectedChain]}
                      </div>
                      <button
                        onClick={copyAddress}
                        className="bg-[#0F212E] border border-white/10 rounded-xl px-4 hover:border-white/20 transition-colors flex items-center gap-2"
                      >
                        {copied ? <Check className="w-4 h-4 text-[#00E701]" /> : <Copy className="w-4 h-4 text-[#B1BAD3]" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleDeposit}
                    disabled={status === 'loading' || !parseFloat(amount)}
                    className="w-full bg-gradient-to-r from-[#00E701] to-[#00c701] text-black font-bold py-4 rounded-xl transition-all hover:shadow-[0_0_30px_rgba(0,231,1,0.3)] disabled:opacity-50 disabled:cursor-not-allowed text-lg uppercase tracking-wider"
                  >
                    {status === 'loading' ? 'Processing...' : `Deposit ${amount} ${chainConfig.symbol}`}
                  </button>
                </>
              )}

              {activeTab === 'withdraw' && (
                <>
                  {/* Withdrawal Address */}
                  <div className="mb-6">
                    <label className="text-xs font-bold text-[#B1BAD3] uppercase tracking-wider mb-3 block">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder={selectedChain === 'solana' ? 'Enter Solana address...' : 'Enter 0x address...'}
                      className="w-full bg-[#0F212E] border border-white/10 rounded-xl px-5 py-4 font-mono text-sm focus:outline-none focus:border-[#1475E1] transition-colors"
                    />
                  </div>

                  <div className="bg-[#0F212E] rounded-xl p-4 mb-6 border border-[#F0B90B]/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#F0B90B] shrink-0 mt-0.5" />
                      <div className="text-sm text-[#B1BAD3]">
                        <span className="text-[#F0B90B] font-bold">Important:</span> Ensure the withdrawal address and network are correct. 
                        Withdrawals to wrong addresses or networks cannot be reversed. Minimum withdrawal: 0.001 {chainConfig.symbol}.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleWithdraw}
                    disabled={status === 'loading' || !parseFloat(amount) || !withdrawAddress}
                    className="w-full bg-gradient-to-r from-[#1475E1] to-[#0d5bc4] text-white font-bold py-4 rounded-xl transition-all hover:shadow-[0_0_30px_rgba(20,117,225,0.3)] disabled:opacity-50 disabled:cursor-not-allowed text-lg uppercase tracking-wider"
                  >
                    {status === 'loading' ? 'Processing...' : `Withdraw ${amount} ${chainConfig.symbol}`}
                  </button>
                </>
              )}
            </>
          )}

          {/* Status Overlay */}
          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0F212E]/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl"
              >
                {status === 'loading' && (
                  <div className="flex flex-col items-center gap-4 px-8">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-white/10 border-t-[#00E701] rounded-full animate-spin" />
                      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-[#1475E1] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    </div>
                    <p className="font-bold text-[#B1BAD3] text-center animate-pulse">{statusMessage}</p>
                  </div>
                )}
                {status === 'success' && (
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4 px-8">
                    <div className="w-20 h-20 bg-[#00E701] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,231,1,0.5)]">
                      <Check className="w-10 h-10 text-black" strokeWidth={3} />
                    </div>
                    <p className="font-bold text-xl text-[#00E701] text-center">{statusMessage}</p>
                    {txHash && (
                      <a
                        href={`${CHAINS[selectedChain].explorerUrl}/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[#1475E1] hover:underline"
                      >
                        View on Explorer <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4 px-8">
                    <div className="w-20 h-20 bg-[#ED4163] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(237,65,99,0.5)]">
                      <X className="w-10 h-10 text-white" strokeWidth={3} />
                    </div>
                    <p className="font-bold text-xl text-[#ED4163] text-center">{statusMessage}</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Info */}
        <div className="flex flex-col gap-4">
          {/* Security Badge */}
          <div className="bg-[#1A2C38] rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-[#00E701]" />
              <h3 className="font-bold text-white text-sm">Secure Transactions</h3>
            </div>
            <ul className="space-y-2 text-xs text-[#B1BAD3]">
              <li className="flex items-start gap-2">
                <span className="text-[#00E701] mt-0.5">✓</span>
                All transactions are verified on-chain
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00E701] mt-0.5">✓</span>
                Non-custodial wallet connections
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00E701] mt-0.5">✓</span>
                Multi-chain support (ETH, SOL, BNB, MATIC)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00E701] mt-0.5">✓</span>
                Instant deposits, fast withdrawals
              </li>
            </ul>
          </div>

          {/* Recent Transactions */}
          <div className="bg-[#1A2C38] rounded-2xl p-5 border border-white/5 flex-1">
            <h3 className="font-bold text-white text-sm mb-4">Recent Transactions</h3>
            {txHistory.length === 0 ? (
              <div className="text-center py-8 text-[#B1BAD3] text-xs">
                No transactions yet
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {txHistory.map((tx, i) => (
                  <div key={i} className="bg-[#0F212E] rounded-xl p-3 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold uppercase ${tx.type === 'deposit' ? 'text-[#00E701]' : 'text-[#1475E1]'}`}>
                        {tx.type === 'deposit' ? '↓ Deposit' : '↑ Withdraw'}
                      </span>
                      <span className="text-[10px] text-[#B1BAD3]">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{tx.amount} {CHAINS[tx.chain]?.symbol}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        tx.status === 'confirmed' ? 'bg-[#00E701]/10 text-[#00E701]' : 'bg-[#F0B90B]/10 text-[#F0B90B]'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
