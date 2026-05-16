'use client'

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden">
      {/* Contenedor principal con fondo lima y borde redondeado en las puntas superiores */}
      <div
        className="w-full relative bg-[var(--color-lime)]"
        style={{
          borderRadius: '80px 80px 0 0',
        }}
      >
        <div className="px-6 lg:px-12 py-20 max-w-7xl mx-auto">
          {/* Sección superior - CTA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20 pb-12 border-b border-black/5">
            <div>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-black mb-6 leading-tight">
                ¿Tienes un proyecto en mente? Nos encantaría conocerlo y mostrarte cómo podemos ayudarte.
              </h3>
              <button className="inline-flex items-center gap-3 bg-white text-black font-bold px-6 py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300">
                <span>Solicitar Cotización</span>
                <span className="w-6 h-6 bg-[var(--color-lime)] text-white rounded-full flex items-center justify-center text-sm font-bold">→</span>
              </button>
            </div>

            {/* Navegación */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-extrabold text-black text-sm uppercase tracking-wider mb-4">Productos</h4>
                <ul className="space-y-2">
                  {['Verduras', 'Frutas', 'Orgánicos', 'Mayorista'].map((item) => (
                    <li key={item}>
                      <a href="/services#services-products" className="text-black/80 hover:text-black font-medium transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-extrabold text-black text-sm uppercase tracking-wider mb-4">Empresa</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="/about-us#about-hero" className="text-black/80 hover:text-black font-medium transition-colors">
                      Sobre Nosotros
                    </a>
                  </li>
                  <li>
                    <a href="/services#services-hero" className="text-black/80 hover:text-black font-medium transition-colors">
                      Servicios
                    </a>
                  </li>
                  <li>
                    <a href="/contact#contact-hero" className="text-black/80 hover:text-black font-medium transition-colors">
                      Contacto
                    </a>
                  </li>
                  <li>
                    <a href="/contact#contact-faq" className="text-black/80 hover:text-black font-medium transition-colors">
                      Soporte
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sección media - Información */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-20 pb-12 border-b border-black/10">
            <div>
              <h4 className="font-extrabold text-black text-sm uppercase tracking-wider mb-4">Arequipa, Perú</h4>
              <p className="text-black/80 font-medium text-sm leading-relaxed">
                987 801 148<br />
                veryfrut.fernanda@gmail.com
              </p>
            </div>
            <div>
              <h4 className="font-extrabold text-black text-sm uppercase tracking-wider mb-4">Horario</h4>
              <p className="text-black/80 font-medium text-sm leading-relaxed">
                Lunes - Viernes: 5:00 AM - 1:00 PM<br />
                Sábado: 5:00 AM - 1:00 PM<br />
                Domingo: Cerrado
              </p>
            </div>
            <div>
              <h4 className="font-extrabold text-black text-sm uppercase tracking-wider mb-4">Categorías</h4>
              <p className="text-black/80 font-medium text-sm leading-relaxed">
                <a href="/services#services-products" className="hover:text-black transition-colors">Verduras</a><br />
                <a href="/services#services-products" className="hover:text-black transition-colors">Frutas</a><br />
                <a href="/services#services-products" className="hover:text-black transition-colors">Orgánicos</a><br />
                <a href="/services#services-wholesale" className="hover:text-black transition-colors">Mayorista</a>
              </p>
            </div>
          </div>

          {/* Sección principal - "Vamos a Conectar" */}
          <div className="mb-12">
            <h2 className="text-6xl lg:text-7xl xl:text-8xl font-extrabold text-black leading-tight mb-6">
              Vamos a<br />Conectar
            </h2>

            {/* Onda decorativa */}
            <svg
              className="w-full h-16 text-[var(--color-lime)] mb-12"
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,50 Q250,0 500,50 T1000,50"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Footer inferior */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-black/10">
            <p className="text-black/80 font-medium text-sm">
              © 2026 Veryfrut. Todos los derechos reservados.
            </p>

            <div className="flex items-center gap-4 text-black/80 font-medium text-sm">
              <span>Desarrollado por</span>
              <a
                href="https://wa.me/51901206784"
                target="_blank"
                rel="noreferrer"
                className="font-bold hover:text-black transition-colors"
              >
                +51901206784
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
