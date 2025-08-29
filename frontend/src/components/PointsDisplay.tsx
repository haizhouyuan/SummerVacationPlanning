import { useEffect, useState } from "react";

interface PointsDisplayProps {
  // New interface
  value?: number;
  // Legacy interface for backward compatibility
  points?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export default function PointsDisplay({ 
  value,
  points,
  size = 'md',
  showLabel = true,
  animated = true,
  className = ""
}: PointsDisplayProps) {
  const actualValue = value ?? points ?? 0;
  const [display, setDisplay] = useState(animated ? 0 : actualValue);
  
  useEffect(() => {
    if (!animated) {
      setDisplay(actualValue);
      return;
    }
    
    const start = performance.now();
    const from = display;
    const delta = actualValue - from;
    const dur = 500;
    let raf = 0;
    const loop = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      setDisplay(Math.round(from + delta * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [actualValue, animated, display]);

  // Size-based styles
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          number: 'text-lg font-bold',
          label: 'text-sm',
          gap: 'gap-1'
        };
      case 'lg':
        return {
          number: 'text-4xl font-extrabold',
          label: 'text-lg',
          gap: 'gap-3'
        };
      default: // md
        return {
          number: 'text-2xl font-bold',
          label: 'text-base',
          gap: 'gap-2'
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const level = Math.floor(actualValue / 100) + 1;

  return (
    <div className={`inline-flex items-baseline ${sizeClasses.gap} ${className}`}>
      <span className="text-cartoon-yellow">⭐</span>
      <span className={`${sizeClasses.number} bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-rose-300 to-indigo-300`}>
        {animated ? display.toLocaleString() : actualValue.toLocaleString()}
      </span>
      {showLabel && <span className={`text-white/60 ${sizeClasses.label}`}>积分</span>}
      {actualValue >= 250 && size !== 'sm' && (
        <span className="text-xs bg-gradient-to-r from-purple-400 to-pink-400 text-white px-2 py-1 rounded-full">
          Lv.{level}
        </span>
      )}
    </div>
  );
}
