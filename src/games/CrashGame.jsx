import React, { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { getCrashPoint, generateServerSeed } from '../utils/provablyFair';
import { getBalance, subtractFromBalance, addToBalance, addHistoryEntry } from '../utils/balance';

export default function CrashGame({ onBack }) {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const graphicsBaseRef = useRef(null);
  const graphicsGlowRef = useRef(null);
  const graphicsParticlesRef = useRef(null);
  
  const [balance, setBalanceState] = useState(getBalance());
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [gamePhase, setGamePhase] = useState('WAITING'); // 'WAITING', 'RUNNING', 'CRASHED'
  const [betState, setBetState] = useState('idle'); // 'idle', 'placed', 'active', 'cashed_out'
  const [currentMultUI, setCurrentMultUI] = useState(1.0);
  const [remainingTimeUI, setRemainingTimeUI] = useState(5000);
  const [lastWin, setLastWin] = useState(0);

  // Synchronize state for the ticker
  const phaseRef = useRef(gamePhase);
  const autoCashoutRef = useRef(autoCashout);
  const betStateRef = useRef(betState);
  const betAmountRef = useRef(betAmount);
  
  const startTimeRef = useRef(Date.now());
  const crashPointRef = useRef(1.0);
  const multRef = useRef(1.0);
  const ptsRef = useRef([]);
  const particlesRef = useRef([]);

  useEffect(() => {
    const handleUpdate = () => setBalanceState(getBalance());
    window.addEventListener('balance-update', handleUpdate);
    return () => window.removeEventListener('balance-update', handleUpdate);
  }, []);

  useEffect(() => { phaseRef.current = gamePhase; }, [gamePhase]);
  useEffect(() => { autoCashoutRef.current = autoCashout; }, [autoCashout]);
  useEffect(() => { betStateRef.current = betState; }, [betState]);
  useEffect(() => { betAmountRef.current = betAmount; }, [betAmount]);

  // UI Updater Interval (approx 20fps for React state)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (phaseRef.current === 'RUNNING') {
        setCurrentMultUI(multRef.current);
      } else if (phaseRef.current === 'WAITING') {
        setRemainingTimeUI(Math.max(0, 5000 - (now - startTimeRef.current)));
      } else if (phaseRef.current === 'CRASHED') {
        setCurrentMultUI(multRef.current);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const rocketSpriteRef = useRef(null);

  useEffect(() => {
    let app = new PIXI.Application();
    let isDestroyed = false;
    
    const initPixi = async () => {
      await app.init({
        resizeTo: canvasRef.current,
        backgroundAlpha: 0,
        antialias: true,
      });
      
      if (isDestroyed) {
        app.destroy(true, { children: true });
        return;
      }
      
      canvasRef.current.appendChild(app.canvas);
      appRef.current = app;

      const graphContainer = new PIXI.Container();
      app.stage.addChild(graphContainer);

      const graphicsGlow = new PIXI.Graphics();
      const graphicsBase = new PIXI.Graphics();
      const graphicsParticles = new PIXI.Graphics();
      
      graphContainer.addChild(graphicsGlow, graphicsBase, graphicsParticles);
      
      graphicsBaseRef.current = graphicsBase;
      graphicsGlowRef.current = graphicsGlow;
      graphicsParticlesRef.current = graphicsParticles;

      // Load Rocket Sprite
      try {
        const texture = await PIXI.Assets.load('/assets/rocket.jpg');
        const rocket = new PIXI.Sprite(texture);
        rocket.anchor.set(0.5);
        rocket.scale.set(0.15); // Scale down 1024x1024 to game size
        rocket.blendMode = 'screen'; // Make the black background transparent!
        rocket.visible = false;
        graphContainer.addChild(rocket);
        rocketSpriteRef.current = rocket;
      } catch (e) {
        console.error("Failed to load rocket sprite:", e);
      }

      startTimeRef.current = Date.now();
      phaseRef.current = 'WAITING';
      setGamePhase('WAITING');

      let shakeAmount = 0;

      app.ticker.add(() => {
        const now = Date.now();
        const phase = phaseRef.current;
        const elapsedSinceStart = now - startTimeRef.current;

        // Apply Screen Shake
        if (shakeAmount > 0) {
          app.stage.x = (Math.random() - 0.5) * shakeAmount;
          app.stage.y = (Math.random() - 0.5) * shakeAmount;
          shakeAmount *= 0.9;
          if (shakeAmount < 0.5) {
            shakeAmount = 0;
            app.stage.x = 0;
            app.stage.y = 0;
          }
        }

        if (phase === 'WAITING') {
          if (elapsedSinceStart >= 5000) {
            phaseRef.current = 'RUNNING';
            setGamePhase('RUNNING');
            startTimeRef.current = now;
            crashPointRef.current = getCrashPoint(generateServerSeed(), Math.random().toString(36).substring(2, 15));
            ptsRef.current = [];
            multRef.current = 1.0;
            particlesRef.current = [];

            if (betStateRef.current === 'placed') {
              setBetState('active');
            } else {
              setBetState('idle');
            }
          }
        } else if (phase === 'RUNNING') {
          const elapsedSecs = elapsedSinceStart / 1000;
          const newMult = Math.pow(Math.E, 0.06 * elapsedSecs);
          
          if (newMult >= crashPointRef.current) {
            phaseRef.current = 'CRASHED';
            setGamePhase('CRASHED');
            startTimeRef.current = now;
            multRef.current = crashPointRef.current;
            shakeAmount = 30; // Trigger massive screen shake on crash!
            
            if (betStateRef.current === 'active') {
              setBetState('idle');
              addHistoryEntry({
                game: 'crash',
                bet: betAmountRef.current,
                payout: 0,
                profit: -betAmountRef.current,
                multiplier: 0,
                details: { crashPoint: crashPointRef.current }
              });
            }
          } else {
            multRef.current = newMult;
            ptsRef.current.push({ x: elapsedSecs, y: newMult });
            
            if (betStateRef.current === 'active' && newMult >= autoCashoutRef.current) {
              const winAmt = betAmountRef.current * autoCashoutRef.current;
              addToBalance(winAmt);
              setBetState('cashed_out');
              setLastWin(winAmt);
              addHistoryEntry({
                game: 'crash',
                bet: betAmountRef.current,
                payout: winAmt,
                profit: winAmt - betAmountRef.current,
                multiplier: autoCashoutRef.current,
                details: { crashPoint: crashPointRef.current, autoCashout: autoCashoutRef.current }
              });
            }
          }
        } else if (phase === 'CRASHED') {
          if (elapsedSinceStart >= 3000) {
            phaseRef.current = 'WAITING';
            setGamePhase('WAITING');
            startTimeRef.current = now;
            multRef.current = 1.0;
            ptsRef.current = [];
            particlesRef.current = [];
            
            if (betStateRef.current === 'cashed_out') {
              setBetState('idle');
            }
          }
        }

        drawScene();
      });
    };

    const drawScene = () => {
      const app = appRef.current;
      if (!app || !graphicsBaseRef.current) return;

      const gBase = graphicsBaseRef.current;
      const gGlow = graphicsGlowRef.current;
      const gParts = graphicsParticlesRef.current;
      const rocket = rocketSpriteRef.current;

      gBase.clear();
      gGlow.clear();
      gParts.clear();

      const w = app.screen.width;
      const h = app.screen.height;

      const phase = phaseRef.current;
      const isCrashed = phase === 'CRASHED';
      const color = isCrashed ? 0xFF3B30 : 0x00E701;

      if (rocket) {
        if (phase === 'WAITING') {
          rocket.visible = false;
        } else {
          rocket.visible = true;
          // When crashed, fade out the rocket or tint it red
          if (isCrashed) {
             rocket.tint = 0xFF3B30;
             rocket.alpha -= 0.05;
             if (rocket.alpha < 0) rocket.alpha = 0;
          } else {
             rocket.tint = 0xFFFFFF;
             rocket.alpha = 1;
          }
        }
      }

      if (phase === 'WAITING') {
        gBase.moveTo(0, h * 0.9);
        gBase.lineTo(w, h * 0.9);
        gBase.stroke({ width: 4, color: 0x00E701 });
        return;
      }

      const maxTime = Math.max(5, (Date.now() - startTimeRef.current) / 1000 + 1);
      const maxMult = Math.max(2, multRef.current * 1.2);

      const mapX = (t) => (t / maxTime) * w;
      const mapY = (m) => h * 0.9 - ((m - 1) / (maxMult - 1)) * (h * 0.8);

      const pts = ptsRef.current;
      if (pts.length > 0) {
        // Base Line
        gBase.moveTo(mapX(pts[0].x), mapY(pts[0].y));
        for (let i = 1; i < pts.length; i++) {
          gBase.lineTo(mapX(pts[i].x), mapY(pts[i].y));
        }
        gBase.stroke({ width: 6, color });

        // Glow
        gGlow.moveTo(mapX(pts[0].x), mapY(pts[0].y));
        for (let i = 1; i < pts.length; i++) {
          gGlow.lineTo(mapX(pts[i].x), mapY(pts[i].y));
        }
        gGlow.stroke({ width: 16, color, alpha: 0.3 });

        const headX = mapX(pts[pts.length - 1].x);
        const headY = mapY(pts[pts.length - 1].y);

        // Update Rocket Position & Rotation
        if (rocket && pts.length > 1) {
           rocket.x = headX;
           rocket.y = headY;
           
           // Calculate trajectory angle
           const prevX = mapX(pts[pts.length - 2].x);
           const prevY = mapY(pts[pts.length - 2].y);
           // Add a slight offset to rotation since the rocket image points diagonally up-right (approx -45 degrees)
           // We want to align its nose with the velocity vector.
           const angle = Math.atan2(headY - prevY, headX - prevX);
           // If the image is drawn pointing up-right, we offset it so it aligns correctly
           rocket.rotation = angle + Math.PI/4; 
        }

        // Particles (Engine Exhaust)
        if (!isCrashed) {
          if (Math.random() < 0.8) {
            particlesRef.current.push({
              x: headX,
              y: headY,
              vx: -2 - Math.random() * 4,
              vy: (Math.random() - 0.5) * 3 + 1,
              life: 1.0
            });
          }
        }
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        let p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        } else {
          gParts.circle(p.x, p.y, 6 * p.life).fill({ color, alpha: p.life * 0.8 });
        }
      }
    };

    initPixi();

    return () => {
      isDestroyed = true;
      if (appRef.current) {
        if (appRef.current.canvas && appRef.current.canvas.parentNode) {
          appRef.current.canvas.parentNode.removeChild(appRef.current.canvas);
        }
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  const placeBet = () => {
    if (betAmount <= 0) return;
    const newBal = subtractFromBalance(betAmount);
    if (newBal === null) return alert('Insufficient balance');
    setBalanceState(newBal);
    setBetState('placed');
  };

  const manualCashout = () => {
    if (betState !== 'active') return;
    const mult = multRef.current;
    const winAmt = betAmount * mult;
    addToBalance(winAmt);
    setBetState('cashed_out');
    setLastWin(winAmt);
    addHistoryEntry({
      game: 'crash',
      bet: betAmount,
      payout: winAmt,
      profit: winAmt - betAmount,
      multiplier: mult,
      details: { crashPoint: crashPointRef.current, manualCashout: true }
    });
  };

  let buttonLabel = 'Place Bet';
  let buttonAction = placeBet;
  let buttonDisabled = false;
  let buttonColor = 'bg-[#00E701] hover:bg-[#00c701] text-black';

  if (gamePhase === 'WAITING') {
    if (betState === 'placed') {
      buttonLabel = 'Waiting for Next Round...';
      buttonDisabled = true;
      buttonColor = 'bg-[#2A3F4C] text-[#B1BAD3]';
    }
  } else if (gamePhase === 'RUNNING') {
    if (betState === 'active') {
      buttonLabel = `Cash Out ${(betAmount * currentMultUI).toFixed(2)}`;
      buttonAction = manualCashout;
      buttonColor = 'bg-[#00E701] hover:bg-[#00c701] text-black';
    } else {
      buttonLabel = 'Game Running';
      buttonDisabled = true;
      buttonColor = 'bg-[#2A3F4C] text-[#B1BAD3]';
    }
  } else if (gamePhase === 'CRASHED') {
    if (betState === 'placed') {
      buttonLabel = 'Waiting for Next Round...';
      buttonDisabled = true;
      buttonColor = 'bg-[#2A3F4C] text-[#B1BAD3]';
    } else {
      buttonLabel = 'Place Bet (Next Round)';
      buttonAction = placeBet;
    }
  }

  const controls = (
    <div className="flex flex-col gap-4">
      <BetControls 
        betAmount={betAmount} 
        setBetAmount={setBetAmount} 
        disabled={betState === 'placed' || betState === 'active'}
      />
      
      <div className="bg-[#0F212E] rounded-lg border border-white/[0.04]">
        <label className="text-xs text-[#B1BAD3] font-semibold uppercase px-3 pt-2 block">Auto Cashout</label>
        <div className="flex items-center">
          <input
            type="number"
            value={autoCashout}
            onChange={e => setAutoCashout(Math.max(1.01, Number(e.target.value)))}
            className="bg-transparent text-white p-3 w-full font-bold font-display outline-none"
            step="0.01"
            min="1.01"
            disabled={betState === 'placed' || betState === 'active'}
          />
          <div className="px-3 text-[#B1BAD3] font-bold">x</div>
        </div>
      </div>

      <button 
        onClick={buttonAction}
        disabled={buttonDisabled}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${buttonColor} ${buttonDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
      >
        {buttonLabel}
      </button>
    </div>
  );

  return (
    <GameLayout title="Crash" balance={balance} onBack={onBack} controls={controls}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F212E] to-[#1A2C38]/50" />
      <div className="absolute inset-0" ref={canvasRef} />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        {gamePhase === 'WAITING' && (
          <>
            <span className="text-5xl font-display font-black text-white drop-shadow-2xl">
              Preparing...
            </span>
            <span className="text-2xl text-[#B1BAD3] font-bold mt-2">
              Starting in {(remainingTimeUI / 1000).toFixed(1)}s
            </span>
          </>
        )}
        {gamePhase === 'RUNNING' && (
          <span className="text-7xl font-display font-black text-white drop-shadow-2xl">
            {currentMultUI.toFixed(2)}x
          </span>
        )}
        {gamePhase === 'CRASHED' && (
          <>
            <span className="text-7xl font-display font-black text-[#FF3B30] drop-shadow-2xl">
              {currentMultUI.toFixed(2)}x
            </span>
            <span className="text-[#FF3B30] font-bold text-2xl mt-2">Crashed!</span>
          </>
        )}
        {betState === 'cashed_out' && gamePhase === 'RUNNING' && (
          <span className="text-[#00E701] font-bold text-xl mt-4">
            Cashed out! +{lastWin.toFixed(2)}
          </span>
        )}
      </div>
    </GameLayout>
  );
}
