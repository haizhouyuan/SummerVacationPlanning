import { Home, CheckSquare, Users } from "lucide-react";

const items = [
  { key: "dashboard", icon: Home, label: "仪表盘" },
  { key: "approve",   icon: CheckSquare, label: "任务审批" },
  { key: "family",    icon: Users, label: "家庭管理" },
];

export default function BottomNav({ active, onChange }: { active: string; onChange: (k: string) => void }) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex gap-3 px-3 py-2 rounded-2xl bg-neutral-900/70 backdrop-blur border border-white/10">
        {items.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`group flex flex-col items-center px-4 py-2 rounded-xl transition-transform
               ${active === key ? "scale-105 bg-white/5" : "hover:scale-105"}`}
          >
            <Icon className={`h-5 w-5 ${active === key ? "text-white" : "text-white/70 group-hover:text-white"}`} />
            <span className="text-xs mt-1 text-white/70">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
