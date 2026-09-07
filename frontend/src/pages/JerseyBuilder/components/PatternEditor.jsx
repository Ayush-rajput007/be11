import React from "react";
import { useSnapshot } from "valtio";
import state, { saveToHistory } from "../store";

const PatternEditor = () => {
  const snap = useSnapshot(state);

  const patterns = [
    { id: "solid", name: "Solid" },
    { id: "stripes", name: "Vertical Stripes" },
    { id: "horizontal", name: "Horizontal Stripes" },
    { id: "diagonal", name: "Diagonal Stripes" },
    { id: "gradient", name: "Gradient Flow" },
    { id: "camo", name: "Abstract Camo" }
  ];

  const handlePatternChange = (type) => {
    state.pattern.type = type;
    saveToHistory();
  };

  const handleSliderChange = (prop, val) => {
    state.pattern[prop] = parseFloat(val);
  };

  const handleSliderComplete = () => {
    saveToHistory();
  };

  return (
    <div className="flex flex-col gap-4 p-4 glassmorphism rounded-lg text-white w-[260px]">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300 border-b border-white/10 pb-2">
        Jersey Pattern
      </h3>

      {/* Pattern Type Picker */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] uppercase tracking-wider text-gray-400">Select Pattern</label>
        <div className="grid grid-cols-2 gap-1.5">
          {patterns.map((pat) => (
            <button
              key={pat.id}
              onClick={() => handlePatternChange(pat.id)}
              className={`text-left text-xs px-2.5 py-2 rounded border transition-all duration-200 ${
                snap.pattern.type === pat.id
                  ? "bg-amber-500 border-amber-500 text-black font-bold shadow-md shadow-amber-500/10"
                  : "bg-black/25 border-white/10 text-gray-300 hover:border-white/30 hover:text-white"
              }`}
            >
              {pat.name}
            </button>
          ))}
        </div>
      </div>

      {snap.pattern.type !== "solid" && (
        <div className="flex flex-col gap-3.5 mt-2 pt-2 border-t border-white/5">
          {/* Pattern Scale */}
          {snap.pattern.type !== "gradient" && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Scale</span>
                <span className="text-amber-400 font-bold">{snap.pattern.scale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={snap.pattern.scale}
                onChange={(e) => handleSliderChange("scale", e.target.value)}
                onMouseUp={handleSliderComplete}
                onTouchEnd={handleSliderComplete}
                className="w-full accent-amber-500 cursor-pointer h-1 bg-black/40 rounded-lg appearance-none"
              />
            </div>
          )}

          {/* Pattern Rotation */}
          {snap.pattern.type === "diagonal" && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Rotation</span>
                <span className="text-amber-400 font-bold">
                  {Math.round((snap.pattern.rotation * 180) / Math.PI)}°
                </span>
              </div>
              <input
                type="range"
                min="-3.14"
                max="3.14"
                step="0.05"
                value={snap.pattern.rotation}
                onChange={(e) => handleSliderChange("rotation", e.target.value)}
                onMouseUp={handleSliderComplete}
                onTouchEnd={handleSliderComplete}
                className="w-full accent-amber-500 cursor-pointer h-1 bg-black/40 rounded-lg appearance-none"
              />
            </div>
          )}

          {/* Pattern Opacity */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Blend Opacity</span>
              <span className="text-amber-400 font-bold">{Math.round(snap.pattern.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={snap.pattern.opacity}
              onChange={(e) => handleSliderChange("opacity", e.target.value)}
              onMouseUp={handleSliderComplete}
              onTouchEnd={handleSliderComplete}
              className="w-full accent-amber-500 cursor-pointer h-1 bg-black/40 rounded-lg appearance-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternEditor;
