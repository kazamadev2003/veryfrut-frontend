"use client"

import Image from "next/image"

export default function Connecting() {
  return (
    // ✅ corta cualquier scroll horizontal que pueda venir de w-screen / transform
    <section className="relative z-20 bg-white overflow-x-clip">
      {/* ✅ en lugar de left-1/2 + w-screen, usa w-full para evitar “espacio a los costados” */}
      <div className="w-full">
        {/* ✅ BORDE REDONDO OK, SIN SOMBRA EXTERNA */}
        <div className="relative rounded-[90px] overflow-hidden bg-white border border-black/10">
          {/* ✅ IMAGEN DE FONDO */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://res.cloudinary.com/diaujeypx/image/upload/v1768881468/2149738020_tzgwqo.jpg"
              alt="Connecting background"
              fill
              priority
              className="object-cover"
              
            />

            {/* ✅ minisombra moderna (overlay suave, NO blur) */}
            <div className="absolute inset-0 bg-black/25" />

            {/* ✅ viñeta sutil para dar look “moderno” sin oscurecer demasiado */}
            <div
              className="absolute inset-0 opacity-[0.55]"
              style={{
                background:
                  "radial-gradient(70% 55% at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.22) 70%, rgba(0,0,0,0.35) 100%)",
              }}
            />
          </div>

          {/* ✅ RIBBON */}
          <div className="pointer-events-none absolute inset-0 z-[12]">
            <svg
              viewBox="0 0 1600 560"
              className="absolute left-1/2 top-14 -translate-x-1/2 w-[1600px] max-w-[1600px] h-auto hidden lg:block"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <path
                id="vfRibbonTop"
                d="M60 185
                   C 280 35, 600 55, 790 185
                   C 980 315, 1260 330, 1540 190"
                fill="none"
                stroke="#F6E20C"
                strokeWidth="84"
                strokeLinecap="round"
              />

              <path
                d="M120 365
                   C 380 520, 700 480, 880 380
                   C 1080 270, 1330 290, 1480 365"
                fill="none"
                stroke="#F6E20C"
                strokeWidth="84"
                strokeLinecap="round"
                opacity="0.98"
              />

              {/* ✅ texto con leve contorno para que se lea sobre foto (no sombra) */}
              <text fontSize="60" fontWeight="900" fill="#ff6b5c" dominantBaseline="middle">
                <textPath href="#vfRibbonTop" startOffset="8%">
                  Conectando con nuestra audiencia
                </textPath>
              </text>
            </svg>

            {/* mobile */}
            <div className="lg:hidden absolute left-1/2 top-10 -translate-x-1/2 w-[92%]">
              <div className="rounded-[26px] bg-[#F6E20C] px-7 py-6 border border-black/10">
                <p className="text-center text-[#ff6b5c] text-lg font-extrabold tracking-tight">
                  Conectando con nuestra audiencia
                </p>
              </div>
            </div>
          </div>

          {/* ✅ ALTURA GRANDE */}
          <div className="relative z-20 px-6 lg:px-12">
            <div className="max-w-7xl mx-auto min-h-[980px] lg:min-h-[1180px] flex items-center justify-center">
              <button className="inline-flex items-center gap-4 bg-[#ff6b5c] text-black font-extrabold px-16 py-7 rounded-2xl hover:scale-105 transition-transform">
                <span className="w-11 h-11 bg-white rounded-full flex items-center justify-center">→</span>
                Conectar ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
