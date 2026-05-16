'use client';

import { useEffect, useRef } from 'react';

export default function Loading() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    let rotation = 0;

    const animate = () => {
      rotation = (rotation + 2) % 360;
      svg.style.transform = `rotate(${rotation}deg)`;
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-background">
      <div className="flex flex-col items-center gap-6 -translate-y-[15vh]">
        {/* SVG Animado */}
        <svg
          ref={svgRef}
          width="120"
          height="120"
          viewBox="0 0 40 40"
          fill="none"
          className="transition-transform origin-center"
        >
          <path
            d="M10 28C10 28 8 22 12 18C16 14 22 22 22 22C22 22 26 14 30 18C34 22 32 28 32 28"
            stroke="#8CC63F"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 18C16 18 14 12 18 8C22 4 28 12 28 12"
            stroke="#8CC63F"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
          <circle cx="10" cy="28" r="3" fill="#8CC63F" />
        </svg>

        {/* Texto de carga */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-semibold text-foreground">Cargando usuarios</p>
          <p className="text-sm text-muted-foreground">Por favor, espera un momento...</p>
        </div>

        {/* Indicador de progreso */}
        <div className="flex gap-2 mt-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
