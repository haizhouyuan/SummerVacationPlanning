import { useEffect } from "react";
import confetti from "canvas-confetti";

interface CelebrationModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  type?: string;
  message?: string;
  points?: number;
  emoji?: string;
}

export default function CelebrationModal({ 
  open, 
  isOpen, 
  onClose, 
  title = "完成！",
  type,
  message,
  points,
  emoji
}: CelebrationModalProps) {
  const isVisible = open ?? isOpen ?? false;
  useEffect(() => {
    if (!isVisible) return;
    const end = Date.now() + 600;
    const tick = () => {
      confetti({ particleCount: 50, spread: 60, startVelocity: 28, scalar: 0.9, origin: { y: 0.6 } });
      if (Date.now() < end) requestAnimationFrame(tick);
    };
    tick();
  }, [isVisible]);

  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur">
      <div className="relative w-[26rem] rounded-2xl border border-white/15 bg-neutral-900/80 p-6">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-white/70 mt-2">干得漂亮！已为你加分并记录到时间轴～</p>
        <button onClick={onClose} className="mt-5 w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white">好的</button>
        <div className="pointer-events-none absolute -top-10 left-6 h-1 w-24 bg-gradient-to-r from-white/0 via-white/70 to-white/0 rotate-12 blur-[1px] animate-[shine_1.6s_linear_infinite]" />
      </div>
    </div>
  );
}
