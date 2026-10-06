import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { PLINKO_MULTIPLIERS } from '../utils/constants';
import { getBalance, subtractFromBalance, addToBalance, addHistoryEntry } from '../utils/balance';
import { getProvablyFairFloats, generateServerSeed } from '../utils/provablyFair';

export default function PlinkoGame({ onBack }) {
  const [betAmount, setBetAmount] = useState(1);
  const [rows, setRows] = useState(12);
  const [risk, setRisk] = useState('medium');
  const [balance, setBalanceState] = useState(getBalance());
  
  const canvasRef = useRef(null);
  const ballsRef = useRef([]);
  const floatingTextsRef = useRef([]);
  const dropNonceRef = useRef(0);
  
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 600;

  const updateBalance = (newBal) => {
    setBalanceState(newBal);
  };
  
  const handleBet = () => {
    const currentBal = getBalance();
    if (currentBal < betAmount) return;
    
    subtractFromBalance(betAmount);
    updateBalance(getBalance());
    
    dropNonceRef.current += 1;
    const floats = getProvablyFairFloats(generateServerSeed(), 'plinko', dropNonceRef.current, rows);
    const path = floats.map(f => f > 0.5 ? 1 : 0);
    
    const j = path.reduce((a, b) => a + b, 0);
    const payoutMultiplier = PLINKO_MULTIPLIERS[rows][risk][j];
    const payout = betAmount * payoutMultiplier;
    
    ballsRef.current.push({
      id: Date.now() + Math.random(),
      progress: -0.5,
      path,
      bet: betAmount,
      payout,
      j,
      rowsAtCreation: rows,
      riskAtCreation: risk
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let lastTime = performance.now();
    
    // Store shockwaves: { x, y, radius, maxRadius, alpha }
    const shockwaves = [];
    // Store ball trails: { x, y, life, color }
    const trails = [];

    const render = (time) => {
      const dt = time - lastTime;
      lastTime = time;
      
      const speed = 0.005 * dt; // Dropping speed
      
      for (let i = ballsRef.current.length - 1; i >= 0; i--) {
        const ball = ballsRef.current[i];
        
        const prevRow = Math.floor(ball.progress);
        ball.progress += speed;
        const currentRow = Math.floor(ball.progress);
        
        // Trigger shockwave on peg hit
        if (currentRow > prevRow && currentRow >= 0 && currentRow < ball.rowsAtCreation) {
           const b_rowSpacing = 420 / ball.rowsAtCreation;
           const b_H_SPACING = 550 / ball.rowsAtCreation;
           
           let j = 0;
           for (let idx = 0; idx < currentRow; idx++) j += ball.path[idx];
           
           const px = GAME_WIDTH/2 - (currentRow * b_H_SPACING / 2) + j * b_H_SPACING;
           const py = 80 + currentRow * b_rowSpacing;
           
           shockwaves.push({ x: px, y: py, radius: 4, maxRadius: 20, alpha: 0.8 });
        }
        
        if (ball.progress >= ball.rowsAtCreation) {
          addToBalance(ball.payout);
          updateBalance(getBalance());
          
          addHistoryEntry({
            game: 'Plinko',
            bet: ball.bet,
            payout: ball.payout,
            multiplier: (ball.payout / ball.bet).toFixed(2)
          });
          
          floatingTextsRef.current.push({
            text: `+${ball.payout.toFixed(4)}`,
            j: ball.j,
            rows: ball.rowsAtCreation,
            life: 1.0,
            yOffset: 0
          });
          
          ballsRef.current.splice(i, 1);
        }
      }
      
      // Update shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
         const sw = shockwaves[i];
         sw.radius += dt * 0.05;
         sw.alpha -= dt * 0.002;
         if (sw.alpha <= 0) shockwaves.splice(i, 1);
      }
      
      // Update trails
      for (let i = trails.length - 1; i >= 0; i--) {
         trails[i].life -= dt * 0.002;
         if (trails[i].life <= 0) trails.splice(i, 1);
      }
      
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.life -= dt / 1000;
        ft.yOffset -= dt * 0.05;
        if (ft.life <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      const TopY = 80;
      const rowSpacing = 420 / rows;
      const H_SPACING = 550 / rows;
      
      // Draw pegs with neon glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00E701';
      ctx.fillStyle = '#FFFFFF';
      for (let r = 0; r < rows; r++) {
        for (let j = 0; j <= r; j++) {
          const x = GAME_WIDTH/2 - (r * H_SPACING / 2) + j * H_SPACING;
          const y = TopY + r * rowSpacing;
          ctx.beginPath();
          ctx.arc(x, y, Math.max(3, 5 - rows/4), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0; // Reset shadow
      
      // Draw shockwaves
      for (const sw of shockwaves) {
         ctx.beginPath();
         ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
         ctx.strokeStyle = `rgba(0, 231, 1, ${Math.max(0, sw.alpha)})`;
         ctx.lineWidth = 2;
         ctx.stroke();
      }
      
      // Draw buckets
      const multipliers = PLINKO_MULTIPLIERS[rows][risk];
      const bucketWidth = H_SPACING * 0.9;
      const bucketHeight = 26;
      const bucketY = TopY + rows * rowSpacing;
      
      for (let j = 0; j <= rows; j++) {
        const x = GAME_WIDTH/2 - (rows * H_SPACING / 2) + j * H_SPACING;
        
        const center = rows / 2;
        const dist = Math.abs(j - center) / center; 
        const r_c = Math.round(0 + dist * (237 - 0));
        const g_c = Math.round(231 + dist * (65 - 231));
        const b_c = Math.round(1 + dist * (99 - 1));
        
        ctx.fillStyle = `rgb(${r_c}, ${g_c}, ${b_c})`;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x - bucketWidth/2, bucketY, bucketWidth, bucketHeight, 4);
          ctx.fill();
        } else {
          ctx.fillRect(x - bucketWidth/2, bucketY, bucketWidth, bucketHeight);
        }
        
        ctx.fillStyle = '#0F212E';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`${multipliers[j]}x`, x, bucketY + bucketHeight/2);
      }
      
      // Draw trails
      for (const t of trails) {
         ctx.beginPath();
         ctx.arc(t.x, t.y, 4 * t.life, 0, Math.PI * 2);
         ctx.fillStyle = `rgba(255, 215, 0, ${t.life * 0.5})`;
         ctx.fill();
      }
      
      // Draw balls
      for (const ball of ballsRef.current) {
        const b_rowSpacing = 420 / ball.rowsAtCreation;
        const b_H_SPACING = 550 / ball.rowsAtCreation;
        
        let bx, by;
        if (ball.progress < 0) {
          const t = 1 + ball.progress;
          bx = GAME_WIDTH / 2;
          by = TopY - b_rowSpacing + t * b_rowSpacing;
        } else {
          const r = Math.min(Math.floor(ball.progress), ball.rowsAtCreation - 1);
          const t = ball.progress - r;
          
          let j = 0;
          for (let i = 0; i < r; i++) {
            j += ball.path[i];
          }
          
          const x0 = GAME_WIDTH/2 - (r * b_H_SPACING / 2) + j * b_H_SPACING;
          const y0 = TopY + r * b_rowSpacing;
          
          const next_j = j + ball.path[r];
          const x1 = GAME_WIDTH/2 - ((r+1) * b_H_SPACING / 2) + next_j * b_H_SPACING;
          const y1 = TopY + (r+1) * b_rowSpacing;
          
          const bounceHeight = b_rowSpacing * 0.5;
          const arcY = Math.sin(t * Math.PI) * bounceHeight;
          
          bx = x0 + t * (x1 - x0);
          by = y0 + t * (y1 - y0) - arcY;
        }
        
        // Add to trails
        if (Math.random() < 0.5) {
           trails.push({ x: bx, y: by, life: 1.0 });
        }
        
        // Photorealistic Gold Metallic 3D Shader (Canvas Radial Gradient)
        const radius = 9;
        const gradient = ctx.createRadialGradient(bx - radius*0.3, by - radius*0.3, radius*0.1, bx, by, radius);
        gradient.addColorStop(0, '#FFFFFF'); // Specular pure white highlight
        gradient.addColorStop(0.3, '#FFD700'); // Bright gold
        gradient.addColorStop(0.7, '#DAA520'); // Mid gold
        gradient.addColorStop(0.9, '#8B6508'); // Dark rim shadow
        gradient.addColorStop(1, '#3B2F00'); // Ambient occlusion rim
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.4)'; // Gold glow
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bx, by, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      // Draw floating texts
      for (const ft of floatingTextsRef.current) {
        const b_H_SPACING = 550 / ft.rows;
        const fx = GAME_WIDTH/2 - (ft.rows * b_H_SPACING / 2) + ft.j * b_H_SPACING;
        const fy = TopY + ft.rows * (420 / ft.rows) + ft.yOffset - 10;
        
        ctx.fillStyle = `rgba(0, 231, 1, ${Math.max(0, ft.life)})`;
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(ft.text, fx, fy);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [rows, risk]); 

  const controls = (
    <div className="flex flex-col gap-4">
      <BetControls 
        betAmount={betAmount} 
        setBetAmount={setBetAmount} 
        maxBet={balance} 
      />
      
      <div className="bg-[#0F212E] p-3 rounded-lg border border-white/[0.04]">
        <label className="text-xs text-[#B1BAD3] font-semibold uppercase block mb-2">Risk</label>
        <div className="flex gap-2">
          {['low', 'medium', 'high'].map(r => (
            <button
              key={r}
              onClick={() => setRisk(r)}
              className={`flex-1 py-2 rounded font-bold text-sm capitalize transition-colors ${
                risk === r 
                  ? 'bg-[#1A2C38] text-white' 
                  : 'text-[#B1BAD3] hover:bg-[#1A2C38]/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0F212E] p-3 rounded-lg border border-white/[0.04]">
        <label className="text-xs text-[#B1BAD3] font-semibold uppercase block mb-2">Rows</label>
        <div className="flex gap-2">
          {[8, 12, 16].map(r => (
            <button
              key={r}
              onClick={() => setRows(r)}
              className={`flex-1 py-2 rounded font-bold text-sm transition-colors ${
                rows === r 
                  ? 'bg-[#1A2C38] text-white' 
                  : 'text-[#B1BAD3] hover:bg-[#1A2C38]/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleBet}
        disabled={balance < betAmount}
        className="w-full bg-[#00E701] hover:bg-[#00c701] text-black font-bold py-4 rounded-lg uppercase tracking-wide transition-colors mt-2 disabled:opacity-50"
      >
        Bet
      </button>
      
      <div className="text-center mt-4 flex items-center justify-between px-2">
        <span className="text-[#B1BAD3] text-sm font-semibold">Balance</span>
        <span className="text-white font-bold font-display">{balance.toFixed(8)}</span>
      </div>
    </div>
  );

  return (
    <GameLayout title="Plinko" onBack={onBack} controls={controls}>
      <div className="w-full h-full flex items-center justify-center p-4 bg-[#0F212E]">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </GameLayout>
  );
}
