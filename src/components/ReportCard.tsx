// components/ReportCard.tsx
import { Sparkles, Dumbbell, Timer, Zap } from 'lucide-react';

export function ReportCard({ data, onClose, isHistory }: { data: any, onClose?: () => void, isHistory: boolean }) {
  return (
    <div className="bg-[#1a2332] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden mb-4">
      <div className={`${isHistory ? 'bg-slate-700' : 'bg-[#00a369]'} p-4 text-white flex justify-between items-center`}>
        <span className="font-bold flex items-center gap-2 text-sm">
          <Sparkles size={16}/> {isHistory ? 'Past Analysis' : 'AI Analysis'}
        </span>
        {isHistory && onClose && (
          <button onClick={onClose} className="text-[10px] bg-white/10 px-2 py-1 rounded-full uppercase font-bold hover:bg-white/20 transition-colors">
            Close
          </button>
        )}
      </div>
      
      <div className="p-6 space-y-6">
        {/* Macros */}
        <div className="grid grid-cols-4 gap-2">
          <MacroTile label="Cals" value={data.macros?.calories} color="text-[#00ffa3]" />
          <MacroTile label="Prot" value={data.macros?.protein} color="text-[#3b82f6]" />
          <MacroTile label="Carb" value={data.macros?.carbs} color="text-[#f59e0b]" />
          <MacroTile label="Fat" value={data.macros?.fats} color="text-[#f43f5e]" />
        </div>

        {/* Coach Advice */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Coach's Advice</h4>
          <div className="p-4 bg-[#111827] rounded-2xl border border-slate-800/50 shadow-inner">
            <p className="text-xs text-slate-300 leading-relaxed font-medium">{data.advice}</p>
          </div>
        </div>

        {/* Detailed Activity Balance */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activity Balance Detail</h4>
          <div className="bg-[#111827] rounded-2xl border border-slate-800/50 overflow-hidden">
             <div className="p-4 flex items-start gap-3 border-b border-slate-800/50">
               <div className="p-2 bg-[#3b82f6]/10 rounded-lg"><Dumbbell className="text-[#3b82f6]" size={20} /></div>
               <div>
                  <p className="text-xs font-bold text-slate-200">{data.recommendedActivity?.name}</p>
                  <p className="text-[10px] text-slate-400">Targeting {data.macros?.calories > 500 ? 'High' : 'Moderate'} Caloric Burn</p>
               </div>
             </div>
             <div className="grid grid-cols-2 p-3 gap-2">
               <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-xl">
                  <Timer size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-mono text-slate-300">{data.recommendedActivity?.duration || '30 mins'}</span>
               </div>
               <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-xl">
                  <Zap size={14} className="text-amber-500" />
                  <span className="text-[10px] font-mono text-slate-300">-{Math.round(data.macros?.calories * 0.8 || 200)} kcal</span>
               </div>
             </div>
             <p className="px-4 pb-4 text-[10px] text-slate-500 italic">This activity compensates for the glycemic load of your current plate.</p>
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Goal-Based Suggestions</h4>
            <div className="space-y-2">
              {data.recommendedFoods?.map((f: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 bg-[#111827] rounded-xl border border-slate-800/50">
                  <span className="text-xs text-slate-200">{f.name} <span className="text-[10px] text-slate-500">({f.weight}g)</span></span>
                  <span className="text-[10px] text-[#00ffa3] font-bold px-2 py-0.5 rounded-full bg-[#00ffa3]/10 border border-[#00ffa3]/20">{f.reason}</span>
                </div>
              ))}
            </div>
        </div>
      </div>
      
      <div className="bg-[#111827]/50 p-4 text-center italic text-[10px] text-slate-500 border-t border-slate-800">
        "{data.quote || "Precision is the foundation of progress."}"
      </div>
    </div>
  );
}

function MacroTile({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="bg-[#111827] p-2 rounded-xl flex flex-col items-center border border-slate-800/50 shadow-inner">
      <span className="text-[8px] uppercase font-bold text-slate-500 mb-1">{label}</span>
      <span className={`font-bold text-sm ${color}`}>{Math.round(value || 0)}</span>
    </div>
  );
}