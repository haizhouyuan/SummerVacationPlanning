import { useRef } from "react";
import { motion } from "framer-motion";

export default function TaskCard({ title, desc, onClick }: { title: string; desc?: string; onClick?: () => void }) {
  const rippleRef = useRef<HTMLSpanElement>(null);

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={(e) => {
        const el = rippleRef.current;
        if (!el) return;
        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.classList.remove("animate-ripple");
        void el.offsetWidth;
        el.classList.add("animate-ripple");
        onClick?.();
      }}
      className="relative w-full text-left rounded-2xl p-5 bg-neutral-900/50 border border-white/10 hover:border-white/20 hover:bg-neutral-900/60 transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
    >
      {/* Simple animated border - no complex effects */}
      <div className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/50 to-purple-500/50 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="font-semibold text-white text-base md:text-lg leading-tight">{title}</div>
        {desc && (
          <div className="text-sm md:text-base text-white/70 mt-2 leading-relaxed line-clamp-2">
            {desc}
          </div>
        )}
      </div>
      
      {/* Ripple effect */}
      <span 
        ref={rippleRef} 
        className="pointer-events-none absolute h-2 w-2 rounded-full bg-white/25 -translate-x-1/2 -translate-y-1/2 opacity-0" 
      />
      
      <style>{`
        .animate-ripple {
          animation: ripple 800ms ease-out forwards;
        }
        @keyframes ripple {
          to {
            transform: translate(-50%, -50%) scale(40);
            opacity: 0;
          }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </motion.button>
  );
}