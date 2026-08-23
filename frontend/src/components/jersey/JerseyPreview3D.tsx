import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface JerseyPreview3DProps {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pattern: string;
  patternScale: number;
  patternRotation: number;
  patternOpacity: number;
  patternIntensity: number;
  collar: string;
  sleeves: string;
  playerName: string;
  playerNumber: string;
  teamName: string;
  font: string;
  numberStyle: string;
  view: 'front' | 'back' | 'left' | 'right' | 'top';
  logoUrl?: string;
  logoScale?: number;
  logoX?: number;
  logoY?: number;
  logoRotate?: number;
  sponsorUrl?: string;
  sponsorScale?: number;
  sponsorX?: number;
  sponsorY?: number;
  sponsorRotate?: number;
  badges?: string[];
  fabric?: string;
  autoRotate?: boolean;
  activeLayer?: 'logo' | 'sponsor' | 'teamName' | 'playerName' | 'number' | null;
  onSelectLayer?: (layer: 'logo' | 'sponsor' | 'teamName' | 'playerName' | 'number' | null) => void;
  onExportReady?: (exportFn: () => string) => void;
}

export const JerseyPreview3D: React.FC<JerseyPreview3DProps> = (props) => {
  const {
    primaryColor,
    secondaryColor,
    accentColor,
    pattern,
    patternScale,
    patternRotation,
    patternOpacity,
    patternIntensity,
    playerName,
    playerNumber,
    teamName,
    font,
    numberStyle,
    view,
    logoUrl,
    logoScale = 1.0,
    logoX = 256,
    logoY = 220,
    logoRotate = 0,
    sponsorUrl,
    sponsorScale = 1.0,
    sponsorX = 256,
    sponsorY = 400,
    sponsorRotate = 0,
    badges = [],
    fabric = 'Standard',
    autoRotate = false,
    activeLayer = null,
    onSelectLayer,
    onExportReady,
  } = props;

  const mountRef = useRef<HTMLDivElement>(null);
  const textureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Cache logo and sponsor image loads to prevent canvas flicker
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const sponsorImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!logoUrl) {
      logoImgRef.current = null;
      drawTextureCanvas();
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = logoUrl;
    img.onload = () => {
      logoImgRef.current = img;
      drawTextureCanvas();
    };
  }, [logoUrl]);

  useEffect(() => {
    if (!sponsorUrl) {
      sponsorImgRef.current = null;
      drawTextureCanvas();
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sponsorUrl;
    img.onload = () => {
      sponsorImgRef.current = img;
      drawTextureCanvas();
    };
  }, [sponsorUrl]);

  // 1. Draw dynamic 2D canvas texture
  const drawTextureCanvas = () => {
    let canvas = textureCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      textureCanvasRef.current = canvas;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, 1024, 1024);

    // Apply Pattern style
    ctx.save();
    ctx.globalAlpha = patternOpacity;
    
    // Set pattern rotation and scale matrix on ctx
    if (pattern !== 'Plain') {
      const centerX = 512;
      const centerY = 512;
      ctx.translate(centerX, centerY);
      ctx.rotate((patternRotation * Math.PI) / 180);
      ctx.scale(patternScale, patternScale);
      ctx.translate(-centerX, -centerY);
    }

    // Secondary color with intensity adjustments
    ctx.fillStyle = secondaryColor;
    ctx.strokeStyle = secondaryColor;

    if (pattern === 'Gradient') {
      const grad = ctx.createLinearGradient(0, 0, 0, 1024);
      grad.addColorStop(0, primaryColor);
      grad.addColorStop(1, accentColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);
    } else if (pattern === 'Stripes') {
      for (let i = -512; i < 1536; i += 120) {
        ctx.fillRect(i, -512, 50 * patternIntensity, 2048);
      }
    } else if (pattern === 'Diagonal') {
      ctx.lineWidth = 40 * patternIntensity;
      for (let i = -1536; i < 1536; i += 160) {
        ctx.beginPath();
        ctx.moveTo(i, -512);
        ctx.lineTo(i + 2048, 1536);
        ctx.stroke();
      }
    } else if (pattern === 'Hexagon') {
      ctx.lineWidth = 4 * patternIntensity;
      const size = 60;
      for (let y = -512; y < 1536; y += size * 1.5) {
        for (let x = -512; x < 1536; x += size * Math.sqrt(3)) {
          ctx.beginPath();
          for (let side = 0; side < 6; side++) {
            const angle = (side * Math.PI) / 3;
            const xOffset = x + (y / (size * 1.5) % 2 === 0 ? 0 : (size * Math.sqrt(3)) / 2);
            ctx.lineTo(xOffset + size * Math.cos(angle), y + size * Math.sin(angle));
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    } else if (pattern === 'Lightning') {
      ctx.beginPath();
      ctx.moveTo(350, -200);
      ctx.lineTo(520, 300);
      ctx.lineTo(420, 350);
      ctx.lineTo(600, 850);
      ctx.lineTo(440, 450);
      ctx.lineTo(540, 400);
      ctx.closePath();
      ctx.fill();
    } else if (pattern === 'Camouflage') {
      for (let i = 0; i < 20; i++) {
        const x = (i * 73) % 1024;
        const y = (i * 97) % 1024;
        const r = (50 + (i * 13) % 100) * patternIntensity;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = accentColor;
      for (let i = 0; i < 15; i++) {
        const x = (i * 89) % 1024;
        const y = (i * 61) % 1024;
        const r = (30 + (i * 17) % 80) * patternIntensity;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (pattern === 'Wave') {
      ctx.lineWidth = 15 * patternIntensity;
      for (let y = -200; y < 1200; y += 150) {
        ctx.beginPath();
        for (let x = -200; x < 1200; x += 10) {
          ctx.lineTo(x, y + Math.sin(x / 60) * 40);
        }
        ctx.stroke();
      }
    } else if (pattern === 'Mesh' || pattern === 'Carbon') {
      ctx.globalAlpha = 0.2 * patternIntensity;
      for (let i = -512; i < 1536; i += 20) {
        ctx.fillRect(i, -512, 3, 2048);
        ctx.fillRect(-512, i, 2048, 3);
      }
    }
    ctx.restore();

    // Select sport fonts family
    let fontFamily = 'sans-serif';
    if (font === 'Classic') fontFamily = 'Georgia, serif';
    if (font === 'Bold' || font === 'Outline' || font === 'IPL' || font === 'Athletic') {
      fontFamily = 'Impact, "Arial Black", sans-serif';
    }

    // FRONT ZONE
    ctx.textAlign = 'center';
    
    // Team Name
    ctx.font = `bold 68px ${fontFamily}`;
    ctx.fillStyle = secondaryColor;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeText(teamName, 256, 350);
    ctx.fillText(teamName, 256, 350);

    // Front Chest Number
    ctx.font = `bold 96px ${fontFamily}`;
    ctx.strokeText(playerNumber, 256, 520);
    ctx.fillText(playerNumber, 256, 520);

    // Badges / Flags (Procedural tri-color flag graphic)
    if (badges.length > 0) {
      ctx.fillStyle = '#FF9933';
      ctx.fillRect(80, 200, 40, 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(80, 210, 40, 10);
      ctx.fillStyle = '#138808';
      ctx.fillRect(80, 220, 40, 10);

      // Captain Badge
      if (badges.includes('Captain Badge')) {
        ctx.fillStyle = '#D97706';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(80 + 20, 260, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('C', 80 + 20, 267);
      }
    }

    // BACK ZONE
    // Player Name
    ctx.font = `bold 58px ${fontFamily}`;
    ctx.fillStyle = secondaryColor;
    ctx.strokeText(playerName, 768, 270);
    ctx.fillText(playerName, 768, 270);

    // Big Squad Number
    ctx.font = `bold 240px ${fontFamily}`;
    if (numberStyle === 'Outline') {
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 14;
      ctx.strokeText(playerNumber, 768, 550);
    } else if (numberStyle === 'Shadow') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillText(playerNumber, 774, 556);
      ctx.fillStyle = secondaryColor;
      ctx.strokeText(playerNumber, 768, 550);
      ctx.fillText(playerNumber, 768, 550);
    } else {
      ctx.strokeText(playerNumber, 768, 550);
      ctx.fillText(playerNumber, 768, 550);
    }

    // DRAW LOGO
    if (logoImgRef.current) {
      ctx.save();
      ctx.translate(logoX, logoY);
      ctx.rotate((logoRotate * Math.PI) / 180);
      const w = logoImgRef.current.width * logoScale * 0.4;
      const h = logoImgRef.current.height * logoScale * 0.4;
      ctx.drawImage(logoImgRef.current, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    // DRAW SPONSOR
    if (sponsorImgRef.current) {
      ctx.save();
      ctx.translate(sponsorX, sponsorY);
      ctx.rotate((sponsorRotate * Math.PI) / 180);
      const w = sponsorImgRef.current.width * sponsorScale * 0.4;
      const h = sponsorImgRef.current.height * sponsorScale * 0.4;
      ctx.drawImage(sponsorImgRef.current, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    // Draw active layer selection highlight box
    if (activeLayer) {
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 8]);
      if (activeLayer === 'logo') {
        ctx.strokeRect(logoX - 60, logoY - 60, 120, 120);
      } else if (activeLayer === 'sponsor') {
        ctx.strokeRect(sponsorX - 120, sponsorY - 40, 240, 80);
      } else if (activeLayer === 'teamName') {
        ctx.strokeRect(256 - 150, 350 - 50, 300, 80);
      } else if (activeLayer === 'playerName') {
        ctx.strokeRect(768 - 150, 270 - 40, 300, 70);
      } else if (activeLayer === 'number') {
        ctx.strokeRect(768 - 100, 550 - 150, 200, 220);
      }
      ctx.setLineDash([]);
    }

    // Mark texture for update
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  };

  // 2. Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Dimensions
    const width = mountRef.current.clientWidth || 360;
    const height = mountRef.current.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#06060A'); // Deep dark configurator backdrop
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 3.0);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.minDistance = 1.3;
    controls.maxDistance = 4.5;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 1.5);
    dirLight.position.set(3, 4, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0002;
    scene.add(dirLight);

    const backRimLight = new THREE.DirectionalLight('#6366f1', 1.0); // Indigo rim highlight
    backRimLight.position.set(-3, 2, -3);
    scene.add(backRimLight);

    const softFillLight = new THREE.PointLight('#ffffff', 0.5, 10);
    softFillLight.position.set(-2, 1, 2);
    scene.add(softFillLight);

    // Dynamic Canvas Texture mapping
    drawTextureCanvas();
    const canvas = textureCanvasRef.current;
    if (canvas) {
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      textureRef.current = texture;
    }

    // Fabric Normal micro weave bumps
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = 128;
    normalCanvas.height = 128;
    const normalCtx = normalCanvas.getContext('2d');
    if (normalCtx) {
      normalCtx.fillStyle = '#8080ff';
      normalCtx.fillRect(0, 0, 128, 128);
      normalCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      for (let x = 0; x < 128; x += 4) {
        normalCtx.fillRect(x, 0, 1, 128);
        normalCtx.fillRect(0, x, 128, 1);
      }
    }
    const normalTexture = new THREE.CanvasTexture(normalCanvas);
    normalTexture.wrapS = THREE.RepeatWrapping;
    normalTexture.wrapT = THREE.RepeatWrapping;
    normalTexture.repeat.set(22, 22);

    // Parse Fabric properties mapping
    let finalRoughness = 0.85;
    let finalMetalness = 0.02;
    if (fabric === 'Dry Fit') {
      finalRoughness = 0.70;
      finalMetalness = 0.05;
    } else if (fabric === 'Performance') {
      finalRoughness = 0.65;
      finalMetalness = 0.08;
    } else if (fabric === 'Elite') {
      finalRoughness = 0.58;
      finalMetalness = 0.12;
    } else if (fabric === 'Mesh') {
      finalRoughness = 0.90;
      finalMetalness = 0.01;
    } else if (fabric === 'Premium Knit') {
      finalRoughness = 0.88;
      finalMetalness = 0.02;
    }

    // Torso cylindrical parametric PBR jersey body mesh
    // Subdivided cylinder to apply deforming drapery folds
    const torsoGeom = new THREE.CylinderGeometry(0.5, 0.52, 1.2, 64, 64, true);
    
    // MATHEMATICAL JERSEY SHAPE MODIFICATION (REPLICATING Dropped Shoulders and Folds of reference shirt!)
    const posAttr = torsoGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      let px = posAttr.getX(i);
      let py = posAttr.getY(i);
      let pz = posAttr.getZ(i);

      // Horizontal angle
      const angle = Math.atan2(pz, px);
      
      // Shape profile R(y)
      let r = 0.52;
      if (py > 0.3) {
        const t = (py - 0.3) / 0.3; // 0 at py=0.3, 1 at py=0.6
        r = 0.52 * (1 - t) + 0.22 * t; // Taper neck opening
        if (py < 0.5) {
          r += Math.sin(t * Math.PI) * 0.07; // shoulder flare bulge
        }
      }

      // Vertical drapery folds
      const folds = Math.sin(py * 6.5) * Math.cos(angle * 2) * 0.028;
      // High-frequency cloth wrinkles
      const wrinkles = Math.sin(py * 24 + angle * 3) * 0.005;

      // Curved bottom hem
      let hemCurve = 0;
      if (py < -0.5) {
        hemCurve = Math.cos(angle) * 0.035;
      }

      const finalR = r + folds + wrinkles;
      posAttr.setX(i, Math.cos(angle) * finalR);
      posAttr.setY(i, py + hemCurve);
      posAttr.setZ(i, Math.sin(angle) * finalR);
    }
    torsoGeom.computeVertexNormals();

    const torsoMat = new THREE.MeshStandardMaterial({
      map: textureRef.current,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.15, 0.15),
      roughness: finalRoughness,
      metalness: finalMetalness,
      side: THREE.DoubleSide,
    });

    const torsoMesh = new THREE.Mesh(torsoGeom, torsoMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    scene.add(torsoMesh);

    // Loose Dropped Sleeves Geometries (deformed and slanted)
    const lSleeveGeom = new THREE.CylinderGeometry(0.21, 0.18, 0.46, 32, 16);
    const lSleevePos = lSleeveGeom.attributes.position;
    for (let i = 0; i < lSleevePos.count; i++) {
      let sx = lSleevePos.getX(i);
      let sy = lSleevePos.getY(i);
      let sz = lSleevePos.getZ(i);
      const angle = Math.atan2(sz, sx);
      
      let r = 0.18;
      if (sy < 0) {
        r += (0 - sy) * 0.06; // flare cuffs
      }
      const folds = Math.sin(sy * 12 + angle) * 0.008;
      const finalR = r + folds;
      lSleevePos.setX(i, Math.cos(angle) * finalR);
      lSleevePos.setZ(i, Math.sin(angle) * finalR);
    }
    lSleeveGeom.computeVertexNormals();

    const lSleeveMesh = new THREE.Mesh(lSleeveGeom, torsoMat);
    lSleeveMesh.position.set(-0.62, 0.38, 0);
    lSleeveMesh.rotation.z = Math.PI / 3.2;
    scene.add(lSleeveMesh);

    // Right sleeve
    const rSleeveGeom = new THREE.CylinderGeometry(0.21, 0.18, 0.46, 32, 16);
    const rSleevePos = rSleeveGeom.attributes.position;
    for (let i = 0; i < rSleevePos.count; i++) {
      let sx = rSleevePos.getX(i);
      let sy = rSleevePos.getY(i);
      let sz = rSleevePos.getZ(i);
      const angle = Math.atan2(sz, sx);
      
      let r = 0.18;
      if (sy < 0) {
        r += (0 - sy) * 0.06;
      }
      const folds = Math.sin(sy * 12 + angle) * 0.008;
      const finalR = r + folds;
      rSleevePos.setX(i, Math.cos(angle) * finalR);
      rSleevePos.setZ(i, Math.sin(angle) * finalR);
    }
    rSleeveGeom.computeVertexNormals();

    const rSleeveMesh = new THREE.Mesh(rSleeveGeom, torsoMat);
    rSleeveMesh.position.set(0.62, 0.38, 0);
    rSleeveMesh.rotation.z = -Math.PI / 3.2;
    scene.add(rSleeveMesh);

    // Crew Neck Collar Rim Mesh
    const collarGeom = new THREE.TorusGeometry(0.24, 0.04, 12, 32);
    const collarMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(secondaryColor),
      roughness: 0.85,
    });
    const collarMesh = new THREE.Mesh(collarGeom, collarMat);
    collarMesh.position.set(0, 0.58, 0);
    collarMesh.rotation.x = Math.PI / 2;
    scene.add(collarMesh);

    // Floor shadow plane
    const shadowGeo = new THREE.PlaneGeometry(4, 4);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.4 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.72;
    shadowMesh.receiveShadow = true;
    scene.add(shadowMesh);

    // Dynamic click Raycasting listener
    const handleCanvasClick = (event: MouseEvent) => {
      if (!renderer.domElement || !onSelectLayer) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const clickX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const clickY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(clickX, clickY), camera);
      const intersects = raycaster.intersectObjects([torsoMesh], true);

      if (intersects.length > 0 && intersects[0].uv) {
        const uv = intersects[0].uv;
        const tx = uv.x * 1024;
        const ty = (1 - uv.y) * 1024;

        // Front zones selection
        if (uv.x < 0.5) {
          if (tx > logoX - 80 && tx < logoX + 80 && ty > logoY - 80 && ty < logoY + 80 && logoUrl) {
            onSelectLayer('logo');
          } else if (tx > sponsorX - 150 && tx < sponsorX + 150 && ty > sponsorY - 80 && ty < sponsorY + 80 && sponsorUrl) {
            onSelectLayer('sponsor');
          } else if (ty > 280 && ty < 400) {
            onSelectLayer('teamName');
          } else if (ty > 440 && ty < 600) {
            onSelectLayer('number');
          }
        } else {
          // Back zones selection
          if (ty > 200 && ty < 320) {
            onSelectLayer('playerName');
          } else if (ty > 400 && ty < 750) {
            onSelectLayer('number');
          }
        }
      }
    };
    renderer.domElement.addEventListener('mousedown', handleCanvasClick);

    // Export snapshots trigger hook
    if (onExportReady) {
      onExportReady(() => {
        renderer.render(scene, camera);
        return renderer.domElement.toDataURL('image/png');
      });
    }

    // Animation loop (floating sways & auto-rotation)
    let animId = 0;
    let clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Soft breathing motion
      const breath = Math.sin(elapsedTime * 1.6) * 0.014;
      torsoMesh.position.y = breath;
      lSleeveMesh.position.y = 0.38 + breath;
      rSleeveMesh.position.y = 0.38 + breath;
      collarMesh.position.y = 0.58 + breath;

      // Soft cloth wind sway
      const scaleX = 1 + Math.sin(elapsedTime * 2.2) * 0.006;
      torsoMesh.scale.set(scaleX, 1, 1);

      if (autoRotate) {
        torsoMesh.rotation.y += 0.007;
        lSleeveMesh.rotation.y += 0.007;
        rSleeveMesh.rotation.y += 0.007;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('mousedown', handleCanvasClick);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      controls.dispose();
      torsoGeom.dispose();
      lSleeveGeom.dispose();
      rSleeveGeom.dispose();
      collarGeom.dispose();
      torsoMat.dispose();
      collarMat.dispose();
    };
  }, [onExportReady, fabric]);

  // 3. Trigger redraw texture canvas on property updates
  useEffect(() => {
    drawTextureCanvas();
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.2;
    }
  }, [
    primaryColor, secondaryColor, accentColor, pattern, patternScale, patternRotation, patternOpacity, patternIntensity,
    playerName, playerNumber, teamName, font, numberStyle, badges, autoRotate, activeLayer,
    logoScale, logoX, logoY, logoRotate, sponsorScale, sponsorX, sponsorY, sponsorRotate
  ]);

  // 4. Orientation view camera bindings
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    controlsRef.current.target.set(0, 0, 0);
    if (view === 'back') {
      cameraRef.current.position.set(0, 0.4, -3.0);
    } else if (view === 'left') {
      cameraRef.current.position.set(-3.0, 0.4, 0);
    } else if (view === 'right') {
      cameraRef.current.position.set(3.0, 0.4, 0);
    } else if (view === 'top') {
      cameraRef.current.position.set(0, 3.0, 0.05);
    } else {
      cameraRef.current.position.set(0, 0.4, 3.0);
    }
  }, [view]);

  return (
    <div className="relative w-full h-full min-h-[480px] flex items-center justify-center overflow-hidden rounded-3xl border border-white/5 bg-[#08080C] shadow-3xl">
      <div className="absolute top-4 right-4 flex gap-1.5 items-center bg-black/50 px-3.5 py-2 rounded-full backdrop-blur-lg border border-white/10 z-10 select-none pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
        <span className="text-[10px] text-indigo-300 font-black uppercase tracking-wider">3D PBR RENDERER</span>
      </div>
      <div ref={mountRef} className="w-full h-full" style={{ minHeight: '480px' }} />
    </div>
  );
};
