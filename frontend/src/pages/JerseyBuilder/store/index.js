import { proxy } from 'valtio';

const state = proxy({
  intro: true,
  view: 'front', // 'front', 'back', 'left', 'right', '360'
  selectedLayerId: null,
  
  // Custom multi-color selections
  colors: {
    primary: '#ffffff',
    secondary: '#ffffff',
    accent: '#ffffff',
    collar: '#ffffff',
  },

  // Base patterns overlay
  pattern: {
    type: 'solid', // 'solid', 'stripes', 'horizontal', 'diagonal', 'gradient', 'camo'
    scale: 1.0,
    rotation: 0,
    opacity: 0.5,
  },

  // Player jersey details (back)
  player: {
    name: 'VIRAT',
    number: '18',
    font: 'Impact',
    color: '#ffffff',
    outlineColor: '#000000',
    outlineWidth: 4,
    isCurved: false,
    fontSize: 40,
    numberFontSize: 85,
    yPosition: 0.12, // Name height
    numYPosition: -0.02, // Number height
  },

  // Editable decal/graphics layers
  layers: [
    {
      id: 'default-logo',
      type: 'image',
      side: 'front',
      texture: './threejs.png',
      position: [0, 0.04, 0.15],
      rotation: [0, 0, 0],
      rotationAngle: 0,
      normal: [0, 0, 1],
      scale: 0.15,
      opacity: 1,
      name: 'BE11 Logo',
      visible: true
    }
  ],

  // History lists for Undo/Redo (serializable snapshots)
  history: [],
  historyIndex: -1,
});

// Deep clone state data for history or local storage saving
const getClone = () => {
  return JSON.parse(
    JSON.stringify({
      colors: state.colors,
      pattern: state.pattern,
      player: state.player,
      layers: state.layers,
    })
  );
};

export const saveToHistory = () => {
  const snapshot = getClone();
  const nextHistory = state.history.slice(0, state.historyIndex + 1);
  nextHistory.push(snapshot);
  
  // Cap history at 30 levels to prevent memory issues
  if (nextHistory.length > 30) {
    nextHistory.shift();
  }
  
  state.history = nextHistory;
  state.historyIndex = nextHistory.length - 1;
};

export const undo = () => {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    const prev = state.history[state.historyIndex];
    state.colors = JSON.parse(JSON.stringify(prev.colors));
    state.pattern = JSON.parse(JSON.stringify(prev.pattern));
    state.player = JSON.parse(JSON.stringify(prev.player));
    state.layers = JSON.parse(JSON.stringify(prev.layers));
    state.selectedLayerId = null;
  }
};

export const redo = () => {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    const next = state.history[state.historyIndex];
    state.colors = JSON.parse(JSON.stringify(next.colors));
    state.pattern = JSON.parse(JSON.stringify(next.pattern));
    state.player = JSON.parse(JSON.stringify(next.player));
    state.layers = JSON.parse(JSON.stringify(next.layers));
    state.selectedLayerId = null;
  }
};

export const resetDesign = () => {
  state.colors = {
    primary: '#ffffff',
    secondary: '#ffffff',
    accent: '#ffffff',
    collar: '#ffffff',
  };
  state.pattern = {
    type: 'solid',
    scale: 1.0,
    rotation: 0,
    opacity: 0.5,
  };
  state.player = {
    name: 'VIRAT',
    number: '18',
    font: 'Impact',
    color: '#ffffff',
    outlineColor: '#000000',
    outlineWidth: 4,
    isCurved: false,
    fontSize: 40,
    numberFontSize: 85,
    yPosition: 0.12,
    numYPosition: -0.02,
  };
  state.layers = [
    {
      id: 'default-logo',
      type: 'image',
      side: 'front',
      texture: './threejs.png',
      position: [0, 0.04, 0.15],
      rotation: [0, 0, 0],
      rotationAngle: 0,
      normal: [0, 0, 1],
      scale: 0.15,
      opacity: 1,
      name: 'BE11 Logo',
      visible: true
    }
  ];
  state.selectedLayerId = null;
  saveToHistory();
};

export const saveDesignToLocalStorage = () => {
  try {
    const data = JSON.stringify(getClone());
    localStorage.setItem('be11_jersey_design', data);
    return true;
  } catch (err) {
    console.error('Failed to save design to localStorage:', err);
    return false;
  }
};

export const loadDesignFromLocalStorage = () => {
  try {
    const data = localStorage.getItem('be11_jersey_design');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.colors) state.colors = parsed.colors;
      if (parsed.pattern) state.pattern = parsed.pattern;
      if (parsed.player) state.player = parsed.player;
      if (parsed.layers) state.layers = parsed.layers;
      state.selectedLayerId = null;
      saveToHistory();
      return true;
    }
  } catch (err) {
    console.error('Failed to load design from localStorage:', err);
  }
  return false;
};

// Initialize the first history state
saveToHistory();

export default state;