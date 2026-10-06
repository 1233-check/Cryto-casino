import React, { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { SLOT_SYMBOLS, SLOT_PAYOUTS } from '../utils/constants';
import { playSound } from '../utils/audio';
import { getBalance, subtractFromBalance, addToBalance, addHistoryEntry } from '../utils/balance';

const PAYLINES = [
  [1, 1, 1, 1, 1], // 1: Middle
  [0, 0, 0, 0, 0], // 2: Top
  [2, 2, 2, 2, 2], // 3: Bottom
  [0, 1, 2, 1, 0], // 4: V
  [2, 1, 0, 1, 2], // 5: Inverted V
  [0, 0, 1, 2, 2], // 6: Top to bottom
  [2, 2, 1, 0, 0], // 7: Bottom to top
  [1, 2, 2, 2, 1], // 8: U-shape bottom
  [1, 0, 0, 0, 1], // 9: U-shape top
  [0, 1, 1, 1, 0], // 10: Top flat U
  [2, 1, 1, 1, 2], // 11: Bottom flat U
  [0, 1, 0, 1, 0], // 12: Zigzag top
  [2, 1, 2, 1, 2], // 13: Zigzag bottom
  [1, 0, 1, 0, 1], // 14: Zigzag middle-top
  [1, 2, 1, 2, 1], // 15: Zigzag middle-bottom
  [0, 2, 0, 2, 0], // 16: Deep zigzag top
  [2, 0, 2, 0, 2], // 17: Deep zigzag bottom
  [0, 0, 2, 0, 0], // 18:
  [2, 2, 0, 2, 2], // 19:
  [1, 1, 0, 1, 1], // 20:
];

const SYMBOL_SIZE = 120;
const REEL_WIDTH = 140;
const REELS_COUNT = 5;
const ROWS_COUNT = 3;
const SYMBOLS_PER_REEL = 6; // 3 visible + 3 hidden buffer

export default function SlotsGame({ onBack }) {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const reelsRef = useRef([]);
  const linesContainerRef = useRef(null);
  
  const [balance, setBalanceState] = useState(getBalance());
  const [betAmount, setBetAmount] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastWin, setLastWin] = useState(0);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  const onReelsStoppedRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => setBalanceState(getBalance());
    window.addEventListener('balance-update', handleUpdate);
    return () => window.removeEventListener('balance-update', handleUpdate);
  }, []);

  const getRandomSymbol = () => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];

  // BackOut easing function for stop animation
  const backOut = (t) => {
    const s = 1.70158;
    return --t * t * ((s + 1) * t + s) + 1;
  };

  useEffect(() => {
    let app;
    let isDestroyed = false;

    const initPixi = async () => {
      app = new PIXI.Application();
      await app.init({
        resizeTo: canvasRef.current,
        backgroundAlpha: 0,
        antialias: true,
      });
      if (isDestroyed) {
        app.destroy(true);
        return;
      }
      canvasRef.current.appendChild(app.canvas);
      appRef.current = app;

      const mainContainer = new PIXI.Container();
      const gameWidth = REEL_WIDTH * REELS_COUNT;
      const gameHeight = SYMBOL_SIZE * ROWS_COUNT;
      
      mainContainer.x = (app.screen.width - gameWidth) / 2;
      mainContainer.y = (app.screen.height - gameHeight) / 2;
      app.stage.addChild(mainContainer);

      // Metallic Bezel Background
      const bezelOuter = new PIXI.Graphics();
      bezelOuter.roundRect(-20, -20, gameWidth + 40, gameHeight + 40, 24);
      const bezelOuterGradient = new PIXI.FillGradient(0, -20, 0, gameHeight + 40);
      bezelOuterGradient.addColorStop(0, 0x555555);
      bezelOuterGradient.addColorStop(0.5, 0x888888);
      bezelOuterGradient.addColorStop(1, 0x333333);
      bezelOuter.fill(bezelOuterGradient);
      bezelOuter.stroke({ color: 0x222222, width: 4 });
      mainContainer.addChild(bezelOuter);
      
      const bezelInner = new PIXI.Graphics();
      bezelInner.roundRect(-10, -10, gameWidth + 20, gameHeight + 20, 16);
      bezelInner.fill(0x000000);
      bezelInner.stroke({ color: 0xFFD700, width: 4, alpha: 0.8 }); // Gold inner trim
      mainContainer.addChild(bezelInner);

      // Background
      const bg = new PIXI.Graphics();
      bg.roundRect(0, 0, gameWidth, gameHeight, 16);
      bg.fill({ color: 0x1A2C38 });
      mainContainer.addChild(bg);

      // Mask
      const mask = new PIXI.Graphics();
      mask.roundRect(0, 0, gameWidth, gameHeight, 16);
      mask.fill(0xffffff);
      mainContainer.addChild(mask);
      mainContainer.mask = mask;

      const linesContainer = new PIXI.Container();
      linesContainerRef.current = linesContainer;

      const style = new PIXI.TextStyle({
        fontFamily: 'system-ui',
        fontSize: Math.round(SYMBOL_SIZE * 0.65),
        align: 'center',
        dropShadow: true,
        dropShadowAlpha: 0.5,
        dropShadowBlur: 4,
        dropShadowDistance: 4,
        dropShadowColor: 0x000000
      });

      const reels = [];
      for (let i = 0; i < REELS_COUNT; i++) {
        const rc = new PIXI.Container();
        rc.x = i * REEL_WIDTH;
        mainContainer.addChild(rc);
        
        // Reel dividers
        if (i > 0) {
           const divider = new PIXI.Graphics();
           divider.moveTo(0, 0);
           divider.lineTo(0, gameHeight);
           divider.stroke({ width: 2, color: 0xFFFFFF, alpha: 0.1 });
           rc.addChild(divider);
        }

        const blur = new PIXI.BlurFilter();
        blur.blurX = 0;
        blur.blurY = 0;
        rc.filters = [blur];

        const symbols = [];
        for (let j = 0; j < SYMBOLS_PER_REEL; j++) {
          const text = getRandomSymbol();
          const sym = new PIXI.Text({ text, style });
          sym.y = (j - 1) * SYMBOL_SIZE; // Start from -1 to 4
          sym.x = (REEL_WIDTH - sym.width) / 2;
          symbols.push(sym);
          rc.addChild(sym);
        }

        reels.push({
          container: rc,
          symbols,
          blur,
          phase: 'idle', // idle, spinning, stopping
          position: 0,
          speed: 0,
          stopTime: 0,
          targetSymbols: [], // 3 final symbols
          stopStartY: 0,
          stopTimer: 0,
          isTeaser: false
        });
      }
      reelsRef.current = reels;
      mainContainer.addChild(linesContainer);

      // ... ticker code ...
      app.ticker.add((ticker) => {
        const delta = ticker.deltaTime;
        const elapsedMS = ticker.elapsedMS;
        
        mainContainer.x = (app.screen.width - gameWidth) / 2;
        mainContainer.y = (app.screen.height - gameHeight) / 2;

        let allStopped = true;

        for (let i = 0; i < reels.length; i++) {
          const r = reels[i];
          
          if (r.phase === 'idle') continue;
          allStopped = false;

          if (r.phase === 'spinning') {
            const targetSpeed = r.isTeaser ? 15 : 40; // Teaser rolls much slower
            if (r.speed < targetSpeed) r.speed = Math.min(r.speed + 2 * delta, targetSpeed);
            if (r.speed > targetSpeed) r.speed = Math.max(r.speed - 1 * delta, targetSpeed);
            
            r.blur.blurY = r.speed * 0.5;

            // Move symbols
            for (let j = 0; j < r.symbols.length; j++) {
              const sym = r.symbols[j];
              sym.y += r.speed * delta;
              
              // Wrap around
              if (sym.y > SYMBOL_SIZE * (SYMBOLS_PER_REEL - 1)) {
                sym.y -= SYMBOL_SIZE * SYMBOLS_PER_REEL;
                sym.text = getRandomSymbol();
                sym.x = (REEL_WIDTH - sym.width) / 2;
              }
            }

            if (Date.now() >= r.stopTime) {
              r.phase = 'stopping';
              r.stopTimer = 0;
              r.blur.blurY = 0;
              
              const stopDistance = SYMBOL_SIZE * 3;
              
              for (let j = 0; j < SYMBOLS_PER_REEL; j++) {
                 const sym = r.symbols[j];
                 if (j < 3) {
                     sym.text = r.targetSymbols[j];
                     sym.y = (j * SYMBOL_SIZE) - stopDistance;
                 } else {
                     sym.text = getRandomSymbol();
                     sym.y = (j * SYMBOL_SIZE) - stopDistance;
                 }
                 sym.x = (REEL_WIDTH - sym.width) / 2;
              }
            }
          } else if (r.phase === 'stopping') {
            r.stopTimer += elapsedMS;
            const duration = 500; // 500ms stop animation
            let t = r.stopTimer / duration;
            if (t >= 1) {
              t = 1;
              r.phase = 'idle';
            }
            
            const ease = backOut(t);
            const stopDistance = SYMBOL_SIZE * 3;
            
            for (let j = 0; j < SYMBOLS_PER_REEL; j++) {
                const sym = r.symbols[j];
                sym.y = (j * SYMBOL_SIZE) - stopDistance + (stopDistance * ease);
            }
          }
        }
        
        if (allStopped && isPlayingRef.current) {
          if (onReelsStoppedRef.current) {
            const cb = onReelsStoppedRef.current;
            onReelsStoppedRef.current = null;
            cb();
          }
        }
      });
    };

    initPixi();
    return () => {
      isDestroyed = true;
      onReelsStoppedRef.current = null;
      if (appRef.current) appRef.current.destroy(true, { children: true });
    };
  }, []); // Run once

  const spin = () => {
    if (isPlaying || betAmount <= 0) return;
    const newBal = subtractFromBalance(betAmount);
    if (newBal === null) return alert('Insufficient balance');
    setBalanceState(newBal);
    
    playSound('bet');
    setIsPlaying(true);
    setLastWin(0);

    if (linesContainerRef.current) {
      while (linesContainerRef.current.children.length > 0) {
        const child = linesContainerRef.current.children[0];
        linesContainerRef.current.removeChild(child);
        if (child.destroy) child.destroy({ children: true });
      }
    }

    const reels = reelsRef.current;
    const finalResult = [];
    
    const now = Date.now();
    for (let i = 0; i < REELS_COUNT; i++) {
        const col = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
        finalResult.push(col);
        
        reels[i].phase = 'spinning';
        reels[i].speed = 0;
        
        // Add dramatic teasers for the 4th and 5th reels!
        if (i >= 3) {
           reels[i].stopTime = now + 1000 + (3 * 300) + ((i - 3) * 1500); // 1.5 second extra delay per final reel
           reels[i].isTeaser = true;
        } else {
           reels[i].stopTime = now + 1000 + (i * 300); 
           reels[i].isTeaser = false;
        }
        
        reels[i].targetSymbols = col;
    }

    // Set callback for when all stop
    onReelsStoppedRef.current = () => {
       evaluateWins(finalResult);
    };
  };

  const evaluateWins = (result) => {
    let totalWin = 0;
    const winningLines = [];
    const lineBet = betAmount / 20;

    // result[col][row]
    for (let i = 0; i < PAYLINES.length; i++) {
      const line = PAYLINES[i];
      const lineSymbols = line.map((row, col) => result[col][row]);
      
      const firstSymbol = lineSymbols[0];
      let matchCount = 1;
      
      for (let k = 1; k < 5; k++) {
        if (lineSymbols[k] === firstSymbol) {
          matchCount++;
        } else {
          break;
        }
      }

      if (matchCount >= 3) {
        const multiplier = SLOT_PAYOUTS[firstSymbol]?.[matchCount] || 0;
        if (multiplier > 0) {
          const winAmount = lineBet * multiplier;
          totalWin += winAmount;
          winningLines.push({ lineIndex: i, count: matchCount, amount: winAmount });
        }
      }
    }

    totalWin = parseFloat(totalWin.toFixed(8));
    const profit = parseFloat((totalWin - betAmount).toFixed(8));

    if (totalWin > 0) {
      playSound('win');
      setLastWin(totalWin);
      addToBalance(totalWin);
      drawWinningLines(winningLines);
    }
    
    addHistoryEntry({
      game: 'slots',
      bet: betAmount,
      payout: totalWin,
      profit,
      multiplier: betAmount > 0 ? parseFloat((totalWin / betAmount).toFixed(2)) : 0,
      details: { winningLinesCount: winningLines.length }
    });

    setIsPlaying(false);
  };

  const drawWinningLines = (wins) => {
    if (!linesContainerRef.current) return;
    while (linesContainerRef.current.children.length > 0) {
      const child = linesContainerRef.current.children[0];
      linesContainerRef.current.removeChild(child);
      if (child.destroy) {
        child.destroy({ children: true });
      }
    }

    const graphics = new PIXI.Graphics();
    linesContainerRef.current.addChild(graphics);

    wins.forEach(win => {
       const line = PAYLINES[win.lineIndex];
       
       // Draw highlight box behind symbols
       for (let col = 0; col < win.count; col++) {
          const row = line[col];
          graphics.rect(col * REEL_WIDTH, row * SYMBOL_SIZE, REEL_WIDTH, SYMBOL_SIZE);
       }
       graphics.fill({ color: 0x00E701, alpha: 0.2 });

       // Draw line connecting symbols
       for (let col = 0; col < win.count; col++) {
          const row = line[col];
          const x = col * REEL_WIDTH + (REEL_WIDTH / 2);
          const y = row * SYMBOL_SIZE + (SYMBOL_SIZE / 2);
          
          if (col === 0) {
             graphics.moveTo(x, y);
          } else {
             graphics.lineTo(x, y);
          }
       }
       graphics.stroke({ width: 6, color: 0x00E701, alpha: 0.8 });
    });
  };

  const controls = (
    <>
      <BetControls 
        betAmount={betAmount} 
        setBetAmount={setBetAmount} 
        disabled={isPlaying} 
      />
      <button 
        onClick={spin}
        disabled={isPlaying}
        className={`w-full py-4 mt-auto rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(0,231,1,0.2)] ${
          isPlaying ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-[#00E701] text-black hover:bg-[#00E701]/90 hover:-translate-y-1'
        }`}
      >
        {isPlaying ? 'Spinning...' : 'SPIN'}
      </button>
    </>
  );

  return (
    <GameLayout title="Slots" balance={balance} onBack={onBack} controls={controls}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F212E] to-[#1A2C38]/50" />
      <div className="absolute inset-0" ref={canvasRef} />
      
      {lastWin > 0 && !isPlaying && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-[#00E701]/20 border border-[#00E701] text-[#00E701] px-8 py-3 rounded-2xl backdrop-blur-sm animate-bounce shadow-[0_0_30px_rgba(0,231,1,0.3)] z-10">
          <span className="font-display font-black text-3xl">+{lastWin.toFixed(2)}</span>
        </div>
      )}
    </GameLayout>
  );
}
