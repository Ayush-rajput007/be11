import React, { useState } from "react";
import { useSnapshot } from "valtio";
import state, { saveToHistory } from "../store";
import * as THREE from "three";

const TextEditor = () => {
  const snap = useSnapshot(state);
  const [newText, setNewText] = useState("");

  const selectedLayer = snap.layers.find((l) => l.id === snap.selectedLayerId);
  const isTextSelected = selectedLayer && selectedLayer.type === "text";

  const fontOptions = [
    { id: "Impact", name: "Impact Block" },
    { id: "Arial Black", name: "Modern Athletic" },
    { id: "Courier New", name: "Retro Block" },
    { id: "Times New Roman", name: "Serif Classic" },
    { id: "Georgia", name: "Varsity Serif" }
  ];

  const handleAddText = () => {
    if (!newText.trim()) return;

    const newLayerId = `text-${Date.now()}`;
    const newLayer = {
      id: newLayerId,
      type: "text",
      side: snap.view === "back" ? "back" : "front",
      text: newText,
      font: "Impact",
      color: "#ffffff",
      outlineColor: "#000000",
      outlineWidth: 2,
      position: snap.view === "back" ? [0, 0.04, -0.12] : [0, 0.04, 0.14],
      rotation: snap.view === "back" ? [0, Math.PI, 0] : [0, 0, 0],
      rotationAngle: 0,
      normal: snap.view === "back" ? [0, 0, -1] : [0, 0, 1],
      scale: 0.22,
      opacity: 1,
      name: `Text: ${newText.substring(0, 10)}`,
      fontSize: 40,
      visible: true
    };

    state.layers.push(newLayer);
    state.selectedLayerId = newLayerId;
    setNewText("");
    saveToHistory();
  };

  const handleUpdate = (prop, val) => {
    if (!isTextSelected) return;
    const index = state.layers.findIndex((l) => l.id === snap.selectedLayerId);
    if (index === -1) return;

    if (prop === "rotationAngle") {
      const rad = (parseFloat(val) * Math.PI) / 180;
      state.layers[index].rotationAngle = rad;

      // Reorient using normal
      const normal = new THREE.Vector3().fromArray(state.layers[index].normal || [0, 0, 1]);
      const localPoint = new THREE.Vector3().fromArray(state.layers[index].position);

      const obj = new THREE.Object3D();
      obj.position.copy(localPoint);
      obj.lookAt(localPoint.clone().add(normal));
      obj.rotateZ(rad);

      state.layers[index].rotation = [obj.rotation.x, obj.rotation.y, obj.rotation.z];
    } else if (prop === "side") {
      state.layers[index].side = val;
      const prevPos = [...state.layers[index].position];
      state.layers[index].position = [prevPos[0], prevPos[1], val === "back" ? -0.12 : 0.14];
      state.layers[index].normal = val === "back" ? [0, 0, -1] : [0, 0, 1];
      state.layers[index].rotation = val === "back" ? [0, Math.PI, 0] : [0, 0, 0];
      state.layers[index].rotationAngle = 0;
    } else {
      state.layers[index][prop] = val;
    }
  };

  const handleSliderComplete = () => {
    saveToHistory();
  };

  return (
    <div className="flex flex-col gap-4 p-4 glassmorphism rounded-lg text-white w-[260px] max-h-[420px] overflow-y-auto">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300 border-b border-white/10 pb-2">
        Custom Text
      </h3>

      {/* Input box */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Enter text..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddText()}
          className="bg-black/30 border border-white/10 text-white rounded p-2 text-xs focus:outline-none focus:border-amber-500"
        />
        <button
          onClick={handleAddText}
          className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold py-2 rounded transition-all duration-200"
        >
          Add Text Decal
        </button>
      </div>

      {isTextSelected ? (
        <div className="flex flex-col gap-3.5 border-t border-white/5 pt-3 mt-1">
          <div className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">
            Editing: {selectedLayer.text}
          </div>

          {/* Text Input edit */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Modify Content</span>
            <input
              type="text"
              value={selectedLayer.text}
              onChange={(e) => handleUpdate("text", e.target.value)}
              onBlur={handleSliderComplete}
              className="bg-black/30 border border-white/10 text-white rounded p-1.5 text-xs"
            />
          </div>

          {/* Placement Side */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Placement Side</span>
            <div className="grid grid-cols-2 gap-1 bg-black/35 p-0.5 rounded border border-white/5">
              {["front", "back"].map((side) => (
                <button
                  key={side}
                  onClick={() => handleUpdate("side", side)}
                  className={`text-[10px] py-1.5 uppercase font-bold rounded transition-all duration-200 ${
                    selectedLayer.side === side ? "bg-white/15 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Font Style</span>
            <select
              value={selectedLayer.font}
              onChange={(e) => handleUpdate("font", e.target.value)}
              className="bg-black/40 border border-white/10 text-white rounded p-1.5 text-xs focus:outline-none focus:border-amber-500"
            >
              {fontOptions.map((f) => (
                <option key={f.id} value={f.id} className="bg-zinc-800 text-white">
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Text Color */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Text Color</span>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={selectedLayer.color}
                onChange={(e) => handleUpdate("color", e.target.value)}
                onBlur={handleSliderComplete}
                className="w-8 h-8 rounded border border-white/15 cursor-pointer bg-transparent"
              />
              <span className="text-xs text-gray-300 font-semibold">{selectedLayer.color}</span>
            </div>
          </div>

          {/* Outline Stroke Color & Width */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Outline Color</span>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={selectedLayer.outlineColor}
                onChange={(e) => handleUpdate("outlineColor", e.target.value)}
                onBlur={handleSliderComplete}
                className="w-8 h-8 rounded border border-white/15 cursor-pointer bg-transparent"
              />
              <span className="text-xs text-gray-300 font-semibold">{selectedLayer.outlineColor}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Outline Width</span>
              <span className="text-amber-400 font-bold">{selectedLayer.outlineWidth}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={selectedLayer.outlineWidth}
              onChange={(e) => handleUpdate("outlineWidth", parseInt(e.target.value))}
              onMouseUp={handleSliderComplete}
              onTouchEnd={handleSliderComplete}
              className="w-full accent-amber-500 cursor-pointer h-1 bg-black/40 rounded-lg appearance-none"
            />
          </div>

          {/* Scale */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Size</span>
              <span className="text-amber-400 font-bold">{Math.round(selectedLayer.scale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.08"
              max="0.4"
              step="0.01"
              value={selectedLayer.scale}
              onChange={(e) => handleUpdate("scale", e.target.value)}
              onMouseUp={handleSliderComplete}
              onTouchEnd={handleSliderComplete}
              className="w-full accent-amber-500 cursor-pointer h-1 bg-black/40 rounded-lg appearance-none"
            />
          </div>

          {/* Text Rotation */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Rotation</span>
              <span className="text-amber-400 font-bold">
                {Math.round((selectedLayer.rotationAngle * 180) / Math.PI)}°
              </span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              value={Math.round((selectedLayer.rotationAngle * 180) / Math.PI)}
              onChange={(e) => handleUpdate("rotationAngle", e.target.value)}
              onMouseUp={handleSliderComplete}
              onTouchEnd={handleSliderComplete}
              className="w-full accent-amber-500 cursor-pointer h-1 bg-black/40 rounded-lg appearance-none"
            />
          </div>
        </div>
      ) : (
        <div className="text-center text-xs text-gray-400 py-6 border-t border-white/5 mt-2">
          Select a text layer in the right Layer panel or enter text above to customize.
        </div>
      )}
    </div>
  );
};

export default TextEditor;
