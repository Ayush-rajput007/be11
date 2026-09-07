import React from "react";
import { useSnapshot } from "valtio";
import state, { saveToHistory } from "../store";

const PlayerEditor = () => {
  const snap = useSnapshot(state);

  const fontOptions = [
    { id: "Impact", name: "Impact Block" },
    { id: "Arial Black", name: "Modern Athletic" },
    { id: "Courier New", name: "Retro Block" },
    { id: "Times New Roman", name: "Classic Roman" },
    { id: "Georgia", name: "Varsity Serif" }
  ];

  const handleUpdate = (prop, val) => {
    state.player[prop] = val;
  };

  const handleSliderComplete = () => {
    saveToHistory();
  };

  return (
    <div className="flex flex-col gap-4 p-4 glassmorphism rounded-lg text-white w-[260px] max-h-[420px] overflow-y-auto">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300 border-b border-white/10 pb-2">
        Player Details
      </h3>

      {/* Player Name */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-gray-400 uppercase tracking-wider">Player Name</label>
        <input
          type="text"
          placeholder="e.g. AYUSH"
          value={snap.player.name}
          onChange={(e) => handleUpdate("name", e.target.value.toUpperCase())}
          onBlur={handleSliderComplete}
          className="bg-black/30 border border-white/10 text-white rounded p-2 text-xs focus:outline-none focus:border-amber-500 uppercase font-bold"
        />
      </div>

      {/* Player Number */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-gray-400 uppercase tracking-wider">Player Number</label>
        <input
          type="text"
          placeholder="e.g. 07"
          maxLength={3}
          value={snap.player.number}
          onChange={(e) => handleUpdate("number", e.target.value)}
          onBlur={handleSliderComplete}
          className="bg-black/30 border border-white/10 text-white rounded p-2 text-xs focus:outline-none focus:border-amber-500 font-bold"
        />
      </div>

      {/* Font Family */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-gray-400 uppercase tracking-wider">Font Family</label>
        <select
          value={snap.player.font}
          onChange={(e) => {
            handleUpdate("font", e.target.value);
            saveToHistory();
          }}
          className="bg-black/40 border border-white/10 text-white rounded p-1.5 text-xs focus:outline-none focus:border-amber-500"
        >
          {fontOptions.map((f) => (
            <option key={f.id} value={f.id} className="bg-zinc-800 text-white">
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Curved Name Toggle */}
      <div className="flex items-center justify-between border-y border-white/5 py-2.5">
        <span className="text-xs text-gray-300">Curve Player Name</span>
        <button
          onClick={() => {
            handleUpdate("isCurved", !snap.player.isCurved);
            saveToHistory();
          }}
          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            snap.player.isCurved ? "bg-amber-500" : "bg-white/10"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              snap.player.isCurved ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Text Colors */}
      <div className="flex justify-between items-center gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-gray-400 uppercase tracking-wider">Color</span>
          <div className="flex gap-1.5 items-center">
            <input
              type="color"
              value={snap.player.color}
              onChange={(e) => handleUpdate("color", e.target.value)}
              onBlur={handleSliderComplete}
              className="w-8 h-8 rounded border border-white/15 cursor-pointer bg-transparent"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-gray-400 uppercase tracking-wider">Outline Color</span>
          <div className="flex gap-1.5 items-center">
            <input
              type="color"
              value={snap.player.outlineColor}
              onChange={(e) => handleUpdate("outlineColor", e.target.value)}
              onBlur={handleSliderComplete}
              className="w-8 h-8 rounded border border-white/15 cursor-pointer bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Outline Width */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Outline Width</span>
          <span className="text-amber-400 font-bold">{snap.player.outlineWidth}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="8"
          step="1"
          value={snap.player.outlineWidth}
          onChange={(e) => handleUpdate("outlineWidth", parseInt(e.target.value))}
          onMouseUp={handleSliderComplete}
          onTouchEnd={handleSliderComplete}
          className="w-full accent-amber-500 cursor-pointer h-1 bg-black/40 rounded-lg appearance-none"
        />
      </div>

      {/* Vertical Positioning offsets */}
      <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3 mt-1">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Vertical Adjustments</span>
        
        {/* Name Height */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>Name Height</span>
            <span className="text-amber-400 font-bold">{Math.round(snap.player.yPosition * 100)}</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.22"
            step="0.01"
            value={snap.player.yPosition}
            onChange={(e) => handleUpdate("yPosition", parseFloat(e.target.value))}
            onMouseUp={handleSliderComplete}
            onTouchEnd={handleSliderComplete}
            className="w-full accent-amber-500 cursor-pointer h-1 bg-black/40 rounded-lg appearance-none"
          />
        </div>

        {/* Number Height */}
        <div className="flex flex-col gap-1 mt-1.5">
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>Number Height</span>
            <span className="text-amber-400 font-bold">{Math.round(snap.player.numYPosition * 100)}</span>
          </div>
          <input
            type="range"
            min="-0.15"
            max="0.05"
            step="0.01"
            value={snap.player.numYPosition}
            onChange={(e) => handleUpdate("numYPosition", parseFloat(e.target.value))}
            onMouseUp={handleSliderComplete}
            onTouchEnd={handleSliderComplete}
            className="w-full accent-amber-500 cursor-pointer h-1 bg-black/40 rounded-lg appearance-none"
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerEditor;
