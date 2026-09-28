import React, { useState, useEffect, useRef, useMemo } from 'react';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { WHEEL_SEGMENTS, COLORS } from '../utils/constants';

function getSegmentColor(mult, index) {
  if (mult === 0) return index % 2 === 0 ? '#1A2C38' : '#213743';
  if (mult <= 1.2) return index % 2 === 0 ? '#2A3F54' : '#324B64';
  if (mult <= 1.5) return '#1475E1'; // accentBlue
  if (mult <= 3) return '#00E701';   // accentGreen
  if (mult <= 5) return '#B388FF';   // accentPurple
  return '#ED4163'; // accentRed
}

export default function WheelGame({ balance, setBalance, onBack }) {
  const canvasRef = useRef(null);
  const [betAmount, setBetAmount] = useState(1);
  const [segments, setSegments] = useState(10);
  const [risk, setRisk] = useState('low');
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [winResult, setWinResult] = useState(null);
  
  const rotationRef = useRef(0);
  const isSpinningRef = useRef(false);
  const animationFrameRef = useRef(null);

  const multipliers = useMemo(() => {
    return WHEEL_SEGMENTS[segments]?.[risk] || WHEEL_SEGMENTS[10].low;
  }, [segments, risk]);

  const handleSpin = () => {
    if (isSpinning || balance < betAmount) return;
    
    setBalance(b => b - betAmount);
    setIsSpinning(true);
    isSpinningRef.current = true;
    setWinResult(null);

    const resultIndex = Math.floor(Math.random() * segments);
    const mult = multipliers[resultIndex];

    const anglePerSegment = (Math.PI * 2) / segments;
    const spins = 5 + Math.random() * 2; 
    
    const targetOffsetAngle = - (Math.PI / 2) - (resultIndex * anglePerSegment + anglePerSegment / 2);
    
    const currentRot = rotationRef.current;
    const normalizedTarget = (targetOffsetAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const normalizedCurrent = (currentRot % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    
    let delta = normalizedTarget - normalizedCurrent;
    if (delta <= 0) delta += Math.PI * 2;
    
    // Slight random offset so it doesn't land exactly in the middle every time
    const randomOffset = (Math.random() - 0.5) * (anglePerSegment * 0.8);
    const finalTarget = currentRot + delta + spins * Math.PI * 2 + randomOffset;
    
    animateSpin(currentRot, finalTarget, mult);
  };

  const animateSpin = (startRot, targetRot, mult) => {
    const duration = 4000;
    let startTime = null;
    
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // EaseOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      rotationRef.current = startRot + (targetRot - startRot) * ease;
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        isSpinningRef.current = false;
        setIsSpinning(false);
        setWinResult(mult);
        if (mult > 0) {
           setBalance(b => b + betAmount * mult);
        }
      }
    };
    
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
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
      const radius = 340;
      
      const anglePerSegment = (Math.PI * 2) / segments;
      
      // Draw outer rim / highlight
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 15, 0, Math.PI * 2);
      ctx.fillStyle = '#1A2C38'; // Default rim color
      ctx.fill();

      if (!isSpinningRef.current && winResult !== null) {
         ctx.beginPath();
         ctx.arc(cx, cy, radius + 25, 0, Math.PI * 2);
         if (winResult > 1) {
            ctx.fillStyle = 'rgba(0, 231, 1, 0.2)'; // green glow
         } else if (winResult === 0) {
            ctx.fillStyle = 'rgba(237, 65, 99, 0.2)'; // red glow
         } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
         }
         ctx.fill();
      }

      // Draw segments
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
         
         // Text
         ctx.save();
         ctx.translate(cx, cy);
         ctx.rotate(startAngle + anglePerSegment / 2);
         ctx.textAlign = 'right';
         ctx.textBaseline = 'middle';
         ctx.fillStyle = '#FFFFFF';
         
         const fontSize = segments <= 20 ? 24 : segments <= 30 ? 18 : 14;
         ctx.font = `bold ${fontSize}px sans-serif`;
         
         ctx.fillText(mult + 'x', radius - 20, 0);
         ctx.restore();
      });

      // Draw center circle
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.fillStyle = '#0F212E';
      ctx.fill();
      ctx.strokeStyle = '#1A2C38';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Draw flapper
      ctx.save();
      ctx.translate(cx, cy - radius - 15);
      
      const currentAngle = -Math.PI / 2 - rotationRef.current;
      const normalized = (currentAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const fraction = (normalized % anglePerSegment) / anglePerSegment;
      
      let flapperAngle = 0;
      if (isSpinningRef.current) {
         if (fraction < 0.15) {
             flapperAngle = ((0.15 - fraction) / 0.15) * (Math.PI / 8);
         } else if (fraction > 0.85) {
             flapperAngle = ((fraction - 0.85) / 0.15) * (Math.PI / 8);
         }
      }
      ctx.rotate(flapperAngle);
      
      // Shadow for flapper
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;

      ctx.beginPath();
      ctx.moveTo(-20, -30);
      ctx.lineTo(20, -30);
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
      
      // Remove shadow before drawing anything else if needed
      ctx.shadowColor = 'transparent';
      ctx.restore();

      rafId = requestAnimationFrame(render);
    };

    render();
    
    return () => cancelAnimationFrame(rafId);
  }, [segments, multipliers, winResult]);

  // Clean up animation on unmount
  useEffect(() => {
      return () => {
          if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
          }
      };
  }, []);

  const controls = (
    <div className="flex flex-col gap-4">
      <BetControls 
        betAmount={betAmount} 
        setBetAmount={setBetAmount}
        disabled={isSpinning}
      />
      
      <div className="bg-[#0F212E] rounded-lg border border-white/[0.04] p-3">
        <label className="text-xs text-[#B1BAD3] font-semibold uppercase block mb-2">Risk</label>
        <select 
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          disabled={isSpinning}
          className="w-full bg-[#1A2C38] text-white p-2 rounded outline-none border border-white/[0.04]"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="bg-[#0F212E] rounded-lg border border-white/[0.04] p-3">
        <label className="text-xs text-[#B1BAD3] font-semibold uppercase block mb-2">Segments</label>
        <select 
          value={segments}
          onChange={(e) => setSegments(Number(e.target.value))}
          disabled={isSpinning}
          className="w-full bg-[#1A2C38] text-white p-2 rounded outline-none border border-white/[0.04]"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
          <option value={40}>40</option>
          <option value={50}>50</option>
        </select>
      </div>

      <button
        onClick={handleSpin}
        disabled={isSpinning || balance < betAmount}
        className="mt-4 bg-[#00E701] hover:bg-[#00c701] text-black font-bold py-4 rounded-xl text-lg uppercase transition-colors disabled:opacity-50"
      >
        Bet
      </button>
    </div>
  );

  return (
    <GameLayout 
      title="Wheel"
      onBack={onBack}
      controls={controls}
    >
      <div className="flex-1 flex items-center justify-center p-8 min-h-[500px]">
        <canvas 
          ref={canvasRef}
          width={800}
          height={800}
          className="max-w-full max-h-full object-contain"
        />
        
        {winResult !== null && !isSpinning && (
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-4xl font-bold font-display px-6 py-3 rounded-xl bg-[#0F212E]/90 border backdrop-blur-sm shadow-2xl animate-in zoom-in duration-300 ${
            winResult > 1 ? 'text-[#00E701] border-[#00E701]/30' : 
            winResult === 0 ? 'text-[#ED4163] border-[#ED4163]/30' : 
            'text-white border-white/10'
          }`}>
            {winResult}x
          </div>
        )}
      </div>
    </GameLayout>
  );
}
