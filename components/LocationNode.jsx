'use client';

import { useState, useMemo, useEffect, memo } from 'react';

/**
 * Authentic 2D Location Marker Node matching the client reference image:
 * Features a classic blue teardrop pin with central cutout, resting with pixel precision
 * at its geographical coordinate.
 * 
 * Interactive & fluid enhancements:
 * - Smooth staggered entrance animation (pins drop in with subtle bounce).
 * - Continuous soft expanding circular ripple waves for selected strategic hubs.
 * - Magnetic proximity sensitivity (gently awakens when cursor is within proximity).
 * - Tactile hover state with vibrant blue radiant halo and upward scale spring.
 * - Luxury frosted graphite/glass tooltip pill with smart directional positioning (prevents clipping).
 * - Anchored with transformOrigin: '50% 100%' so the tip NEVER shifts from its coordinate.
 * - z-[100] elevation for active markers ensuring tooltips are always on top of sibling pins.
 */
export const LocationNode = memo(function LocationNode({
  location,
  mapBounds,
  cursorPos,
  hoveredLocationId,
  onHoverChange
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Sync click/open state with global hovered/dismiss state
  useEffect(() => {
    if (hoveredLocationId === null || (hoveredLocationId && hoveredLocationId !== location.id)) {
      setIsOpen(false);
    }
  }, [hoveredLocationId, location.id]);

  // Calculate pixel position relative to current map bounds
  const { leftPx, topPx, isReady, showBelow, alignX } = useMemo(() => {
    if (!mapBounds || mapBounds.mapW <= 0) {
      return { leftPx: 0, topPx: 0, isReady: false, showBelow: false, alignX: 'center' };
    }
    const lx = mapBounds.offsetX + location.x * mapBounds.mapW;
    const ty = mapBounds.offsetY + location.y * mapBounds.mapH;

    // Smart tooltip positioning: unroll downward if too close to top header
    const below = ty < 120;
    // Horizontal edge protection
    let ax = 'center';
    if (lx < 130) ax = 'left';
    else if (mapBounds.width > 0 && mapBounds.width - lx < 130) ax = 'right';

    return {
      leftPx: lx,
      topPx: ty,
      isReady: true,
      showBelow: below,
      alignX: ax
    };
  }, [mapBounds, location.x, location.y]);

  // Gentle proximity sensitivity when pointer approaches within 50px
  const isNearby = useMemo(() => {
    if (!cursorPos || !cursorPos.isHovering || !isReady || isHovered) return false;
    const dx = cursorPos.x - leftPx;
    const dy = cursorPos.y - (topPx - 8);
    return dx * dx + dy * dy < 2500; // 50px radius
  }, [cursorPos, leftPx, topPx, isReady, isHovered]);

  // Staggered entrance delay derived deterministically from geographic position
  const entranceDelayMs = useMemo(() => {
    const raw = (location.x * 600 + location.y * 400);
    return Math.min(1000, Math.round(raw % 800) + 120);
  }, [location.x, location.y]);

  const active = isHovered || (hoveredLocationId === location.id) || isOpen;
  const isMajor = !!location.isMajor;
  const hasPulse = !!location.hasPulse;

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverChange?.(location.id);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverChange?.(null);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
    onHoverChange?.(location.id);
  };

  if (!isReady) return null;

  // Tooltip positioning styles based on edge detection
  let tooltipAlignClass = '-translate-x-1/2 left-0';
  let arrowAlignClass = 'left-1/2 -translate-x-1/2';
  if (alignX === 'left') {
    tooltipAlignClass = 'left-0 translate-x-[-15%]';
    arrowAlignClass = 'left-[15%]';
  } else if (alignX === 'right') {
    tooltipAlignClass = 'left-0 translate-x-[-85%]';
    arrowAlignClass = 'left-[85%]';
  }

  return (
    <div
      className={`absolute select-none animate-marker-entrance pointer-events-auto transition-[z-index] ${
        active ? 'z-[100]' : isNearby ? 'z-30' : 'z-20'
      }`}
      style={{
        left: `${leftPx}px`,
        top: `${topPx}px`,
        transformOrigin: '50% 100%',
        animationDelay: `${entranceDelayMs}ms`
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* 1. Subtle, elegant expanding circular ripple waves for key hubs or active marker */}
      {(hasPulse || active) && (
        <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {/* Primary soft expanding ring */}
          <span
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/40 bg-sky-400/8 animate-ripple-pulse pointer-events-none"
            style={{ width: '26px', height: '26px' }}
          />
          {/* Secondary delayed expanding ring */}
          <span
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/25 animate-ripple-pulse-outer pointer-events-none"
            style={{ width: '34px', height: '34px' }}
          />
        </div>
      )}

      {/* 2. Soft radiant glow behind the active/nearby pin */}
      <div
        className={`absolute left-0 bottom-1 -translate-x-1/2 rounded-full pointer-events-none transition-all duration-300 ${
          active
            ? 'w-8 h-8 bg-sky-500/30 blur-md scale-125'
            : isNearby
            ? 'w-6 h-6 bg-sky-400/18 blur-sm scale-110'
            : 'w-3 h-3 bg-transparent blur-none scale-50'
        }`}
      />

      {/* 3. The Authentic Blue Location Pin SVG */}
      <button
        type="button"
        aria-label={`${location.name}, ${location.country}`}
        aria-expanded={active}
        className={`relative block p-0 border-0 bg-transparent cursor-pointer outline-none transition-all duration-250 ease-out will-change-transform ${
          active
            ? 'scale-130 -translate-y-1'
            : isNearby
            ? 'scale-112 -translate-y-0.5'
            : isMajor
            ? 'scale-105'
            : 'scale-100 hover:scale-120'
        }`}
        style={{
          transformOrigin: '50% 100%'
        }}
      >
        <svg
          viewBox="0 0 24 30"
          className="block transition-all duration-250"
          style={{
            width: isMajor ? '15px' : '12px',
            height: isMajor ? '19px' : '15px',
            filter: active
              ? 'drop-shadow(0 0 7px rgba(13, 98, 178, 0.75)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25))'
              : isNearby
              ? 'drop-shadow(0 0 4px rgba(13, 98, 178, 0.45))'
              : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.18))'
          }}
        >
          {/* Classic Pin Teardrop Body */}
          <path
            d="M12 0C5.373 0 0 5.373 0 12c0 8.2 12 18 12 18s12-9.8 12-18c0-6.627-5.373-12-12-12z"
            fill={active ? '#0369a1' : '#0d62b2'}
          />
          {/* Circular Cutout in Head */}
          <circle cx="12" cy="11.5" r="4.2" fill="#ffffff" />
        </svg>
      </button>

      {/* 4. Luxury Floating Information Pill / Card with smart directional positioning */}
      {active && (
        <div
          className={`absolute pointer-events-auto animate-tooltip-reveal z-50 select-text ${
            showBelow ? 'top-full mt-2' : 'bottom-full mb-2'
          } ${tooltipAlignClass}`}
          style={{ width: 'max-content', minWidth: '220px', maxWidth: '280px' }}
        >
          <div className="bg-[#12161f] text-white px-3.5 py-2.5 rounded-lg shadow-2xl border border-white/20 text-left">
            {/* Top row: role badge & live status */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1.5">
              <span className="text-[10px] tracking-wider font-semibold text-sky-400 uppercase font-mono">
                {location.role}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                <span className="text-[9px] text-neutral-300 uppercase font-mono">
                  {location.status}
                </span>
              </div>
            </div>

            {/* City & Country */}
            <div className="text-[13px] font-semibold text-neutral-100 tracking-tight mb-0.5">
              {location.name}
              {location.country ? (
                <span className="text-neutral-400 font-normal">, {location.country}</span>
              ) : null}
            </div>

            {/* Metrics / Overview */}
            {location.metrics && (
              <div className="text-[11px] text-neutral-300 leading-snug mb-2 font-normal">
                {location.metrics}
              </div>
            )}

            {/* Coordinates footer */}
            <div className="text-[9px] font-mono text-neutral-400 flex items-center justify-between pt-1 border-t border-white/10">
              <span className="tracking-wider">COORDINATES</span>
              <span className="text-sky-300 font-medium">{location.coords}</span>
            </div>
          </div>

          {/* Pointer Arrowhead */}
          <div
            className={`w-2 h-2 bg-[#12161f] border-white/20 rotate-45 shadow-sm absolute ${arrowAlignClass} ${
              showBelow
                ? '-top-1 border-l border-t'
                : '-bottom-1 border-r border-b'
            }`}
          />
        </div>
      )}
    </div>
  );
});
