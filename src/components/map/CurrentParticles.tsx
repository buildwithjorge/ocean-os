/**
 * Module: CurrentParticles
 * Purpose: Animated current/wind flow overlay using real lng/lat positions
 * reprojected to screen space via the map's own projection, so particles
 * track true geography during pan/zoom instead of floating in flat screen space.
 * Renders as continuous fading streamlines (matching the Copernicus Marine
 * "sea water velocity" flow style) rather than short disconnected dashes:
 * each frame partially erases the previous frame instead of clearing it,
 * leaving a trailing streak behind every particle.
 */
import { useEffect } from "react";
import type maplibregl from "maplibre-gl";

type ParticleLayerProps = {
  map: maplibregl.Map | null;
  enabled: boolean;
  hue: string;
  speed: number;
  flowDirectionDeg?: number;
  flowStrength?: number;
  id: string;
};

// Meters-per-degree-latitude is ~constant; longitude scales by cos(latitude).
const METERS_PER_DEG_LAT = 111_320;
// Density scales with canvas area so the flow reads as a dense, continuous
// field (Copernicus/Windy style) instead of a handful of sparse dashes.
const PARTICLES_PER_PX = 1 / 900;
const MIN_PARTICLES = 500;
const MAX_PARTICLES = 3000;
const TRAIL_FADE_ALPHA = 0.05;

export function CurrentParticles({ map, enabled, hue, speed, flowDirectionDeg = 90, flowStrength = 1, id }: ParticleLayerProps) {
  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    let canvas = container.querySelector(`canvas[data-layer='${id}']`) as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.dataset.layer = id;
      canvas.className = "particle-canvas";
      container.appendChild(canvas);
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bounds = map.getBounds();
    const seedParticle = () => ({
      lng: bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest()),
      lat: bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth()),
      age: Math.random(),
    });

    const particleCount = Math.min(
      MAX_PARTICLES,
      Math.max(MIN_PARTICLES, Math.round(container.clientWidth * container.clientHeight * PARTICLES_PER_PX)),
    );
    const particles = Array.from({ length: particleCount }, seedParticle);

    const directionRad = (flowDirectionDeg * Math.PI) / 180;
    const dx = Math.sin(directionRad);
    const dy = -Math.cos(directionRad);

    let frame = 0;
    let raf = 0;

    const resize = () => {
      if (!canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    const draw = () => {
      frame += 1;
      if (!enabled) {
        ctx.clearRect(0, 0, canvas!.width, canvas!.height);
        raf = requestAnimationFrame(draw);
        return;
      }

      const currentBounds = map.getBounds();
      const west = currentBounds.getWest();
      const east = currentBounds.getEast();
      const south = currentBounds.getSouth();
      const north = currentBounds.getNorth();

      // Fade the previous frame instead of clearing it, so each particle
      // leaves a trailing streak that decays smoothly (continuous flow lines).
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0, 0, 0, ${TRAIL_FADE_ALPHA})`;
      ctx.fillRect(0, 0, canvas!.width, canvas!.height);
      ctx.globalCompositeOperation = "lighter";

      particles.forEach((p) => {
        const prevPoint = map.project([p.lng, p.lat]);

        const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos((p.lat * Math.PI) / 180);
        const intensity = speed * flowStrength * 60; // meters per frame at typical speeds
        p.lng += ((dx * intensity) / metersPerDegLng) + Math.sin((frame + p.age * 360) * 0.008) * 0.00006;
        p.lat += ((dy * intensity) / METERS_PER_DEG_LAT) + Math.cos((frame + p.age * 240) * 0.01) * 0.00006;

        // Recycle particles that drift outside the current viewport.
        if (p.lng > east || p.lng < west || p.lat > north || p.lat < south) {
          const fresh = seedParticle();
          p.lng = fresh.lng;
          p.lat = fresh.lat;
          return;
        }

        const point = map.project([p.lng, p.lat]);
        ctx.strokeStyle = hue;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    map.on("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      map.off("resize", resize);
      canvas?.remove();
    };
  }, [map, enabled, hue, speed, flowDirectionDeg, flowStrength, id]);

  return null;
}
