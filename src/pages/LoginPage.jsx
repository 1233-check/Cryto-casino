import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { motion } from 'framer-motion';

export default function LoginPage({ onNavigate }) {
  const { loginWithGoogle } = useAuth();
  const { connectMetaMask, connectPhantom, connectTrustWallet, isConnecting } = useWallet();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeMethod, setActiveMethod] = useState(null); // 'google' | 'metamask' | 'phantom' | 'trust'

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setActiveMethod('google');
    try {
      await loginWithGoogle();
      onNavigate('home');
    } catch (err) {
      console.error('Google login failed:', err);
    } finally {
      setIsLoggingIn(false);
      setActiveMethod(null);
    }
  };

  const handleWalletLogin = async (type) => {
    setIsLoggingIn(true);
    setActiveMethod(type);
    try {
      if (type === 'metamask') await connectMetaMask();
      else if (type === 'phantom') await connectPhantom();
      else if (type === 'trust') await connectTrustWallet();
      onNavigate('home');
    } catch (err) {
      console.error(`${type} login failed:`, err);
    } finally {
      setIsLoggingIn(false);
      setActiveMethod(null);
    }
  };

  const isDisabled = isLoggingIn || isConnecting;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#0F212E] via-[#0a1a27] to-[#1A2C38] relative overflow-hidden">
      
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
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-[#9945FF] rounded-full blur-[150px] opacity-[0.06]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md p-8 bg-[#0F212E]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center"
      >
        
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-tr from-[#1475E1] to-[#00E701] p-3 rounded-xl shadow-[0_0_25px_rgba(20,117,225,0.4)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
              <circle cx="15.5" cy="15.5" r="1.5" fill="white" />
              <circle cx="15.5" cy="8.5" r="1.5" fill="white" />
              <circle cx="8.5" cy="15.5" r="1.5" fill="white" />
            </svg>
          </div>
          <h1 className="text-3xl font-black font-display tracking-tight text-white">Crypto<span className="text-[#00E701]">Casino</span></h1>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2 text-center">Welcome Back</h2>
        <p className="text-[#B1BAD3] text-center mb-8 text-sm">Connect your wallet or sign in to start playing</p>

        {/* Wallet Login Options */}
        <div className="w-full space-y-3 mb-6">
          
          {/* MetaMask */}
          <button
            onClick={() => handleWalletLogin('metamask')}
            disabled={isDisabled}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-[#F6851B]/10 to-[#E2761B]/10 border border-[#F6851B]/30 hover:border-[#F6851B] text-white font-bold text-sm py-3.5 px-5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(246,133,27,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <div className="flex items-center justify-center gap-3">
              {activeMethod === 'metamask' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-[#F6851B] rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 35 33" fill="none">
                  <path d="M32.96 1L19.7 10.89l2.45-5.81L32.96 1z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2.04 1l13.14 9.98-2.33-5.9L2.04 1z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <span>Continue with MetaMask</span>
              <span className="ml-auto text-[10px] bg-white/5 text-[#B1BAD3] px-2 py-0.5 rounded-full">ETH</span>
            </div>
          </button>

          {/* Phantom */}
          <button
            onClick={() => handleWalletLogin('phantom')}
            disabled={isDisabled}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-[#AB9FF2]/10 to-[#512DA8]/10 border border-[#AB9FF2]/30 hover:border-[#AB9FF2] text-white font-bold text-sm py-3.5 px-5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(171,159,242,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <div className="flex items-center justify-center gap-3">
              {activeMethod === 'phantom' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-[#AB9FF2] rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
                  <rect width="128" height="128" rx="26" fill="#AB9FF2"/>
                  <path d="M110.5 64.6c-1.2 18.2-16.7 32.5-35 32.5H44.8c-2.6 0-4.8-2.1-4.8-4.8 0-.4.1-.8.1-1.2l4.8-29.4c.7-4.3 4.4-7.5 8.8-7.5h32c12.3 0 22.4 9.5 23.4 21.7.1.6.1 1.1.1 1.7" fill="#FFF"/>
                </svg>
              )}
              <span>Continue with Phantom</span>
              <span className="ml-auto text-[10px] bg-white/5 text-[#B1BAD3] px-2 py-0.5 rounded-full">SOL</span>
            </div>
          </button>

          {/* Trust Wallet */}
          <button
            onClick={() => handleWalletLogin('trust')}
            disabled={isDisabled}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-[#3375BB]/10 to-[#1B4F7A]/10 border border-[#3375BB]/30 hover:border-[#3375BB] text-white font-bold text-sm py-3.5 px-5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(51,117,187,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <div className="flex items-center justify-center gap-3">
              {activeMethod === 'trust' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-[#3375BB] rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4L6 12v12c0 11.1 7.7 21.5 18 24 10.3-2.5 18-12.9 18-24V12L24 4z" fill="#3375BB"/>
                  <path d="M24 8l-14 6.2v9.7c0 9 6.3 17.5 14 19.6 7.7-2.1 14-10.6 14-19.6v-9.7L24 8z" fill="white"/>
                </svg>
              )}
              <span>Continue with Trust Wallet</span>
              <span className="ml-auto text-[10px] bg-white/5 text-[#B1BAD3] px-2 py-0.5 rounded-full">Multi</span>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-[#557086] font-bold uppercase">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Google Login */}
        <button 
          onClick={handleGoogleLogin}
          disabled={isDisabled}
          className="w-full relative group overflow-hidden bg-white text-black font-bold text-sm py-3.5 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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

        <div className="mt-8 text-center text-xs text-[#B1BAD3]/60 max-w-xs">
          By continuing, you agree to our Terms of Service and Privacy Policy. Only users 18+ are permitted to play.
        </div>
      </motion.div>
    </div>
  );
}
