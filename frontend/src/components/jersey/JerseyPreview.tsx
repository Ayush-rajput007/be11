import React from 'react';

interface JerseyPreviewProps {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pattern: string;
  collar: string;
  sleeves: string;
  playerName: string;
  playerNumber: string;
  teamName: string;
  font: string;
  numberStyle: string;
  view: 'front' | 'back';
  logoUrl?: string;
  sponsorUrl?: string;
  sponsorPosition?: 'front' | 'back' | 'sleeve';
  badges?: string[];
  fabric?: string;
}

export const JerseyPreview: React.FC<JerseyPreviewProps> = ({
  primaryColor,
  secondaryColor,
  accentColor,
  pattern,
  collar,
  sleeves,
  playerName,
  playerNumber,
  teamName,
  font,
  numberStyle,
  view,
  logoUrl,
  sponsorUrl,
  sponsorPosition = 'front',
  badges = [],
}) => {
  // Map font names to CSS families
  const getFontFamily = (f: string) => {
    switch (f) {
      case 'Classic': return "'Cinzel', Georgia, serif";
      case 'Modern': return "'Outfit', sans-serif";
      case 'Bold': return "'Poppins', sans-serif";
      case 'Outline': return "'Outfit', sans-serif";
      case 'Shadow': return "'Poppins', sans-serif";
      default: return "'Inter', sans-serif";
    }
  };

  // Map number style attributes
  const getNumberStyleAttrs = (style: string, color: string) => {
    switch (style) {
      case 'Outline':
        return {
          fill: 'none',
          stroke: color,
          strokeWidth: '4px',
        };
      case 'Shadow':
        return {
          fill: color,
          filter: 'drop-shadow(3px 3px 2px rgba(0, 0, 0, 0.45))',
        };
      case 'Bold':
        return {
          fill: color,
          fontWeight: '900',
        };
      default:
        return {
          fill: color,
        };
    }
  };

  const fontFamily = getFontFamily(font);
  const numberAttrs = getNumberStyleAttrs(numberStyle, secondaryColor);

  return (
    <div className="relative w-full max-w-sm aspect-[4/5] bg-gray-50 rounded-24 border border-outline-variant/30 flex items-center justify-center p-6 shadow-sm overflow-hidden select-none">
      {/* 3D Fabric Wrinkles & Soft lighting overlays */}
      <div className="absolute inset-0 pointer-events-none z-30 mix-blend-overlay opacity-40 bg-gradient-to-b from-white/20 via-transparent to-black/30"></div>
      
      <svg
        viewBox="0 0 400 500"
        className="w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.15)]"
      >
        <defs>
          {/* Subtle Fabric pattern grid to simulate structure */}
          <pattern id="fabricTexture" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="none" />
            <path d="M 0 4 L 4 0 M 0 0 L 4 4" stroke="rgba(0, 0, 0, 0.04)" strokeWidth="0.5" />
          </pattern>

          {/* Gradients */}
          <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>

          {/* Custom Patterns */}
          <pattern id="stripesPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="20" height="40" fill={primaryColor} />
            <rect x="20" width="20" height="40" fill={secondaryColor} />
          </pattern>

          <pattern id="diagonalPattern" width="40" height="40" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="20" height="40" fill={primaryColor} />
            <rect x="20" width="20" height="40" fill={secondaryColor} />
          </pattern>

          <pattern id="hexagonPattern" width="30" height="52" patternUnits="userSpaceOnUse">
            <path d="M15 0 L30 8.6 L30 25.8 L15 34.4 L0 25.8 L0 8.6 Z" fill="none" stroke={secondaryColor} strokeWidth="1" />
            <path d="M15 52 L30 43.4 L30 26.2 L15 17.6 L0 26.2 L0 43.4 Z" fill="none" stroke={secondaryColor} strokeWidth="1" />
          </pattern>
        </defs>

        {/* Base Jersey Body path */}
        <g id="jersey-body">
          {/* Sleeves logic */}
          {sleeves !== 'Sleeveless' && (
            <>
              {/* Left Sleeve */}
              <path
                d="M 80 120 L 20 180 L 50 210 L 95 160 Z"
                fill={accentColor}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth="1.5"
              />
              {/* Right Sleeve */}
              <path
                d="M 320 120 L 380 180 L 350 210 L 305 160 Z"
                fill={accentColor}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth="1.5"
              />
            </>
          )}

          {/* Core Body Silhouette */}
          <path
            d="M 95 120 C 140 140, 260 140, 305 120 L 320 400 C 320 440, 80 440, 80 400 Z"
            fill={
              pattern === 'Gradient'
                ? 'url(#primaryGradient)'
                : pattern === 'Stripes'
                ? 'url(#stripesPattern)'
                : pattern === 'Diagonal'
                ? 'url(#diagonalPattern)'
                : pattern === 'Hexagon'
                ? 'url(#hexagonPattern)'
                : primaryColor
            }
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="1.5"
          />

          {/* Fabric Shimmer Grid Overlay */}
          <path
            d="M 95 120 C 140 140, 260 140, 305 120 L 320 400 C 320 440, 80 440, 80 400 Z"
            fill="url(#fabricTexture)"
            pointerEvents="none"
          />
        </g>

        {/* Pattern overlays (e.g. Lightning, Geometric, Camouflage) */}
        {pattern === 'Lightning' && (
          <path
            d="M 120 120 L 220 280 L 160 300 L 260 420 L 210 290 L 270 270 Z"
            fill={secondaryColor}
            opacity="0.75"
          />
        )}

        {pattern === 'Geometric' && (
          <g opacity="0.6">
            <polygon points="90,140 180,180 140,240" fill={secondaryColor} />
            <polygon points="310,140 220,180 260,240" fill={secondaryColor} />
            <polygon points="200,260 120,380 280,380" fill={accentColor} />
          </g>
        )}

        {/* Collar Variants */}
        <g id="collar">
          {collar === 'V Neck' && (
            <path d="M 160 125 L 200 165 L 240 125 C 220 130, 180 130, 160 125 Z" fill={secondaryColor} />
          )}
          {collar === 'Mandarin' && (
            <path d="M 160 120 C 180 110, 220 110, 240 120 L 240 135 C 220 125, 180 125, 160 135 Z" fill={secondaryColor} />
          )}
          {collar === 'Polo' && (
            <g>
              <path d="M 155 120 L 200 145 L 245 120 Z" fill={secondaryColor} />
              <path d="M 180 145 L 200 185 L 220 145 Z" fill="rgba(0,0,0,0.15)" />
            </g>
          )}
          {/* Default Round Neck */}
          {collar === 'Round Neck' && (
            <path d="M 160 120 C 180 135, 220 135, 240 120 C 230 110, 170 110, 160 120 Z" fill={secondaryColor} />
          )}
        </g>

        {/* Front Details (Logos, Sponsor, Badges) */}
        {view === 'front' && (
          <g id="front-graphics">
            {/* Team Logo Placement */}
            <g transform="translate(130, 180)">
              {logoUrl ? (
                <image href={logoUrl} x="-20" y="-20" width="40" height="40" />
              ) : (
                <circle r="15" fill={secondaryColor} stroke="white" strokeWidth="2" />
              )}
            </g>

            {/* Badges Placement */}
            <g transform="translate(270, 180)">
              {badges.length > 0 && (
                <circle r="12" fill="#D97706" stroke="white" strokeWidth="1.5" />
              )}
              {badges.includes('Champion Badge') && (
                <polygon points="270,172 273,178 280,180 275,185 277,192 270,188 263,192 265,185 260,180 267,178" fill="white" transform="translate(-270, -180) scale(0.6)" />
              )}
            </g>

            {/* Team Name banner */}
            <text
              x="200"
              y="250"
              textAnchor="middle"
              fill={secondaryColor}
              fontFamily={fontFamily}
              fontSize="20"
              fontWeight="900"
              letterSpacing="3"
            >
              {teamName || 'TEAM NAME'}
            </text>

            {/* Sponsor banner */}
            {sponsorUrl && sponsorPosition === 'front' && (
              <g transform="translate(150, 320)">
                <rect x="0" y="0" width="100" height="30" fill="white/10" rx="6" stroke="white/20" />
                <text x="50" y="20" textAnchor="middle" fill={secondaryColor} fontSize="10" fontWeight="bold">SPONSOR</text>
              </g>
            )}

            {/* Tiny chest number */}
            <text
              x="200"
              y="290"
              textAnchor="middle"
              {...numberAttrs}
              fontFamily={fontFamily}
              fontSize="28"
            >
              {playerNumber}
            </text>
          </g>
        )}

        {/* Back Details (Name and Large Number) */}
        {view === 'back' && (
          <g id="back-graphics">
            {/* Player Name */}
            <text
              x="200"
              y="180"
              textAnchor="middle"
              fill={secondaryColor}
              fontFamily={fontFamily}
              fontSize="22"
              fontWeight="bold"
              letterSpacing="2"
            >
              {playerName || 'PLAYER'}
            </text>

            {/* Player Large Number */}
            <text
              x="200"
              y="300"
              textAnchor="middle"
              {...numberAttrs}
              fontFamily={fontFamily}
              fontSize="85"
            >
              {playerNumber || '10'}
            </text>

            {/* Sponsor at Back option */}
            {sponsorUrl && sponsorPosition === 'back' && (
              <g transform="translate(150, 360)">
                <text x="50" y="20" textAnchor="middle" fill={secondaryColor} fontSize="9" fontWeight="bold">SPONSOR</text>
              </g>
            )}
          </g>
        )}

        {/* Photorealistic shadow mapping overlays */}
        <g id="shadows-and-creases" opacity="0.25" pointerEvents="none" style={{ mixBlendMode: 'multiply' }}>
          {/* Fold crease 1 */}
          <path d="M 120 180 Q 200 240, 280 200" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" />
          {/* Fold crease 2 */}
          <path d="M 100 320 Q 200 350, 300 310" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />
          {/* Shadow sides */}
          <path d="M 80 120 L 95 400" fill="none" stroke="black" strokeWidth="6" opacity="0.3" />
          <path d="M 320 120 L 305 400" fill="none" stroke="black" strokeWidth="6" opacity="0.3" />
        </g>
      </svg>
    </div>
  );
};
