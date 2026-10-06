import React, { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { getBalance, subtractFromBalance, addToBalance, addHistoryEntry } from '../utils/balance';
import { getGameResult } from '../utils/provablyFair';
import { ROULETTE_SEQUENCE, RED_NUMBERS, BLACK_NUMBERS } from '../utils/constants';

const arc = (Math.PI * 2) / 37;

export default function RouletteGame({ onBack }) {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const wheelRef = useRef(null);
  const ballRef = useRef(null);
  const tickerFnRef = useRef(null);

  const [localBalance, setLocalBalance] = useState(getBalance());
  const [betAmount, setBetAmount] = useState(0.1);
  const [bets, setBets] = useState({});
  const [gameState, setGameState] = useState('BETTING'); // BETTING, SPINNING, RESULT
  const [countdown, setCountdown] = useState(15);
  const [result, setResult] = useState(null);
  const [recentResults, setRecentResults] = useState([]);

  const betsRef = useRef(bets);
  useEffect(() => { betsRef.current = bets; }, [bets]);
  
  const localBalanceRef = useRef(localBalance);
  useEffect(() => { localBalanceRef.current = localBalance; }, [localBalance]);

  useEffect(() => {
    let timer;
    if (gameState === 'BETTING') {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        spin();
      }
    } else if (gameState === 'RESULT') {
      timer = setTimeout(() => {
        setBets({});
        setResult(null);
        setCountdown(15);
        setGameState('BETTING');
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [gameState, countdown]);

  useEffect(() => {
    let app;
    const initPixi = async () => {
      app = new PIXI.Application();
      await app.init({ 
        resizeTo: canvasRef.current, 
        backgroundAlpha: 0, 
        antialias: true 
      });
      canvasRef.current.appendChild(app.canvas);
      appRef.current = app;

      const wheelRadius = Math.min(app.screen.width, app.screen.height) * 0.38;
      
      const wheel = new PIXI.Container();
      wheel.x = app.screen.width / 2;
      wheel.y = app.screen.height / 2 - 20; 
      app.stage.addChild(wheel);
      wheelRef.current = wheel;

      // Outer rim
      const rim = new PIXI.Graphics();
      rim.circle(0, 0, wheelRadius + 24);
      rim.fill(0x0F212E);
      rim.stroke({ width: 6, color: 0x2A3F54 });
      wheel.addChild(rim);

      const innerRim = new PIXI.Graphics();
      innerRim.circle(0, 0, wheelRadius + 18);
      innerRim.stroke({ width: 2, color: 0xFFD700, alpha: 0.8 });
      wheel.addChild(innerRim);

      for (let i = 0; i < 37; i++) {
        const num = ROULETTE_SEQUENCE[i];
        const isRed = RED_NUMBERS.has(num);
        const color = num === 0 ? 0x00C001 : isRed ? 0xED4163 : 0x1A2C38;
        
        const slice = new PIXI.Graphics();
        slice.moveTo(0, 0);
        slice.arc(0, 0, wheelRadius, i * arc, (i + 1) * arc);
        slice.fill(color);
        slice.stroke({ width: 1, color: 0xFFFFFF, alpha: 0.15 });
        wheel.addChild(slice);

        const text = new PIXI.Text(num.toString(), {
          fontFamily: 'system-ui',
          fontSize: wheelRadius * 0.12,
          fill: 0xFFFFFF,
          fontWeight: '900'
        });
        text.anchor.set(0.5);
        const textAngle = i * arc + arc / 2;
        text.x = Math.cos(textAngle) * (wheelRadius * 0.82);
        text.y = Math.sin(textAngle) * (wheelRadius * 0.82);
        text.rotation = textAngle + Math.PI / 2;
        wheel.addChild(text);
      }

      // Center dome
      const center = new PIXI.Graphics();
      center.circle(0, 0, wheelRadius * 0.3);
      center.fill(0x213743);
      center.stroke({ width: 3, color: 0xFFD700 });
      wheel.addChild(center);

      // Pointer (at top)
      const pointer = new PIXI.Graphics();
      pointer.poly([-12, 0, 12, 0, 0, 24]);
      pointer.fill(0xFFFFFF);
      pointer.x = app.screen.width / 2;
      pointer.y = app.screen.height / 2 - 20 - wheelRadius - 25;
      app.stage.addChild(pointer);

      // Ball
      const ball = new PIXI.Graphics();
      ball.circle(0, 0, 7);
      ball.fill(0xFFFFFF);
      ball.visible = false;
      wheel.addChild(ball);
      ballRef.current = ball;
    };

    initPixi();

    return () => {
      if (appRef.current) {
        if (tickerFnRef.current) appRef.current.ticker.remove(tickerFnRef.current);
        appRef.current.destroy(true, { children: true });
      }
    };
  }, []);

  const calculatePayouts = (currentBets, winNum) => {
    let payout = 0;
    for (const [key, amount] of Object.entries(currentBets)) {
      const parts = key.split('-');
      const type = parts[0];
      if (type === 'straight') {
        if (parseInt(parts[1]) === winNum) payout += amount * 36;
      } else if (type === 'split' || type === 'corner' || type === 'street' || type === 'line') {
        const nums = parts.slice(1).map(Number);
        if (nums.includes(winNum)) {
          if (type === 'split') payout += amount * 18;
          if (type === 'corner') payout += amount * 9;
          if (type === 'street') payout += amount * 12;
          if (type === 'line') payout += amount * 6;
        }
      } else if (type === 'col') {
        const col = parseInt(parts[1]);
        if (winNum !== 0 && (winNum % 3 === (col % 3))) payout += amount * 3;
      } else if (type === 'dozen') {
        const d = parseInt(parts[1]);
        if (winNum !== 0) {
          if (d === 1 && winNum >= 1 && winNum <= 12) payout += amount * 3;
          if (d === 2 && winNum >= 13 && winNum <= 24) payout += amount * 3;
          if (d === 3 && winNum >= 25 && winNum <= 36) payout += amount * 3;
        }
      } else if (type === 'half') {
        const h = parseInt(parts[1]);
        if (winNum !== 0) {
          if (h === 1 && winNum >= 1 && winNum <= 18) payout += amount * 2;
          if (h === 2 && winNum >= 19 && winNum <= 36) payout += amount * 2;
        }
      } else if (type === 'parity') {
        if (winNum !== 0) {
          if (parts[1] === 'even' && winNum % 2 === 0) payout += amount * 2;
          if (parts[1] === 'odd' && winNum % 2 !== 0) payout += amount * 2;
        }
      } else if (type === 'color') {
        if (parts[1] === 'red' && RED_NUMBERS.has(winNum)) payout += amount * 2;
        if (parts[1] === 'black' && BLACK_NUMBERS.has(winNum)) payout += amount * 2;
      }
    }
    return payout;
  };

  const spin = () => {
    const currentBets = betsRef.current;
    const totalBet = Object.values(currentBets).reduce((a, b) => a + b, 0);
    
    if (totalBet > 0) {
      const newBal = subtractFromBalance(totalBet);
      if (newBal === null) {
        setBets({}); 
      } else {
        setLocalBalance(newBal);
      }
    }
    
    setGameState('SPINNING');
    setResult(null);

    const winNum = Math.floor(getGameResult(0, 37));
    const winIdx = ROULETTE_SEQUENCE.indexOf(winNum);
    const pocketAngle = winIdx * arc + arc / 2;

    const app = appRef.current;
    const wheel = wheelRef.current;
    const ball = ballRef.current;
    
    ball.visible = true;
    
    const startTime = performance.now();
    const spinDuration = 5000;
    
    const initialWheelRot = wheel.rotation % (Math.PI * 2);
    const k_wheel = 4;
    const finalWheelRot = -Math.PI / 2 - pocketAngle + k_wheel * Math.PI * 2;

    const initialWorldBall = -Math.PI / 2 - 8 * Math.PI; 
    const finalWorldBall = -Math.PI / 2;
    
    const wheelRadius = Math.min(app.screen.width, app.screen.height) * 0.38;

    const tick = () => {
      const now = performance.now();
      const t = Math.min((now - startTime) / spinDuration, 1);
      
      // Easing out cubic for both wheel and ball
      const easeT = 1 - Math.pow(1 - t, 3);
      
      wheel.rotation = initialWheelRot + (finalWheelRot - initialWheelRot) * easeT;
      
      const currentWorldBall = initialWorldBall + (finalWorldBall - initialWorldBall) * easeT;
      const ballLocalAngle = currentWorldBall - wheel.rotation;
      
      const R_out = wheelRadius + 15;
      const R_in = wheelRadius * 0.75;
      let currentR = R_out - (R_out - R_in) * easeT;
      
      if (t > 0.6) {
         const bounceT = (t - 0.6) / 0.4;
         const bounceAmt = Math.abs(Math.sin(bounceT * Math.PI * 4)) * 15 * (1 - bounceT);
         currentR -= bounceAmt;
      }
      
      ball.x = Math.cos(ballLocalAngle) * currentR;
      ball.y = Math.sin(ballLocalAngle) * currentR;
      
      if (t >= 1) {
        app.ticker.remove(tick);
        tickerFnRef.current = null;
        
        setGameState('RESULT');
        setResult(winNum);
        setRecentResults(prev => [winNum, ...prev].slice(0, 10));
        
        const payout = calculatePayouts(currentBets, winNum);
        if (payout > 0) {
          const finalBal = addToBalance(payout);
          setLocalBalance(finalBal);
        }
        
        if (totalBet > 0) {
          addHistoryEntry({
            game: 'roulette',
            bet: totalBet,
            payout,
            profit: payout - totalBet,
            result: winNum
          });
        }
      }
    };
    
    if (tickerFnRef.current) app.ticker.remove(tickerFnRef.current);
    tickerFnRef.current = tick;
    app.ticker.add(tick);
  };

  const placeBet = (key) => {
    if (gameState !== 'BETTING') return;
    setBets(prev => ({ ...prev, [key]: (prev[key] || 0) + betAmount }));
  };

  const handleClearBets = () => {
    if (gameState === 'BETTING') setBets({});
  };

  const handleDoubleBets = () => {
    if (gameState !== 'BETTING') return;
    const newBets = { ...bets };
    let totalAdded = 0;
    for (let k in newBets) totalAdded += newBets[k];
    if (totalAdded > localBalance) return;
    for (let k in newBets) newBets[k] *= 2;
    setBets(newBets);
  };

  const renderChip = (key) => {
    const amount = bets[key];
    if (!amount) return null;
    return (
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
      >
        <div className="bg-[#1475E1] rounded-full w-7 h-7 flex items-center justify-center border-2 border-white shadow-[0_2px_10px_rgba(0,0,0,0.5)] text-[9px] font-black text-white leading-none">
          {amount >= 1000 ? (amount/1000).toFixed(1)+'k' : parseFloat(amount.toFixed(2))}
        </div>
      </motion.div>
    );
  };

  const totalBetAmount = Object.values(bets).reduce((a, b) => a + b, 0);

  const controls = (
    <div className="flex flex-col gap-4 h-full">
      
      <div className="bg-[#0F212E] rounded-xl border border-white/5 p-4 shadow-inner">
        <BetControls betAmount={betAmount} setBetAmount={setBetAmount} disabled={gameState !== 'BETTING'} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={handleClearBets}
          disabled={gameState !== 'BETTING' || Object.keys(bets).length === 0}
          className="bg-[#213743] hover:bg-[#2A3F54] py-3.5 rounded-xl font-bold text-sm text-[#B1BAD3] hover:text-white disabled:opacity-50 transition-all shadow-inner"
        >
          Clear
        </button>
        <button 
          onClick={handleDoubleBets}
          disabled={gameState !== 'BETTING' || Object.keys(bets).length === 0}
          className="bg-[#213743] hover:bg-[#2A3F54] py-3.5 rounded-xl font-bold text-sm text-[#B1BAD3] hover:text-white disabled:opacity-50 transition-all shadow-inner"
        >
          Double
        </button>
      </div>
      
      <div className="bg-[#0F212E] rounded-xl border border-white/5 p-4 shadow-inner mt-auto flex items-center justify-between">
        <div className="text-xs text-[#B1BAD3] uppercase font-bold tracking-wider">Total Bet</div>
        <div className="text-lg font-display font-bold text-white">
          {totalBetAmount.toFixed(4)}
        </div>
      </div>
    </div>
  );

  return (
    <GameLayout title="Roulette" balance={localBalance} onBack={onBack} controls={controls}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F212E] to-[#1A2C38] flex flex-col">
        
        {/* Top Header info */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full px-6 flex justify-between items-center pointer-events-none">
          <div className="flex gap-1.5 overflow-hidden w-64 max-w-[40%]">
            <AnimatePresence>
              {recentResults.map((r, i) => {
                const isRed = RED_NUMBERS.has(r);
                return (
                  <motion.div 
                    key={`${i}-${r}`}
                    initial={{ scale: 0, x: -20 }}
                    animate={{ scale: 1, x: 0 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-md border border-white/10 shrink-0 ${r === 0 ? 'bg-[#00E701]' : isRed ? 'bg-[#ED4163]' : 'bg-[#1A2C38]'}`}
                  >
                    {r}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          <div className="flex flex-col items-center pointer-events-auto">
            <div className="text-xs text-[#B1BAD3] uppercase font-bold tracking-widest mb-1">
              {gameState === 'BETTING' ? 'Place Bets' : gameState === 'SPINNING' ? 'Spinning' : 'Result'}
            </div>
            <div className={`text-3xl font-display font-black bg-[#0F212E]/80 px-6 py-2 rounded-full border shadow-xl backdrop-blur-md transition-colors duration-300 ${gameState === 'BETTING' && countdown <= 5 ? 'text-[#ED4163] border-[#ED4163]/30 animate-pulse' : 'text-white border-white/10'}`}>
              {gameState === 'BETTING' ? `00:${countdown.toString().padStart(2, '0')}` : '---'}
            </div>
          </div>
          <div className="w-64 max-w-[40%] hidden sm:block"></div>
        </div>

        {/* Pixi Canvas Container */}
        <div className="flex-1 relative min-h-[300px]" ref={canvasRef}>
          <AnimatePresence>
            {result !== null && gameState === 'RESULT' && (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
              >
                <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] bg-[#0F212E]/90 backdrop-blur-sm
                  ${result === 0 ? 'text-[#00E701] border-[#00E701]' : RED_NUMBERS.has(result) ? 'text-[#ED4163] border-[#ED4163]' : 'text-white border-[#2A3F54]'}`}>
                  <span className="text-6xl font-display font-black drop-shadow-lg">{result}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Betting Table Container */}
        <div className="w-full overflow-x-auto pb-8 pt-4 flex justify-center custom-scrollbar shrink-0 bg-[#0B1720]/50 backdrop-blur-md border-t border-white/5">
          <div className="min-w-max select-none flex flex-col gap-2">
            
            <div className="flex shadow-2xl rounded-lg overflow-hidden border-2 border-white/10">
              {/* Zero */}
              <div 
                className="w-14 h-[168px] border-r border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 relative text-white bg-[#00E701]/10 hover:bg-[#00E701]/20 transition-colors"
                onClick={() => placeBet('straight-0')}
              >
                <span className="font-bold text-2xl -rotate-90 text-[#00E701]">0</span>
                {renderChip('straight-0')}
              </div>

              {/* 1-36 Grid */}
              <div className="flex flex-col">
                {[3, 2, 1].map((rowOffset) => (
                  <div key={rowOffset} className="flex">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const num = i * 3 + rowOffset;
                      const isRed = RED_NUMBERS.has(num);
                      const colorClass = isRed ? 'bg-[#ED4163] hover:bg-[#ff5b7b]' : 'bg-[#1A2C38] hover:bg-[#2A3F54]';
                      
                      return (
                        <div 
                          key={num}
                          className={`w-14 h-14 border-r border-b border-white/10 flex items-center justify-center cursor-pointer relative transition-colors ${colorClass}`}
                          onClick={() => placeBet(`straight-${num}`)}
                        >
                          <span className="font-bold text-lg text-white drop-shadow-md">{num}</span>
                          {renderChip(`straight-${num}`)}
                          
                          {/* Split Targets */}
                          {i === 0 && (
                            <div className="absolute left-[-12px] top-0 bottom-0 w-[24px] z-10 hover:bg-white/30 cursor-pointer flex items-center justify-center" onClick={(e) => { e.stopPropagation(); placeBet(`split-0-${num}`); }}>
                              {renderChip(`split-0-${num}`)}
                            </div>
                          )}
                          {i < 11 && (
                            <div className="absolute right-[-12px] top-0 bottom-0 w-[24px] z-10 hover:bg-white/30 cursor-pointer flex items-center justify-center" onClick={(e) => { e.stopPropagation(); placeBet(`split-${num}-${num+3}`); }}>
                              {renderChip(`split-${num}-${num+3}`)}
                            </div>
                          )}
                          {rowOffset > 1 && (
                            <div className="absolute bottom-[-12px] left-0 right-0 h-[24px] z-10 hover:bg-white/30 cursor-pointer flex items-center justify-center" onClick={(e) => { e.stopPropagation(); placeBet(`split-${num}-${num-1}`); }}>
                              {renderChip(`split-${num}-${num-1}`)}
                            </div>
                          )}
                          {i < 11 && rowOffset > 1 && (
                            <div className="absolute right-[-12px] bottom-[-12px] w-[24px] h-[24px] z-20 hover:bg-white/30 cursor-pointer rounded-full flex items-center justify-center" onClick={(e) => { e.stopPropagation(); placeBet(`corner-${num}-${num-1}-${num+2}-${num+3}`); }}>
                              {renderChip(`corner-${num}-${num-1}-${num+2}-${num+3}`)}
                            </div>
                          )}
                          {rowOffset === 1 && (
                            <div className="absolute bottom-[-12px] left-0 right-0 h-[24px] z-10 hover:bg-white/30 cursor-pointer flex items-center justify-center" onClick={(e) => { e.stopPropagation(); placeBet(`street-${num}-${num+1}-${num+2}`); }}>
                              {renderChip(`street-${num}-${num+1}-${num+2}`)}
                            </div>
                          )}
                          {rowOffset === 1 && i < 11 && (
                            <div className="absolute right-[-12px] bottom-[-12px] w-[24px] h-[24px] z-20 hover:bg-white/30 cursor-pointer rounded-full flex items-center justify-center" onClick={(e) => { e.stopPropagation(); placeBet(`line-${num}-${num+1}-${num+2}-${num+3}-${num+4}-${num+5}`); }}>
                              {renderChip(`line-${num}-${num+1}-${num+2}-${num+3}-${num+4}-${num+5}`)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Columns (2:1) */}
              <div className="flex flex-col border-l-2 border-white/10">
                {[3, 2, 1].map((col) => (
                  <div 
                    key={`col-${col}`}
                    className="w-16 h-14 border-b border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 relative bg-[#213743] transition-colors"
                    onClick={() => placeBet(`col-${col}`)}
                  >
                    <span className="text-xs font-bold text-[#B1BAD3] uppercase">2:1</span>
                    {renderChip(`col-${col}`)}
                  </div>
                ))}
              </div>
            </div>

            {/* Outside Bets */}
            <div className="flex ml-14 gap-1">
              <div className="flex-1 h-12 rounded flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-[#B1BAD3] uppercase bg-[#213743] border border-white/5 transition-colors" onClick={() => placeBet('dozen-1')}>1st 12 {renderChip('dozen-1')}</div>
              <div className="flex-1 h-12 rounded flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-[#B1BAD3] uppercase bg-[#213743] border border-white/5 transition-colors" onClick={() => placeBet('dozen-2')}>2nd 12 {renderChip('dozen-2')}</div>
              <div className="flex-1 h-12 rounded flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-[#B1BAD3] uppercase bg-[#213743] border border-white/5 transition-colors" onClick={() => placeBet('dozen-3')}>3rd 12 {renderChip('dozen-3')}</div>
            </div>
            
            <div className="flex ml-14 gap-1">
              <div className="flex-1 h-12 rounded flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-[#B1BAD3] uppercase bg-[#213743] border border-white/5 transition-colors" onClick={() => placeBet('half-1')}>1 to 18 {renderChip('half-1')}</div>
              <div className="flex-1 h-12 rounded flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-[#B1BAD3] uppercase bg-[#213743] border border-white/5 transition-colors" onClick={() => placeBet('parity-even')}>Even {renderChip('parity-even')}</div>
              <div className="flex-1 h-12 rounded flex justify-center items-center cursor-pointer hover:bg-[#ff5b7b] relative text-sm font-bold text-white uppercase bg-[#ED4163] border border-white/5 transition-colors shadow-inner" onClick={() => placeBet('color-red')}>
                Red {renderChip('color-red')}
              </div>
              <div className="flex-1 h-12 rounded flex justify-center items-center cursor-pointer hover:bg-[#2A3F54] relative text-sm font-bold text-white uppercase bg-[#1A2C38] border border-white/5 transition-colors shadow-inner" onClick={() => placeBet('color-black')}>
                Black {renderChip('color-black')}
              </div>
              <div className="flex-1 h-12 rounded flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-[#B1BAD3] uppercase bg-[#213743] border border-white/5 transition-colors" onClick={() => placeBet('parity-odd')}>Odd {renderChip('parity-odd')}</div>
              <div className="flex-1 h-12 rounded flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-[#B1BAD3] uppercase bg-[#213743] border border-white/5 transition-colors" onClick={() => placeBet('half-2')}>19 to 36 {renderChip('half-2')}</div>
            </div>

          </div>
        </div>

      </div>
    </GameLayout>
  );
}
