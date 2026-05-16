"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export default function LandingPage() {
  const [email, setEmail] = useState("")

  return (
    <section className="bg-white w-full">
      {/* ==================== SECCIÓN CATEGORÍAS ==================== */}
      <div className="relative pt-24 pb-24 -mt-1">
        {/* Borde superior redondeado - más arriba */}
        <div className="absolute -top-20 left-0 right-0 h-20 bg-white border-t-4 border-[var(--color-lime)]" style={{ borderRadius: "50px 50px 0 0" }} />

        <div className="px-6 lg:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">Nuestras Categorías</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubre nuestra amplia selección de productos frescos y de calidad, cuidadosamente seleccionados para satisfacer tus necesidades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Verduras", image: "https://res.cloudinary.com/dhkb93mix/image/upload/v1770494623/WhatsApp_Image_2026-02-07_at_11.42.31_AM_hr9rko.jpg", items: ["Acelga", "Cebolla", "Cilantro", "Apio"] },
              { title: "Frutas", image: "https://res.cloudinary.com/dhkb93mix/image/upload/v1770494636/WhatsApp_Image_2026-02-07_at_11.43.54_AM_cwlb84.jpg", items: ["Aguaymanto", "Arándano", "Chirimoya", "Mango"] },
              { title: "IGV", image: "https://res.cloudinary.com/dhkb93mix/image/upload/v1770494358/622903-800-auto_pozdfm.webp", items: ["Huevo Codorniz", "Queso Paria", "Fideos"] },
              { title: "Otros", image: "https://res.cloudinary.com/demzflxgq/image/upload/v1770447045/fresh-fruits-and-vegetables_yhlz0w.jpg", items: ["Cáscara de Cacao", "Garbanzo", "Chuño"] },
            ].map((cat, i) => (
              <div key={i} className="group overflow-hidden rounded-[20px] border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="relative h-40 overflow-hidden bg-gray-200">
                  <Image
                    src={cat.image || "/placeholder.svg"}
                    alt={cat.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-5 bg-white">
                  <h3 className="text-lg font-extrabold mb-3">{cat.title}</h3>
                  <ul className="space-y-1.5">
                    {cat.items.slice(0, 3).map((item, j) => (
                      <li key={j} className="text-xs text-gray-600 flex items-center gap-2">
                        <span className="text-[var(--color-lime)]">•</span> {item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/catalog" className="mt-4 block w-full text-center text-sm font-bold text-[var(--color-lime)] hover:text-[var(--color-lime)]/80 transition-colors">
                    Ver más →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== SEPARADOR ==================== */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

      {/* ==================== SECCIÓN LÍNEAS DE PRODUCTOS ==================== */}
      <div className="px-6 lg:px-12 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">Líneas de Productos</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Ofrecemos amplia gama de productos frescos de alta calidad que cumplen los más altos estándares de seguridad alimentaria.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Línea Mayorista */}
          <div className="group overflow-hidden rounded-[24px] border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="relative h-64 sm:h-auto bg-gray-200">
                <Image
                  src="https://res.cloudinary.com/dhkb93mix/image/upload/v1770494556/WhatsApp_Image_2026-02-07_at_11.42.31_AM_a7tdpd.jpg"
                  alt="Línea Mayorista"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="bg-white p-8 flex flex-col justify-center">
                <h3 className="text-2xl font-extrabold mb-4">Mayorista</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--color-lime)] font-bold text-lg">✓</span>
                    <span className="text-gray-700 text-sm"><strong>Volumen</strong> garantizado</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--color-lime)] font-bold text-lg">✓</span>
                    <span className="text-gray-700 text-sm"><strong>Precios</strong> estables</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--color-lime)] font-bold text-lg">✓</span>
                    <span className="text-gray-700 text-sm"><strong>Entregas</strong> programadas</span>
                  </li>
                </ul>
                <button className="w-full bg-[#ff6b5c] text-black font-bold px-4 py-3 rounded-xl hover:scale-105 transition-transform text-sm">
                  Consultar volumen
                </button>
              </div>
            </div>
          </div>

          {/* Línea Premium */}
          <div className="group overflow-hidden rounded-[24px] border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="relative h-64 sm:h-auto bg-gray-200 order-2 sm:order-1">
                <Image
                  src="https://res.cloudinary.com/demzflxgq/image/upload/v1770444706/sabrina_ripke_fotografie-pumpkin-1768857_1280_xxf594.jpg"
                  alt="Línea Premium"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="bg-white p-8 flex flex-col justify-center order-1 sm:order-2">
                <h3 className="text-2xl font-extrabold mb-4">Premium</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--color-lime)] font-bold text-lg">✓</span>
                    <span className="text-gray-700 text-sm"><strong>Calidad</strong> superior</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--color-lime)] font-bold text-lg">✓</span>
                    <span className="text-gray-700 text-sm"><strong>Pedido</strong> mínimo flexible</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--color-lime)] font-bold text-lg">✓</span>
                    <span className="text-gray-700 text-sm"><strong>Trazabilidad</strong> completa</span>
                  </li>
                </ul>
                <div className="flex gap-3">
                  <button className="flex-1 bg-[#ff6b5c] text-black font-bold px-4 py-3 rounded-xl hover:scale-105 transition-transform text-sm">
                    Ficha Técnica
                  </button>
                  <button className="flex-1 border-2 border-[var(--color-lime)] text-black font-bold px-4 py-3 rounded-xl hover:bg-[var(--color-lime)]/10 transition-colors text-sm">
                    Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personalización */}
        <div className="bg-gradient-to-br from-[var(--color-lime)]/10 to-[var(--color-lime)]/5 rounded-[24px] px-8 py-12 border border-[var(--color-lime)]/20">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-extrabold mb-3">¿Necesita una solución personalizada?</h3>
            <p className="text-gray-700 mb-8 text-sm">
              Contáctenos para discutir volúmenes, frecuencia de entrega y requisitos especiales.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button className="flex-1 bg-[#ff6b5c] text-black font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform">
                Contactar Ventas
              </button>
              <button className="flex-1 border-2 border-[var(--color-lime)] text-black font-bold px-6 py-3 rounded-xl hover:bg-[var(--color-lime)]/10 transition-colors">
                Ver Catálogo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SEPARADOR ==================== */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

      {/* ==================== SECCIÓN TESTIMONIOS ==================== */}
      <div className="px-6 lg:px-12 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">Lo que dicen nuestros clientes</h2>
          <p className="text-lg text-gray-600">Confianza en cada pedido</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "María García", role: "Gerente de Compras", comment: "Excelente calidad y entrega puntual." },
            { name: "Carlos López", role: "Chef Restaurante", comment: "Productos frescos y servicio profesional." },
            { name: "Ana Martínez", role: "Dueña Supermercado", comment: "Mejor relación precio-calidad del mercado." },
          ].map((testimonial, i) => (
            <div key={i} className="bg-gradient-to-br from-white to-gray-50 rounded-[20px] p-8 border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 text-sm italic">{testimonial.comment}</p>
              <p className="font-bold text-black text-sm">{testimonial.name}</p>
              <p className="text-xs text-gray-600">{testimonial.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== SEPARADOR ==================== */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

      {/* ==================== SECCIÓN VERYFRUT ==================== */}
      <div className="px-6 lg:px-12 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">¿Por qué elegir Veryfrut?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "🌱", title: "Mejor Rendimiento", desc: "Distribución eficiente y de alta calidad" },
            { icon: "🛒", title: "Venta Online", desc: "Pedidos fáciles a través de nuestra plataforma" },
            { icon: "📱", title: "Adaptado a Móviles", desc: "Realiza pedidos desde cualquier dispositivo" },
            { icon: "⚙️", title: "Personalización Fácil", desc: "Adapta tus pedidos a tus necesidades" },
            { icon: "🍎", title: "Productos de Calidad", desc: "100% naturales" },
            { icon: "💰", title: "Mejor Precio", desc: "Precios justos para todos" },
          ].map((feature, i) => (
            <div key={i} className="text-center bg-gradient-to-br from-white to-gray-50 rounded-[20px] p-8 border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-extrabold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== SEPARADOR ==================== */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

      {/* ==================== SECCIÓN NEWSLETTER ==================== */}
      <div className="px-6 lg:px-12 py-24 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[var(--color-lime)]/15 to-[var(--color-lime)]/10 rounded-[24px] px-8 py-16 border border-[var(--color-lime)]/20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4">Suscríbete a Nuestro Boletín</h2>
            <p className="text-gray-700 mb-8 text-sm">
              Recibe noticias sobre productos de temporada, ofertas especiales y consejos sobre alimentación saludable.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                setEmail("")
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                placeholder="Tu correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-6 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime)] bg-white text-black placeholder:text-gray-500 text-sm"
                required
              />
              <button
                type="submit"
                className="px-8 py-3 bg-[#ff6b5c] text-black font-bold rounded-xl hover:scale-105 transition-transform whitespace-nowrap"
              >
                Suscribir
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
