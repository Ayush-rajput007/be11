import React from "react";
import state, { saveToHistory } from "../store";
import { useSnapshot } from "valtio";

const PresetSelector = () => {
  const snap = useSnapshot(state);

  const presets = [
    {
      id: "be11-pro",
      name: "BE11 Pro",
      colors: { primary: "#101820", secondary: "#ffffff", accent: "#ffcc00", collar: "#ffcc00" },
      pattern: { type: "solid", scale: 1.0, rotation: 0, opacity: 0.5 },
      themeColor: "#ffcc00"
    },
    {
      id: "thunder",
      name: "Thunder",
      colors: { primary: "#111111", secondary: "#00d2ff", accent: "#ff007f", collar: "#111111" },
      pattern: { type: "diagonal", scale: 1.2, rotation: 0, opacity: 0.8 },
      themeColor: "#00d2ff"
    },
    {
      id: "royal",
      name: "Royal Gold",
      colors: { primary: "#0b1d3a", secondary: "#d4af37", accent: "#ffffff", collar: "#d4af37" },
      pattern: { type: "stripes", scale: 0.8, rotation: 0, opacity: 0.6 },
      themeColor: "#d4af37"
    },
    {
      id: "striker",
      name: "Striker",
      colors: { primary: "#b30000", secondary: "#111111", accent: "#ffffff", collar: "#111111" },
      pattern: { type: "horizontal", scale: 1.5, rotation: 0, opacity: 0.7 },
      themeColor: "#b30000"
    },
    {
      id: "velocity",
      name: "Velocity",
      colors: { primary: "#ffffff", secondary: "#0f52ba", accent: "#00ffcc", collar: "#0f52ba" },
      pattern: { type: "camo", scale: 0.7, rotation: 0, opacity: 0.5 },
      themeColor: "#0f52ba"
    },
    {
      id: "minimal",
      name: "Minimalist",
      colors: { primary: "#eceff1", secondary: "#263238", accent: "#78909c", collar: "#263238" },
      pattern: { type: "solid", scale: 1.0, rotation: 0, opacity: 0.5 },
      themeColor: "#78909c"
    }
  ];

  const applyPreset = (preset) => {
    state.colors.primary = preset.colors.primary;
    state.colors.secondary = preset.colors.secondary;
    state.colors.accent = preset.colors.accent;
    state.colors.collar = preset.colors.collar;
    
    state.pattern.type = preset.pattern.type;
    state.pattern.scale = preset.pattern.scale;
    state.pattern.rotation = preset.pattern.rotation;
    state.pattern.opacity = preset.pattern.opacity;

    saveToHistory();
  };

  return (
    <div className="flex flex-col gap-3 p-4 glassmorphism rounded-lg text-white w-[260px]">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300 border-b border-white/10 pb-2">
        Quick Presets
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className="flex flex-col items-center gap-1.5 p-2 rounded bg-black/30 hover:bg-black/50 border border-white/5 hover:border-amber-500/50 transition-all duration-200"
          >
            {/* Color Swatch Preview Dot */}
            <div className="flex gap-0.5">
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/20"
                style={{ backgroundColor: preset.colors.primary }}
              />
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/20"
                style={{ backgroundColor: preset.colors.secondary }}
              />
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/20"
                style={{ backgroundColor: preset.colors.collar }}
              />
            </div>
            <span className="text-[10px] font-bold text-gray-200">{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PresetSelector;
