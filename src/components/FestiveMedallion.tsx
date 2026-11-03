import { useState, useRef, useCallback, type MouseEvent, type TouchEvent } from 'react';

interface FestiveMedallionProps {
  size?: 'desktop' | 'mobile';
  className?: string;
  onBurst?: (clientX: number, clientY: number) => void;
}

interface ShockwaveItem {
  id: number;
}

export function FestiveMedallion({
  size = 'desktop',
  className = '',
  onBurst,
}: FestiveMedallionProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [shockwaves, setShockwaves] = useState<ShockwaveItem[]>([]);

  // 3D Parallax Tilt Handler
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (clientX - centerX) / (rect.width / 2);
    const deltaY = (clientY - centerY) / (rect.height / 2);

    const tiltX = Math.max(-16, Math.min(16, -deltaY * 14));
    const tiltY = Math.max(-16, Math.min(16, deltaX * 14));

    card.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);

    const glowX = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const glowY = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    card.style.setProperty('--glow-x', `${glowX.toFixed(1)}%`);
    card.style.setProperty('--glow-y', `${glowY.toFixed(1)}%`);
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    handlePointerMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches && e.touches[0]) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
    card.style.setProperty('--glow-x', '50%');
    card.style.setProperty('--glow-y', '50%');
  };

  // Interactive Tap / Click Celebration Action (Spawns shockwaves and golden particles; no audio, no blessing labels)
  const handleMedallionTap = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    let clientX: number;
    let clientY: number;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      const rect = cardRef.current?.getBoundingClientRect();
      clientX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      clientY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    }

    // 1. Trigger golden celebration burst on parent canvas
    if (onBurst) {
      onBurst(clientX, clientY);
    }

    // 2. Spawn visual shockwave ring
    const newId = Date.now() + Math.random();
    setShockwaves((prev) => [...prev, { id: newId }]);
    window.setTimeout(() => {
      setShockwaves((prev) => prev.filter((item) => item.id !== newId));
    }, 1100);
  };

  const isMobile = size === 'mobile';

  return (
    <div
      className={`medallion-stage relative flex items-center justify-center select-none ${className}`}
      aria-label="Sto. Niño Parish Ceremonial Medallion"
    >
      {/* Shockwave Rings Container */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30" aria-hidden="true">
        {shockwaves.map((sw) => (
          <div key={sw.id} className="shockwave-ring" />
        ))}
      </div>

      {/* 3D Interactive Medallion Card */}
      <div
        ref={cardRef}
        className={`medallion-3d medallion-float relative rounded-full cursor-pointer group ${
          isMobile ? 'medallion-size--mobile' : 'medallion-size--desktop'
        }`}
        onClick={handleMedallionTap}
        onTouchStart={handleMedallionTap}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const rect = cardRef.current?.getBoundingClientRect();
            const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
            const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
            onBurst?.(cx, cy);
            const newId = Date.now() + Math.random();
            setShockwaves((prev) => [...prev, { id: newId }]);
            window.setTimeout(() => {
              setShockwaves((prev) => prev.filter((item) => item.id !== newId));
            }, 1100);
          }
        }}
        title="Sto. Niño Parish Ceremonial Medallion"
      >
        {/* Layered Ceremonial SVG with Rotating Mandalas and Authentic Parish Seal */}
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full overflow-visible drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Outer Dark Crimson Vignette Plate Gradient */}
            <radialGradient id="festiveCrimsonPlateGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8c111b" />
              <stop offset="68%" stopColor="#5d0c13" />
              <stop offset="94%" stopColor="#42070c" />
              <stop offset="100%" stopColor="#2a0407" />
            </radialGradient>

            {/* Metallic 3D Gold Rim Gradient */}
            <linearGradient id="festiveGoldRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff0a8" />
              <stop offset="25%" stopColor="#d99f26" />
              <stop offset="50%" stopColor="#7a4d06" />
              <stop offset="75%" stopColor="#f5c242" />
              <stop offset="100%" stopColor="#fff0a8" />
            </linearGradient>

            {/* Circular Clip Path for Central Parish Seal */}
            <clipPath id="parishCenterSealClip">
              <circle cx="250" cy="250" r="140" />
            </clipPath>

            {/* Primary 12-Fold White & Crimson Lotus Mandala Petal */}
            <g id="festiveMandalaPetal">
              {/* Outer White Flame Petal */}
              <path
                d="M250,46
                   C268,75 288,100 282,135
                   C278,155 264,168 250,172
                   C236,168 222,155 218,135
                   C212,100 232,75 250,46 Z"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              {/* Inner Crimson Teardrop Cutout */}
              <path
                d="M250,62
                   C262,85 275,104 271,130
                   C268,144 258,154 250,158
                   C242,154 232,144 229,130
                   C225,104 238,85 250,62 Z"
                fill="#800f17"
              />
              {/* Fine White Filigree Ribs Inside Petal */}
              <path
                d="M250,74 C258,94 265,110 262,132 C259,142 254,149 250,152 C246,149 241,142 238,132 C235,110 242,94 250,74 Z"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                opacity="0.9"
              />
              <path
                d="M250,86 C255,102 258,115 256,132 C254,140 252,145 250,147 C248,145 246,140 244,132 C242,115 245,102 250,86 Z"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.6"
                opacity="0.85"
              />
              <line x1="250" y1="68" x2="250" y2="155" stroke="#ffffff" strokeWidth="1.8" opacity="0.9" />
            </g>

            {/* Secondary Interstitial Lotus Tip */}
            <g id="festiveInnerLotusTip">
              <path
                d="M250,65 C260,84 268,102 264,122 C250,130 250,130 236,122 C232,102 240,84 250,65 Z"
                fill="#ffffff"
                opacity="0.85"
              />
              <path
                d="M250,75 C256,90 260,104 257,118 C250,124 250,124 243,118 C240,104 244,90 250,75 Z"
                fill="#b8141f"
              />
            </g>
          </defs>

          {/* 1. Base Plate & Crimson Shield */}
          <circle cx="250" cy="250" r="242" fill="#2c0609" opacity="0.6" />
          <circle
            cx="250"
            cy="250"
            r="230"
            fill="url(#festiveCrimsonPlateGrad)"
            stroke="url(#festiveGoldRimGrad)"
            strokeWidth="6"
          />
          {/* Subtle Inner Dashed Gold Rim */}
          <circle
            cx="250"
            cy="250"
            r="218"
            fill="none"
            stroke="#f5c242"
            strokeWidth="1"
            strokeDasharray="6 6"
            opacity="0.45"
            className="spin-slow"
          />

          {/* 2. Sacred Sunburst Rays (Rotating Slowly in Reverse) */}
          <g className="spin-reverse-slow" opacity="0.48">
            <g stroke="url(#festiveGoldRimGrad)" strokeWidth="1.6">
              <line x1="250" y1="28" x2="250" y2="472" />
              <line x1="28" y1="250" x2="472" y2="250" />
              <line x1="93" y1="93" x2="407" y2="407" />
              <line x1="407" y1="93" x2="93" y2="407" />
              <line x1="165" y1="45" x2="335" y2="455" />
              <line x1="45" y1="165" x2="455" y2="335" />
              <line x1="335" y1="45" x2="165" y2="455" />
              <line x1="455" y1="165" x2="45" y2="335" />
            </g>
          </g>

          {/* 3. Secondary 12-Fold Interstitial Lotus Petals (Rotating in Reverse) */}
          <g className="spin-reverse-slow">
            <use href="#festiveInnerLotusTip" transform="rotate(15 250 250)" />
            <use href="#festiveInnerLotusTip" transform="rotate(45 250 250)" />
            <use href="#festiveInnerLotusTip" transform="rotate(75 250 250)" />
            <use href="#festiveInnerLotusTip" transform="rotate(105 250 250)" />
            <use href="#festiveInnerLotusTip" transform="rotate(135 250 250)" />
            <use href="#festiveInnerLotusTip" transform="rotate(165 250 250)" />
            <use href="#festiveInnerLotusTip" transform="rotate(195 250 250)" />
            <use href="#festiveInnerLotusTip" transform="rotate(225 250 250)" />
            <use href="#festiveInnerLotusTip" transform="rotate(255 250 250)" />
            <use href="#festiveInnerLotusTip" transform="rotate(285 250 250)" />
            <use href="#festiveInnerLotusTip" transform="rotate(315 250 250)" />
            <use href="#festiveInnerLotusTip" transform="rotate(345 250 250)" />
          </g>

          {/* 4. Primary 12-Fold White & Crimson Lotus Mandala Ring (Rotating Forward) */}
          <g className="spin-slow">
            <use href="#festiveMandalaPetal" transform="rotate(0 250 250)" />
            <use href="#festiveMandalaPetal" transform="rotate(30 250 250)" />
            <use href="#festiveMandalaPetal" transform="rotate(60 250 250)" />
            <use href="#festiveMandalaPetal" transform="rotate(90 250 250)" />
            <use href="#festiveMandalaPetal" transform="rotate(120 250 250)" />
            <use href="#festiveMandalaPetal" transform="rotate(150 250 250)" />
            <use href="#festiveMandalaPetal" transform="rotate(180 250 250)" />
            <use href="#festiveMandalaPetal" transform="rotate(210 250 250)" />
            <use href="#festiveMandalaPetal" transform="rotate(240 250 250)" />
            <use href="#festiveMandalaPetal" transform="rotate(270 250 250)" />
            <use href="#festiveMandalaPetal" transform="rotate(300 250 250)" />
            <use href="#festiveMandalaPetal" transform="rotate(330 250 250)" />
          </g>

          {/* 5. Scalloped Red & Gold Rosette Rim Behind Official Seal */}
          <circle cx="250" cy="250" r="148" fill="#8f0f18" stroke="#ffffff" strokeWidth="2.5" />
          <circle
            cx="250"
            cy="250"
            r="142"
            fill="#34090d"
            stroke="url(#festiveGoldRimGrad)"
            strokeWidth="5"
          />

          {/* 6. Central Official Sto. Niño Parish Seal (Replaces the cartoon logo) */}
          <g clipPath="url(#parishCenterSealClip)">
            <circle cx="250" cy="250" r="140" fill="#34090d" />
            <image
              href="/images/parish_logo.webp"
              x="110"
              y="110"
              width="280"
              height="280"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>

          {/* 7. Metallic Gold Ring Frame Over the Seal with Specular Highlight */}
          <circle
            cx="250"
            cy="250"
            r="140"
            fill="none"
            stroke="url(#festiveGoldRimGrad)"
            strokeWidth="4"
          />
          <circle
            cx="250"
            cy="250"
            r="140"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            opacity="0.35"
          />
        </svg>

        {/* Dynamic Specular Glare Overlay */}
        <div className="medallion-glare" aria-hidden="true" />
      </div>
    </div>
  );
}
