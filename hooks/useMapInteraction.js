'use client';

import { useEffect, useRef, useCallback } from 'react';
import { MAP_DOTS } from '../data/mapData';
import { CONNECTION_CORRIDORS } from '../data/locationsData';

/**
 * Premium 60 FPS Canvas Physics & Animation Engine for the 2D Dotted World Map.
 * 
 * Features:
 * 1. Smooth Staggered Map Entrance (progressive wave reveal with easeOutCubic).
 * 2. Multi-frequency Organic Ambient Shimmer & Breathing.
 * 3. Fluid Cursor Displacement Field with exponential velocity damping.
 * 4. Concentric Wave Ripple Propagation (via click or programmatic trigger).
 * 5. Elegant Global Connection Corridors with flowing glowing particle trails.
 * 6. Dynamic corridor illumination on marker hover.
 * 7. Respects prefers-reduced-motion for complete accessibility.
 */
export function useMapInteraction(canvasRef, containerRef, options = {}) {
  const {
    interactionRadius = 140,
    maxDisplacement = 22,
    friction = 0.88,
    springTension = 0.14,
    ambientGlow = true,
    onBoundsChange,
    locations = [],
    hoveredLocationId = null,
    onCursorPosChange
  } = options;

  // Mutable animation state stored in ref to maintain 60fps with zero React re-renders
  const stateRef = useRef({
    dots: [],
    width: 0,
    height: 0,
    dpr: 1,
    mapBounds: { mapW: 0, mapH: 0, offsetX: 0, offsetY: 0 },
    mouse: {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      isHovering: false,
      down: false
    },
    ripples: [],
    animationFrameId: null,
    isVisible: true,
    prefersReducedMotion: false,
    startTime: 0,
    revealDuration: 1.2
  });

  const optionsRef = useRef({
    locations,
    hoveredLocationId,
    onBoundsChange,
    onCursorPosChange
  });

  useEffect(() => {
    optionsRef.current = {
      locations,
      hoveredLocationId,
      onBoundsChange,
      onCursorPosChange
    };
  }, [locations, hoveredLocationId, onBoundsChange, onCursorPosChange]);

  // Trigger concentric ripple wave at given client coordinates
  const triggerRipple = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    stateRef.current.ripples.push({
      x,
      y,
      radius: 4,
      maxRadius: Math.max(rect.width, rect.height) * 0.48,
      speed: 4.8,
      strength: 18,
      alpha: 0.85
    });
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Check prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    stateRef.current.prefersReducedMotion = motionQuery.matches;
    const handleMotionChange = (e) => {
      stateRef.current.prefersReducedMotion = e.matches;
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // Resize handler measuring the canvas's immediate container
    const handleResize = () => {
      const mountEl = canvas.parentElement || container;
      const rect = mountEl.getBoundingClientRect();
      const w = rect.width || container.clientWidth || window.innerWidth;
      const h = rect.height || container.clientHeight || (window.innerHeight - 120);

      if (w === 0 || h === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      stateRef.current.width = w;
      stateRef.current.height = h;
      stateRef.current.dpr = dpr;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);

      // Aspect ratio containment matching reference 2D dotted map (~2.04:1)
      const mapRatio = 2.04;
      let mapW = w * 0.94;
      let mapH = mapW / mapRatio;
      if (mapH > h * 0.92) {
        mapH = h * 0.92;
        mapW = mapH * mapRatio;
      }
      const offsetX = (w - mapW) / 2;
      const offsetY = (h - mapH) / 2;

      const bounds = { mapW, mapH, offsetX, offsetY, width: w, height: h };
      stateRef.current.mapBounds = bounds;
      optionsRef.current.onBoundsChange?.(bounds);

      stateRef.current.dots = MAP_DOTS.map((dot, idx) => {
        const homeX = offsetX + dot.x * mapW;
        const homeY = offsetY + dot.y * mapH;
        return {
          id: idx,
          normX: dot.x,
          normY: dot.y,
          homeX,
          homeY,
          curX: homeX,
          curY: homeY,
          vx: 0,
          vy: 0,
          baseR: dot.r,
          curR: dot.r * 0.35,
          baseAlpha: dot.baseAlpha,
          curAlpha: dot.baseAlpha * 0.35,
          glow: 0,
          phase: (dot.x * 16 + dot.y * 12) % (Math.PI * 2)
        };
      });
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas.parentElement || container);

    // Mouse & touch interaction listeners
    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      stateRef.current.mouse.targetX = x;
      stateRef.current.mouse.targetY = y;
      stateRef.current.mouse.isHovering = true;
      optionsRef.current.onCursorPosChange?.({ x, y, isHovering: true });
    };

    const onPointerLeave = () => {
      stateRef.current.mouse.targetX = -9999;
      stateRef.current.mouse.targetY = -9999;
      stateRef.current.mouse.isHovering = false;
      optionsRef.current.onCursorPosChange?.({ x: -9999, y: -9999, isHovering: false });
    };

    const onPointerDown = (e) => {
      stateRef.current.mouse.down = true;
      triggerRipple(e.clientX, e.clientY);
    };

    const onPointerUp = () => {
      stateRef.current.mouse.down = false;
    };

    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerleave', onPointerLeave);
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    const observer = new IntersectionObserver(
      ([entry]) => {
        stateRef.current.isVisible = entry ? entry.isIntersecting : true;
      },
      { threshold: 0.01 }
    );
    observer.observe(container);

    // Main 60fps render loop
    stateRef.current.startTime = performance.now();
    let lastTime = performance.now();

    const render = (now) => {
      stateRef.current.animationFrameId = requestAnimationFrame(render);

      if (!stateRef.current.isVisible) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const { width, height, mouse, ripples, prefersReducedMotion, startTime, revealDuration, mapBounds } = stateRef.current;
      if (width === 0 || height === 0) return;

      // Entrance calculation (smooth easeOutCubic)
      const elapsedSec = Math.max(0, (now - startTime) / 1000);
      const rawEntrance = Math.min(1.0, elapsedSec / revealDuration);
      const entranceEased = prefersReducedMotion ? 1.0 : (1.0 - Math.pow(1.0 - rawEntrance, 3));

      // Smooth pointer tracking (exponential damping)
      if (mouse.isHovering) {
        mouse.x += (mouse.targetX - mouse.x) * 0.22;
        mouse.y += (mouse.targetY - mouse.y) * 0.22;
      } else {
        mouse.x += (-9999 - mouse.x) * 0.1;
        mouse.y += (-9999 - mouse.y) * 0.1;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Atmospheric luminous cursor spotlight
      if (mouse.isHovering && ambientGlow && !prefersReducedMotion) {
        const radGrad = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, interactionRadius * 1.8
        );
        radGrad.addColorStop(0, 'rgba(14, 165, 233, 0.14)');
        radGrad.addColorStop(0.45, 'rgba(56, 189, 248, 0.05)');
        radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, interactionRadius * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Render and update concentric ripple waves
      for (let r = ripples.length - 1; r >= 0; r--) {
        const rip = ripples[r];
        rip.radius += rip.speed;
        rip.alpha *= 0.965;
        rip.strength *= 0.958;

        if (rip.alpha < 0.012 || rip.radius > rip.maxRadius) {
          ripples.splice(r, 1);
        } else {
          ctx.strokeStyle = `rgba(14, 165, 233, ${rip.alpha * 0.45})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 3. Render Elegant Global Connection Corridors & Flowing Particles (Requirement 4)
      const locList = optionsRef.current.locations;
      const hoveredId = optionsRef.current.hoveredLocationId;
      const timeSec = now * 0.001;

      if (locList.length > 0 && mapBounds.mapW > 0) {
        const locMap = new Map(locList.map((l) => [l.id, l]));

        for (let cIdx = 0; cIdx < CONNECTION_CORRIDORS.length; cIdx++) {
          const corridor = CONNECTION_CORRIDORS[cIdx];
          const fromLoc = locMap.get(corridor.from);
          const toLoc = locMap.get(corridor.to);

          if (!fromLoc || !toLoc) continue;

          const x1 = mapBounds.offsetX + fromLoc.x * mapBounds.mapW;
          const y1 = mapBounds.offsetY + fromLoc.y * mapBounds.mapH;
          const x2 = mapBounds.offsetX + toLoc.x * mapBounds.mapW;
          const y2 = mapBounds.offsetY + toLoc.y * mapBounds.mapH;

          const dist = Math.hypot(x2 - x1, y2 - y1);
          if (dist < 10) continue;

          // Midpoint and normal arch calculation for great-circle style curved path
          const mx = (x1 + x2) * 0.5;
          const my = (y1 + y2) * 0.5;
          const nx = -(y2 - y1) / dist;
          const ny = (x2 - x1) / dist;

          const archHeight = dist * 0.20 * (corridor.curvature < 0 ? -1 : 1);
          const cx = mx + nx * archHeight;
          const cy = my + ny * archHeight;

          const isConnectedToHover = hoveredId === fromLoc.id || hoveredId === toLoc.id;
          const pathAlpha = (isConnectedToHover ? 0.70 : 0.22) * Math.max(0.3, entranceEased);

          // Draw the smooth curved corridor
          ctx.strokeStyle = isConnectedToHover
            ? `rgba(13, 98, 178, ${pathAlpha})`
            : `rgba(14, 165, 233, ${pathAlpha})`;
          ctx.lineWidth = isConnectedToHover ? 1.8 : 1.1;
          ctx.setLineDash(isConnectedToHover ? [] : [3, 4]);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(cx, cy, x2, y2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Flowing glowing particle beads with comet light tail along the corridor path
          if (!prefersReducedMotion) {
            const beadSpeed = isConnectedToHover ? 0.32 : 0.18;
            const t = (timeSec * beadSpeed + cIdx * 0.27) % 1.0;
            const beadOpacity = Math.sin(t * Math.PI) * (isConnectedToHover ? 0.95 : 0.75) * entranceEased;

            if (beadOpacity > 0.05) {
              // Draw 3-segment light trail behind the bead
              for (let trailStep = 2; trailStep >= 0; trailStep--) {
                const subT = Math.max(0, t - trailStep * 0.016);
                const oneMinusSubT = 1 - subT;
                const tx = oneMinusSubT * oneMinusSubT * x1 + 2 * oneMinusSubT * subT * cx + subT * subT * x2;
                const ty = oneMinusSubT * oneMinusSubT * y1 + 2 * oneMinusSubT * subT * cy + subT * subT * y2;

                const stepFade = (1 - trailStep * 0.32) * beadOpacity;
                const stepR = (isConnectedToHover ? 5.5 : 4.0) * (1 - trailStep * 0.22);

                const bGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, stepR);
                bGrad.addColorStop(0, trailStep === 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.7)');
                bGrad.addColorStop(0.4, isConnectedToHover ? `rgba(13, 98, 178, ${0.9 * stepFade})` : `rgba(14, 165, 233, ${0.85 * stepFade})`);
                bGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');

                ctx.fillStyle = bGrad;
                ctx.beginPath();
                ctx.arc(tx, ty, stepR, 0, Math.PI * 2);
                ctx.fill();
              }

              // Sharp central bead core
              const oneMinusT = 1 - t;
              const px = oneMinusT * oneMinusT * x1 + 2 * oneMinusT * t * cx + t * t * x2;
              const py = oneMinusT * oneMinusT * y1 + 2 * oneMinusT * t * cy + t * t * y2;

              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(px, py, 1.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // 4. Batch Render 3,515 Dotted World Map Nodes
      const dots = stateRef.current.dots;
      const numDots = dots.length;

      for (let i = 0; i < numDots; i++) {
        const dot = dots[i];

        // Progressive staggered entrance calculation
        let dotEntrance = 1.0;
        if (!prefersReducedMotion && rawEntrance < 1.0) {
          const stagger = (dot.normX * 0.65 + dot.normY * 0.35);
          const localProgress = Math.max(0, Math.min(1, (rawEntrance - stagger * 0.38) / 0.62));
          dotEntrance = 0.3 + 0.7 * (1.0 - Math.pow(1.0 - localProgress, 3));
        }

        // Multi-wave organic breathing & living matrix shimmer
        const wave1 = Math.sin(timeSec * 0.85 + dot.phase) * 0.08;
        const wave2 = Math.cos(timeSec * 0.45 + dot.homeX * 0.003 + dot.homeY * 0.003) * 0.05;
        const breath = (wave1 + wave2) * dotEntrance;

        // Pointer displacement field
        let targetX = dot.homeX;
        let targetY = dot.homeY;
        let influence = 0;

        if (mouse.isHovering && !prefersReducedMotion && dotEntrance > 0.4) {
          const dx = dot.curX - mouse.x;
          const dy = dot.curY - mouse.y;
          const distSq = dx * dx + dy * dy;
          const radiusSq = interactionRadius * interactionRadius;

          if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq);
            const norm = 1 - dist / interactionRadius;
            influence = norm * norm * norm;

            const angle = Math.atan2(dy, dx);
            const push = influence * maxDisplacement;

            targetX += Math.cos(angle) * push;
            targetY += Math.sin(angle) * push;
          }
        }

        // Concentric ripple displacement
        if (!prefersReducedMotion && ripples.length > 0 && dotEntrance > 0.4) {
          for (let r = 0; r < ripples.length; r++) {
            const rip = ripples[r];
            const dx = dot.homeX - rip.x;
            const dy = dot.homeY - rip.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const waveDist = Math.abs(dist - rip.radius);
            const waveWidth = 38;

            if (waveDist < waveWidth) {
              const waveFactor = Math.cos((waveDist / waveWidth) * Math.PI * 0.5);
              const angle = Math.atan2(dy, dx);
              const wavePush = waveFactor * rip.strength * rip.alpha;

              targetX += Math.cos(angle) * wavePush;
              targetY += Math.sin(angle) * wavePush;
              influence = Math.max(influence, waveFactor * rip.alpha);
            }
          }
        }

        // Spring physics restitution
        if (prefersReducedMotion) {
          dot.curX = dot.homeX;
          dot.curY = dot.homeY;
        } else {
          const ax = (targetX - dot.curX) * springTension;
          const ay = (targetY - dot.curY) * springTension;
          dot.vx = (dot.vx + ax) * friction;
          dot.vy = (dot.vy + ay) * friction;
          dot.curX += dot.vx;
          dot.curY += dot.vy;
        }

        // Visual radius & luminous alpha interpolation
        dot.glow += (influence - dot.glow) * 0.18;

        const targetR = dot.baseR * (1.0 + dot.glow * 0.55 + breath * 0.25) * dotEntrance;
        dot.curR += (targetR - dot.curR) * 0.25;

        const targetAlpha = Math.min(1.0, (dot.baseAlpha + dot.glow * 0.6 + breath * 0.18) * dotEntrance);
        dot.curAlpha += (targetAlpha - dot.curAlpha) * 0.25;

        if (dot.curR <= 0.1 || dot.curAlpha <= 0.01) continue;

        // Color interpolation matching reference light-blue dotted map
        let rVal, gVal, bVal;
        if (dot.glow > 0.04) {
          rVal = Math.round(98 + (14 - 98) * dot.glow);
          gVal = Math.round(148 + (165 - 148) * dot.glow);
          bVal = Math.round(188 + (233 - 188) * dot.glow);
        } else {
          rVal = 105;
          gVal = 155;
          bVal = 192;
        }

        ctx.fillStyle = `rgba(${rVal}, ${gVal}, ${bVal}, ${dot.curAlpha * 0.88})`;
        ctx.beginPath();
        ctx.arc(dot.curX, dot.curY, Math.max(0.5, dot.curR), 0, Math.PI * 2);
        ctx.fill();

        // Specular core on high illumination
        if (dot.glow > 0.52) {
          ctx.fillStyle = `rgba(255, 255, 255, ${dot.glow * 0.85})`;
          ctx.beginPath();
          ctx.arc(dot.curX, dot.curY, dot.curR * 0.42, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    stateRef.current.animationFrameId = requestAnimationFrame(render);

    return () => {
      if (stateRef.current.animationFrameId) {
        cancelAnimationFrame(stateRef.current.animationFrameId);
      }
      resizeObserver.disconnect();
      observer.disconnect();
      motionQuery.removeEventListener('change', handleMotionChange);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [canvasRef, containerRef, interactionRadius, maxDisplacement, friction, springTension, ambientGlow, triggerRipple]);

  return {
    triggerRipple
  };
}
