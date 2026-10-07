import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onNavigate }) {
  const { loginWithGoogle } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    await loginWithGoogle();
    setIsLoggingIn(false);
    onNavigate('home');
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#0F212E] to-[#1A2C38]">
      
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1475E1] rounded-full blur-[150px] opacity-10" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00E701] rounded-full blur-[150px] opacity-10" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 bg-[#0F212E]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-tr from-[#1475E1] to-[#00E701] p-3 rounded-xl shadow-[0_0_20px_rgba(20,117,225,0.4)]">
             {/* Simple dice SVG logo */}
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
        <p className="text-[#B1BAD3] text-center mb-10 text-sm">Log in to start playing the most advanced crypto games.</p>

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
          className="w-full relative group overflow-hidden bg-white text-black font-bold text-lg py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-4">
             {isLoggingIn ? (
               <div className="w-6 h-6 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
             ) : (
               <>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                 </svg>
                 <span>Continue with Google</span>
               </>
             )}
          </div>
        </button>

        <div className="mt-8 text-center text-xs text-[#B1BAD3]/60 max-w-xs">
          By continuing, you agree to our Terms of Service and Privacy Policy. Only users 18+ are permitted to play.
        </div>
      </div>
    </div>
  );
}
