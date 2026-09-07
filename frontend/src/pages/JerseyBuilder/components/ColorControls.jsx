import React, { useState } from "react";
import { useSnapshot } from "valtio";
import { SketchPicker } from "react-color";
import state, { saveToHistory } from "../store";

const ColorControls = () => {
  const snap = useSnapshot(state);
  const [activeTab, setActiveTab] = useState("primary"); // 'primary', 'secondary', 'accent', 'collar'

  const presetColors = [
    "#101820", "#ffffff", "#ffcc00", "#d32f2f", "#1976d2", "#388e3c",
    "#8e24aa", "#f57c00", "#455a64", "#00796b", "#e64a19", "#303f9f",
    "#000000", "#b0bec5", "#ffd54f", "#4fc3f7"
  ];

  const handleColorChange = (color) => {
    state.colors[activeTab] = color.hex;
  };

  const handleColorChangeComplete = () => {
    saveToHistory();
  };

  const tabLabels = {
    primary: "Primary (Body)",
    secondary: "Secondary (Sleeves)",
    accent: "Accent (Patterns)",
    collar: "Collar (Trim)"
  };

  return (
    <div className="flex flex-col gap-4 p-4 glassmorphism rounded-lg text-white w-[260px] max-h-[420px] overflow-y-auto">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300 border-b border-white/10 pb-2">
        Color Settings
      </h3>

      {/* Tabs for different parts */}
      <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-md border border-white/5">
        {Object.keys(tabLabels).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[10px] py-1.5 rounded uppercase tracking-wider transition-all duration-200 ${
              activeTab === tab
                ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="text-[11px] text-gray-400">
        Modifying: <span className="text-amber-400 font-bold">{tabLabels[activeTab]}</span>
      </div>

      <div className="flex justify-center scale-95 origin-top">
        <SketchPicker
          color={snap.colors[activeTab]}
          disableAlpha
          presetColors={presetColors}
          onChange={handleColorChange}
          onChangeComplete={handleColorChangeComplete}
          className="color-picker-custom"
        />
      </div>
    </div>
  );
};

export default ColorControls;
