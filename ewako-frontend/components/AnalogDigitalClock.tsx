import React from 'react';
import { TimeComponents } from '../hooks/useRealTimeClocks';

interface AnalogDigitalClockProps {
  timeComponents: TimeComponents;
  label: string;
}

export const AnalogDigitalClock: React.FC<AnalogDigitalClockProps> = ({ timeComponents, label }) => {
  const { hours, minutes, seconds, dayName, dateString } = timeComponents;

  const secondsDeg = (seconds / 60) * 360 + 90; // +90 to offset initial SVG rotation
  const minutesDeg = (minutes / 60) * 360 + (seconds / 60) * 6 + 90;
  const hoursDeg = (hours / 12) * 360 + (minutes / 60) * 30 + 90;

  const hourMarkers = Array.from({ length: 12 }, (_, i) => {
    const angle = i * 30; // 360 / 12 = 30 degrees per hour
    const isMajor = (i + 1) % 3 === 0;
    return (
      <div
        key={`marker-${i}`}
        className={`hour-marker ${isMajor ? 'major' : ''}`}
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <div />
      </div>
    );
  });


  return (
    <div className="flex flex-col items-center p-2 sm:p-3 bg-gray-800 rounded-lg shadow-lg w-full">
      <h3 className="text-xs sm:text-sm font-semibold metallic-gold-text mb-1.5 sm:mb-2 text-center">{label}</h3>
      <div 
        className="clock-face w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-[170px] lg:h-[170px] xl:w-[200px] xl:h-[200px]"
      >
        {/* Hour Markers */}
        {hourMarkers}

        {/* Hands */}
        <div className="clock-hand hour-hand" style={{ transform: `translateX(-50%) rotate(${hoursDeg}deg)` }}></div>
        <div className="clock-hand minute-hand" style={{ transform: `translateX(-50%) rotate(${minutesDeg}deg)` }}></div>
        <div className="clock-hand second-hand" style={{ transform: `translateX(-50%) rotate(${secondsDeg}deg)` }}></div>
        <div className="clock-center-dot"></div>

        {/* Digital time and date centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-[5] leading-tight">
          <p className="static-neon-text text-base sm:text-lg md:text-xl font-bold -mt-1">
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
          <p className="static-neon-text text-[9px] sm:text-[10px] md:text-xs mt-0.5 sm:mt-1">{dateString}</p>
          <p className="static-neon-text text-[8px] sm:text-[9px] md:text-[10px] opacity-80">{dayName}</p>
        </div>
      </div>
    </div>
  );
};
