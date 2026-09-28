import React, { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
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

  const [localBalance, setLocalBalance] = useState(getBalance());
  const [betAmount, setBetAmount] = useState(0.01);
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
    const initPixi = async () => {
      const app = new PIXI.Application();
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
      wheel.y = app.screen.height / 2 - 20; // Shift up slightly to leave room for table
      app.stage.addChild(wheel);
      wheelRef.current = wheel;

      // Outer rim
      const rim = new PIXI.Graphics();
      rim.beginFill(0x0F212E);
      rim.lineStyle(4, 0xFFD700);
      rim.drawCircle(0, 0, wheelRadius + 20);
      rim.endFill();
      wheel.addChild(rim);

      for (let i = 0; i < 37; i++) {
        const num = ROULETTE_SEQUENCE[i];
        const isRed = RED_NUMBERS.has(num);
        const color = num === 0 ? 0x00E701 : isRed ? 0xED4163 : 0x1A2C38;
        
        const slice = new PIXI.Graphics();
        slice.beginFill(color);
        slice.lineStyle(1, 0xFFFFFF, 0.2);
        slice.moveTo(0, 0);
        slice.arc(0, 0, wheelRadius, i * arc, (i + 1) * arc);
        slice.endFill();
        wheel.addChild(slice);

        const text = new PIXI.Text(num.toString(), {
          fontFamily: 'system-ui',
          fontSize: wheelRadius * 0.1,
          fill: 0xFFFFFF,
          fontWeight: 'bold'
        });
        text.anchor.set(0.5);
        const textAngle = i * arc + arc / 2;
        text.x = Math.cos(textAngle) * (wheelRadius * 0.85);
        text.y = Math.sin(textAngle) * (wheelRadius * 0.85);
        text.rotation = textAngle + Math.PI / 2;
        wheel.addChild(text);
      }

      // Center dome
      const center = new PIXI.Graphics();
      center.beginFill(0x213743);
      center.lineStyle(2, 0xFFD700);
      center.drawCircle(0, 0, wheelRadius * 0.3);
      center.endFill();
      wheel.addChild(center);

      // Pointer (at top)
      const pointer = new PIXI.Graphics();
      pointer.beginFill(0xFFFFFF);
      pointer.drawPolygon([-10, 0, 10, 0, 0, 20]);
      pointer.endFill();
      pointer.x = app.screen.width / 2;
      pointer.y = app.screen.height / 2 - 20 - wheelRadius - 20;
      app.stage.addChild(pointer);

      // Ball
      const ball = new PIXI.Graphics();
      ball.beginFill(0xFFFFFF);
      ball.drawCircle(0, 0, 6);
      ball.endFill();
      ball.visible = false;
      wheel.addChild(ball);
      ballRef.current = ball;
    };

    initPixi();

    return () => {
      if (appRef.current) appRef.current.destroy(true, { children: true });
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
        setBets({}); // Clear bets if somehow insufficient
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
      
      if (t < 1) {
        app.ticker.addOnce(tick);
      } else {
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
            result: winNum
          });
        }
      }
    };
    
    app.ticker.addOnce(tick);
  };

  const placeBet = (key) => {
    if (gameState !== 'BETTING') return;
    setBets(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + betAmount
    }));
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
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
        <div className="bg-[#1475E1] rounded-full w-6 h-6 flex items-center justify-center border-[1.5px] border-white shadow-lg text-[8px] font-bold text-white leading-none">
          {amount >= 1000 ? (amount/1000).toFixed(1)+'k' : amount}
        </div>
      </div>
    );
  };

  const totalBetAmount = Object.values(bets).reduce((a, b) => a + b, 0);

  const controls = (
    <div className="flex flex-col gap-4 h-full">
      <div className="text-center bg-[#0F212E] py-4 rounded-xl border border-white/5 shadow-inner">
        <div className="text-sm text-[#B1BAD3] uppercase font-bold tracking-wider mb-1">
          {gameState === 'BETTING' ? 'Place Your Bets' : gameState === 'SPINNING' ? 'No More Bets' : 'Result'}
        </div>
        <div className={`text-4xl font-display font-bold ${gameState === 'BETTING' && countdown <= 5 ? 'text-[#ED4163]' : 'text-white'}`}>
          {gameState === 'BETTING' ? `00:${countdown.toString().padStart(2, '0')}` : '---'}
        </div>
      </div>

      <BetControls betAmount={betAmount} setBetAmount={setBetAmount} disabled={gameState !== 'BETTING'} />
      
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={handleClearBets}
          disabled={gameState !== 'BETTING' || Object.keys(bets).length === 0}
          className="bg-[#213743] hover:bg-white/10 py-3 rounded-lg font-bold text-sm text-[#B1BAD3] disabled:opacity-50 transition-colors"
        >
          Clear
        </button>
        <button 
          onClick={handleDoubleBets}
          disabled={gameState !== 'BETTING' || Object.keys(bets).length === 0}
          className="bg-[#213743] hover:bg-white/10 py-3 rounded-lg font-bold text-sm text-[#B1BAD3] disabled:opacity-50 transition-colors"
        >
          Double
        </button>
      </div>

      <div className="mt-2 p-3 bg-[#0F212E] rounded-lg border border-white/5">
        <div className="text-xs text-[#B1BAD3] uppercase font-bold mb-1">Total Bet</div>
        <div className="text-lg font-display font-bold text-white">
          {totalBetAmount.toFixed(4)}
        </div>
      </div>
    </div>
  );

  return (
    <GameLayout title="Roulette" balance={localBalance} onBack={onBack} controls={controls}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F212E] to-[#1A2C38]/50 flex flex-col">
        {/* Pixi Canvas Container */}
        <div className="flex-1 relative min-h-[300px]" ref={canvasRef}>
          {recentResults.length > 0 && (
            <div className="absolute top-4 left-4 flex gap-1 z-10">
              {recentResults.map((r, i) => {
                const isRed = RED_NUMBERS.has(r);
                return (
                  <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white ${r === 0 ? 'bg-[#00E701]' : isRed ? 'bg-[#ED4163]' : 'bg-[#1A2C38]'}`}>
                    {r}
                  </div>
                );
              })}
            </div>
          )}
          
          {result !== null && gameState === 'RESULT' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <span className={`text-6xl font-display font-black drop-shadow-2xl ${result === 0 ? 'text-[#00E701]' : RED_NUMBERS.has(result) ? 'text-[#ED4163]' : 'text-white'}`}>
                {result}
              </span>
            </div>
          )}
        </div>

        {/* Betting Table Container */}
        <div className="w-full overflow-x-auto pb-6 pt-2 flex justify-center custom-scrollbar shrink-0">
          <div className="min-w-max select-none flex flex-col gap-2">
            
            <div className="flex">
              {/* Zero */}
              <div 
                className="w-12 h-[144px] border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/10 relative text-white"
                onClick={() => placeBet('straight-0')}
              >
                <span className="font-bold text-xl -rotate-90">0</span>
                {renderChip('straight-0')}
                
                {/* 0 Splits (Right edge of 0, left edge of 1,2,3 is handled by the numbers instead of 0 for simplicity, wait no, let's put them on the numbers) */}
              </div>

              {/* 1-36 Grid */}
              <div className="flex flex-col">
                {[3, 2, 1].map((rowOffset) => (
                  <div key={rowOffset} className="flex">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const num = i * 3 + rowOffset;
                      const isRed = RED_NUMBERS.has(num);
                      const colorClass = isRed ? 'bg-[#ED4163]/20 text-[#ED4163]' : 'bg-gray-800 text-white';
                      
                      return (
                        <div 
                          key={num}
                          className={`w-12 h-12 border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/10 relative ${colorClass}`}
                          onClick={() => placeBet(`straight-${num}`)}
                        >
                          <span className="font-bold">{num}</span>
                          {renderChip(`straight-${num}`)}
                          
                          {/* Split Targets */}
                          {/* Split with 0 */}
                          {i === 0 && (
                            <div 
                              className="absolute left-[-10px] top-0 bottom-0 w-[20px] z-10 hover:bg-white/30 cursor-pointer flex items-center justify-center"
                              onClick={(e) => { e.stopPropagation(); placeBet(`split-0-${num}`); }}
                            >
                              {renderChip(`split-0-${num}`)}
                            </div>
                          )}

                          {/* Horizontal split */}
                          {i < 11 && (
                            <div 
                              className="absolute right-[-10px] top-0 bottom-0 w-[20px] z-10 hover:bg-white/30 cursor-pointer flex items-center justify-center"
                              onClick={(e) => { e.stopPropagation(); placeBet(`split-${num}-${num+3}`); }}
                            >
                              {renderChip(`split-${num}-${num+3}`)}
                            </div>
                          )}

                          {/* Vertical split */}
                          {rowOffset > 1 && (
                            <div 
                              className="absolute bottom-[-10px] left-0 right-0 h-[20px] z-10 hover:bg-white/30 cursor-pointer flex items-center justify-center"
                              onClick={(e) => { e.stopPropagation(); placeBet(`split-${num}-${num-1}`); }}
                            >
                              {renderChip(`split-${num}-${num-1}`)}
                            </div>
                          )}

                          {/* Corner split */}
                          {i < 11 && rowOffset > 1 && (
                            <div 
                              className="absolute right-[-10px] bottom-[-10px] w-[20px] h-[20px] z-20 hover:bg-white/30 cursor-pointer rounded-full flex items-center justify-center"
                              onClick={(e) => { e.stopPropagation(); placeBet(`corner-${num}-${num-1}-${num+2}-${num+3}`); }}
                            >
                              {renderChip(`corner-${num}-${num-1}-${num+2}-${num+3}`)}
                            </div>
                          )}

                          {/* Street (bottom edge of bottom row) */}
                          {rowOffset === 1 && (
                            <div 
                              className="absolute bottom-[-10px] left-0 right-0 h-[20px] z-10 hover:bg-white/30 cursor-pointer flex items-center justify-center"
                              onClick={(e) => { e.stopPropagation(); placeBet(`street-${num}-${num+1}-${num+2}`); }}
                            >
                              {renderChip(`street-${num}-${num+1}-${num+2}`)}
                            </div>
                          )}

                          {/* Line (double street, bottom corner of bottom row) */}
                          {rowOffset === 1 && i < 11 && (
                            <div 
                              className="absolute right-[-10px] bottom-[-10px] w-[20px] h-[20px] z-20 hover:bg-white/30 cursor-pointer rounded-full flex items-center justify-center"
                              onClick={(e) => { e.stopPropagation(); placeBet(`line-${num}-${num+1}-${num+2}-${num+3}-${num+4}-${num+5}`); }}
                            >
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
              <div className="flex flex-col">
                {[3, 2, 1].map((col) => (
                  <div 
                    key={`col-${col}`}
                    className="w-12 h-12 border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/10 relative bg-[#1A2C38]"
                    onClick={() => placeBet(`col-${col}`)}
                  >
                    <span className="text-[10px] font-bold text-[#B1BAD3] rotate-90">2:1</span>
                    {renderChip(`col-${col}`)}
                  </div>
                ))}
              </div>
            </div>

            {/* Outside Bets */}
            <div className="flex ml-12">
              <div className="w-[192px] h-12 border border-white/20 flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-white bg-[#1A2C38]" onClick={() => placeBet('dozen-1')}>1st 12 {renderChip('dozen-1')}</div>
              <div className="w-[192px] h-12 border border-white/20 flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-white bg-[#1A2C38]" onClick={() => placeBet('dozen-2')}>2nd 12 {renderChip('dozen-2')}</div>
              <div className="w-[192px] h-12 border border-white/20 flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-white bg-[#1A2C38]" onClick={() => placeBet('dozen-3')}>3rd 12 {renderChip('dozen-3')}</div>
            </div>
            
            <div className="flex ml-12">
              <div className="w-24 h-12 border border-white/20 flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-white bg-[#1A2C38]" onClick={() => placeBet('half-1')}>1 to 18 {renderChip('half-1')}</div>
              <div className="w-24 h-12 border border-white/20 flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-white bg-[#1A2C38]" onClick={() => placeBet('parity-even')}>EVEN {renderChip('parity-even')}</div>
              <div className="w-24 h-12 border border-white/20 flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-[#ED4163] bg-[#ED4163]/10" onClick={() => placeBet('color-red')}>
                <div className="w-4 h-4 bg-[#ED4163] rotate-45 mr-2"></div>
                RED {renderChip('color-red')}
              </div>
              <div className="w-24 h-12 border border-white/20 flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-white bg-gray-800" onClick={() => placeBet('color-black')}>
                <div className="w-4 h-4 bg-black rotate-45 mr-2 border border-white/20"></div>
                BLACK {renderChip('color-black')}
              </div>
              <div className="w-24 h-12 border border-white/20 flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-white bg-[#1A2C38]" onClick={() => placeBet('parity-odd')}>ODD {renderChip('parity-odd')}</div>
              <div className="w-24 h-12 border border-white/20 flex justify-center items-center cursor-pointer hover:bg-white/10 relative text-sm font-bold text-white bg-[#1A2C38]" onClick={() => placeBet('half-2')}>19 to 36 {renderChip('half-2')}</div>
            </div>

          </div>
        </div>

      </div>
    </GameLayout>
  );
}
