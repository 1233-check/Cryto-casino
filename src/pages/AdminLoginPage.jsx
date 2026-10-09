import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';

export default function AdminLoginPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Login successful, redirect to admin dashboard
      onNavigate('admin');
    } catch (err) {
      console.error(err);
      setError('Invalid admin credentials. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0F212E] items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-[#1A2C38] border border-white/5 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-[#ED4163]/10 p-3 rounded-xl border border-[#ED4163]/20">
            <ShieldAlert className="w-8 h-8 text-[#ED4163]" />
          </div>
          <h1 className="text-2xl font-black font-display text-white">Admin Portal</h1>
        </div>

        {error && (
          <div className="bg-[#ED4163]/10 border border-[#ED4163]/20 text-[#ED4163] px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#557086] uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0F212E] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ED4163] transition-colors"
              placeholder="admin@cryptocasino.com"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#557086] uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0F212E] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#ED4163] transition-colors"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-[#557086] absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full mt-6 bg-[#ED4163] hover:bg-[#ED4163]/80 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => onNavigate('home')} className="text-sm text-[#557086] hover:text-white transition-colors">
            &larr; Return to Casino
          </button>
        </div>
      </div>
    </div>
  );
}
