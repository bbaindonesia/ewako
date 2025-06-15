
import React from 'react';
import { useRealTimeClocks } from '../hooks/useRealTimeClocks';

export const TimeDisplay: React.FC = () => {
  const { wib, ksa } = useRealTimeClocks();

  return (
    <div className="text-xs text-gray-300 space-y-0.5 text-center md:text-right">
      <p><span className="font-semibold">WIB:</span> {wib.fullFormattedString}</p>
      <p><span className="font-semibold">KSA:</span> {ksa.fullFormattedString}</p>
    </div>
  );
};