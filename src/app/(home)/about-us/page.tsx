'use client'

import Image from 'next/image'

export default function AboutUsPage() {
  return (
    <main id="about-us" className="bg-white w-full pt-24">
      {/* Hero Section */}
      <section id="about-hero" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">Sobre Veryfrut</h1>
          <p className="text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            En Veryfrut nos dedicamos a distribuir las mejores frutas y verduras de la mejor calidad, garantizando frescura y calidad en cada producto.
          </p>
        </div>
      </section>

      {/* Historia Section */}
      <section id="about-history" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto border-t border-black/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl font-extrabold tracking-tight mb-8">Nuestra Historia</h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Fundada en 2021, Veryfrut nació con la misión de proporcionar productos de la más alta calidad a nuestros clientes. Comenzamos como una pequeña empresa familiar y hemos crecido hasta convertirnos en uno de los distribuidores líderes de frutas y verduras en la región.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Trabajamos directamente con agricultores locales que comparten nuestra pasión por la agricultura sostenible y los productos naturales, garantizando que cada fruta y verdura que distribuimos cumpla con los más altos estándares de calidad.
            </p>
          </div>
          <div className="relative h-96 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
            <Image
              src="https://res.cloudinary.com/demzflxgq/image/upload/v1770448703/secretaria_oc88fw.jpg"
              alt="Equipo de Veryfrut"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Valores Section */}
      <section id="about-values" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto border-t border-black/5">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold tracking-tight mb-6">Nuestros Valores</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Los principios que guían nuestras acciones</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: '✨', title: 'Calidad', desc: 'Productos de la mejor calidad, seleccionados cuidadosamente.' },
            { icon: '🌱', title: 'Sostenibilidad', desc: 'Prácticas agrícolas sostenibles y respetuosas con el ambiente.' },
            { icon: '👥', title: 'Comunidad', desc: 'Apoyo a agricultores locales y desarrollo de comunidades.' },
            { icon: '💚', title: 'Compromiso', desc: 'Responsabilidad y dedicación en cada entrega.' },
          ].map((valor, i) => (
            <div key={i} className="bg-gradient-to-br from-white to-gray-50 rounded-[24px] p-8 border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="text-5xl mb-4">{valor.icon}</div>
              <h3 className="text-2xl font-extrabold mb-3">{valor.title}</h3>
              <p className="text-gray-600">{valor.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ¿Por qué elegirnos? */}
      <section id="about-why" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto border-t border-black/5">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold tracking-tight mb-6">¿Por qué elegirnos?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: 'Calidad', desc: 'Productos de la mejor calidad, seleccionados cuidadosamente en cada etapa del proceso.' },
            { title: 'Entrega Rápida', desc: 'Distribución eficiente y puntual garantizando la frescura de nuestros productos.' },
            { title: 'Precios Justos', desc: 'Valor justo para clientes y productores, sin comprometer la calidad.' },
            { title: 'Compromiso', desc: 'Responsabilidad y dedicación en cada entrega y interacción con nuestros clientes.' },
          ].map((benefit, i) => (
            <div key={i} className="relative max-w-2xl bg-white rounded-[28px] px-12 py-12 border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div
                className="pointer-events-none absolute -right-12 -bottom-12 w-40 h-40 rounded-full opacity-[0.08]"
                style={{
                  background: 'radial-gradient(circle, rgba(142,215,101,0.85) 0%, rgba(142,215,101,0) 65%)',
                }}
              />
              <div className="relative z-10">
                <h3 className="text-3xl font-extrabold mb-4">{benefit.title}</h3>
                <p className="text-lg text-gray-600">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section id="about-contact" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto border-t border-black/5">
        <div className="bg-gradient-to-r from-[var(--color-lime)]/15 to-[var(--color-lime)]/10 rounded-[28px] px-12 py-16 border border-[var(--color-lime)]/20 text-center">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">Conectemos</h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Estamos listos para hablar sobre cómo podemos colaborar y ofrecerte los mejores productos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center justify-center gap-3 bg-[#ff6b5c] text-black font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform">
              Contactar Ahora
            </button>
            <button className="inline-flex items-center justify-center gap-3 border-2 border-[var(--color-lime)] text-black font-bold px-8 py-4 rounded-xl hover:bg-[var(--color-lime)]/10 transition-colors">
              Ver Catálogo
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
