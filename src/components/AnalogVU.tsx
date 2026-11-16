import React, { useEffect, useRef, useState } from 'react';

interface AnalogVUProps {
  player: any;
  isPlaying: boolean;
  initialX?: number;
  initialY?: number;
  invert?: boolean;
}

export const AnalogVU: React.FC<AnalogVUProps> = ({ 
  player, 
  isPlaying, 
  initialX = 40,  
  initialY = 140,
  invert = false  
}) => {
  const needleRef = useRef<HTMLDivElement>(null); 
  const requestRef = useRef<number | undefined>(undefined);
  const currentAngleRef = useRef(-45);

  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isPlaying || !player?.analyser) {
      if (needleRef.current) {
        currentAngleRef.current = -45;
        needleRef.current.style.transform = 'rotate(-45deg)'; 
      }
      return;
    }

    const analyser = player.analyser;
    const dataArray = new Uint8Array(analyser.fftSize);

    const updateMeter = () => {
      analyser.getByteTimeDomainData(dataArray);

      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / dataArray.length);

      const minAngle = -45;
      const maxAngle = 45; 
      const range = maxAngle - minAngle;
      
      const displayRms = Math.min(rms * 2.2, 1.0); 
      
      const targetAngle = invert 
        ? maxAngle - (displayRms * range)
        : minAngle + (displayRms * range);

      currentAngleRef.current += (targetAngle - currentAngleRef.current) * 0.12;

      if (needleRef.current) {
        needleRef.current.style.transform = `rotate(${currentAngleRef.current}deg)`;
      }

      requestRef.current = requestAnimationFrame(updateMeter);
    };

    requestRef.current = requestAnimationFrame(updateMeter);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, player, invert]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    setPosition({
      x: e.clientX - dragOffsetRef.current.x,
      y: e.clientY - dragOffsetRef.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '160px',
        height: '95px',
        background: '#111',
        border: '3px solid #444',
        borderRadius: '2px',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 6px 12px rgba(0,0,0,0.7)',
        overflow: 'hidden',
        fontFamily: '"Silkscreen", "DotGothic16", monospace',
        userSelect: 'none',
        zIndex: 50,
        cursor: 'grab',
        touchAction: 'none',
      }}
    >
      <div style={{ position: 'absolute', top: '2px', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '3px', background: '#444', borderRadius: '2px', zIndex: 4 }} />
      
      <div style={{ position: 'absolute', top: '5px', left: '5px', width: '3px', height: '3px', background: '#555', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '5px', right: '5px', width: '3px', height: '3px', background: '#555', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '3px', left: '5px', width: '3px', height: '3px', background: '#555', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '3px', right: '5px', width: '3px', height: '3px', background: '#555', borderRadius: '50%' }} />

      <div style={{
        position: 'absolute',
        inset: '10px 10px 8px 10px',
        background: 'linear-gradient(to bottom, #d8d0b0 0%, #b8af8d 100%)',
        border: '1px solid #665',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        <div style={{ position: 'absolute', top: '4px', left: '0', right: '0', textAlign: 'center', fontSize: '7px', color: '#222', letterSpacing: '0.05em', fontWeight: 'bold' }}>
          -20  -10  -5  0  +3
        </div>
        <div style={{ position: 'absolute', top: '14px', right: '32px', width: '26px', height: '2px', background: '#cc2222' }} />
        <div style={{ position: 'absolute', bottom: '-55px', left: '50%', transform: 'translateX(-50%)', width: '110px', height: '110px', border: '1px dotted #443', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', color: '#443', letterSpacing: '0.2em' }}>
          VU
        </div>
        <div style={{ position: 'absolute', bottom: '-28px', left: '50%', transform: 'translateX(-50%)', width: '12px', height: '12px', background: '#222', borderRadius: '50%', zIndex: 3, boxShadow: '0 1px 2px rgba(0,0,0,0.6)' }} />

        {/* 🌟 修正ポイント：針の基点を「下部中央 (bottom center)」にし、文字盤の内側から上に向かって伸びるように修正 */}
        <div 
          ref={needleRef} 
          style={{ 
            position: 'absolute', 
            bottom: '6px',             /* 文字盤の下側から生やす */
            left: '50%', 
            width: '1.5px', 
            height: '55px',            /* 長さの調整 */
            background: 'linear-gradient(to top, #d32f2f, #111)', 
            transformOrigin: 'bottom center', /* 支点を「下」に設定 */
            transform: 'rotate(-45deg)',
            zIndex: 2,
            transition: 'none', 
          }} 
        />
      </div>
    </div>
  );
};