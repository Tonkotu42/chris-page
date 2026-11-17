import React, { useEffect, useRef, useState } from 'react';

interface AnalogVUPlayer {
  analyser: AnalyserNode | null;
}

interface AnalogVUProps {
  player: AnalogVUPlayer | null;
  isPlaying: boolean;
  initialX?: number;
  initialY?: number;
  invert?: boolean;
  embedded?: boolean;
  className?: string;
}

export const AnalogVU: React.FC<AnalogVUProps> = ({
  player,
  isPlaying,
  initialX = 40,
  initialY = 140,
  invert = false,
  embedded = false,
  className = '',
}) => {
  const needleRef = useRef<HTMLDivElement>(null);
  const peakLedRef = useRef<HTMLSpanElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const currentAngleRef = useRef(invert ? 45 : -45);

  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const minAngle = -45;
    const maxAngle = 45;
    const range = maxAngle - minAngle;
    const restAngle = invert ? maxAngle : minAngle;

    const analyser = player?.analyser ?? null;
    const dataArray = analyser ? new Uint8Array(analyser.fftSize) : null;

    const updateMeter = () => {
      let targetAngle = restAngle;
      let level = 0;

      if (isPlaying && analyser && dataArray) {
        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i += 1) {
          const normalized = (dataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        level = Math.min(rms * 2.4, 1.0);
        targetAngle = invert
          ? maxAngle - level * range
          : minAngle + level * range;
      }

      const smoothing = targetAngle > currentAngleRef.current ? 0.24 : 0.1;
      currentAngleRef.current += (targetAngle - currentAngleRef.current) * smoothing;

      if (needleRef.current) {
        needleRef.current.style.transform = `rotate(${currentAngleRef.current.toFixed(2)}deg)`;
      }

      if (peakLedRef.current) {
        peakLedRef.current.style.opacity = level > 0.72 ? '1' : '0.22';
      }

      const settled = !isPlaying && Math.abs(currentAngleRef.current - restAngle) < 0.15;
      if (settled) {
        currentAngleRef.current = restAngle;
        if (needleRef.current) {
          needleRef.current.style.transform = `rotate(${restAngle}deg)`;
        }
        if (peakLedRef.current) {
          peakLedRef.current.style.opacity = '0.22';
        }
        return;
      }

      requestRef.current = requestAnimationFrame(updateMeter);
    };

    requestRef.current = requestAnimationFrame(updateMeter);

    return () => {
      if (requestRef.current !== undefined) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, player, invert]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (embedded) return;
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (embedded || !isDraggingRef.current) return;
    setPosition({
      x: e.clientX - dragOffsetRef.current.x,
      y: e.clientY - dragOffsetRef.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (embedded) return;
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture was already released.
    }
  };

  const containerStyle: React.CSSProperties = embedded
    ? {
        position: 'relative',
        width: '100%',
        height: '66px',
        background: '#111',
        border: '2px solid #444',
        borderRadius: '2px',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.85), 0 1px 0 rgba(255,255,255,0.12)',
        overflow: 'hidden',
        fontFamily: '"Silkscreen", "DotGothic16", monospace',
        userSelect: 'none',
      }
    : {
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
      };

  return (
    <div
      className={className}
      aria-label="Analog VU meter"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={containerStyle}
    >
      <div style={{ position: 'absolute', top: '2px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '2px', background: '#444', borderRadius: '2px', zIndex: 4 }} />

      <div style={{ position: 'absolute', top: '4px', left: '4px', width: '3px', height: '3px', background: '#555', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '4px', right: '4px', width: '3px', height: '3px', background: '#555', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '3px', left: '4px', width: '3px', height: '3px', background: '#555', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '3px', right: '4px', width: '3px', height: '3px', background: '#555', borderRadius: '50%' }} />

      <div
        style={{
          position: 'absolute',
          inset: embedded ? '6px 7px 6px 7px' : '10px 10px 8px 10px',
          background: isPlaying
            ? 'linear-gradient(to bottom, #e5ddb9 0%, #c1b78e 100%)'
            : 'linear-gradient(to bottom, #cfc7a6 0%, #ada482 100%)',
          border: '1px solid #665',
          boxShadow: isPlaying
            ? 'inset 0 1px 4px rgba(0,0,0,0.35), 0 0 8px rgba(255,220,140,0.2)'
            : 'inset 0 1px 3px rgba(0,0,0,0.45)',
          overflow: 'hidden',
          pointerEvents: 'none',
          transition: 'background 200ms ease, box-shadow 200ms ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: embedded ? '2px' : '4px',
            left: '0',
            right: '0',
            textAlign: 'center',
            fontSize: embedded ? '6px' : '7px',
            color: '#222',
            letterSpacing: '0.04em',
            fontWeight: 'bold',
          }}
        >
          -20 -10 -5 0 +3
        </div>
        <div
          style={{
            position: 'absolute',
            top: embedded ? '10px' : '14px',
            right: embedded ? '20px' : '32px',
            width: embedded ? '22px' : '26px',
            height: '2px',
            background: '#cc2222',
          }}
        />
        <span
          ref={peakLedRef}
          style={{
            position: 'absolute',
            top: embedded ? '4px' : '6px',
            right: embedded ? '5px' : '7px',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: '#ff2a00',
            opacity: 0.22,
            transition: 'opacity 80ms linear',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: embedded ? '-52px' : '-55px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: embedded ? '96px' : '110px',
            height: embedded ? '96px' : '110px',
            border: '1px dotted #443',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: embedded ? '7px' : '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: embedded ? '7px' : '8px',
            color: '#443',
            letterSpacing: '0.2em',
          }}
        >
          VU
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: embedded ? '-18px' : '-28px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '12px',
            height: '12px',
            background: '#222',
            borderRadius: '50%',
            zIndex: 3,
            boxShadow: '0 1px 2px rgba(0,0,0,0.6)',
          }}
        />

        <div
          ref={needleRef}
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            width: '1.5px',
            height: embedded ? '40px' : '55px',
            background: 'linear-gradient(to top, #d32f2f, #111)',
            transformOrigin: 'bottom center',
            transform: `rotate(${invert ? 45 : -45}deg)`,
            zIndex: 2,
            transition: 'none',
          }}
        />
      </div>
    </div>
  );
};