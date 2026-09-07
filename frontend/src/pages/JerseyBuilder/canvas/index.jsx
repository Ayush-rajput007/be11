import { Canvas } from "@react-three/fiber";
import { Environment, Center, ContactShadows, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useSnapshot } from "valtio";
import { easing } from "maath";

import Shirt from "./Shirt";
import state from "../store";

// Custom controller to handle smooth camera rotations to designated angles
const CameraController = () => {
  const { camera } = useThree();
  const snap = useSnapshot(state);
  const controlsRef = useRef();

  useFrame((state, delta) => {
    // Coordinate dampening for camera views
    if (snap.view === "front") {
      easing.damp3(camera.position, [0, 0, 2.0], 0.25, delta);
      if (controlsRef.current) easing.damp3(controlsRef.current.target, [0, 0, 0], 0.25, delta);
    } else if (snap.view === "back") {
      easing.damp3(camera.position, [0, 0, -2.0], 0.25, delta);
      if (controlsRef.current) easing.damp3(controlsRef.current.target, [0, 0, 0], 0.25, delta);
    } else if (snap.view === "left") {
      easing.damp3(camera.position, [-2.0, 0, 0], 0.25, delta);
      if (controlsRef.current) easing.damp3(controlsRef.current.target, [0, 0, 0], 0.25, delta);
    } else if (snap.view === "right") {
      easing.damp3(camera.position, [2.0, 0, 0], 0.25, delta);
      if (controlsRef.current) easing.damp3(controlsRef.current.target, [0, 0, 0], 0.25, delta);
    }

    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      minDistance={1.0}
      maxDistance={3.5}
      minPolarAngle={Math.PI / 4} // 45 deg
      maxPolarAngle={Math.PI - Math.PI / 4} // 135 deg
      onStart={() => {
        // Switch to free orbit if the user drags manually
        if (state.view !== "360") {
          state.view = "360";
        }
      }}
    />
  );
};

const CanvasModel = () => {
  const snap = useSnapshot(state);

  return (
    <div className="w-full h-full relative">
      {/* Dynamic Background Vignette in Studio */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none z-0" />

      <Canvas
        shadows
        camera={{ position: [0, 0, 2.0], fov: 25 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        className="w-full h-full relative z-1"
      >
        {/* Ambient and directional lights for soft shadows and high fidelity */}
        <ambientLight intensity={0.65} />
        
        {/* Soft fill light */}
        <directionalLight intensity={0.5} position={[-5, 5, 5]} />
        
        {/* Strong Key Light with shadow mapping */}
        <directionalLight
          intensity={1.2}
          position={[5, 10, 5]}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        
        {/* Back/Rim light for fabric silhouette edge highlight */}
        <directionalLight intensity={1.5} position={[0, 4, -8]} />

        {/* Studio environment mapping */}
        <Environment preset="city" />

        <Center>
          <Shirt />
        </Center>

        {/* Ground ambient occlusion floor shadow */}
        <ContactShadows
          position={[0, -0.42, 0]}
          opacity={0.6}
          scale={2.2}
          blur={1.6}
          far={0.6}
        />

        <CameraController />
      </Canvas>
    </div>
  );
};

export default CanvasModel;
