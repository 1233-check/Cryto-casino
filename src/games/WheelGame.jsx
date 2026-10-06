import React, { useState, useEffect, useRef, useMemo } from 'react';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { WHEEL_SEGMENTS, COLORS } from '../utils/constants';
import { getBalance, subtractFromBalance, addToBalance, addHistoryEntry } from '../utils/balance';
import { motion, AnimatePresence } from 'framer-motion';

function getSegmentColor(mult, index) {
  if (mult === 0) return index % 2 === 0 ? '#1A2C38' : '#213743';
  if (mult <= 1.2) return index % 2 === 0 ? '#2A3F54' : '#324B64';
  if (mult <= 1.5) return '#1475E1'; 
  if (mult <= 3) return '#00E701';   
  if (mult <= 5) return '#B388FF';   
  return '#ED4163'; 
}

export default function WheelGame({ onBack }) {
  const canvasRef = useRef(null);
  const [balance, setBalanceState] = useState(getBalance());
  const [betAmount, setBetAmount] = useState(0.1);
  const [segments, setSegments] = useState(10);
  const [risk, setRisk] = useState('low');
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [winResult, setWinResult] = useState(null);
  
  const rotationRef = useRef(0);
  const isSpinningRef = useRef(false);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => setBalanceState(getBalance());
    window.addEventListener('balance-update', handleUpdate);
    return () => window.removeEventListener('balance-update', handleUpdate);
  }, []);

  const multipliers = useMemo(() => {
    return WHEEL_SEGMENTS[segments]?.[risk] || WHEEL_SEGMENTS[10].low;
  }, [segments, risk]);

  const handleSpin = () => {
    if (isSpinning || betAmount <= 0) return;
    const newBal = subtractFromBalance(betAmount);
    if (newBal === null) return alert('Insufficient balance');
    setBalanceState(newBal);
    setIsSpinning(true);
    isSpinningRef.current = true;
    setWinResult(null);

    const resultIndex = Math.floor(Math.random() * segments);
    const mult = multipliers[resultIndex];

    const anglePerSegment = (Math.PI * 2) / segments;
    const spins = 5 + Math.random() * 2; 
    
    // The flapper is at -Math.PI / 2.
    // To have segment `resultIndex` end up at the flapper, we calculate targetOffsetAngle.
    // Since we draw segments clockwise (from rotationRef), the segment that ends up at the top
    // is actually segment `segments - resultIndex` if we rotate backwards, 
    // or just calculate the exact target angle for rotationRef.
    const targetOffsetAngle = - (Math.PI / 2) - (resultIndex * anglePerSegment + anglePerSegment / 2);
    
    const currentRot = rotationRef.current;
    const normalizedTarget = (targetOffsetAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const normalizedCurrent = (currentRot % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    
    let delta = normalizedTarget - normalizedCurrent;
    if (delta <= 0) delta += Math.PI * 2;
    
    const randomOffset = (Math.random() - 0.5) * (anglePerSegment * 0.8);
    const finalTarget = currentRot + delta + spins * Math.PI * 2 + randomOffset;
    
    animateSpin(currentRot, finalTarget, mult, resultIndex);
  };

  const animateSpin = (startRot, targetRot, mult, segmentIndex) => {
    const duration = 4000;
    let startTime = null;
    
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const ease = 1 - Math.pow(1 - progress, 3);
      rotationRef.current = startRot + (targetRot - startRot) * ease;
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        isSpinningRef.current = false;
        setIsSpinning(false);
        setWinResult(mult);
        const payout = parseFloat((betAmount * mult).toFixed(8));
        const profit = parseFloat((payout - betAmount).toFixed(8));
        if (payout > 0) {
          addToBalance(payout);
        }
        addHistoryEntry({
          game: 'wheel',
          bet: betAmount,
          payout,
          profit,
          multiplier: mult,
          details: { segments, risk, segmentIndex }
        });
      }
    };
    
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rafId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(cx, cy) * 0.75;
      
      const anglePerSegment = (Math.PI * 2) / segments;
      
      // Outer shadow/rim
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 20, 0, Math.PI * 2);
      ctx.fillStyle = '#1A2C38';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#2F4553';
      ctx.stroke();

      // Glow effect if won
      if (!isSpinningRef.current && winResult !== null) {
         ctx.beginPath();
         ctx.arc(cx, cy, radius + 30, 0, Math.PI * 2);
         if (winResult > 1) ctx.fillStyle = 'rgba(0, 231, 1, 0.15)';
         else if (winResult === 0) ctx.fillStyle = 'rgba(237, 65, 99, 0.15)';
         else ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
         ctx.fill();
      }

      // Segments
      multipliers.forEach((mult, i) => {
         const startAngle = rotationRef.current + i * anglePerSegment;
         const endAngle = startAngle + anglePerSegment;
         
         ctx.beginPath();
         ctx.moveTo(cx, cy);
         ctx.arc(cx, cy, radius, startAngle, endAngle);
         ctx.fillStyle = getSegmentColor(mult, i);
         ctx.fill();
         ctx.strokeStyle = '#0F212E';
         ctx.lineWidth = 2;
         ctx.stroke();
         
         ctx.save();
         ctx.translate(cx, cy);
         ctx.rotate(startAngle + anglePerSegment / 2);
         ctx.textAlign = 'right';
         ctx.textBaseline = 'middle';
         ctx.fillStyle = '#FFFFFF';
         
         const fontSize = segments <= 20 ? 22 : segments <= 30 ? 16 : 12;
         ctx.font = `800 ${fontSize}px system-ui`;
         
         // Only draw text if it fits nicely
         if (segments <= 40) {
            ctx.fillText(mult + 'x', radius - 20, 0);
         } else {
            ctx.fillText(mult, radius - 15, 0);
         }
         ctx.restore();
      });

      // Center cap
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = '#213743';
      ctx.fill();
      ctx.strokeStyle = '#0F212E';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Flapper
      ctx.save();
      ctx.translate(cx, cy - radius - 15);
      
      const currentAngle = -Math.PI / 2 - rotationRef.current;
      const normalized = (currentAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const fraction = (normalized % anglePerSegment) / anglePerSegment;
      
      let flapperAngle = 0;
      if (isSpinningRef.current) {
         if (fraction < 0.15) {
             flapperAngle = ((0.15 - fraction) / 0.15) * (Math.PI / 6);
         } else if (fraction > 0.85) {
             flapperAngle = ((fraction - 0.85) / 0.15) * (Math.PI / 6);
         }
      }
      ctx.rotate(flapperAngle);
      
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;

      // Draw pointer polygon
      ctx.beginPath();
      ctx.moveTo(-15, -25);
      ctx.lineTo(15, -25);
      ctx.lineTo(0, 20);
      ctx.closePath();
      
      if (!isSpinningRef.current && winResult !== null) {
         if (winResult > 1) ctx.fillStyle = COLORS.accentGreen;
         else if (winResult === 0) ctx.fillStyle = COLORS.accentRed;
         else ctx.fillStyle = '#FFFFFF';
      } else {
         ctx.fillStyle = '#FFFFFF';
      }
      ctx.fill();
      
      ctx.restore();

      rafId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(rafId);
  }, [segments, multipliers, winResult]);

  useEffect(() => {
      return () => {
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
  }, []);

  const controls = (
    <div className="flex flex-col gap-4">
      
      <div className="bg-[#0F212E] rounded-xl border border-white/5 p-4 shadow-inner">
        <BetControls 
          betAmount={betAmount} 
          setBetAmount={setBetAmount}
          disabled={isSpinning}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0F212E] rounded-xl border border-white/5 p-3 flex flex-col gap-2 shadow-inner">
          <label className="text-xs text-[#B1BAD3] font-bold uppercase tracking-wider">Risk</label>
          <select 
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            disabled={isSpinning}
            className="w-full bg-[#1A2C38] text-white p-2.5 rounded-lg outline-none border border-white/5 font-semibold text-sm hover:bg-[#213743] transition-colors appearance-none cursor-pointer"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="bg-[#0F212E] rounded-xl border border-white/5 p-3 flex flex-col gap-2 shadow-inner">
          <label className="text-xs text-[#B1BAD3] font-bold uppercase tracking-wider">Segments</label>
          <select 
            value={segments}
            onChange={(e) => setSegments(Number(e.target.value))}
            disabled={isSpinning}
            className="w-full bg-[#1A2C38] text-white p-2.5 rounded-lg outline-none border border-white/5 font-semibold text-sm hover:bg-[#213743] transition-colors appearance-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={40}>40</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSpin}
        disabled={isSpinning || betAmount > balance}
        className="w-full py-4 mt-2 rounded-xl font-bold text-black uppercase tracking-wider transition-all
                   bg-gradient-to-b from-[#00E701] to-[#00C001] shadow-[0_4px_15px_rgba(0,231,1,0.2)] 
                   hover:shadow-[0_6px_20px_rgba(0,231,1,0.3)] hover:-translate-y-0.5 active:translate-y-0
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        Bet
      </button>
    </div>
  );

  return (
    <GameLayout title="Wheel" onBack={onBack} controls={controls} balance={balance}>
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-[400px] md:min-h-[500px] relative bg-gradient-to-b from-[#0F212E] to-[#1A2C38]/50">
        <canvas 
          ref={canvasRef}
          width={800}
          height={800}
          className="max-w-full max-h-full object-contain"
        />
        
        <AnimatePresence>
          {winResult !== null && !isSpinning && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-5xl font-black font-display px-8 py-4 rounded-2xl bg-[#0F212E]/95 border-2 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.5)] ${
                winResult > 1 ? 'text-[#00E701] border-[#00E701]/40' : 
                winResult === 0 ? 'text-[#ED4163] border-[#ED4163]/40' : 
                'text-white border-white/20'
              }`}
            >
              {winResult.toFixed(2)}x
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}
