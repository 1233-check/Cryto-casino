import React, { useState } from 'react';
import { useAuth, ADMIN_EMAILS, isUserAdmin } from '../context/AuthContext';
import { ShieldAlert, ArrowRight, Lock, CheckCircle2, ShieldCheck, Mail, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLoginPage({ onNavigate }) {
  const { user, loginWithEmail, loginWithGoogle, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // If already logged in as authorized admin, allow direct entry
  const currentUserIsAdmin = isUserAdmin(user);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await loginWithEmail(email, password);
      if (isUserAdmin(loggedUser)) {
        onNavigate('admin');
      } else {
        setError('This account does not have administrative privileges.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid admin credentials. Please verify your login.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const loggedUser = await loginWithGoogle();
      if (loggedUser && isUserAdmin(loggedUser)) {
        onNavigate('admin');
      } else if (loggedUser) {
        setError('This account does not have administrative privileges.');
      }
    } catch (err) {
      console.error('Google Admin Login error:', err);
      setError(err.message || 'Google authentication was cancelled or interrupted.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#0F212E] via-[#0b1721] to-[#162734] items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ED4163]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#1475E1]/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 bg-[#1A2C38]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-gradient-to-tr from-[#ED4163] to-[#FF6B8B] p-3.5 rounded-2xl shadow-[0_0_25px_rgba(237,65,99,0.4)] mb-4">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-white">Staff Admin Portal</h1>
          <p className="text-xs text-[#B1BAD3] mt-1">Platform administration, cold vault and user management</p>
        </div>

        {/* If user is already logged in as authorized admin */}
        {currentUserIsAdmin ? (
          <div className="mb-6 p-4 rounded-2xl bg-[#00E701]/10 border border-[#00E701]/30 text-center">
            <div className="flex items-center justify-center gap-2 text-[#00E701] font-bold text-sm mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span>Admin Access Verified</span>
            </div>
            <p className="text-xs text-[#B1BAD3] mb-4">
              Signed in as <strong className="text-white">{user.email || user.name}</strong>
            </p>
            <button
              onClick={() => onNavigate('admin')}
              className="w-full py-3.5 bg-[#00E701] hover:bg-[#00E701]/90 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,231,1,0.3)] hover:-translate-y-0.5 text-sm"
            >
              Enter Admin Dashboard &rarr;
            </button>
          </div>
        ) : null}

        {error && (
          <div className="bg-[#ED4163]/10 border border-[#ED4163]/30 text-[#ED4163] px-4 py-3 rounded-xl text-xs mb-6 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* 1-Click Google Sign-In for Admin */}
        <button
          onClick={handleGoogleAdminLogin}
          disabled={googleLoading || loading}
          className="w-full py-3.5 px-4 bg-white hover:bg-gray-100 text-black font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-3 mb-5 shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span>Sign In with Admin Google Account</span>
        </button>

        <div className="w-full flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[11px] text-[#557086] font-bold uppercase tracking-wider">or sign in with password</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#557086] uppercase tracking-wider mb-2">Admin Email</label>
            <div className="relative">
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0F212E] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#ED4163] transition-colors text-sm"
                placeholder="tejugiri549@gmail.com"
              />
              <Mail className="w-4 h-4 text-[#557086] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#557086] uppercase tracking-wider mb-2">Security Key / Password</label>
            <div className="relative">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0F212E] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#ED4163] transition-colors text-sm"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-[#557086] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full mt-4 bg-gradient-to-r from-[#ED4163] to-[#FF6B8B] hover:opacity-90 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(237,65,99,0.3)] hover:-translate-y-0.5 disabled:opacity-50 text-sm"
          >
            {loading ? 'Authenticating...' : 'Authenticate Admin Access'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => onNavigate('home')} 
            className="text-xs text-[#557086] hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto"
          >
            &larr; Return to Casino Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
