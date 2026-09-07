import React, { useRef, useEffect, useState } from 'react';

interface JerseyPreviewMockupProps {
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
  onExportReady?: (exportFn: () => string) => void;
}

export const JerseyPreviewMockup: React.FC<JerseyPreviewMockupProps> = (props) => {
  const {
    primaryColor,
    secondaryColor,
    accentColor,
    pattern,
    patternScale,
    patternRotation,
    patternOpacity,
    patternIntensity,
    collar,
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
    onExportReady,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Cache logo and sponsor image loads
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const sponsorImgRef = useRef<HTMLImageElement | null>(null);

  // Mockup WebP source images
  const assetSources = {
    shading: '/jersey-mockup/shading.webp',
    body_mask: '/jersey-mockup/body_mask.webp',
    collar_mask: '/jersey-mockup/collar_mask.webp',
    collar_band_mask: '/jersey-mockup/collar_band_mask.webp',
    hand_mask: '/jersey-mockup/hand_mask.webp',
    hand_border_mask: '/jersey-mockup/hand_border_mask.webp',
  };

  // 1. Preload mockup WebP layers
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    const promises = Object.entries(assetSources).map(([key, url]) => {
      return new Promise<[string, HTMLImageElement]>((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve([key, img]);
        img.onerror = () => reject(new Error(`Failed to load ${key}`));
      });
    });

    Promise.all(promises)
      .then((results) => {
        if (!active) return;
        const imgMap = Object.fromEntries(results);
        setLoadedImages(imgMap);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (active) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // 2. Load custom Logo & Sponsor graphics
  useEffect(() => {
    if (!logoUrl) {
      logoImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = logoUrl;
    img.onload = () => {
      logoImgRef.current = img;
      drawCanvas();
    };
  }, [logoUrl]);

  useEffect(() => {
    if (!sponsorUrl) {
      sponsorImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sponsorUrl;
    img.onload = () => {
      sponsorImgRef.current = img;
      drawCanvas();
    };
  }, [sponsorUrl]);

  // 3. Draw mockup composition onto Canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || loading || error) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1200;
    const H = 834;

    ctx.clearRect(0, 0, W, H);

    // Create an offscreen canvas for rendering individual layers with their respective masks
    const offscreen = document.createElement('canvas');
    offscreen.width = W;
    offscreen.height = H;
    const oCtx = offscreen.getContext('2d');
    if (!oCtx) return;

    // Helper to draw a masked layer
    const drawMaskedLayer = (maskImg: HTMLImageElement, fillStyle: string | CanvasGradient, drawFn?: (c: CanvasRenderingContext2D) => void) => {
      oCtx.clearRect(0, 0, W, H);
      oCtx.save();
      // Draw mask shape
      oCtx.drawImage(maskImg, 0, 0, W, H);
      // Clip to mask
      oCtx.globalCompositeOperation = 'source-in';
      oCtx.fillStyle = fillStyle;
      oCtx.fillRect(0, 0, W, H);

      if (drawFn) {
        drawFn(oCtx);
      }
      oCtx.restore();

      // Paste masked layer onto main canvas
      ctx.drawImage(offscreen, 0, 0);
    };

    // a. Render Collar Band (Accent Color)
    if (loadedImages.collar_band_mask) {
      drawMaskedLayer(loadedImages.collar_band_mask, accentColor);
    }

    // b. Render Collar (Secondary Color)
    if (loadedImages.collar_mask) {
      drawMaskedLayer(loadedImages.collar_mask, secondaryColor, (c) => {
        c.save();
        c.strokeStyle = accentColor;
        c.lineWidth = 6;
        if (collar === 'V Neck') {
          c.beginPath();
          c.moveTo(W / 2 - 90, 85);
          c.lineTo(W / 2, 160);
          c.lineTo(W / 2 + 90, 85);
          c.stroke();
        } else if (collar === 'Polo') {
          c.beginPath();
          c.moveTo(W / 2, 115);
          c.lineTo(W / 2, 165);
          c.stroke();
          c.lineWidth = 4;
          c.fillStyle = secondaryColor;
          c.beginPath();
          c.moveTo(W / 2 - 90, 85);
          c.lineTo(W / 2 - 20, 120);
          c.lineTo(W / 2, 120);
          c.lineTo(W / 2 + 20, 120);
          c.lineTo(W / 2 + 90, 85);
          c.stroke();
        } else if (collar === 'Mandarin') {
          c.beginPath();
          c.arc(W / 2, 105, 5, 0, Math.PI * 2);
          c.fillStyle = accentColor;
          c.fill();
        } else if (collar === 'Elite') {
          c.beginPath();
          c.moveTo(W / 2 - 90, 85);
          c.lineTo(W / 2, 150);
          c.lineTo(W / 2 + 90, 85);
          c.stroke();
          c.strokeStyle = '#FFFFFF';
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(W / 2 - 80, 85);
          c.lineTo(W / 2, 140);
          c.lineTo(W / 2 + 80, 85);
          c.stroke();
        }
        c.restore();
      });
    }

    // c. Render Sleeves Cuffs (Accent Color)
    if (loadedImages.hand_mask) {
      drawMaskedLayer(loadedImages.hand_mask, accentColor);
    }

    // d. Render Sleeves Cuffs Border (Secondary Color)
    if (loadedImages.hand_border_mask) {
      drawMaskedLayer(loadedImages.hand_border_mask, secondaryColor);
    }

    // e. Render Jersey Body (Primary Color + Pattern + Custom Graphics & Fonts)
    if (loadedImages.body_mask) {
      drawMaskedLayer(loadedImages.body_mask, primaryColor, (c) => {
        // Apply patterns
        c.save();
        c.globalAlpha = patternOpacity;

        // Apply scale/rotation translate matrix
        if (pattern !== 'Plain') {
          c.translate(W / 2, H / 2);
          c.rotate((patternRotation * Math.PI) / 180);
          c.scale(patternScale, patternScale);
          c.translate(-W / 2, -H / 2);
        }

        c.fillStyle = secondaryColor;
        c.strokeStyle = secondaryColor;

        if (pattern === 'Gradient') {
          const grad = c.createLinearGradient(0, 0, 0, H);
          grad.addColorStop(0, primaryColor);
          grad.addColorStop(1, accentColor);
          c.fillStyle = grad;
          c.fillRect(0, 0, W, H);
        } else if (pattern === 'Stripes') {
          for (let i = -W; i < W * 2; i += 100) {
            c.fillRect(i, -H, 40 * patternIntensity, H * 3);
          }
        } else if (pattern === 'Diagonal') {
          c.lineWidth = 30 * patternIntensity;
          for (let i = -W * 2; i < W * 2; i += 120) {
            c.beginPath();
            c.moveTo(i, -H);
            c.lineTo(i + W * 2, H * 2);
            c.stroke();
          }
        } else if (pattern === 'Hexagon' || pattern === 'Geometric') {
          c.lineWidth = 3 * patternIntensity;
          const size = 50;
          for (let y = -H; y < H * 2; y += size * 1.5) {
            for (let x = -W; x < W * 2; x += size * Math.sqrt(3)) {
              c.beginPath();
              for (let side = 0; side < 6; side++) {
                const angle = (side * Math.PI) / 3;
                const xOffset = x + (y / (size * 1.5) % 2 === 0 ? 0 : (size * Math.sqrt(3)) / 2);
                c.lineTo(xOffset + size * Math.cos(angle), y + size * Math.sin(angle));
              }
              c.closePath();
              c.stroke();
            }
          }
        } else if (pattern === 'Chevron') {
          c.lineWidth = 25 * patternIntensity;
          for (let y = -200; y < H + 200; y += 100) {
            c.beginPath();
            c.moveTo(W / 2 - 400, y);
            c.lineTo(W / 2, y + 120);
            c.lineTo(W / 2 + 400, y);
            c.stroke();
          }
        } else if (pattern === 'Lightning') {
          c.beginPath();
          c.moveTo(W / 2 - 100, -100);
          c.lineTo(W / 2 + 50, H / 2 - 50);
          c.lineTo(W / 2 - 30, H / 2);
          c.lineTo(W / 2 + 150, H + 100);
          c.lineTo(W / 2 + 20, H / 2 + 80);
          c.lineTo(W / 2 + 100, H / 2 + 30);
          c.closePath();
          c.fill();
        } else if (pattern === 'Camouflage') {
          // Draw deterministic splotches
          for (let i = 0; i < 24; i++) {
            const x = (i * 123) % W;
            const y = (i * 187) % H;
            const r = (45 + (i * 23) % 110) * patternIntensity;
            c.beginPath();
            c.arc(x, y, r, 0, Math.PI * 2);
            c.fill();
          }
          c.fillStyle = accentColor;
          for (let i = 0; i < 18; i++) {
            const x = (i * 149) % W;
            const y = (i * 131) % H;
            const r = (25 + (i * 29) % 75) * patternIntensity;
            c.beginPath();
            c.arc(x, y, r, 0, Math.PI * 2);
            c.fill();
          }
        } else if (pattern === 'Wave') {
          c.lineWidth = 12 * patternIntensity;
          for (let y = -100; y < H + 100; y += 120) {
            c.beginPath();
            for (let x = -100; x < W + 100; x += 15) {
              c.lineTo(x, y + Math.sin(x / 50) * 30);
            }
            c.stroke();
          }
        } else if (pattern === 'Mesh' || pattern === 'Carbon') {
          c.globalAlpha = 0.15 * patternIntensity;
          for (let i = -W; i < W * 2; i += 15) {
            c.fillRect(i, -H, 2, H * 3);
            c.fillRect(-W, i, W * 3, 2);
          }
        }
        c.restore();

        // Draw fabric micro-textures
        if (fabric === 'Mesh') {
          c.save();
          c.globalAlpha = 0.08;
          c.fillStyle = '#000000';
          for (let y = 0; y < H; y += 4) {
            for (let x = 0; x < W; x += 4) {
              c.fillRect(x + (y % 8 === 0 ? 2 : 0), y, 1.5, 1.5);
            }
          }
          c.restore();
        } else if (fabric === 'Premium Knit') {
          c.save();
          c.globalAlpha = 0.06;
          c.strokeStyle = '#ffffff';
          c.lineWidth = 1;
          for (let x = 0; x < W; x += 6) {
            c.beginPath();
            c.moveTo(x, 0);
            c.lineTo(x, H);
            c.stroke();
          }
          c.restore();
        } else if (fabric === 'Performance') {
          c.save();
          c.globalAlpha = 0.05;
          c.strokeStyle = '#000000';
          c.lineWidth = 0.5;
          for (let x = -W; x < W; x += 8) {
            c.beginPath();
            c.moveTo(x, 0);
            c.lineTo(x + H, H);
            c.stroke();
            c.beginPath();
            c.moveTo(x + H, 0);
            c.lineTo(x, H);
            c.stroke();
          }
          c.restore();
        }

        // 4. Font Typography settings
        let fontFamily = 'sans-serif';
        if (font === 'Classic') fontFamily = 'Georgia, serif';
        if (font === 'Bold' || font === 'Outline' || font === 'IPL' || font === 'Athletic') {
          fontFamily = 'Impact, "Arial Black", sans-serif';
        }

        // 5. Draw graphics on body depending on View
        if (view === 'back') {
          // PLAYER NAME (Back view)
          c.save();
          c.textAlign = 'center';
          c.font = `bold 38px ${fontFamily}`;
          c.fillStyle = secondaryColor;
          c.strokeStyle = 'rgba(0,0,0,0.8)';
          c.lineWidth = 5;
          // Slight perspective curve on jersey
          c.strokeText(playerName || 'PLAYER', W / 2, 280);
          c.fillText(playerName || 'PLAYER', W / 2, 280);

          // SQUAD NUMBER (Large center number)
          c.font = `bold 160px ${fontFamily}`;
          if (numberStyle === 'Outline') {
            c.strokeStyle = secondaryColor;
            c.lineWidth = 10;
            c.strokeText(playerNumber || '10', W / 2, 450);
          } else if (numberStyle === 'Shadow') {
            c.fillStyle = 'rgba(0, 0, 0, 0.45)';
            c.fillText(playerNumber || '10', W / 2 + 5, 455);
            c.fillStyle = secondaryColor;
            c.strokeText(playerNumber || '10', W / 2, 450);
            c.fillText(playerNumber || '10', W / 2, 450);
          } else {
            c.strokeText(playerNumber || '10', W / 2, 450);
            c.fillText(playerNumber || '10', W / 2, 450);
          }
          c.restore();
        } else {
          // FRONT VIEW GRAPHICS
          c.save();
          c.textAlign = 'center';

          // Team Name banner
          c.font = `bold 44px ${fontFamily}`;
          c.fillStyle = secondaryColor;
          c.strokeStyle = 'rgba(0,0,0,0.8)';
          c.lineWidth = 6;
          c.strokeText(teamName || 'TEAM NAME', W / 2, 330);
          c.fillText(teamName || 'TEAM NAME', W / 2, 330);

          // Small Chest Number
          c.font = `bold 54px ${fontFamily}`;
          c.strokeText(playerNumber, W / 2, 420);
          c.fillText(playerNumber, W / 2, 420);

          // Badges / Flags (Procedural champion badge / flag representation)
          if (badges.length > 0) {
            c.fillStyle = '#FF9933';
            c.fillRect(W / 2 - 130, 230, 32, 8);
            c.fillStyle = '#FFFFFF';
            c.fillRect(W / 2 - 130, 238, 32, 8);
            c.fillStyle = '#138808';
            c.fillRect(W / 2 - 130, 246, 32, 8);

            if (badges.includes('Captain Badge')) {
              c.fillStyle = '#D97706';
              c.strokeStyle = '#FFFFFF';
              c.lineWidth = 1.5;
              c.beginPath();
              c.arc(W / 2 - 114, 280, 14, 0, Math.PI * 2);
              c.fill();
              c.stroke();
              c.fillStyle = '#FFFFFF';
              c.font = 'bold 15px sans-serif';
              c.fillText('C', W / 2 - 114, 285);
            }
          }

          // Dynamic Sponsor logo drawing
          if (sponsorImgRef.current) {
            c.save();
            c.translate(sponsorX * 2.34, sponsorY * 0.95); // Slanted/scaled coordinates to match mockup coordinates
            c.rotate((sponsorRotate * Math.PI) / 180);
            const w = sponsorImgRef.current.width * sponsorScale * 0.35;
            const h = sponsorImgRef.current.height * sponsorScale * 0.35;
            c.drawImage(sponsorImgRef.current, -w / 2, -h / 2, w, h);
            c.restore();
          }

          // Dynamic Team badge logo drawing
          if (logoImgRef.current) {
            c.save();
            c.translate(logoX * 2.34, logoY * 0.95); // Slanted/scaled coordinates to match mockup coordinates
            c.rotate((logoRotate * Math.PI) / 180);
            const w = logoImgRef.current.width * logoScale * 0.35;
            const h = logoImgRef.current.height * logoScale * 0.35;
            c.drawImage(logoImgRef.current, -w / 2, -h / 2, w, h);
            c.restore();
          }
          c.restore();
        }
      });
    }

    // f. Draw Mockup Shading (Folds, Shadows, Highlights, Creases, Fabric Texture)
    if (loadedImages.shading) {
      ctx.save();
      let shadingOpacity = 0.85;
      if (fabric === 'Performance') shadingOpacity = 0.95;
      else if (fabric === 'Dry Fit') shadingOpacity = 0.78;
      else if (fabric === 'Elite') shadingOpacity = 1.0;
      else if (fabric === 'Mesh') shadingOpacity = 0.68;
      else if (fabric === 'Premium Knit') shadingOpacity = 1.0;
      ctx.globalAlpha = shadingOpacity;
      ctx.drawImage(loadedImages.shading, 0, 0, W, H);
      ctx.restore();
    }
  };

  // Draw canvas on props update or loading state change
  useEffect(() => {
    drawCanvas();
  }, [
    loadedImages, loading, error, primaryColor, secondaryColor, accentColor,
    pattern, patternScale, patternRotation, patternOpacity, patternIntensity,
    playerName, playerNumber, teamName, font, numberStyle, view, badges, fabric,
    logoScale, logoX, logoY, logoRotate, sponsorScale, sponsorX, sponsorY, sponsorRotate
  ]);

  // Expose export callback
  useEffect(() => {
    if (onExportReady && !loading && !error) {
      onExportReady(() => {
        const canvas = canvasRef.current;
        return canvas ? canvas.toDataURL('image/png') : '';
      });
    }
  }, [loading, error]);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[480px] flex flex-col items-center justify-center bg-[#08080C] rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-indigo-300 font-bold tracking-wider uppercase animate-pulse">Preparing your jersey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-[480px] flex flex-col items-center justify-center bg-[#08080C] rounded-3xl border border-white/5 shadow-2xl p-6 text-center">
        <span className="material-symbols-outlined text-rose-500 text-4xl mb-3">error</span>
        <p className="text-sm font-bold text-white uppercase tracking-wider">Jersey Preview Unavailable</p>
        <p className="text-xs text-gray-500 mt-1 max-w-xs leading-normal">The high-fidelity photographic mockup failed to load. Please check your connection and try again.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
        >
          Retry Preview
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[480px] flex items-center justify-center overflow-hidden rounded-3xl border border-white/5 bg-[#08080C] shadow-3xl select-none">
      {/* Visual Indicator */}
      <div className="absolute top-4 right-4 flex gap-1.5 items-center bg-black/60 px-3.5 py-2 rounded-full backdrop-blur-lg border border-white/10 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
        <span className="text-[9px] text-indigo-300 font-black uppercase tracking-wider">PSD PHOTO MOCKUP</span>
      </div>

      <canvas 
        ref={canvasRef} 
        width={1200} 
        height={834} 
        className="w-full h-auto max-w-full rounded-2xl drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
      />
    </div>
  );
};
