import React from 'react';
import Canvas from './canvas';
import Customizer from './pages/Customizer';
import Home from './pages/Home';
import './index.css';

export const JerseyBuilder = () => {
  return (
    <main className="jb-app transition-all ease-in">
      <Home />
      <Canvas />
      <Customizer />
    </main>
  );
};

export default JerseyBuilder;
