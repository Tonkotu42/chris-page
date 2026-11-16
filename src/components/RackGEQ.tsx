import React, { useState } from 'react';
import './RackGEQ.css';

const FREQUENCIES = ['31', '62', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];

export const RackGEQ: React.FC = () => {
  const [gains, setGains] = useState<number[]>(Array(10).fill(0));

  const handleGainChange = (index: number, value: number) => {
    // センターへのスナップ機能（-1〜+1の間なら0にする）
    const snappedValue = Math.abs(value) < 1 ? 0 : value;
    const newGains = [...gains];
    newGains[index] = snappedValue;
    setGains(newGains);
  };

  return (
    <div className="rack-geq-container">
      <div className="rack-geq-header">
        <span>GRAPHIC EQUALIZER</span>
        <span className="rack-geq-power-led" />
      </div>
      <div className="rack-geq-bands">
        {FREQUENCIES.map((freq, index) => {
          const gain = gains[index];
          const isZero = gain === 0;
          return (
            <div key={freq} className="rack-geq-band">
              {/* ゼロ通過で光るLED */}
              <div className={`rack-geq-led ${!isZero ? 'is-active' : ''}`} />
              
              <div className="rack-fader-wrapper">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.1"
                  value={gain}
                  onChange={(e) => handleGainChange(index, parseFloat(e.target.value))}
                  className="rack-fader"
                  aria-label={`${freq} Hz Gain`}
                />
                <div className="rack-fader-marks" />
              </div>
              <span className="rack-geq-freq">{freq}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};