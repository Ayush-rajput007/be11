import React, { useRef } from "react";
import { useSnapshot } from "valtio";
import * as THREE from "three";
import state, { saveToHistory } from "../store";
import { reader } from "../config/helpers";

const LogoEditor = () => {
  const snap = useSnapshot(state);
  const fileInputRef = useRef(null);

  // Find currently selected image layer
  const selectedLayer = snap.layers.find((l) => l.id === snap.selectedLayerId);
  const isImageSelected = selectedLayer && selectedLayer.type === "image";

  // Handle uploading logo file
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size exceeds 5MB. Please upload a smaller image.");
      return;
    }

    reader(file).then((base64Result) => {
      const newLayerId = `layer-${Date.now()}`;
      // Put new logo in center front
      const newLayer = {
        id: newLayerId,
        type: "image",
        side: snap.view === "back" ? "back" : "front",
        texture: base64Result,
        position: snap.view === "back" ? [0, 0.04, -0.12] : [0, 0.04, 0.14],
        rotation: snap.view === "back" ? [0, Math.PI, 0] : [0, 0, 0],
        rotationAngle: 0,
        normal: snap.view === "back" ? [0, 0, -1] : [0, 0, 1],
        scale: 0.15,
        opacity: 1,
        name: file.name.substring(0, 15) || "Custom Logo",
        visible: true
      };

      state.layers.push(newLayer);
      state.selectedLayerId = newLayerId;
      saveToHistory();
    });
  };

  const handleUpdate = (prop, val) => {
    if (!isImageSelected) return;
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
    } else if (prop === "scale" || prop === "opacity") {
      state.layers[index][prop] = parseFloat(val);
    } else if (prop === "side") {
      state.layers[index].side = val;
      // Mirror position Z coordinates when switching sides
      const prevPos = [...state.layers[index].position];
      state.layers[index].position = [prevPos[0], prevPos[1], val === "back" ? -0.12 : 0.14];
      state.layers[index].normal = val === "back" ? [0, 0, -1] : [0, 0, 1];
      state.layers[index].rotation = val === "back" ? [0, Math.PI, 0] : [0, 0, 0];
      state.layers[index].rotationAngle = 0;
    }
  };

  const handleSliderComplete = () => {
    saveToHistory();
  };

  // Quick positioning buttons mapping
  const quickPositions = {
    "Top Left": [-0.06, 0.08],
    "Top Center": [0.0, 0.08],
    "Top Right": [0.06, 0.08],
    "Center Left": [-0.06, -0.04],
    "Center": [0.0, -0.04],
    "Center Right": [0.06, -0.04],
    "Bottom Left": [-0.06, -0.15],
    "Bottom Center": [0.0, -0.15],
    "Bottom Right": [0.06, -0.15]
  };

  const applyQuickPosition = (coords) => {
    if (!isImageSelected) return;
    const index = state.layers.findIndex((l) => l.id === snap.selectedLayerId);
    if (index === -1) return;

    const side = state.layers[index].side;
    const [qx, qy] = coords;
    
    // Project flush depth coordinate (Z)
    const qz = side === "back" ? -0.12 : 0.14;
    state.layers[index].position = [qx, qy, qz];
    state.layers[index].normal = side === "back" ? [0, 0, -1] : [0, 0, 1];
    state.layers[index].rotation = side === "back" ? [0, Math.PI, 0] : [0, 0, 0];
    state.layers[index].rotationAngle = 0;
    saveToHistory();
  };

  return (
    <div className="flex flex-col gap-4 p-4 glassmorphism rounded-lg text-white w-[260px] max-h-[420px] overflow-y-auto">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300 border-b border-white/10 pb-2">
        Logo & Graphics
      </h3>

      {/* Upload button */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => fileInputRef.current.click()}
          className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold py-2 px-3 rounded text-center transition-all duration-200 shadow-md shadow-amber-500/10"
        >
          Upload Custom Logo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleLogoUpload}
          className="hidden"
        />
        <p className="text-[9px] text-gray-400 text-center">Supports PNG, JPG, WEBP (Max 5MB)</p>
      </div>

      {isImageSelected ? (
        <div className="flex flex-col gap-3.5 border-t border-white/5 pt-3 mt-1">
          <div className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">
            Editing: {selectedLayer.name}
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

          {/* Logo Scale */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Size</span>
              <span className="text-amber-400 font-bold">{Math.round(selectedLayer.scale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.04"
              max="0.4"
              step="0.01"
              value={selectedLayer.scale}
              onChange={(e) => handleUpdate("scale", e.target.value)}
              onMouseUp={handleSliderComplete}
              onTouchEnd={handleSliderComplete}
              className="w-full accent-amber-500 cursor-pointer h-1 bg-black/40 rounded-lg appearance-none"
            />
          </div>

          {/* Logo Rotation */}
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

          {/* Logo Opacity */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Opacity</span>
              <span className="text-amber-400 font-bold">{Math.round(selectedLayer.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={selectedLayer.opacity}
              onChange={(e) => handleUpdate("opacity", e.target.value)}
              onMouseUp={handleSliderComplete}
              onTouchEnd={handleSliderComplete}
              className="w-full accent-amber-500 cursor-pointer h-1 bg-black/40 rounded-lg appearance-none"
            />
          </div>

          {/* Quick Align buttons */}
          <div className="flex flex-col gap-1.5 border-t border-white/5 pt-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Quick Align</span>
            <div className="grid grid-cols-3 gap-1">
              {Object.keys(quickPositions).map((posName) => (
                <button
                  key={posName}
                  onClick={() => applyQuickPosition(quickPositions[posName])}
                  className="bg-black/25 hover:bg-black/50 border border-white/10 hover:border-white/20 text-[9px] py-1 rounded text-center transition-all duration-200 truncate"
                >
                  {posName}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-xs text-gray-400 py-6 border-t border-white/5 mt-2">
          Select an image layer in the right Layer panel or click above to upload a new logo to customize.
        </div>
      )}
    </div>
  );
};

export default LogoEditor;
