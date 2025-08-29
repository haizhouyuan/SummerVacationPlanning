import { motion } from "framer-motion";

export default function ProgressCircle({ value }: { value: number }) {
  const R = 42, C = 2 * Math.PI * R;
  const offset = C * (1 - Math.min(1, Math.max(0, value)) );
  
  return (
    <div className="relative h-32 w-32 md:h-36 md:w-36 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full transform -rotate-90">
        <circle 
          cx="50" 
          cy="50" 
          r={R} 
          stroke="currentColor" 
          strokeOpacity="0.15" 
          strokeWidth="8" 
          fill="none" 
          className="text-white/20"
        />
        <motion.circle
          cx="50" 
          cy="50" 
          r={R} 
          stroke="url(#progressGradient)" 
          strokeWidth="8" 
          fill="none"
          strokeDasharray={C} 
          strokeDashoffset={C}
          animate={{ strokeDashoffset: offset }} 
          transition={{ type: "spring", stiffness: 50, damping: 15, duration: 1.2 }}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <div className="text-2xl md:text-3xl font-bold">
          {Math.round(value * 100)}%
        </div>
        <div className="text-xs md:text-sm text-white/70 mt-1">
          本周进度
        </div>
      </div>
    </div>
  );
}