"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"

export default function Loading() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const paths = svgRef.current.querySelectorAll("path")

    const tl = gsap.timeline({
      defaults: { ease: "power4.inOut" }, 
    })

    // 1. Animación del SVG
    paths.forEach((path) => {
      const length = (path as SVGPathElement).getTotalLength?.() || 100
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
      })

      tl.to(
        path,
        {
          strokeDashoffset: 0,
          duration: 1.5,
        },
        0
      )
    })

    // 2. Animación del Texto
    if (textRef.current) {
      tl.to(
        textRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
        },
        0.5
      )
    }

    // 3. SALIDA DEL LOADER
    // Usamos yPercent: -100 para que suba basándose en su propia altura (que ahora es mayor)
    tl.to(containerRef.current, {
      yPercent: -100, 
      duration: 1.8,    // 🔹 Un poco más lento para disfrutar el efecto
      ease: "expo.inOut",
      delay: 0.8,
      onComplete: () => setVisible(false),
    })

    return () => {
      tl.kill()
    }
  }, [])

  if (!visible) return null

  return (
    <div
      ref={containerRef}
      className="
        loading-screen 
        fixed top-0 left-0 w-full z-[9999] 
        flex items-center justify-center 
        bg-white 
        overflow-hidden
        /* 🔹 BORDES REDONDEADOS */
        rounded-b-[40px] 
        md:rounded-b-[80px]
        /* 🔹 OCUPAR MÁS ESPACIO HACIA ABAJO */
        /* Al ser 130vh, hay 30vh de contenido 'blanco' extra por debajo de la pantalla */
        h-[130vh] 
        shadow-[0_20px_50px_rgba(0,0,0,0.1)]
      "
    >
      {/* Compensamos el centro visual: 
         Como el div mide 130vh, el centro real está muy abajo. 
         Con -translate-y-[15vh] (la mitad del extra), el logo queda centrado en la pantalla del usuario.
      */}
      <div className="flex flex-col items-center gap-6 -translate-y-[15vh]">
        <svg
          ref={svgRef}
          width="120"
          height="120"
          viewBox="0 0 40 40"
          fill="none"
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

        <div ref={textRef} className="opacity-0 translate-y-2">
          <h1 className="text-5xl font-bold text-black tracking-tight">Veryfrut</h1>
        </div>
      </div>
    </div>
  )
}