'use client'

import Image from 'next/image'

export default function ServicesPage() {
  return (
    <main id="services" className="bg-white w-full pt-24">
      {/* Hero Section */}
      <section id="services-hero" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">Nuestros Servicios</h1>
          <p className="text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            En Veryfrut ofrecemos servicios completos de distribución de frutas y verduras de la mejor calidad para satisfacer las necesidades de nuestros diversos clientes.
          </p>
        </div>
      </section>

      {/* Distribución Mayorista */}
      <section id="services-wholesale" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto border-t border-black/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl font-extrabold tracking-tight mb-6">Distribución Mayorista</h2>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Ofrecemos servicios de distribución mayorista para supermercados, hoteles, restaurantes y otros negocios que requieren productos frescos de alta calidad en grandes cantidades.
            </p>
            <p className="text-lg text-gray-700 mb-10 leading-relaxed">
              Nuestro sistema logístico eficiente garantiza que los productos lleguen a su destino en perfectas condiciones y en el momento acordado, manteniendo la cadena de frío cuando es necesario.
            </p>
            
            <ul className="space-y-4 mb-10">
              {[
                'Entregas programadas y puntuales',
                'Productos frescos seleccionados',
                'Precios competitivos para mayoristas',
                'Amplia variedad de productos de calidad',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[var(--color-lime)] font-bold text-xl">✓</span>
                  <span className="text-gray-700 text-lg">{item}</span>
                </li>
              ))}
            </ul>

            <button className="inline-flex items-center gap-3 bg-[#ff6b5c] text-black font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform">
              Solicitar Información
            </button>
          </div>
          <div className="relative h-96 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
            <Image
              src="https://res.cloudinary.com/dhkb93mix/image/upload/v1770755728/WhatsApp_Image_2026-02-10_at_3.09.59_PM_kdtscc.jpg"
              alt="Distribución Mayorista"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Distribución Minorista */}
      <section id="services-retail" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto border-t border-black/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative h-96 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.1)] lg:order-2">
            <Image
              src="https://res.cloudinary.com/demzflxgq/image/upload/v1770444706/vitaly-gariev-xSdL0ze7Qqc-unsplash_czjiib.jpg"
              alt="Distribución Minorista"
              fill
              className="object-cover"
            />
          </div>
          <div className="lg:order-1">
            <h2 className="text-5xl font-extrabold tracking-tight mb-6">Distribución Minorista</h2>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Suministramos a tiendas especializadas, mercados locales y pequeños comercios que buscan ofrecer a sus clientes productos de la mejor calidad.
            </p>
            <p className="text-lg text-gray-700 mb-10 leading-relaxed">
              Entendemos las necesidades específicas de los minoristas y ofrecemos soluciones flexibles que se adaptan a diferentes volúmenes y frecuencias de pedido.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                'Pedidos personalizados',
                'Entregas frecuentes de productos frescos',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[var(--color-lime)] font-bold text-xl">✓</span>
                  <span className="text-gray-700 text-lg">{item}</span>
                </li>
              ))}
            </ul>

            <button className="inline-flex items-center gap-3 bg-[#ff6b5c] text-black font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform">
              Contactar Ahora
            </button>
          </div>
        </div>
      </section>

      {/* Nuestro Proceso */}
      <section id="services-process" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto border-t border-black/5">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold tracking-tight mb-6">Nuestro Proceso</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Cómo aseguramos calidad en cada paso</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { step: '1', title: 'Selección', desc: 'Seleccionamos cuidadosamente los mejores productos del mercado cumpliendo las especificaciones de cada cliente.' },
            { step: '2', title: 'Control de Calidad', desc: 'Verificamos la calidad y frescura de cada producto antes de su distribución.' },
            { step: '3', title: 'Empaque', desc: 'Empacamos los productos con materiales sostenibles que mantienen su frescura.' },
            { step: '4', title: 'Distribución', desc: 'Entregamos los productos a tiempo y en perfectas condiciones a nuestros clientes.' },
          ].map((proceso, i) => (
            <div key={i} className="relative">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-[24px] p-8 border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="w-12 h-12 bg-[var(--color-lime)] text-white rounded-full flex items-center justify-center font-extrabold text-lg mb-4">
                  {proceso.step}
                </div>
                <h3 className="text-2xl font-extrabold mb-3">{proceso.title}</h3>
                <p className="text-gray-600">{proceso.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Productos que Distribuimos */}
      <section id="services-products" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto border-t border-black/5">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold tracking-tight mb-6">Productos que Distribuimos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title: 'Frutas Frescas', image: 'https://res.cloudinary.com/demzflxgq/image/upload/v1770447062/Exportaciones-de-frutas-chilenas-alcanzaron-cifras-record-en-el-primer-trimestre-de-2024-00_zz4iad.jpg' },
            { title: 'Verduras', image: 'https://res.cloudinary.com/demzflxgq/image/upload/v1770447045/fresh-fruits-and-vegetables_yhlz0w.jpg' },
            { title: 'Frutas Exóticas', image: 'https://res.cloudinary.com/demzflxgq/image/upload/v1770444706/sabrina_ripke_fotografie-pumpkin-1768857_1280_xxf594.jpg' },
            { title: 'Productos de Temporada', image: 'https://res.cloudinary.com/demzflxgq/image/upload/v1770444706/vitaly-gariev-xSdL0ze7Qqc-unsplash_czjiib.jpg' },
          ].map((producto, i) => (
            <div key={i} className="group overflow-hidden rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-shadow">
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={producto.image || "/placeholder.svg"}
                  alt={producto.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="bg-white p-6">
                <h3 className="text-2xl font-extrabold text-center">{producto.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section id="services-contact" className="scroll-mt-28 px-6 lg:px-12 py-20 max-w-7xl mx-auto border-t border-black/5">
        <div className="bg-gradient-to-r from-[var(--color-lime)]/15 to-[var(--color-lime)]/10 rounded-[28px] px-12 py-16 border border-[var(--color-lime)]/20 text-center">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">¿Listo para comenzar?</h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Contáctanos hoy mismo para discutir cómo podemos satisfacer tus necesidades de distribución de frutas y verduras de la mejor calidad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center justify-center gap-3 bg-[#ff6b5c] text-black font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform">
              Solicitar Cotización
            </button>
            <button className="inline-flex items-center justify-center gap-3 border-2 border-[var(--color-lime)] text-black font-bold px-8 py-4 rounded-xl hover:bg-[var(--color-lime)]/10 transition-colors">
              Contactar Ahora
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
