"use client"
import type React from "react"
import { useRef, useState, useEffect } from "react"
import { ChevronDown, X, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import gsap from "gsap"
import { NAV_ITEMS } from "@/components/home/nav-items"

const LOGO_SRC =
  "https://res.cloudinary.com/demzflxgq/image/upload/v1770449756/ChatGPT_Image_7_feb_2026_02_25_57_a_ilotbf.svg"

const LogoIcon: React.FC = () => (
  <Image
    src={LOGO_SRC}
    alt="Logo Veryfrut"
    width={96}
    height={56}
    className="h-12 w-auto shrink-0 sm:h-14 [filter:brightness(0)_saturate(100%)_invert(66%)_sepia(17%)_saturate(1508%)_hue-rotate(43deg)_brightness(91%)_contrast(88%)]"
  />
)

const ButtonLogo: React.FC<{ dark?: boolean }> = ({ dark = false }) => (
  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${dark ? "bg-white/15" : "bg-[#F3F8E8]"}`}>
    <Image
      src={LOGO_SRC}
      alt="Logo Veryfrut"
      width={22}
      height={22}
      className={`h-[22px] w-auto ${dark ? "brightness-0 invert" : "[filter:brightness(0)_saturate(100%)_invert(66%)_sepia(17%)_saturate(1508%)_hue-rotate(43deg)_brightness(91%)_contrast(88%)]"}`}
    />
  </div>
)

const MenuIcon: React.FC = () => (
  <div className="flex flex-col gap-[3.5px] items-center">
    <div className="w-4.5 h-[2px] bg-[#1A1A1A] rounded-full"></div>
    <div className="w-4.5 h-[2px] bg-[#1A1A1A] rounded-full"></div>
  </div>
)

const Header: React.FC = () => {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mainBarRef = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    router.prefetch("/users")
  }, [router])

  useEffect(() => {
    if (openDropdown && dropdownRef.current) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
      )
    }
  }, [openDropdown])

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => {
      const next = !prev
      if (next) {
        setOpenDropdown(null)
      }
      return next
    })
  }

  const openDropdownMenu = (itemLabel: string) => {
    clearCloseTimeout()
    setOpenDropdown(itemLabel)
  }

  const scheduleCloseDropdown = () => {
    clearCloseTimeout()
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpenDropdown(null)
    }, 140)
  }

  const handleMobileNavigate = (href: string) => {
    setIsMobileMenuOpen(false)
    setOpenDropdown(null)
    router.push(href)
  }

  return (
    <div className="relative">
      <nav ref={navRef} className="fixed top-3 left-0 right-0 z-50 flex justify-center mx-auto px-3 sm:px-4 md:px-6 lg:px-40 h-auto">
        <div className="flex w-full max-w-[1300px] gap-2 sm:gap-3 items-stretch">
          {/* Main Bar */}
          <div ref={mainBarRef} className="relative flex-1 bg-white rounded-[10px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-3 sm:px-4 md:px-5 lg:px-6 py-2 flex justify-between min-h-[66px] mx-0 my-1.5 border-0 items-stretch flex-row font-normal tracking-normal">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <LogoIcon />
              <span className="text-[#1A1A1A] text-base sm:text-lg md:text-xl lg:text-2xl tracking-tight leading-5 font-normal whitespace-nowrap">
                Veryfrut
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-0 ml-auto pr-0 relative">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.label}
                  onMouseEnter={() => item.hasDropdown && openDropdownMenu(item.label)}
                  onMouseLeave={() => item.hasDropdown && scheduleCloseDropdown()}
                  className="relative"
                >
                  <a
                    href={item.href}
                    className="text-[#1A1A1A] hover:text-[#8CC63F] transition-colors flex font-normal text-[18px] items-center gap-0 leading-7 tracking-normal whitespace-nowrap px-2.5"
                  >
                    {item.label}
                    {item.hasDropdown && <ChevronDown size={13} className="text-[#1A1A1A]/40 mt-0.5 ml-1" />}
                  </a>
                </div>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="rounded-full bg-[#8CC63F] flex items-center justify-center hover:bg-[#7db138] transition-all active:scale-95 cursor-pointer flex-shrink-0 w-10 sm:w-11 h-10 sm:h-11 border-0 ml-2 lg:hidden"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X size={18} className="text-[#1A1A1A]" /> : <MenuIcon />}
            </button>
          </div>

          {/* Quote Button */}
          <Link
            href="/users"
            onMouseEnter={() => router.prefetch("/users")}
            className="hidden md:flex bg-white rounded-[10px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] items-center gap-2 md:gap-3 min-h-[68px] hover:bg-neutral-50 transition-colors cursor-pointer shrink-0 px-4 md:px-6 py-0 mr-0 ml-1 mt-1 mb-1 whitespace-nowrap"
          >
            <span className="text-[#1A1A1A] text-base md:text-lg lg:text-[18px] font-normal tracking-normal leading-9">
              Pedir ya
            </span>
            <ButtonLogo />
          </Link>
        </div>
      </nav>

      {/* Mega Menu - Fixed position below navbar */}
      {openDropdown && !isMobileMenuOpen && (
        <div
          ref={dropdownRef}
          onMouseEnter={clearCloseTimeout}
          onMouseLeave={scheduleCloseDropdown}
          className="hidden lg:block fixed top-[calc(12px+66px+12px)] left-1/2 -translate-x-1/2 w-[calc(100%-24px)] lg:w-auto lg:max-w-[900px] bg-white rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-40 px-3 sm:px-4 md:px-6 lg:px-0"
        >
          {NAV_ITEMS.find((item) => item.label === openDropdown) && (
            <div className="flex p-6 gap-8">
              {/* Image Section */}
              <div className="relative w-80 h-80 flex-shrink-0 rounded-[10px] overflow-hidden">
                <Image
                  src={NAV_ITEMS.find((item) => item.label === openDropdown)?.dropdownImage || "/placeholder.svg"}
                  alt={NAV_ITEMS.find((item) => item.label === openDropdown)?.dropdownTitle || "Imagen de navegación"}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <h3 className="text-xl font-medium text-white">
                    {NAV_ITEMS.find((item) => item.label === openDropdown)?.dropdownTitle}
                  </h3>
                  <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Menu Links */}
              <div className="flex-1 flex gap-16 py-4">
                <div className="space-y-4">
                  {(NAV_ITEMS.find((item) => item.label === openDropdown)?.dropdownItems || [])
                    .slice(0, Math.ceil((NAV_ITEMS.find((item) => item.label === openDropdown)?.dropdownItems || []).length / 2))
                    .map((dropdownItem) => (
                      <Link
                        key={`${dropdownItem.href}-${dropdownItem.label}-left`}
                        href={dropdownItem.href}
                        className="block text-[#1A1A1A] hover:text-[#8CC63F] transition-colors text-base font-normal"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {dropdownItem.label}
                      </Link>
                    ))}
                </div>
                <div className="space-y-4">
                  {(NAV_ITEMS.find((item) => item.label === openDropdown)?.dropdownItems || [])
                    .slice(Math.ceil((NAV_ITEMS.find((item) => item.label === openDropdown)?.dropdownItems || []).length / 2))
                    .map((dropdownItem) => (
                      <Link
                        key={`${dropdownItem.href}-${dropdownItem.label}-right`}
                        href={dropdownItem.href}
                        className="block text-[#1A1A1A] hover:text-[#8CC63F] transition-colors text-base font-normal"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {dropdownItem.label}
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[80px] px-3 sm:px-4 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/5" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-full max-w-[400px] mx-auto bg-white rounded-[14px] p-4 sm:p-6 shadow-2xl border border-gray-100">
            <div className="flex flex-col gap-4 sm:gap-5">
              {NAV_ITEMS.map((item) => (
                <div key={item.label}>
                  {item.hasDropdown ? (
                    <button
                      onClick={() => {
                        setOpenDropdown(openDropdown === item.label ? null : item.label)
                      }}
                      className="text-base sm:text-[17px] font-semibold text-[#1A1A1A] flex justify-between items-center w-full"
                    >
                      {item.label}
                      <ChevronDown size={18} className="text-gray-300" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMobileNavigate(item.href)}
                      className="text-base sm:text-[17px] font-semibold text-[#1A1A1A] flex justify-between items-center w-full text-left"
                    >
                      {item.label}
                    </button>
                  )}
                  {item.hasDropdown && openDropdown === item.label && (
                    <div className="ml-4 mt-3 space-y-2 border-l-2 border-[#8CC63F] pl-4">
                      {item.dropdownItems?.map((dropdownItem) => (
                        <Link
                          key={`${dropdownItem.href}-${dropdownItem.label}-mobile`}
                          href={dropdownItem.href}
                          className="block py-2 text-sm text-[#1A1A1A] hover:text-[#8CC63F] transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {dropdownItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <hr className="border-gray-50" />
              <Link
                href="/users"
                onClick={() => setIsMobileMenuOpen(false)}
                onMouseEnter={() => router.prefetch("/users")}
                className="w-full bg-[#1A96FF] text-white rounded-[10px] py-2.5 sm:py-3.5 px-4 sm:px-6 font-bold flex items-center justify-between text-sm sm:text-base"
              >
                <span>Pedir ya</span>
                <ButtonLogo dark />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Header

