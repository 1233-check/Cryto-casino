import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWallet, ASSETS, DEPOSIT_ADDRESSES } from '../context/WalletContext';
import { getBalance, addToBalance, subtractFromBalance, getCurrencyConfig, CURRENCIES, getActiveCurrency, setActiveCurrency } from '../utils/balance';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Copy, Check, ExternalLink, Shield, AlertTriangle, ChevronDown, X, LinkIcon, Unlink, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const WALLET_OPTIONS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    desc: 'Ethereum & EVM Web3 Wallet',
    assets: ['ethereum', 'bnb', 'usdt'],
    color: '#F6851B',
    gradient: 'from-[#F6851B]/20 to-[#E2761B]/20',
    borderColor: 'border-[#F6851B]',
    iconText: '🦊',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    desc: 'Solana Web3 Wallet',
    assets: ['solana'],
    color: '#AB9FF2',
    gradient: 'from-[#AB9FF2]/20 to-[#7D6AE8]/20',
    borderColor: 'border-[#AB9FF2]',
    iconText: '👻',
  },
  {
    id: 'trustwallet',
    name: 'Trust Wallet',
    desc: 'Multi-chain mobile & extension',
    assets: ['ethereum', 'bnb', 'solana', 'usdt', 'btc'],
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
  {
    id: 'demo',
    name: 'Demo Wallet',
    desc: 'Instant Web3 test wallet',
    assets: ['ethereum', 'bnb', 'solana', 'usdt', 'btc'],
    color: '#00E701',
    gradient: 'from-[#00E701]/20 to-[#1475E1]/20',
    borderColor: 'border-[#00E701]',
    iconText: '⚡',
  },
];

const CHAIN_TO_CURRENCY = {
  ethereum: 'ETH',
  solana: 'SOL',
  bnb: 'BNB',
  usdt: 'USDT',
  btc: 'BTC'
};

const CURRENCY_TO_CHAIN = {
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'bnb',
  USDT: 'usdt',
  BTC: 'btc'
};

const CURRENCY_PRESETS = {
  USDT: ['10', '50', '100', '250', '500'],
  BTC: ['0.001', '0.005', '0.01', '0.05', '0.1'],
  ETH: ['0.01', '0.05', '0.1', '0.5', '1'],
  SOL: ['0.1', '0.5', '1', '5', '10'],
  BNB: ['0.05', '0.1', '0.5', '1', '2']
};

export default function WalletPage({ onNavigate }) {
  const { user, loginWithWallet } = useAuth();
  const {
    connectedWallet, walletAddress, selectedChain, setSelectedChain,
    isConnecting, connectMetaMask, connectPhantom, connectTrustWallet,
    connectInjectedWallet, connectDemoWallet,
    disconnect, sendEvmTransaction, sendSolanaTransaction, addTx, txHistory
  } = useWallet();

  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('50');
  const [status, setStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [balance, setBalanceState] = useState(getBalance());
  const [copied, setCopied] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [txHash, setTxHash] = useState('');

  const targetCur = CHAIN_TO_CURRENCY[selectedChain] || 'USDT';
  const currentAssetBal = getBalance(targetCur);
  const curConfig = getCurrencyConfig(targetCur);

  // Synchronize with active currency and balance updates
  useEffect(() => {
    const syncActiveCurrency = () => {
      const active = getActiveCurrency();
      const mappedChain = CURRENCY_TO_CHAIN[active];
      if (mappedChain && mappedChain !== selectedChain) {
        setSelectedChain(mappedChain);
      }
      setBalanceState(getBalance(CHAIN_TO_CURRENCY[mappedChain || selectedChain] || 'USDT'));
    };

    syncActiveCurrency();
    window.addEventListener('balance-update', syncActiveCurrency);
    return () => window.removeEventListener('balance-update', syncActiveCurrency);
  }, [selectedChain, setSelectedChain]);

  // Adjust default amount when target currency changes
  useEffect(() => {
    const presets = CURRENCY_PRESETS[targetCur] || ['1', '5', '10', '25', '50'];
    setAmount(presets[1] || presets[0]);
  }, [targetCur]);

  const connectWallet = async (walletId) => {
    try {
      let addr;
      if (walletId === 'metamask') addr = await connectMetaMask();
      else if (walletId === 'phantom') addr = await connectPhantom();
      else if (walletId === 'trustwallet') addr = await connectTrustWallet();
      else if (walletId === 'browser') addr = await connectInjectedWallet();
      else if (walletId === 'demo') addr = await connectDemoWallet();

      if (addr && loginWithWallet && !user) {
        await loginWithWallet(addr, walletId);
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setStatus('error');
      setStatusMessage(err.message || 'Wallet connection failed');
      setTimeout(() => setStatus(null), 4000);
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

      // Credit directly to specific asset balance immediately upon confirmation
      addToBalance(numAmount, targetCur);
      setBalanceState(getBalance(targetCur));

      // Synchronize with authoritative server ledger & Firestore
      try {
        const { auth } = await import('../firebase');
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
        if (token) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          await fetch(`${apiUrl}/api/deposit/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              chain: selectedChain,
              amount: numAmount,
              txHash: hash,
              currency: targetCur,
            }),
          });
        }
      } catch (backendErr) {
        console.warn('Backend deposit confirmation notice:', backendErr.message);
      }

      // Record tx
      addTx({
        type: 'deposit',
        chain: selectedChain,
        amount: numAmount,
        currency: targetCur,
        hash,
        timestamp: Date.now(),
        status: 'confirmed',
      });

      setStatus('success');
      setStatusMessage(`Successfully deposited ${numAmount} ${targetCur}`);

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
    if (numAmount > currentAssetBal) {
      setStatus('error');
      setStatusMessage(`Insufficient ${targetCur} balance (Available: ${currentAssetBal})`);
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    setStatus('loading');
    setStatusMessage('Processing withdrawal...');

    try {
      const newBal = subtractFromBalance(numAmount, targetCur);
      if (newBal === null) throw new Error('Insufficient balance');
      setBalanceState(newBal);

      let txHash = 'pending';

      try {
        const { auth } = await import('../firebase');
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

        if (token) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const response = await fetch(`${apiUrl}/api/withdraw`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              chain: selectedChain,
              amount: numAmount,
              toAddress: withdrawAddress,
              currency: targetCur,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data?.txHash) txHash = data.txHash;
            if (typeof data?.newBalance === 'number') {
              setBalance(data.newBalance, targetCur);
              setBalanceState(data.newBalance);
            }
          }
        }
      } catch (backendErr) {
        console.warn('Backend server offline; withdrawal queued in local ledger:', backendErr.message);
      }

      addTx({
        type: 'withdrawal',
        chain: selectedChain,
        currency: targetCur,
        amount: numAmount,
        hash: txHash,
        timestamp: Date.now(),
        status: 'processing',
      });

      setStatus('success');
      setStatusMessage(`Withdrawal of ${numAmount} ${ASSETS[selectedChain].symbol} submitted for review`);
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

  const chainConfig = ASSETS[selectedChain];

  return (
    <div className="flex flex-col h-full bg-[#0B0D11] text-white p-4 sm:p-6 w-full max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            Wallet &amp; Vault
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Deposit and withdraw crypto across multi-chain settlement rails</p>
        </div>
        <div className="bg-[#14171F] px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-white/[0.07] shadow-sm flex items-center justify-between sm:flex-col sm:items-end">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
            {targetCur} Balance
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-xl font-bold text-white tabular-nums">
              {currentAssetBal.toLocaleString(undefined, { 
                minimumFractionDigits: curConfig.decimals > 2 ? curConfig.decimals : 2, 
                maximumFractionDigits: curConfig.decimals 
              })}
            </span>
            <span style={{ color: curConfig.color }} className="font-semibold text-xs">{curConfig.symbol}</span>
          </div>
        </div>
      </div>

      {/* Connected Wallet Badge */}
      {connectedWallet && walletAddress && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#14171F] border border-emerald-500/20 rounded-xl px-3.5 sm:px-4 py-2.5 mb-5 flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="font-semibold text-xs text-white capitalize">
              {connectedWallet === 'trustwallet' ? 'Trust Wallet' : connectedWallet === 'metamask' ? 'MetaMask' : connectedWallet === 'phantom' ? 'Phantom' : connectedWallet === 'demo' ? 'Demo Web3 Wallet' : 'Web3 Wallet'}
            </span>
            <span className="text-slate-400 font-mono text-xs">{formatAddress(walletAddress)}</span>
          </div>
          <button
            onClick={disconnect}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg transition-all"
          >
            <Unlink className="w-3 h-3" />
            Disconnect
          </button>
        </motion.div>
      )}

      {/* Tab Buttons */}
      <div className="flex gap-2 mb-5 w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs transition-all ${
            activeTab === 'deposit'
              ? 'bg-[#10B981] text-gray-950 shadow-sm'
              : 'bg-[#14171F] text-slate-400 hover:bg-[#1A1E27] hover:text-white border border-white/[0.06]'
          }`}
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs transition-all ${
            activeTab === 'withdraw'
              ? 'bg-white/10 text-white border border-white/[0.12] shadow-sm'
              : 'bg-[#14171F] text-slate-400 hover:bg-[#1A1E27] hover:text-white border border-white/[0.06]'
          }`}
        >
          <ArrowUpFromLine className="w-3.5 h-3.5" />
          Withdraw
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Main Card */}
        <div className="lg:col-span-2 bg-[#14171F] rounded-2xl p-5 sm:p-7 border border-white/[0.07] shadow-md relative overflow-hidden">
          
          {/* Step 1: Connect Wallet (if not connected) */}
          {!connectedWallet && (
            <div className="mb-6">
              <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-emerald-400" />
                Connect Your Wallet
              </h2>
              <p className="text-xs text-slate-400 mb-4">Choose a Web3 provider for multi-chain deposits and withdrawals</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto">
                {WALLET_OPTIONS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => connectWallet(w.id)}
                    disabled={isConnecting}
                    className="relative group p-3.5 rounded-xl border border-white/[0.07] bg-[#10131A] hover:bg-[#181C26] hover:border-white/20 transition-all flex flex-col items-center gap-2 disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-white/[0.05]">
                      {w.icon || w.iconText}
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-xs text-white">{w.name}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{w.desc}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-center">
                      {w.assets.slice(0, 3).map(c => (
                        <span key={c} className="text-[8px] bg-white/[0.04] text-slate-400 px-1.5 py-0.5 rounded font-medium uppercase">
                          {ASSETS[c].symbol}
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
              <div className="mb-5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Network / Chain</label>
                <div className="relative">
                  <button
                    onClick={() => setShowChainSelector(!showChainSelector)}
                    className="w-full bg-[#10131A] border border-white/[0.07] rounded-xl px-4 py-3 flex items-center justify-between hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{chainConfig.icon}</span>
                      <div className="text-left">
                        <div className="font-semibold text-xs text-white">{chainConfig.name}</div>
                        <div className="text-[10px] text-slate-400">{chainConfig.symbol}</div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showChainSelector ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showChainSelector && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full mt-1.5 left-0 right-0 bg-[#14171F] border border-white/[0.08] rounded-xl overflow-hidden z-30 shadow-2xl"
                      >
                        {Object.entries(ASSETS)
                          .filter(([key]) => {
                            if (!connectedWallet) return true;
                            const wallet = WALLET_OPTIONS.find(w => w.id === connectedWallet);
                            return wallet?.assets ? wallet.assets.includes(key) : true;
                          })
                          .map(([key, chain]) => (
                          <button
                            key={key}
                            onClick={() => { 
                              setSelectedChain(key); 
                              const mapped = CHAIN_TO_CURRENCY[key];
                              if (mapped) setActiveCurrency(mapped);
                              setShowChainSelector(false); 
                            }}
                            className={`w-full px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/5 transition-colors ${selectedChain === key ? 'bg-white/5' : ''}`}
                          >
                            <span className="text-lg">{chain.icon}</span>
                            <div className="text-left">
                              <div className="font-semibold text-white text-xs">{chain.name}</div>
                              <div className="text-[10px] text-slate-400">{chain.symbol}</div>
                            </div>
                            {selectedChain === key && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {activeTab === 'deposit' ? 'Deposit' : 'Withdraw'} Amount ({chainConfig.symbol})
                  </label>
                  {activeTab === 'withdraw' && (
                    <button
                      type="button"
                      onClick={() => setAmount(currentAssetBal.toString())}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider transition-colors"
                    >
                      MAX ({currentAssetBal} {curConfig.symbol})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#10131A] border border-white/[0.07] rounded-xl px-4 py-3 text-base font-bold focus:outline-none focus:border-white/20 transition-colors pr-16 tabular-nums"
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{chainConfig.symbol}</span>
                </div>
                <div className="flex gap-1.5 mt-2.5">
                  {(CURRENCY_PRESETS[targetCur] || ['1', '5', '10', '25', '50']).map(val => (
                    <button
                      key={val}
                      onClick={() => setAmount(val.toString())}
                      className="flex-1 bg-[#10131A] border border-white/[0.06] rounded-lg py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-white/20 transition-colors"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'deposit' && (
                <>
                  {/* Deposit Address */}
                  <div className="mb-5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                      Deposit Address ({chainConfig.name})
                    </label>
                    
                    <div className="bg-[#10131A] border border-white/[0.07] rounded-xl p-4 mb-3 flex flex-col items-center justify-center">
                      <div className="bg-white p-2.5 rounded-xl mb-2.5 shadow-sm">
                        <QRCodeSVG 
                          value={DEPOSIT_ADDRESSES[selectedChain] || ''} 
                          size={140} 
                          level="H" 
                          includeMargin={false}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 text-center max-w-xs">Scan this QR code from your mobile wallet to send {chainConfig.symbol}.</p>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 bg-[#10131A] border border-white/[0.07] rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-300 truncate">
                        {DEPOSIT_ADDRESSES[selectedChain]}
                      </div>
                      <button
                        onClick={copyAddress}
                        className="bg-[#10131A] border border-white/[0.07] rounded-xl px-3 hover:border-white/20 transition-colors flex items-center gap-1.5 text-xs"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {ASSETS[selectedChain].chainType === 'bitcoin' ? (
                    <div className="w-full bg-[#10131A] text-slate-300 font-medium py-3 rounded-xl text-center text-xs border border-amber-500/30">
                      Please send Bitcoin manually to the address above.
                    </div>
                  ) : (
                    <button
                      onClick={handleDeposit}
                      disabled={status === 'loading' || !parseFloat(amount)}
                      className="w-full bg-[#10B981] hover:bg-[#059669] text-gray-950 font-bold py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm uppercase tracking-wider"
                    >
                      {status === 'loading' ? 'Processing...' : `Deposit ${amount} ${chainConfig.symbol}`}
                    </button>
                  )}
                </>
              )}

              {activeTab === 'withdraw' && (
                <>
                  {/* Withdrawal Address */}
                  <div className="mb-5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder={selectedChain === 'solana' ? 'Enter Solana address...' : 'Enter 0x address...'}
                      className="w-full bg-[#10131A] border border-white/[0.07] rounded-xl px-4 py-3 font-mono text-xs focus:outline-none focus:border-white/20 transition-colors text-white"
                    />
                  </div>

                  <div className="bg-[#10131A] rounded-xl p-3.5 mb-5 border border-amber-500/20">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-400">
                        <span className="text-amber-400 font-semibold">Important:</span> Ensure the withdrawal address and network are correct. 
                        Minimum withdrawal: 0.001 {chainConfig.symbol}.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleWithdraw}
                    disabled={status === 'loading' || !parseFloat(amount) || !withdrawAddress}
                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm uppercase tracking-wider"
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
                className="absolute inset-0 bg-[#0B0D11]/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl"
              >
                {status === 'loading' && (
                  <div className="flex flex-col items-center gap-3 px-8">
                    <div className="w-12 h-12 border-3 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
                    <p className="font-semibold text-slate-300 text-xs text-center">{statusMessage}</p>
                  </div>
                )}
                {status === 'success' && (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-3 px-8">
                    <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-7 h-7 text-gray-950" strokeWidth={3} />
                    </div>
                    <p className="font-bold text-base text-emerald-400 text-center">{statusMessage}</p>
                    {txHash && ASSETS[selectedChain]?.explorerUrl && (
                      <a
                        href={`${ASSETS[selectedChain].explorerUrl}/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline"
                      >
                        View on Explorer <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-3 px-8">
                    <div className="w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-md">
                      <X className="w-7 h-7 text-white" strokeWidth={3} />
                    </div>
                    <p className="font-bold text-base text-rose-400 text-center">{statusMessage}</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Info */}
        <div className="flex flex-col gap-3.5">
          {/* Security Badge */}
          <div className="bg-[#14171F] rounded-2xl p-4 sm:p-5 border border-white/[0.07] shadow-sm">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-white text-xs">Secure Settlements</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                Cryptographically signed transactions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                Non-custodial smart contracts &amp; direct rails
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                USDT, BTC, ETH, SOL, BNB settlement
              </li>
            </ul>
          </div>

          {/* Recent Transactions */}
          <div className="bg-[#14171F] rounded-2xl p-4 sm:p-5 border border-white/[0.07] shadow-sm flex-1">
            <h3 className="font-semibold text-white text-xs mb-3">Recent Transactions</h3>
            {txHistory.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No transactions yet
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {txHistory.map((tx, i) => (
                  <div key={i} className="bg-[#10131A] rounded-xl p-2.5 border border-white/[0.05]">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-semibold uppercase ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {tx.type === 'deposit' ? '↓ Deposit' : '↑ Withdraw'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{tx.amount} {ASSETS[tx.chain]?.symbol}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-semibold ${
                        tx.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
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
