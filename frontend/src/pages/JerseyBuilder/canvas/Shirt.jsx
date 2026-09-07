import React, { useMemo, useRef, useState, useEffect } from "react";
import { useSnapshot } from "valtio";
import { Decal, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import state, { saveToHistory } from "../store";

// Helper hook to load dynamic images without suspending
const useDynamicTexture = (url) => {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!url) return;
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTexture(tex);
    };
    img.onerror = (err) => {
      console.error("Failed to load dynamic image texture:", err);
    };
  }, [url]);

  return texture;
};

// Component to project dynamic uploaded images
const DynamicDecal = ({ textureUrl, ...decalProps }) => {
  const texture = useDynamicTexture(textureUrl);
  if (!texture) return null;
  return <Decal map={texture} anisotropy={16} {...decalProps} />;
};

// Component to project high-quality canvas text
const TextDecal = ({
  text,
  font,
  color,
  outlineColor,
  outlineWidth,
  isCurved,
  fontSize = 40,
  isNumber = false,
  isName = false,
  ...decalProps
}) => {
  const texture = useMemo(() => {
    if (!text) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 1024, 1024);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Setup text colors
    ctx.fillStyle = color || "#ffffff";

    if (outlineWidth && outlineColor) {
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outlineWidth * 2.5; // Scale for 1024 resolution
      ctx.lineJoin = "round";
    }

    if (isNumber) {
      // Bold athletic-style numbering
      ctx.font = `bold ${fontSize * 5.0}px ${font || "Impact"}`;
      if (outlineWidth && outlineColor) {
        ctx.strokeText(text, 512, 512);
      }
      ctx.fillText(text, 512, 512);
    } else {
      // Bold player name lettering
      ctx.font = `bold ${fontSize * 2.2}px ${font || "Impact"}`;

      if (isName) {
        // Apply canvas letter spacing for straight names
        ctx.letterSpacing = `${fontSize * 0.45}px`;
      }

      if (isCurved) {
        // Curve along top arc
        const len = text.length;
        const radius = 350;
        // Spacing along arc is controlled by rotation angles
        const angleSpread = len * (isName ? 0.22 : 0.14);
        const startAngle = -Math.PI / 2 - angleSpread / 2;

        ctx.save();
        ctx.translate(512, 850); // Arc origin

        for (let i = 0; i < len; i++) {
          const charAngle = startAngle + (i + 0.5) * (angleSpread / len);
          ctx.save();
          ctx.rotate(charAngle + Math.PI / 2);
          if (outlineWidth && outlineColor) {
            ctx.strokeText(text[i], 0, -radius);
          }
          ctx.fillText(text[i], 0, -radius);
          ctx.restore();
        }
        ctx.restore();
      } else {
        if (outlineWidth && outlineColor) {
          ctx.strokeText(text, 512, 512);
        }
        ctx.fillText(text, 512, 512);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    tex.needsUpdate = true;
    return tex;
  }, [text, font, color, outlineColor, outlineWidth, isCurved, fontSize, isNumber, isName]);

  if (!texture) return null;
  return <Decal map={texture} anisotropy={16} {...decalProps} />;
};

const Shirt = () => {
  const snap = useSnapshot(state);
  const { nodes, materials } = useGLTF("/shirt_baked.glb");
  const isDraggingRef = useRef(false);

  // Split GLB mesh programmatically into Body, Sleeves, and Collar
  const { bodyGeometry, sleevesGeometry, collarGeometry } = useMemo(() => {
    const originalGeometry = nodes.T_Shirt_male.geometry;
    const indexAttr = originalGeometry.index;
    const positionAttr = originalGeometry.attributes.position;

    const bodyIndices = [];
    const sleevesIndices = [];
    const collarIndices = [];

    for (let i = 0; i < indexAttr.count; i += 3) {
      const i1 = indexAttr.getX(i);
      const i2 = indexAttr.getX(i + 1);
      const i3 = indexAttr.getX(i + 2);

      const p1_x = positionAttr.getX(i1), p1_y = positionAttr.getY(i1);
      const p2_x = positionAttr.getX(i2), p2_y = positionAttr.getY(i2);
      const p3_x = positionAttr.getX(i3), p3_y = positionAttr.getY(i3);

      const avgX = (p1_x + p2_x + p3_x) / 3;
      const avgY = (p1_y + p2_y + p3_y) / 3;

      if (avgY > 0.20 && Math.abs(avgX) < 0.08) {
        collarIndices.push(i1, i2, i3);
      } else if (Math.abs(avgX) > 0.17) {
        sleevesIndices.push(i1, i2, i3);
      } else {
        bodyIndices.push(i1, i2, i3);
      }
    }

    const bodyGeom = originalGeometry.clone();
    bodyGeom.setIndex(new THREE.BufferAttribute(new Uint32Array(bodyIndices), 1));

    const sleevesGeom = originalGeometry.clone();
    sleevesGeom.setIndex(new THREE.BufferAttribute(new Uint32Array(sleevesIndices), 1));

    const collarGeom = originalGeometry.clone();
    collarGeom.setIndex(new THREE.BufferAttribute(new Uint32Array(collarIndices), 1));

    return {
      bodyGeometry: bodyGeom,
      sleevesGeometry: sleevesGeom,
      collarGeometry: collarGeom,
    };
  }, [nodes.T_Shirt_male.geometry]);

  // Generate canvas base pattern texture dynamically
  const patternTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");

    const primary = snap.colors.primary;
    const secondary = snap.colors.secondary;
    const accent = snap.colors.accent;
    const type = snap.pattern.type;
    const scale = snap.pattern.scale;
    const opacity = snap.pattern.opacity;

    // Draw background color
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, 1024, 1024);

    if (type !== "solid") {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = secondary;

      if (type === "stripes") {
        const stripeWidth = 40 * scale;
        const gap = 40 * scale;
        for (let x = 0; x < 1024; x += stripeWidth + gap) {
          ctx.fillRect(x, 0, stripeWidth, 1024);
        }
      } else if (type === "horizontal") {
        const stripeHeight = 40 * scale;
        const gap = 40 * scale;
        for (let y = 0; y < 1024; y += stripeHeight + gap) {
          ctx.fillRect(0, y, 1024, stripeHeight);
        }
      } else if (type === "diagonal") {
        const stripeWidth = 40 * scale;
        const gap = 40 * scale;
        ctx.save();
        ctx.translate(512, 512);
        ctx.rotate(Math.PI / 4 + snap.pattern.rotation);
        ctx.translate(-1024, -1024);
        for (let x = 0; x < 2048; x += stripeWidth + gap) {
          ctx.fillRect(x, 0, stripeWidth, 2048);
        }
        ctx.restore();
      } else if (type === "gradient") {
        const grad = ctx.createLinearGradient(0, 0, 0, 1024);
        grad.addColorStop(0, primary);
        grad.addColorStop(1, secondary);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 1.0;
        ctx.fillRect(0, 0, 1024, 1024);
      } else if (type === "camo") {
        // Deterministic seed generation
        let seed = 88;
        const random = () => {
          const x = Math.sin(seed++) * 10000;
          return x - Math.floor(x);
        };

        // Draw camo spots
        ctx.fillStyle = secondary;
        for (let i = 0; i < 25; i++) {
          ctx.beginPath();
          const startX = random() * 1024;
          const startY = random() * 1024;
          ctx.moveTo(startX, startY);
          for (let j = 0; j < 4; j++) {
            ctx.lineTo(
              startX + (random() - 0.5) * 350 * scale,
              startY + (random() - 0.5) * 350 * scale
            );
          }
          ctx.closePath();
          ctx.fill();
        }

        // Draw accent spots
        ctx.fillStyle = accent;
        for (let i = 0; i < 15; i++) {
          ctx.beginPath();
          const startX = random() * 1024;
          const startY = random() * 1024;
          ctx.moveTo(startX, startY);
          for (let j = 0; j < 3; j++) {
            ctx.lineTo(
              startX + (random() - 0.5) * 200 * scale,
              startY + (random() - 0.5) * 200 * scale
            );
          }
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    ctx.globalAlpha = 1.0;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [
    snap.colors.primary,
    snap.colors.secondary,
    snap.colors.accent,
    snap.pattern.type,
    snap.pattern.scale,
    snap.pattern.opacity,
    snap.pattern.rotation,
  ]);

  // Pointer drag events for direct 3D placement of layers
  const handlePointerDown = (e) => {
    e.stopPropagation();

    // Disable dragging on right clicks
    if (e.button === 2) return;

    const localPoint = e.object.worldToLocal(e.point.clone());

    // Filter which side's layers are eligible for clicks
    const clickedSide = localPoint.z > 0 ? "front" : "back";

    let clickedLayerId = null;
    let minDistance = 0.08; // Click threshold distance in meters

    state.layers.forEach((layer) => {
      if (!layer.visible || layer.side !== clickedSide) return;

      const layerPos = new THREE.Vector3().fromArray(layer.position);
      const dist = localPoint.distanceTo(layerPos);

      if (dist < minDistance) {
        minDistance = dist;
        clickedLayerId = layer.id;
      }
    });

    if (clickedLayerId) {
      state.selectedLayerId = clickedLayerId;
      isDraggingRef.current = true;
      e.target.setPointerCapture(e.pointerId);
    } else {
      // Deselect if clicking on empty jersey space
      state.selectedLayerId = null;
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || !state.selectedLayerId) return;
    e.stopPropagation();

    const localPoint = e.object.worldToLocal(e.point.clone());
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(e.object.matrixWorld);
    const localNormal = e.face.normal.clone().applyMatrix3(normalMatrix).normalize();

    const index = state.layers.findIndex((l) => l.id === state.selectedLayerId);
    if (index !== -1) {
      state.layers[index].position = [localPoint.x, localPoint.y, localPoint.z];
      state.layers[index].side = localPoint.z > 0 ? "front" : "back";
      state.layers[index].normal = [localNormal.x, localNormal.y, localNormal.z];

      // Re-orient decal rotation to stay flush along normal
      const obj = new THREE.Object3D();
      obj.position.copy(localPoint);
      obj.lookAt(localPoint.clone().add(localNormal));
      obj.rotateZ(state.layers[index].rotationAngle || 0);

      state.layers[index].rotation = [obj.rotation.x, obj.rotation.y, obj.rotation.z];
    }
  };

  const handlePointerUp = (e) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      e.target.releasePointerCapture(e.pointerId);
      saveToHistory();
    }
  };

  return (
    <group key={JSON.stringify(snap.colors) + snap.pattern.type}>
      {/* 1. MAIN BODY */}
      <mesh
        castShadow
        receiveShadow
        geometry={bodyGeometry}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <meshStandardMaterial
          map={patternTexture}
          roughness={0.8}
          metalness={0.05}
          normalMap={materials.lambert1.normalMap}
          normalScale={new THREE.Vector2(0.3, 0.3)}
          aoMap={materials.lambert1.aoMap}
          aoMapIntensity={1.2}
        />

        {/* Dynamic Graphic & Logo Layers */}
        {snap.layers.map((layer) => {
          if (!layer.visible) return null;

          const isLayerSelected = snap.selectedLayerId === layer.id;

          return (
            <React.Fragment key={layer.id}>
              {layer.type === "image" ? (
                <DynamicDecal
                  textureUrl={layer.texture}
                  position={layer.position}
                  rotation={layer.rotation}
                  scale={layer.scale}
                  opacity={layer.opacity}
                  depthWrite={true}
                  depthTest={false}
                />
              ) : (
                <TextDecal
                  text={layer.text}
                  font={layer.font}
                  color={layer.color}
                  outlineColor={layer.outlineColor}
                  outlineWidth={layer.outlineWidth}
                  position={layer.position}
                  rotation={layer.rotation}
                  scale={layer.scale}
                  opacity={layer.opacity}
                  fontSize={layer.fontSize}
                  depthWrite={true}
                  depthTest={false}
                />
              )}

              {/* Gold outline ring around the selected layer */}
              {isLayerSelected && (
                <mesh
                  position={new THREE.Vector3()
                    .fromArray(layer.position)
                    .add(
                      new THREE.Vector3()
                        .fromArray(layer.normal || [0, 0, 1])
                        .multiplyScalar(0.003)
                    )}
                  rotation={layer.rotation}
                >
                  <ringGeometry args={[layer.scale * 0.47, layer.scale * 0.5, 32]} />
                  <meshBasicMaterial
                    color="#ffcc00"
                    depthTest={false}
                    depthWrite={false}
                    transparent
                  />
                </mesh>
              )}
            </React.Fragment>
          );
        })}

        {/* Player Name (Back) */}
        {snap.player.name && (
          <TextDecal
            text={snap.player.name}
            font={snap.player.font}
            color={snap.player.color}
            outlineColor={snap.player.outlineColor}
            outlineWidth={snap.player.outlineWidth}
            isCurved={snap.player.isCurved}
            fontSize={snap.player.fontSize}
            position={[0, snap.player.yPosition, -0.12]}
            rotation={[0, Math.PI, 0]}
            scale={0.3}
            depthWrite={true}
            depthTest={false}
            isName={true}
          />
        )}

        {/* Player Number (Back) */}
        {snap.player.number && (
          <TextDecal
            text={snap.player.number}
            font={snap.player.font}
            color={snap.player.color}
            outlineColor={snap.player.outlineColor}
            outlineWidth={snap.player.outlineWidth}
            isNumber={true}
            fontSize={snap.player.numberFontSize}
            position={[0, snap.player.numYPosition, -0.12]}
            rotation={[0, Math.PI, 0]}
            scale={0.4}
            depthWrite={true}
            depthTest={false}
          />
        )}
      </mesh>

      {/* 2. SLEEVES */}
      <mesh castShadow receiveShadow geometry={sleevesGeometry}>
        <meshStandardMaterial
          color={snap.colors.secondary}
          roughness={0.8}
          metalness={0.05}
          normalMap={materials.lambert1.normalMap}
          normalScale={new THREE.Vector2(0.3, 0.3)}
          aoMap={materials.lambert1.aoMap}
          aoMapIntensity={1.2}
        />
      </mesh>

      {/* 3. COLLAR */}
      <mesh castShadow receiveShadow geometry={collarGeometry}>
        <meshStandardMaterial
          color={snap.colors.collar}
          roughness={0.8}
          metalness={0.05}
          normalMap={materials.lambert1.normalMap}
          normalScale={new THREE.Vector2(0.3, 0.3)}
          aoMap={materials.lambert1.aoMap}
          aoMapIntensity={1.2}
        />
      </mesh>
    </group>
  );
};

export default Shirt;
