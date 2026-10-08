'use client';

import { useRef, useState, useCallback } from 'react';
import { useMapInteraction } from '../hooks/useMapInteraction';
import { LocationNode } from './LocationNode';
import { LOCATIONS } from '../data/locationsData';
import { Sparkles, Radio, Compass } from 'lucide-react';

export function InteractiveWorldMap() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mapWrapperRef = useRef(null);

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeCoords, setActiveCoords] = useState({ lat: '52.37° N', lon: '4.90° E' });
  const [mapBounds, setMapBounds] = useState({ mapW: 0, mapH: 0, offsetX: 0, offsetY: 0 });
  const [hoveredLocationId, setHoveredLocationId] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: -9999, y: -9999, isHovering: false });

  const handleBoundsChange = useCallback((bounds) => {
    setMapBounds(bounds);
  }, []);

  const handleCursorPosChange = useCallback((pos) => {
    setCursorPos(pos);
  }, []);

  const { triggerRipple } = useMapInteraction(canvasRef, containerRef, {
    interactionRadius: 145,
    maxDisplacement: 22,
    friction: 0.88,
    springTension: 0.14,
    ambientGlow: true,
    onBoundsChange: handleBoundsChange,
    locations: LOCATIONS,
    hoveredLocationId,
    onCursorPosChange: handleCursorPosChange
  });

  // Smooth, subtle 2.5D perspective tilt (kept minimal to honor flat 2D specification)
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.5) * 2;

    // Ultra-subtle tilt: max 2.2 degrees for elegant depth without distorting 2D layout
    setTilt({
      x: -normY * 2.2,
      y: normX * 2.8
    });

    // Approximate real-time lat/lon under cursor
    const lon = (-175 + (x / rect.width) * 355).toFixed(2);
    const lat = (74 - (y / rect.height) * 129).toFixed(2);
    setActiveCoords({
      lat: lat >= 0 ? `${lat}° N` : `${Math.abs(lat)}° S`,
      lon: lon >= 0 ? `${lon}° E` : `${Math.abs(lon)}° W`
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setHoveredLocationId(null);
  }, []);

  const handleContainerClick = useCallback(() => {
    setHoveredLocationId(null);
  }, []);

  // Trigger demo ripple wave across the globe
  const handleGlobalPulse = (e) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    triggerRipple(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleContainerClick}
      className="relative w-full h-full bg-white flex flex-col justify-between overflow-hidden cursor-crosshair select-none"
      style={{ perspective: '1600px' }}
    >
      {/* 1. Primary Header: High-impact typography */}
      <header className="w-full pt-6 sm:pt-8 md:pt-10 pb-2 px-6 text-center select-none z-30 relative shrink-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[34px] font-bold tracking-[0.04em] text-[#111317] uppercase font-sans">
          INSPIRING CLARITY ACROSS THE WORLD
        </h1>
        <p className="text-[11px] sm:text-xs text-neutral-500 font-mono tracking-widest mt-1 uppercase">
          GLOBAL SUPPLY & TRADING NETWORK INFRASTRUCTURE
        </p>
      </header>

      {/* 2. Ethereal atmospheric backlighting (Cyan glow & warmth) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Soft central ambient illumination */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] h-[68%] rounded-full opacity-55 blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(162, 203, 226, 0.35) 0%, rgba(186, 219, 235, 0.18) 50%, rgba(255, 255, 255, 0) 80%)'
          }}
        />
        {/* Subtle perimeter softness */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, transparent 70%, rgba(245, 243, 238, 0.4) 100%)'
          }}
        />
      </div>

      {/* 3. Main Interactive 2D World Map Canvas & Markers Layer */}
      <div className="relative flex-1 w-full h-full min-h-0 z-10">
        <div
          ref={mapWrapperRef}
          className="relative w-full h-full transition-transform duration-300 ease-out will-change-transform"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
          }}
        >
          {/* HTML5 Canvas for 3,515 dots, connection corridors, and flowing particles */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block"
          />

          {/* Interactive Blue Location Pins Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {LOCATIONS.map((loc) => (
              <LocationNode
                key={loc.id}
                location={loc}
                mapBounds={mapBounds}
                cursorPos={cursorPos}
                hoveredLocationId={hoveredLocationId}
                onHoverChange={setHoveredLocationId}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 4. Minimalist Luxury Telemetry Bar at bottom */}
      <footer className="w-full pb-4 pt-2 px-6 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none text-[11px] font-mono tracking-wider text-neutral-500 uppercase shrink-0">
        {/* Left: Location Telemetry */}
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-neutral-200/90 shadow-xs pointer-events-auto">
          <Compass className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-neutral-800 font-semibold">COORDINATES</span>
          <span className="text-neutral-300">|</span>
          <span className="text-neutral-600 tabular-nums">
            {activeCoords.lat}, {activeCoords.lon}
          </span>
        </div>

        {/* Center: Subtle interaction prompt */}
        <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-neutral-400 bg-white/80 backdrop-blur-xs px-3 py-1 rounded-full border border-neutral-200/60 pointer-events-none">
          <Sparkles className="w-3 h-3 text-sky-600" />
          <span>HOVER MARKERS TO REVEAL CORRIDORS • CLICK TO PROPAGATE IMPULSE</span>
        </div>

        {/* Right: Network Status & Pulse Trigger */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-200/90 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            <span className="text-neutral-700 font-medium">119 ACTIVE NODES</span>
          </div>

          <button
            type="button"
            onClick={handleGlobalPulse}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/95 hover:bg-neutral-50 active:scale-95 text-neutral-800 rounded-full border border-neutral-200/90 shadow-xs transition-all font-sans text-xs cursor-pointer backdrop-blur-md"
            title="Emit wave impulse across the dotted world map"
          >
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            Emit Wave Impulse
          </button>
        </div>
      </footer>
    </div>
  );
}
