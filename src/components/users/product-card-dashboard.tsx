"use client"

import type React from "react"
import Image from "next/image"
import { useState, useCallback, useMemo } from "react"
import { ShoppingCart, Star, Tag, Plus, Minus, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Interfaces
interface UnitMeasurement {
  id: number
  name: string
  description: string
}

interface ProductUnit {
  id: number
  productId: number
  unitMeasurementId: number
  unitMeasurement: UnitMeasurement
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  imageUrl: string
  categoryId: number
  createdAt: string
  updatedAt: string
  productUnits: ProductUnit[]
  rating?: number
}

interface CartProduct extends Product {
  quantity: number
  selectedUnitId: number
  cartItemId?: string
}

interface ProductCardDashboardProps {
  product: Product
  onAddToCart?: (product: CartProduct, selectedUnitId: number) => void
  disabled?: boolean
  className?: string
}

// Constants
const QUANTITY_LIMITS = {
  MIN: 0.01,
  MAX: 999.99,
  STEP: 0.25,
  DECIMALS: 2,
} as const

const ALLOWED_REMOTE_IMAGE_HOSTS = new Set(["res.cloudinary.com"])
const IMAGE_PLACEHOLDER = "/placeholder.svg"

function getSafeImageSrc(value?: string | null) {
  const src = value?.trim()
  if (!src) return IMAGE_PLACEHOLDER

  if (src.startsWith("/") && !src.startsWith("//")) {
    return src
  }
  if (!src.includes("://") && !src.startsWith("data:")) {
    return `/${src.replace(/^\.?\/+/, "")}`
  }

  try {
    const parsed = new URL(src)
    if (!["http:", "https:"].includes(parsed.protocol)) return IMAGE_PLACEHOLDER
    if (!ALLOWED_REMOTE_IMAGE_HOSTS.has(parsed.hostname)) return IMAGE_PLACEHOLDER
    return src
  } catch {
    return IMAGE_PLACEHOLDER
  }
}

// Componente de calificación
const StarRating = ({ rating }: { rating: number }) => {
  const safeRating = Math.min(5, Math.max(0, rating || 5))
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            "h-3 w-3",
            index < safeRating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200",
          )}
          aria-hidden="true"
        />
      ))}
      <span className="text-xs font-medium text-gray-600">{safeRating.toFixed(1)}</span>
    </div>
  )
}

// Hook para gestionar cantidad
const useQuantityManager = (initialQuantity = 1) => {
  const [quantity, setQuantity] = useState<number>(initialQuantity)
  const [quantityInput, setQuantityInput] = useState<string>(initialQuantity.toString())

  const formatQuantity = useCallback((qty: number): string => {
    if (qty % 1 === 0) {
      return qty.toFixed(0)
    }
    return Number.parseFloat(qty.toFixed(QUANTITY_LIMITS.DECIMALS)).toString().replace(".", ",")
  }, [])

  const updateQuantity = useCallback(
    (newQuantity: number) => {
      if (newQuantity >= QUANTITY_LIMITS.MIN && newQuantity <= QUANTITY_LIMITS.MAX) {
        const roundedQuantity = Math.round(newQuantity * 1000) / 1000
        setQuantity(roundedQuantity)
        setQuantityInput(formatQuantity(roundedQuantity))
        return true
      }
      return false
    },
    [formatQuantity],
  )

  const handleInputChange = useCallback((value: string) => {
    const normalizedValue = value.replace(",", ".")
    const regex = /^\d*\.?\d{0,3}$/
    if (regex.test(normalizedValue) || value === "") {
      setQuantityInput(value)
      if (value !== "") {
        const numValue = Number.parseFloat(normalizedValue)
        if (!isNaN(numValue) && numValue > 0) {
          const roundedValue = Math.round(numValue * 1000) / 1000
          setQuantity(roundedValue)
        }
      }
    }
  }, [])

  const handleInputBlur = useCallback(() => {
    const normalizedValue = quantityInput.replace(",", ".")
    const numValue = Number.parseFloat(normalizedValue)
    if (!isNaN(numValue) && numValue > 0) {
      updateQuantity(numValue)
    } else {
      setQuantityInput(formatQuantity(quantity))
    }
  }, [quantityInput, quantity, updateQuantity, formatQuantity])

  const increment = useCallback(() => {
    updateQuantity(quantity + QUANTITY_LIMITS.STEP)
  }, [quantity, updateQuantity])

  const decrement = useCallback(() => {
    if (quantity > QUANTITY_LIMITS.MIN) {
      updateQuantity(quantity - QUANTITY_LIMITS.STEP)
    }
  }, [quantity, updateQuantity])

  return {
    quantity,
    quantityInput,
    formatQuantity,
    handleInputChange,
    handleInputBlur,
    increment,
    decrement,
  }
}

export function ProductCardDashboard({
  product,
  onAddToCart,
  disabled = false,
  className,
}: ProductCardDashboardProps) {
  const productUnits = useMemo(
    () => (Array.isArray(product.productUnits) ? product.productUnits : []),
    [product.productUnits]
  )
  const safePrice = Number.isFinite(Number(product.price)) ? Number(product.price) : 0
  const safeStock = Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0
  const [selectedUnitId, setSelectedUnitId] = useState<number>(
    productUnits[0]?.unitMeasurement?.id ?? 0,
  )
  const [isHovered, setIsHovered] = useState(false)

  const {
    quantity,
    quantityInput,
    formatQuantity,
    handleInputChange,
    handleInputBlur,
    increment,
    decrement,
  } = useQuantityManager(1)

  // Valores memoizados
  const selectedUnitName = useMemo(() => {
    const selectedUnit = productUnits.find((pu) => pu.unitMeasurement?.id === selectedUnitId)
    return selectedUnit?.unitMeasurement.name || "Unidad"
  }, [productUnits, selectedUnitId])

  const isOutOfStock = useMemo(() => safeStock <= 0, [safeStock])
  const isAddDisabled = useMemo(
    () => disabled || productUnits.length === 0 || quantity <= 0 || isOutOfStock,
    [disabled, productUnits.length, quantity, isOutOfStock],
  )

  // Manejador para agregar al carrito
  const handleAddToCart = useCallback(() => {
    if (!onAddToCart) return

    const cartProduct: CartProduct = {
      ...product,
      price: safePrice,
      stock: safeStock,
      productUnits,
      quantity,
      selectedUnitId,
    }

    onAddToCart(cartProduct, selectedUnitId)
  }, [onAddToCart, product, productUnits, quantity, safePrice, safeStock, selectedUnitId])

  return (
    <Card
      className={cn(
        "overflow-hidden border border-gray-200 transition-all duration-300 flex flex-col h-full",
        "bg-white shadow-sm hover:shadow-lg",
        !disabled && isHovered ? "border-green-400 shadow-lg" : "border-gray-200",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Imagen del producto */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-white">
        <Image
          src={getSafeImageSrc(product.imageUrl)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-contain object-center p-3"
          loading="lazy"
        />

        {/* Badges de estado */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isOutOfStock && (
            <Badge className="bg-red-600 text-white font-semibold text-xs px-3 py-1 shadow-md">
              SIN STOCK
            </Badge>
          )}
          {!isOutOfStock && safeStock < 5 && (
            <Badge className="bg-orange-500 text-white font-semibold text-xs px-3 py-1 shadow-md">
              ÚLTIMO STOCK
            </Badge>
          )}
        </div>
      </div>

      {/* Contenido de la tarjeta */}
      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Nombre del producto */}
        <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-2 min-h-[2rem]">{product.name}</h3>

        {/* Descripción */}
        <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">{product.description}</p>

        {/* Rating */}
        <div className="mb-4">
          <StarRating rating={product.rating || 5} />
        </div>



        {/* Selector de unidad de medida */}
        <div className="mt-auto">
          <label className="text-xs font-semibold text-gray-700 mb-2 block">Presentación</label>
          <Select value={selectedUnitId.toString()} onValueChange={(value: string) => setSelectedUnitId(Number(value))} disabled={disabled}>
            <SelectTrigger className="h-10 text-sm border-gray-300 focus:ring-green-500/20 focus:border-green-500">
              <SelectValue placeholder="Selecciona unidad" />
            </SelectTrigger>
            <SelectContent>
              {productUnits.map((pu) => (
                <SelectItem key={pu.id} value={(pu.unitMeasurement?.id ?? pu.unitMeasurementId).toString()}>
                  <span className="font-medium">{pu.unitMeasurement?.name ?? "Unidad"}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      {/* Footer con controles de cantidad y botón */}
      <CardFooter className="p-4 pt-0 flex flex-col gap-3">
        {/* Controles de cantidad */}
        <div className="w-full bg-gray-50 rounded-lg border border-gray-200 p-3">
          <label className="text-xs font-semibold text-gray-700 mb-2 block flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" />
            Cantidad
          </label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg bg-white hover:bg-gray-100"
              onClick={decrement}
              disabled={disabled || quantity <= QUANTITY_LIMITS.MIN}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="text"
              value={quantityInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              onKeyPress={(e) => e.key === "Enter" && handleInputBlur()}
              className="h-9 text-center text-sm font-semibold border-gray-300 focus:ring-green-500/20 focus:border-green-500"
              disabled={disabled}
              inputMode="decimal"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg bg-white hover:bg-gray-100"
              onClick={increment}
              disabled={disabled}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <div className="ml-auto">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {selectedUnitName}
              </Badge>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full inline-block">
              {formatQuantity(quantity)} {selectedUnitName}
            </span>
          </div>
        </div>

        {/* Botón de agregar al carrito */}
        <Button
          className={cn(
            "w-full h-11 font-semibold transition-all duration-200 shadow-sm",
            isOutOfStock
              ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:shadow-lg",
          )}
          onClick={handleAddToCart}
          disabled={isAddDisabled}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isOutOfStock ? "Sin stock disponible" : "Agregar al carrito"}
        </Button>

        {/* Información adicional */}
        {safeStock > 0 && safeStock < 10 && (
          <div className="w-full flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
            <Info className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
            <span className="text-xs text-amber-700 font-medium">
              Solo {safeStock} unidades disponibles
            </span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
