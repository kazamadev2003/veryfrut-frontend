export interface DropdownItem {
  label: string
  href: string
}

export interface NavItem {
  label: string
  href: string
  hasDropdown?: boolean
  dropdownTitle?: string
  dropdownImage?: string
  dropdownItems?: DropdownItem[]
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Servicios", href: "/services#services-hero" },
  {
    label: "Nosotros",
    href: "/about-us#about-hero",
    hasDropdown: true,
    dropdownTitle: "Nosotros",
    dropdownImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=500&fit=crop",
    dropdownItems: [
      { label: "Quienes Somos", href: "/about-us#about-hero" },
      { label: "Nuestra Historia", href: "/about-us#about-history" },
      { label: "Mision y Vision", href: "/about-us#about-values" },
      { label: "Equipo", href: "/about-us#about-why" },
      { label: "Valores", href: "/about-us#about-values" },
      { label: "Responsabilidad Social", href: "/about-us#about-contact" },
      { label: "Certificaciones", href: "/about-us#about-contact" },
      { label: "Premios", href: "/about-us#about-contact" },
      { label: "Alianzas", href: "/about-us#about-contact" },
      { label: "Trabaja con Nosotros", href: "/about-us#about-contact" },
    ],
  },
  { label: "Catalogo", href: "/catalog" },
  { label: "Contactanos", href: "/contact#contact-hero" },
]

export function getPublicNavRoutes(): string[] {
  const routes = new Set<string>()

  for (const item of NAV_ITEMS) {
    if (item.href && item.href !== "#" && item.href.startsWith("/")) {
      routes.add(item.href)
    }
    for (const dropdownItem of item.dropdownItems ?? []) {
      if (dropdownItem.href && dropdownItem.href.startsWith("/")) {
        routes.add(dropdownItem.href)
      }
    }
  }

  return Array.from(routes)
}
