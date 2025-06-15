import React from 'react';
import { useRealTimeClocks } from '../hooks/useRealTimeClocks';
import { AnalogDigitalClock } from './AnalogDigitalClock'; // New component

export const NeonClockWidget: React.FC = () => {
  const { wib, ksa } = useRealTimeClocks();

  return (
    <div className="mb-6 sm:mb-8 p-2 sm:p-3 md:p-4 bg-gray-900 bg-opacity-40 rounded-lg shadow-xl">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 items-center justify-items-center">
        <AnalogDigitalClock 
          timeComponents={wib}
          label="WIB (Indonesia)"
        />
        <AnalogDigitalClock
          timeComponents={ksa}
          label="KSA (Saudi Arabia)"
        />
      </div>
    </div>
  );
};