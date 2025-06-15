
import { useState, useEffect } from 'react';

export interface TimeComponents {
  hours: number;
  minutes: number;
  seconds: number;
  dayName: string;
  dateString: string; // e.g., "1 Juli 2024"
  fullFormattedString: string; // e.g., "Senin, 1 Juli 2024, 10:30:45"
}

const getTimeComponents = (date: Date, timeZone: string): TimeComponents => {
  const optionsBase: Intl.DateTimeFormatOptions = { timeZone };
  
  // Get H, M, S as numbers
  const hours = parseInt(new Intl.DateTimeFormat('en-US', { ...optionsBase, hour: 'numeric', hour12: false }).format(date), 10);
  const minutes = parseInt(new Intl.DateTimeFormat('en-US', { ...optionsBase, minute: 'numeric' }).format(date), 10);
  const seconds = parseInt(new Intl.DateTimeFormat('en-US', { ...optionsBase, second: 'numeric' }).format(date), 10);
  
  const dayName = new Intl.DateTimeFormat('id-ID', { ...optionsBase, weekday: 'long' }).format(date);
  const dateString = new Intl.DateTimeFormat('id-ID', { ...optionsBase, day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  
  const fullFormattedString = new Intl.DateTimeFormat('id-ID', {
    ...optionsBase,
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit'
  }).format(date);

  return { hours, minutes, seconds, dayName, dateString, fullFormattedString };
};

export interface RealTimeData {
  wib: TimeComponents;
  ksa: TimeComponents;
}

export const useRealTimeClocks = (): RealTimeData => {
  const initialDate = new Date();
  const [times, setTimes] = useState<RealTimeData>({
    wib: getTimeComponents(initialDate, 'Asia/Jakarta'),
    ksa: getTimeComponents(initialDate, 'Asia/Riyadh'),
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      setTimes({
        wib: getTimeComponents(now, 'Asia/Jakarta'),
        ksa: getTimeComponents(now, 'Asia/Riyadh'),
      });
    }, 1000); // Update every second

    return () => clearInterval(intervalId);
  }, []);

  return times;
};