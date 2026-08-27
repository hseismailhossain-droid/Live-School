import React from 'react';
import { Sparkles } from 'lucide-react';

interface MathSymbolToolbarProps {
  onInsertSymbol: (symbol: string) => void;
  className?: string;
}

export const MathSymbolToolbar: React.FC<MathSymbolToolbarProps> = ({ onInsertSymbol, className = '' }) => {
  const symbolCategories = [
    {
      name: 'জ্যামিতি',
      symbols: ['△', '∠', 'θ', 'π', '⊥', '∥', '≅', '∼', '°', 'radian'],
    },
    {
      name: 'বীজগণিত ও মূল',
      symbols: ['√', '∛', '²', '³', '⁴', 'ⁿ', '±', '∓', '½', '¼', '¾', '∞'],
    },
    {
      name: 'চিহ্ন ও সমীকরণ',
      symbols: ['×', '÷', '≤', '≥', '≠', '≈', '≡', '∝', '∑', '∫', 'Δ'],
    },
    {
      name: 'গ্রিক ও সাবস্ক্রিপ্ট',
      symbols: ['α', 'β', 'γ', 'λ', 'μ', 'σ', 'ω', '₀', '₁', '₂', '₃', 'ₓ', 'ₙ'],
    },
  ];

  return (
    <div className={`p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>গণিত ও জ্যামিতি চিহ্ন টুলবার (ক্লিক করলেই যুক্ত হবে):</span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">△ ত্রিভুজ, ∠ কোণ, √ মূল, ° ডিগ্রি</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {symbolCategories.map((cat, catIdx) => (
          <div key={catIdx} className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 px-1 select-none border-r border-slate-100">
              {cat.name}
            </span>
            <div className="flex items-center gap-0.5">
              {cat.symbols.map((sym, symIdx) => (
                <button
                  key={symIdx}
                  type="button"
                  onClick={() => onInsertSymbol(sym)}
                  title={`যোগ করুন: ${sym}`}
                  className="px-1.5 py-0.5 min-w-6 text-center font-bold text-slate-800 bg-slate-50 hover:bg-teal-600 hover:text-white rounded transition-colors text-xs cursor-pointer active:scale-95"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
