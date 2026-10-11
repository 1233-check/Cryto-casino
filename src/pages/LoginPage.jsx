import React, { useState, useEffect } from 'react';
import { useAuth, ADMIN_EMAILS } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle2, 
  Wallet, 
  Sparkles, 
  ShieldCheck,
  Zap,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  ArrowRight
} from 'lucide-react';

export default function LoginPage({ onNavigate }) {
  const { 
    loginWithGoogle, 
    loginWithEmail, 
    signupWithEmail, 
    loginAsGuest, 
    loginWithWallet, 
    user 
  } = useAuth();

  const { 
    connectMetaMask, 
    connectPhantom, 
    connectTrustWallet, 
    connectInjectedWallet, 
    connectDemoWallet, 
    isConnecting 
  } = useWallet();

  // Active Login Mode Tab: 'instant' | 'email' | 'google' | 'wallet'
  const [activeTab, setActiveTab] = useState('instant');
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Guest name state
  const [guestName, setGuestName] = useState('');

  // Status & loading
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeMethod, setActiveMethod] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [domainWarning, setDomainWarning] = useState(false);

  const [detectedWallets, setDetectedWallets] = useState({ 
    metamask: false, 
    phantom: false, 
    trust: false, 
    browser: false 
  });

  // Detect wallet extensions
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
      const timer = setTimeout(() => {
        onNavigate('home');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, onNavigate]);

  // 1-Click Instant Guest Login
  const handleInstantGuestLogin = () => {
    setError(null);
    setIsLoggingIn(true);
    setActiveMethod('instant');
    try {
      const guest = loginAsGuest(guestName);
      setSuccessMsg(`Welcome, ${guest.name}! Loading casino...`);
      setTimeout(() => onNavigate('home'), 400);
    } catch (err) {
      setError(err.message || 'Failed to initialize instant guest session.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Email Login / Signup
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    setActiveMethod('email');

    try {
      if (authMode === 'signup') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await signupWithEmail(email, password, displayName);
        setSuccessMsg('Account created successfully! Entering casino...');
      } else {
        await loginWithEmail(email, password);
        setSuccessMsg('Signed in successfully! Entering casino...');
      }
      setTimeout(() => onNavigate('home'), 400);
    } catch (err) {
      console.error('Email auth error:', err);
      let msg = err.message || 'Failed to authenticate.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Incorrect email or password. Please verify your credentials.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Switch to "Sign Up" to create one.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Switch to "Sign In".';
      }
      setError(msg);
    } finally {
      setIsLoggingIn(false);
      setActiveMethod(null);
    }
  };

  // Google Login
  const handleGoogleLogin = async () => {
    setError(null);
    setDomainWarning(false);
    setIsLoggingIn(true);
    setActiveMethod('google');

    try {
      const loggedInUser = await loginWithGoogle();
      if (loggedInUser) {
        setSuccessMsg(`Welcome, ${loggedInUser.name || loggedInUser.email}!`);
        setTimeout(() => onNavigate('home'), 400);
      }
    } catch (err) {
      console.error('Google login error:', err);
      let message = 'Unable to sign in with Google. Please try another method or play as guest.';
      if (err.code === 'auth/unauthorized-domain') {
        setDomainWarning(true);
        message = 'This hosting domain is not yet on Firebase authorized list. Use Instant 1-Click Guest or Email Login below to enter immediately!';
      } else if (err.code === 'auth/popup-closed-by-user') {
        message = 'Google sign-in popup was closed. Click again or use Instant Guest Play.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        message = 'Sign in request cancelled.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoggingIn(false);
      setActiveMethod(null);
    }
  };

  // Web3 Wallet Login
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
        await loginWithWallet(address, type);
        setSuccessMsg('Wallet connected! Entering casino...');
        setTimeout(() => onNavigate('home'), 400);
      }
    } catch (err) {
      console.error(`${type} login failed:`, err);
      setError(err.message || 'Wallet connection was cancelled or not installed.');
    } finally {
      setIsLoggingIn(false);
      setActiveMethod(null);
    }
  };

  const isDisabled = isLoggingIn || isConnecting;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#07131D] via-[#0F212E] to-[#162734] relative overflow-x-hidden p-4 sm:p-6">
      
      {/* Dynamic ambient lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-[#00E701] rounded-full blur-[200px] opacity-[0.06] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-[#1475E1] rounded-full blur-[200px] opacity-[0.08] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-[#FFD700] rounded-full blur-[240px] opacity-[0.03] pointer-events-none" />

      {/* Top Navigation Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-[#B1BAD3] hover:text-white rounded-xl border border-white/10 transition-all text-xs sm:text-sm font-semibold backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Games</span>
        </button>
      </div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-lg bg-[#0F212E]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6 sm:p-8 mt-12 mb-6"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="bg-gradient-to-tr from-[#1475E1] to-[#00E701] p-2.5 rounded-2xl shadow-[0_0_25px_rgba(0,231,1,0.35)]">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <span className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              CRYPTO<span className="text-[#00E701]">BET</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#B1BAD3]">
            Provably Fair Crypto Casino • Instant Access & Payouts
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="w-full mb-4 p-3 rounded-xl bg-[#00E701]/15 border border-[#00E701]/30 text-[#00E701] text-xs font-semibold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {/* Error Alert */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="w-full mb-4 p-3.5 rounded-xl bg-[#ED4163]/15 border border-[#ED4163]/30 text-[#ED4163] text-xs flex items-start gap-2.5 leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              {domainWarning && (
                <button
                  onClick={handleInstantGuestLogin}
                  className="block mt-2 font-bold text-[#00E701] hover:underline"
                >
                  ⚡ Click here to start playing immediately as Instant Guest (no config needed) &rarr;
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Navigation Tabs for Auth Modes */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#07131D] rounded-2xl border border-white/5 mb-6 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('instant'); setError(null); }}
            className={`py-2.5 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'instant'
                ? 'bg-[#00E701] text-black shadow-[0_0_15px_rgba(0,231,1,0.3)]'
                : 'text-[#B1BAD3] hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] sm:text-xs">Instant</span>
          </button>

          <button
            onClick={() => { setActiveTab('email'); setError(null); }}
            className={`py-2.5 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'email'
                ? 'bg-[#1475E1] text-white shadow-[0_0_15px_rgba(20,117,225,0.3)]'
                : 'text-[#B1BAD3] hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] sm:text-xs">Email</span>
          </button>

          <button
            onClick={() => { setActiveTab('google'); setError(null); }}
            className={`py-2.5 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                : 'text-[#B1BAD3] hover:text-white hover:bg-white/5'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-[11px] sm:text-xs">Google</span>
          </button>

          <button
            onClick={() => { setActiveTab('wallet'); setError(null); }}
            className={`py-2.5 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'wallet'
                ? 'bg-[#AB9FF2] text-black shadow-[0_0_15px_rgba(171,159,242,0.3)]'
                : 'text-[#B1BAD3] hover:text-white hover:bg-white/5'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] sm:text-xs">Web3</span>
          </button>
        </div>

        {/* TAB 1: 1-CLICK INSTANT GUEST ACCESS */}
        {activeTab === 'instant' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#00E701]/10 to-[#1475E1]/10 border border-[#00E701]/20 text-center">
              <div className="flex items-center justify-center gap-2 text-[#00E701] font-bold text-sm mb-1">
                <Flame className="w-4 h-4 text-[#FFD700]" />
                <span>Zero Friction • Instant Play</span>
              </div>
              <p className="text-xs text-[#B1BAD3]">
                Jump straight into the games with a generated anonymous account and <strong>1.00000000 BTC</strong> play balance.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#557086] uppercase tracking-wider mb-2">
                Nickname / Handle (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Satoshi_VIP, HighRoller"
                  className="w-full bg-[#07131D] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#00E701] transition-colors"
                />
                <User className="w-4 h-4 text-[#557086] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              onClick={handleInstantGuestLogin}
              disabled={isDisabled}
              className="w-full py-4 bg-gradient-to-r from-[#00E701] to-[#00C853] hover:brightness-110 text-black font-extrabold text-sm rounded-xl transition-all shadow-[0_0_25px_rgba(0,231,1,0.35)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>Play Instantly as Guest</span>
            </button>

            <div className="text-center">
              <span className="text-[11px] text-[#557086]">
                You can link an email or Web3 wallet at any time in your account settings.
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: EMAIL & PASSWORD (SIGN IN / REGISTER) */}
        {activeTab === 'email' && (
          <div>
            {/* Mode Switcher */}
            <div className="flex border-b border-white/10 mb-5">
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setError(null); }}
                className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-all ${
                  authMode === 'signin'
                    ? 'border-[#1475E1] text-white'
                    : 'border-transparent text-[#557086] hover:text-[#B1BAD3]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setError(null); }}
                className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-all ${
                  authMode === 'signup'
                    ? 'border-[#00E701] text-white'
                    : 'border-transparent text-[#557086] hover:text-[#B1BAD3]'
                }`}
              >
                Create New Account
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-[#557086] uppercase tracking-wider mb-1.5">
                    Username / Player Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="CryptoChamp"
                      className="w-full bg-[#07131D] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#1475E1]"
                    />
                    <User className="w-4 h-4 text-[#557086] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#557086] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@example.com"
                    className="w-full bg-[#07131D] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#1475E1]"
                  />
                  <Mail className="w-4 h-4 text-[#557086] absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#557086] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#07131D] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-[#1475E1]"
                  />
                  <Lock className="w-4 h-4 text-[#557086] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#557086] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isDisabled}
                className={`w-full mt-4 py-3.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 disabled:opacity-50 ${
                  authMode === 'signup'
                    ? 'bg-[#00E701] hover:bg-[#00E701]/90 text-black shadow-[0_0_20px_rgba(0,231,1,0.3)]'
                    : 'bg-[#1475E1] hover:bg-[#1475E1]/90 text-white shadow-[0_0_20px_rgba(20,117,225,0.3)]'
                }`}
              >
                {isLoggingIn && activeMethod === 'email' ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{authMode === 'signup' ? 'Create Casino Account' : 'Sign In with Email'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: GOOGLE ONE-TAP */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <p className="text-xs text-[#B1BAD3] leading-relaxed">
                Connect seamlessly with your Google Account. Your profile will be automatically synced with your personal vault.
              </p>
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={isDisabled}
              className="w-full relative group overflow-hidden bg-white text-black font-bold text-sm py-3.5 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-3">
                {isLoggingIn && activeMethod === 'google' ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                <span>Continue with Google</span>
              </div>
            </button>

            {/* Quick backup fallback in case popup blocked */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-[#557086] text-center">
              Having trouble with popups in your mobile browser? Try <strong>Instant Guest</strong> or <strong>Email Login</strong> tabs above.
            </div>
          </div>
        )}

        {/* TAB 4: WEB3 WALLETS */}
        {activeTab === 'wallet' && (
          <div className="space-y-2.5">
            {/* MetaMask */}
            <button
              onClick={() => handleWalletLogin('metamask')}
              disabled={isDisabled}
              className="w-full bg-[#F6851B]/10 hover:bg-[#F6851B]/20 border border-[#F6851B]/30 hover:border-[#F6851B] text-white font-bold text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🦊</span>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span>MetaMask</span>
                    {detectedWallets.metamask && (
                      <span className="text-[10px] bg-[#00E701]/20 text-[#00E701] px-1.5 py-0.2 rounded font-semibold">Detected</span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#B1BAD3]">Ethereum, BNB, Polygon</span>
                </div>
              </div>
              <span className="text-xs text-[#557086]">Connect &rarr;</span>
            </button>

            {/* Phantom */}
            <button
              onClick={() => handleWalletLogin('phantom')}
              disabled={isDisabled}
              className="w-full bg-[#AB9FF2]/10 hover:bg-[#AB9FF2]/20 border border-[#AB9FF2]/30 hover:border-[#AB9FF2] text-white font-bold text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">👻</span>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span>Phantom</span>
                    {detectedWallets.phantom && (
                      <span className="text-[10px] bg-[#00E701]/20 text-[#00E701] px-1.5 py-0.2 rounded font-semibold">Detected</span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#B1BAD3]">Solana Network (SOL)</span>
                </div>
              </div>
              <span className="text-xs text-[#557086]">Connect &rarr;</span>
            </button>

            {/* Trust Wallet */}
            <button
              onClick={() => handleWalletLogin('trust')}
              disabled={isDisabled}
              className="w-full bg-[#3375BB]/10 hover:bg-[#3375BB]/20 border border-[#3375BB]/30 hover:border-[#3375BB] text-white font-bold text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🛡️</span>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span>Trust Wallet</span>
                    {detectedWallets.trust && (
                      <span className="text-[10px] bg-[#00E701]/20 text-[#00E701] px-1.5 py-0.2 rounded font-semibold">Detected</span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#B1BAD3]">Multi-Chain Mobile & Extension</span>
                </div>
              </div>
              <span className="text-xs text-[#557086]">Connect &rarr;</span>
            </button>

            {/* Instant Demo Web3 Wallet */}
            <button
              onClick={() => handleWalletLogin('demo')}
              disabled={isDisabled}
              className="w-full py-3 px-4 bg-[#00E701]/10 hover:bg-[#00E701]/20 border border-[#00E701]/40 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold text-[#00E701]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Connect Instant Demo Web3 Wallet (No extension required)</span>
            </button>
          </div>
        )}

        {/* Security & Provably Fair Guarantees */}
        <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-around text-center text-[10px] text-[#557086] font-semibold">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00E701]" />
            <span>100% Provably Fair</span>
          </div>
          <div className="flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-[#1475E1]" />
            <span>Non-Custodial</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Instant Cashouts</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
