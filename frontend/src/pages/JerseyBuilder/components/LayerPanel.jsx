import React from "react";
import { useSnapshot } from "valtio";
import state, { saveToHistory } from "../store";

const LayerPanel = () => {
  const snap = useSnapshot(state);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    state.layers = state.layers.filter((l) => l.id !== id);
    if (state.selectedLayerId === id) {
      state.selectedLayerId = null;
    }
    saveToHistory();
  };

  const handleDuplicate = (layer, e) => {
    e.stopPropagation();
    const newId = `layer-${Date.now()}`;
    // Position offset to make duplicate obvious
    const newPos = [
      Math.max(-0.09, Math.min(0.09, layer.position[0] + 0.015)),
      Math.max(-0.2, Math.min(0.1, layer.position[1] - 0.015)),
      layer.position[2],
    ];

    const newLayer = {
      ...JSON.parse(JSON.stringify(layer)),
      id: newId,
      position: newPos,
      name: `${layer.name.replace(/ \(Copy\)/g, "")} (Copy)`
    };

    state.layers.push(newLayer);
    state.selectedLayerId = newId;
    saveToHistory();
  };

  const handleToggleVisibility = (id, e) => {
    e.stopPropagation();
    const index = state.layers.findIndex((l) => l.id === id);
    if (index !== -1) {
      state.layers[index].visible = !state.layers[index].visible;
    }
  };

  const moveLayer = (index, direction, e) => {
    e.stopPropagation();
    if (direction === "up" && index > 0) {
      const temp = JSON.parse(JSON.stringify(state.layers[index]));
      state.layers[index] = state.layers[index - 1];
      state.layers[index - 1] = temp;
    } else if (direction === "down" && index < state.layers.length - 1) {
      const temp = JSON.parse(JSON.stringify(state.layers[index]));
      state.layers[index] = state.layers[index + 1];
      state.layers[index + 1] = temp;
    }
    saveToHistory();
  };

  return (
    <div className="flex flex-col gap-4 p-4 glassmorphism rounded-lg text-white w-[260px] max-h-[400px] overflow-y-auto">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300 border-b border-white/10 pb-2">
        Layers Stack
      </h3>

      {snap.layers.length === 0 ? (
        <div className="text-center text-xs text-gray-400 py-6">
          No design layers added yet. Upload a logo or add text decals.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {snap.layers.map((layer, index) => {
            const isSelected = snap.selectedLayerId === layer.id;

            return (
              <div
                key={layer.id}
                onClick={() => (state.selectedLayerId = layer.id)}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-500 text-white"
                    : "bg-black/25 border-white/5 text-gray-300 hover:bg-black/45"
                }`}
              >
                {/* Left side: Type indicator + Name */}
                <div className="flex items-center gap-2 max-w-[130px] truncate">
                  <span className="text-xs">
                    {layer.type === "image" ? "🖼️" : "🔤"}
                  </span>
                  <span className="text-[11px] font-medium truncate" title={layer.name}>
                    {layer.name}
                  </span>
                </div>

                {/* Right side: Controls (Eye, Move Up/Down, Duplicate, Trash) */}
                <div className="flex items-center gap-1.5">
                  {/* Visibility */}
                  <button
                    onClick={(e) => handleToggleVisibility(layer.id, e)}
                    className="p-1 hover:text-white text-gray-400 transition-colors"
                    title="Toggle Visibility"
                  >
                    {layer.visible ? "👁️" : "🕶️"}
                  </button>

                  {/* Move Up */}
                  <button
                    onClick={(e) => moveLayer(index, "up", e)}
                    disabled={index === 0}
                    className={`p-0.5 hover:text-white text-gray-400 transition-colors ${
                      index === 0 ? "opacity-30 cursor-not-allowed" : ""
                    }`}
                    title="Move Layer Up"
                  >
                    ▲
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={(e) => moveLayer(index, "down", e)}
                    disabled={index === snap.layers.length - 1}
                    className={`p-0.5 hover:text-white text-gray-400 transition-colors ${
                      index === snap.layers.length - 1 ? "opacity-30 cursor-not-allowed" : ""
                    }`}
                    title="Move Layer Down"
                  >
                    ▼
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={(e) => handleDuplicate(layer, e)}
                    className="p-1 hover:text-amber-400 text-gray-400 transition-colors"
                    title="Duplicate Layer"
                  >
                    ➕
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => handleDelete(layer.id, e)}
                    className="p-1 hover:text-red-500 text-gray-400 transition-colors"
                    title="Delete Layer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Layer Instructions */}
      <div className="text-[9px] text-gray-400 border-t border-white/5 pt-2 text-center leading-normal">
        Select a layer to adjust properties. Drag & drop directly on the 3D shirt to position.
      </div>
    </div>
  );
};

export default LayerPanel;
