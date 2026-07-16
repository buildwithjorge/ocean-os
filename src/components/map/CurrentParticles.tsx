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

    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      age: Math.random(),
    }));

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

      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach((p) => {
        const intensity = speed * flowStrength;
        p.x += dx * intensity * 0.00022 + Math.sin((frame + p.age * 360) * 0.008) * 0.00008;
        p.y += dy * intensity * 0.00022 + Math.cos((frame + p.age * 240) * 0.01) * 0.00008;
        if (p.x > 1) p.x = 0;
        if (p.y > 1) p.y = 0;
        if (p.y < 0) p.y = 1;

        const x = p.x * canvas!.width;
        const y = p.y * canvas!.height;
        ctx.strokeStyle = hue;
        ctx.globalAlpha = 0.42;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx * 10, y + dy * 10 + Math.sin(frame * 0.02 + p.age) * 1.5);
        ctx.stroke();
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas?.remove();
    };
  }, [map, enabled, hue, speed, flowDirectionDeg, flowStrength, id]);

  return null;
}
