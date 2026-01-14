import { LucideSettings2, LucideCalculator } from "lucide-react";

export default function BottomControls({
  cantidadPaso,
  setCantidadPaso,
  modoManual,
  setModoManual,
  valorManual,
  setValorManual,
}) {
  const presets = [
    { label: "1", val: 1, desc: "Un / Kg" },
    { label: "0.1", val: 0.1, desc: "100g" },
    { label: "0.5", val: 0.5, desc: "Media" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
      <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto pb-1">
        {presets.map((preset) => (
          <button
            key={preset.val}
            onClick={() => {
              setCantidadPaso(preset.val);
              setModoManual(false);
            }}
            className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg flex flex-col items-center justify-center transition-all border ${
              !modoManual && cantidadPaso === preset.val
                ? "bg-slate-900 text-white border-slate-900 shadow-md -translate-y-1"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className="text-lg font-bold">{preset.label}</span>
            <span
              className={`text-[10px] uppercase ${
                !modoManual && cantidadPaso === preset.val
                  ? "text-slate-300"
                  : "text-slate-400"
              }`}
            >
              {preset.desc}
            </span>
          </button>
        ))}

        <div
          className={`flex-1 min-w-[120px] rounded-lg p-1 border flex items-center gap-2 transition-all ${
            modoManual
              ? "bg-amber-50 border-amber-300 ring-1 ring-amber-200"
              : "bg-white border-slate-200"
          }`}
        >
          <button
            onClick={() => setModoManual(true)}
            className={`p-2 rounded-md ${
              modoManual ? "text-amber-600" : "text-slate-400"
            }`}
          >
            <LucideCalculator size={20} />
          </button>
          <div className="flex flex-col w-full">
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              Manual
            </span>
            <input
              type="number"
              step="any"
              value={valorManual}
              onClick={() => setModoManual(true)}
              onChange={(e) => {
                setValorManual(e.target.value);
                setModoManual(true);
              }}
              placeholder="0.00"
              className="w-full bg-transparent outline-none text-lg font-bold text-slate-800 placeholder-slate-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
