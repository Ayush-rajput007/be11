import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSnapshot } from "valtio";

import state, {
  undo,
  redo,
  resetDesign,
  saveDesignToLocalStorage,
  loadDesignFromLocalStorage
} from "../store";

import {
  ColorControls,
  PatternEditor,
  LogoEditor,
  TextEditor,
  PlayerEditor,
  LayerPanel,
  PresetSelector,
  CustomButton
} from "../components";

import { fadeAnimation, slideAnimation } from "../config/motion";
import { downloadCanvasToImage } from "../config/helpers";

const Customizer = () => {
  const snap = useSnapshot(state);
  const [activeTab, setActiveTab] = useState("presets"); // 'colors', 'patterns', 'logos', 'text', 'player', 'presets'
  const [toast, setToast] = useState("");

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const tabs = [
    { id: "presets", label: "Presets", icon: "🏆" },
    { id: "colors", label: "Colors", icon: "🎨" },
    { id: "patterns", label: "Pattern", icon: "🏁" },
    { id: "logos", label: "Logos", icon: "🖼️" },
    { id: "text", label: "Text", icon: "🔤" },
    { id: "player", label: "Player", icon: "👤" }
  ];

  const handleSave = () => {
    const success = saveDesignToLocalStorage();
    if (success) {
      triggerToast("Design Saved to Local Storage!");
    } else {
      triggerToast("Failed to Save Design.");
    }
  };

  const handleLoad = () => {
    const success = loadDesignFromLocalStorage();
    if (success) {
      triggerToast("Design Loaded Successfully!");
    } else {
      triggerToast("No Saved Design Found.");
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset your design?")) {
      resetDesign();
      triggerToast("Design Reset to Default.");
    }
  };

  const handleDownload = () => {
    try {
      downloadCanvasToImage();
      triggerToast("Exporting Design PNG...");
    } catch (e) {
      console.error(e);
      triggerToast("Export Failed.");
    }
  };

  return (
    <AnimatePresence>
      {!snap.intro && (
        <>
          {/* TOAST NOTIFICATION CONTAINER */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold px-6 py-2.5 rounded-full shadow-2xl shadow-amber-500/20 text-xs tracking-wider uppercase border border-amber-300/20"
              >
                {toast}
              </motion.div>
            )}
          </AnimatePresence>

          {/* LEFT SIDEBAR (TOOLS & CONTROLS) */}
          <motion.div
            key="customizer-left"
            className="absolute top-5 left-5 bottom-5 z-10 flex gap-4 items-stretch pointer-events-none"
            {...slideAnimation("left")}
          >
            {/* Toolbar Buttons */}
            <div className="flex flex-col gap-2 p-2.5 bg-black/40 border border-white/5 backdrop-blur-md rounded-xl justify-center items-center pointer-events-auto shadow-2xl">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/25 scale-105"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                    title={tab.label}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className={`text-[9px] uppercase tracking-wider mt-1 font-bold ${
                      isActive ? "text-black" : "text-gray-400"
                    }`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Control Panel */}
            <div className="flex flex-col justify-center pointer-events-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "presets" && <PresetSelector />}
                  {activeTab === "colors" && <ColorControls />}
                  {activeTab === "patterns" && <PatternEditor />}
                  {activeTab === "logos" && <LogoEditor />}
                  {activeTab === "text" && <TextEditor />}
                  {activeTab === "player" && <PlayerEditor />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* VIEW CONTROLLER (TOP CENTER) */}
          <motion.div
            key="customizer-view"
            className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 p-1 bg-black/40 border border-white/5 backdrop-blur-md rounded-full shadow-xl"
            {...slideAnimation("down")}
          >
            {["front", "back", "left", "right", "360"].map((v) => {
              const isActive = snap.view === v;
              return (
                <button
                  key={v}
                  onClick={() => (state.view = v)}
                  className={`px-4 py-1.5 rounded-full text-[10px] uppercase font-extrabold tracking-wider transition-all duration-200 ${
                    isActive
                      ? "bg-white text-black font-extrabold"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {v === "360" ? "360°" : v}
                </button>
              );
            })}
          </motion.div>

          {/* RIGHT SIDEBAR (LAYERS & GLOBAL ACTIONS) */}
          <motion.div
            key="customizer-right"
            className="absolute top-5 right-5 bottom-5 z-10 flex flex-col gap-4 items-end pointer-events-none"
            {...slideAnimation("right")}
          >
            {/* Go Back Header */}
            <div className="pointer-events-auto">
              <CustomButton
                type="outline"
                title="← BACK HOME"
                handleClick={() => {
                  state.intro = true;
                }}
                customStyles="px-4 py-2 font-extrabold text-[10px] tracking-wider uppercase bg-black/30 text-white border-white/10 hover:bg-white/10"
              />
            </div>

            {/* Middle Layers Panel */}
            <div className="flex-1 flex flex-col justify-center pointer-events-auto">
              <LayerPanel />
            </div>

            {/* Bottom Actions Dashboard */}
            <div className="flex flex-col gap-2 p-3 bg-black/40 border border-white/5 backdrop-blur-md rounded-xl w-[260px] pointer-events-auto shadow-2xl">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-gray-400 border-b border-white/5 pb-1 mb-1">
                Studio Actions
              </h4>

              {/* Undo & Redo Row */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={undo}
                  disabled={snap.historyIndex <= 0}
                  className="bg-black/35 hover:bg-black/60 border border-white/10 text-xs py-2 rounded text-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                  title="Undo last change"
                >
                  ↩️ Undo
                </button>
                <button
                  onClick={redo}
                  disabled={snap.historyIndex >= snap.history.length - 1}
                  className="bg-black/35 hover:bg-black/60 border border-white/10 text-xs py-2 rounded text-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                  title="Redo last change"
                >
                  ↪️ Redo
                </button>
              </div>

              {/* Save, Load, and Reset Row */}
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                <button
                  onClick={handleSave}
                  className="bg-black/35 hover:bg-black/60 border border-white/10 text-[10px] py-2 rounded font-bold uppercase transition-all"
                  title="Save design to local storage"
                >
                  💾 Save
                </button>
                <button
                  onClick={handleLoad}
                  className="bg-black/35 hover:bg-black/60 border border-white/10 text-[10px] py-2 rounded font-bold uppercase transition-all"
                  title="Load design from local storage"
                >
                  📂 Load
                </button>
                <button
                  onClick={handleReset}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[10px] text-red-400 py-2 rounded font-bold uppercase transition-all"
                  title="Reset design"
                >
                  🔄 Reset
                </button>
              </div>

              {/* Export/Download Button */}
              <button
                onClick={handleDownload}
                className="mt-1.5 w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black text-xs font-black py-2.5 rounded shadow-lg shadow-amber-500/10 text-center uppercase tracking-wider transition-all duration-200"
              >
                📥 Download Jersey PNG
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Customizer;
