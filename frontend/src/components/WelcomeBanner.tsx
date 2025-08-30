import { motion } from "framer-motion";

export default function WelcomeBanner({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-full overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-600/20 via-green-500/10 to-teal-400/10 border border-emerald-400/40 neon-border flex flex-col justify-center min-h-[140px]"
    >
      {/* Warp Background Effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_200px,rgba(16,185,129,0.3),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b981,#059669,#22c55e,#f59e0b,#3b82f6)] opacity-10 blur-3xl" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <h1 className="text-2xl md:text-3xl font-fun font-bold text-white leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-white/80 mt-2 text-sm md:text-base leading-relaxed">{subtitle}</p>
        )}
      </div>
      
      {/* Shine Border Effect */}
      <span className="pointer-events-none absolute inset-0 before:absolute before:inset-y-0 before:w-1/3 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:animate-shine" />
    </motion.div>
  );
}