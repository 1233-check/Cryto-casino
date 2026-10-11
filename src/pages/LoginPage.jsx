import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { motion } from 'framer-motion';
import { 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle2, 
  Wallet, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function LoginPage({ onNavigate }) {
  const { loginWithGoogle, loginWithWallet, user } = useAuth();
  const { 
    connectMetaMask, 
    connectPhantom, 
    connectTrustWallet, 
    connectInjectedWallet, 
    connectDemoWallet, 
    isConnecting 
  } = useWallet();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeMethod, setActiveMethod] = useState(null); // 'google' | 'metamask' | 'phantom' | 'trust' | 'browser' | 'demo'
  const [error, setError] = useState(null);
  const [detectedWallets, setDetectedWallets] = useState({ metamask: false, phantom: false, trust: false, browser: false });

  // Detect which wallet extensions exist in the user's browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasMetaMask = Boolean(window.ethereum?.isMetaMask && !window.ethereum?.isTrust);
      const hasPhantom = Boolean(window.phantom?.solana || window.solana?.isPhantom);
      const hasTrust = Boolean(window.trustwallet || window.ethereum?.isTrust);
      const hasGeneric = Boolean(window.ethereum && !hasMetaMask && !hasTrust);
      setDetectedWallets({ metamask: hasMetaMask, phantom: hasPhantom, trust: hasTrust, browser: hasGeneric });
    }
  }, []);

  useEffect(() => {
    if (user) {
      onNavigate('account');
    }
  }, [user, onNavigate]);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoggingIn(true);
    setActiveMethod('google');
    try {
      const loggedInUser = await loginWithGoogle();
      if (loggedInUser) {
        onNavigate('account');
      }
    } catch (err) {
      console.error('Google login error:', err);
      let message = 'Unable to sign in. Please try again.';
      if (err.code === 'auth/unauthorized-domain') {
        message = 'Domain not authorized: Please ensure "cryto-casino.vercel.app" is added in Firebase Console > Authentication > Settings > Authorized domains.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        message = 'Sign in popup was closed. Click Continue with Google to try again.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        message = 'Sign in request cancelled. Please try again.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoggingIn(false);
      setActiveMethod(null);
    }
  };

  const handleWalletLogin = async (type) => {
    setError(null);
    setIsLoggingIn(true);
    setActiveMethod(type);

    try {
      let address;
      if (type === 'metamask') {
        address = await connectMetaMask();
      } else if (type === 'phantom') {
        address = await connectPhantom();
      } else if (type === 'trust') {
        address = await connectTrustWallet();
      } else if (type === 'browser') {
        address = await connectInjectedWallet();
      } else if (type === 'demo') {
        address = await connectDemoWallet();
      }

      if (address) {
        // Authenticate into Casino session as a Web3 player
        if (loginWithWallet) {
          await loginWithWallet(address, type);
        }
        onNavigate('account');
      }
    } catch (err) {
      console.error(`${type} login failed:`, err);
      let msg = err.message || 'Wallet connection was rejected or cancelled.';
      setError(msg);
    } finally {
      setIsLoggingIn(false);
      setActiveMethod(null);
    }
  };

  const isDisabled = isLoggingIn || isConnecting;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#0F212E] via-[#0a1a27] to-[#1A2C38] relative overflow-hidden p-4">
      
      {/* Back to Home Button */}
      <button
        onClick={() => onNavigate('home')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-[#B1BAD3] hover:text-white rounded-xl border border-white/10 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Casino
      </button>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1475E1] rounded-full blur-[180px] opacity-[0.08]"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00E701] rounded-full blur-[180px] opacity-[0.08]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg p-6 sm:p-8 bg-[#0F212E]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center max-h-[95vh] overflow-y-auto custom-scrollbar"
      >
        
        {/* Logo */}
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-gradient-to-tr from-[#1475E1] to-[#00E701] p-2.5 rounded-xl shadow-[0_0_25px_rgba(20,117,225,0.4)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
              <circle cx="15.5" cy="15.5" r="1.5" fill="white" />
              <circle cx="15.5" cy="8.5" r="1.5" fill="white" />
              <circle cx="8.5" cy="15.5" r="1.5" fill="white" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
            Crypto<span className="text-[#00E701]">Casino</span>
          </h1>
        </div>

        {user ? (
          <div className="w-full flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full border-2 border-[#00E701] overflow-hidden mb-3">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Signed in as {user.name}</h2>
            <p className="text-xs text-[#00E701] mb-6 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Account Connected (UID: {user.id?.substring(0, 8)}...)
            </p>
            <div className="w-full space-y-3">
              <button
                onClick={() => onNavigate('account')}
                className="w-full py-3.5 bg-[#00E701] text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(0,231,1,0.3)] hover:-translate-y-0.5 text-sm"
              >
                Go to My Account
              </button>
              <button
                onClick={() => onNavigate('home')}
                className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/15 transition-all text-sm"
              >
                Continue to Casino Home
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 text-center">Sign In or Connect Wallet</h2>
            <p className="text-[#B1BAD3] text-center mb-5 text-xs sm:text-sm">Instant anonymous login with Web3 or Google</p>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="w-full mb-4 p-3.5 rounded-xl bg-[#ED4163]/15 border border-[#ED4163]/30 text-[#ED4163] text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  {error}
                  {error.includes('not installed') && (
                    <button
                      onClick={() => handleWalletLogin('demo')}
                      className="block mt-2 font-bold text-[#00E701] hover:underline"
                    >
                      💡 Or click here to connect Instant Demo Web3 Wallet (no extension required)
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Google OAuth Button */}
            <button 
              onClick={handleGoogleLogin}
              disabled={isDisabled}
              className="w-full relative group overflow-hidden bg-white text-black font-bold text-sm py-3.5 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 mb-5"
            >
              <div className="flex items-center justify-center gap-3">
                {activeMethod === 'google' ? (
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                <span>Continue with Google</span>
              </div>
            </button>

            {/* Divider */}
            <div className="w-full flex items-center gap-4 mb-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-[#557086] font-bold uppercase tracking-wider">or connect web3 wallet</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Web3 Wallet Options Grid */}
            <div className="w-full space-y-2.5 mb-4">
              
              {/* MetaMask */}
              <button
                onClick={() => handleWalletLogin('metamask')}
                disabled={isDisabled}
                className="w-full relative group bg-gradient-to-r from-[#F6851B]/10 to-[#E2761B]/10 border border-[#F6851B]/30 hover:border-[#F6851B] text-white font-bold text-sm py-3 px-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(246,133,27,0.2)] disabled:opacity-50 text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {activeMethod === 'metamask' ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-[#F6851B] rounded-full animate-spin" />
                  ) : (
                    <span className="text-xl">🦊</span>
                  )}
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      MetaMask
                      {detectedWallets.metamask && (
                        <span className="text-[10px] bg-[#00E701]/20 text-[#00E701] px-1.5 py-0.2 rounded font-semibold">Detected</span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#B1BAD3]">Ethereum, BNB, USDT</span>
                  </div>
                </div>
                <span className="text-xs text-[#557086] group-hover:text-white transition-colors">EVM &rarr;</span>
              </button>

              {/* Phantom */}
              <button
                onClick={() => handleWalletLogin('phantom')}
                disabled={isDisabled}
                className="w-full relative group bg-gradient-to-r from-[#AB9FF2]/10 to-[#7D6AE8]/10 border border-[#AB9FF2]/30 hover:border-[#AB9FF2] text-white font-bold text-sm py-3 px-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(171,159,242,0.2)] disabled:opacity-50 text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {activeMethod === 'phantom' ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-[#AB9FF2] rounded-full animate-spin" />
                  ) : (
                    <span className="text-xl">👻</span>
                  )}
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      Phantom
                      {detectedWallets.phantom && (
                        <span className="text-[10px] bg-[#00E701]/20 text-[#00E701] px-1.5 py-0.2 rounded font-semibold">Detected</span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#B1BAD3]">Solana Network (SOL)</span>
                  </div>
                </div>
                <span className="text-xs text-[#557086] group-hover:text-white transition-colors">SOL &rarr;</span>
              </button>

              {/* Trust Wallet */}
              <button
                onClick={() => handleWalletLogin('trust')}
                disabled={isDisabled}
                className="w-full relative group bg-gradient-to-r from-[#3375BB]/10 to-[#1B4F7A]/10 border border-[#3375BB]/30 hover:border-[#3375BB] text-white font-bold text-sm py-3 px-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(51,117,187,0.2)] disabled:opacity-50 text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {activeMethod === 'trust' ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-[#3375BB] rounded-full animate-spin" />
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                      <path d="M24 4L6 12v12c0 11.1 7.7 21.5 18 24 10.3-2.5 18-12.9 18-24V12L24 4z" fill="#3375BB"/>
                      <path d="M24 8l-14 6.2v9.7c0 9 6.3 17.5 14 19.6 7.7-2.1 14-10.6 14-19.6v-9.7L24 8z" fill="white"/>
                    </svg>
                  )}
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      Trust Wallet
                      {detectedWallets.trust && (
                        <span className="text-[10px] bg-[#00E701]/20 text-[#00E701] px-1.5 py-0.2 rounded font-semibold">Detected</span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#B1BAD3]">Multi-Chain Mobile & Extension</span>
                  </div>
                </div>
                <span className="text-xs text-[#557086] group-hover:text-white transition-colors">Multi &rarr;</span>
              </button>

              {/* Browser / Injected Web3 (Coinbase, Brave, Rabby, OKX) */}
              <button
                onClick={() => handleWalletLogin('browser')}
                disabled={isDisabled}
                className="w-full relative group bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/30 text-white font-medium text-sm py-2.5 px-4 rounded-xl transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-[#1475E1]" />
                  <span className="text-xs text-[#B1BAD3]">Other Web3 Wallet (Coinbase / Brave / Rabby)</span>
                </div>
                <span className="text-xs text-[#557086] group-hover:text-white">&rarr;</span>
              </button>
            </div>

            {/* Instant Demo Web3 Wallet */}
            <div className="w-full pt-2">
              <button
                onClick={() => handleWalletLogin('demo')}
                disabled={isDisabled}
                className="w-full py-2.5 px-3 bg-[#00E701]/10 hover:bg-[#00E701]/20 border border-[#00E701]/30 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold text-[#00E701]"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Test Instantly with Demo Web3 Wallet (No extension required)</span>
              </button>
            </div>

            <div className="mt-5 text-center text-xs text-[#B1BAD3]/60 max-w-xs">
              By connecting, you agree to our Terms of Service. Non-custodial provably fair gambling platform.
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
