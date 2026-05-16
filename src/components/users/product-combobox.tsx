"use client"

import React, { useMemo, useState } from "react"
import Image from "next/image"
import { Search, Package, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"

// Import types from the existing codebase
import { Product } from "@/types/product"

interface ProductComboboxProps {
  products: Product[]
  selectedProductId?: number
  onProductSelect: (productId: number) => void
  quantity: number
  disabled?: boolean
  placeholder?: string
}

export function ProductCombobox({
  products,
  selectedProductId,
  onProductSelect,
  quantity,
  disabled = false,
  placeholder = "Seleccionar producto..."
}: ProductComboboxProps) {
  const [localSearchValue, setLocalSearchValue] = useState("")

  // Find the selected product for display
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId)
  }, [products, selectedProductId])

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!localSearchValue.trim()) return products

    const searchTerms = localSearchValue.toLowerCase().split(" ")
    return products.filter((product) => {
      const searchText = `${product.name} ${product.description || ""}`.toLowerCase()
      return searchTerms.every((term) => searchText.includes(term))
    })
  }, [products, localSearchValue])

  const handleProductSelect = (productId: string) => {
    const id = parseInt(productId)
    onProductSelect(id)
  }

  const getStockVariant = (stock: number) => {
    if (stock === 0) return "destructive"
    if (stock <= 5) return "secondary"
    return "default"
  }

  const getStockText = (stock: number) => {
    if (stock === 0) return "Agotado"
    if (stock <= 5) return `¡Últimos ${stock}!`
    return `${stock} disponibles`
  }

  return (
    <ComboboxRoot
      value={selectedProductId?.toString() || ""}
      onValueChange={handleProductSelect}
    >
      <ComboboxTrigger disabled={disabled} className="w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedProduct ? (
            <>
              <Package className="h-4 w-4 text-orange-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{selectedProduct.name}</div>
                <div className="text-xs text-gray-500">
                  ${selectedProduct.price.toFixed(2)} • {quantity} unidad{quantity !== 1 ? "es" : ""}
                </div>
              </div>
            </>
          ) : (
            <>
              <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500 text-sm">{placeholder}</span>
            </>
          )}
        </div>
      </ComboboxTrigger>
      
      <ComboboxContent>
        <div className="px-2 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <ComboboxInput
              placeholder="Buscar producto..."
              value={localSearchValue}
              onChange={(e) => setLocalSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="max-h-60 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <ComboboxEmpty>
              <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <div className="text-sm">
                {localSearchValue ? "No se encontraron productos" : "No hay productos disponibles"}
              </div>
            </ComboboxEmpty>
          ) : (
            filteredProducts.map((product) => {
              const isSelected = product.id === selectedProductId
              const canAddQuantity = product.stock >= quantity
              
              return (
                <ComboboxItem
                  key={product.id}
                  value={product.id.toString()}
                  disabled={!canAddQuantity}
                  className={cn(
                    "p-3 gap-3",
                    !canAddQuantity && "opacity-50"
                  )}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {product.name}
                        </span>
                        {isSelected && (
                          <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                      
                      {product.description && (
                        <div className="text-xs text-gray-500 mb-2 line-clamp-2">
                          {product.description}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-green-600">
                            ${product.price.toFixed(2)}
                          </span>
                          <Badge
                            variant={getStockVariant(product.stock)}
                            className="text-xs"
                          >
                            {getStockText(product.stock)}
                          </Badge>
                        </div>
                        
                        {product.productUnits && product.productUnits.length > 0 && (
                          <div className="text-xs text-gray-400">
                            {product.productUnits[0]?.unitMeasurement?.name || "Und"}
                          </div>
                        )}
                      </div>
                      
                      {!canAddQuantity && (
                        <div className="text-xs text-red-600 mt-1">
                          Stock insuficiente para {quantity} unidades
                        </div>
                      )}
                    </div>
                  </div>
                </ComboboxItem>
              )
            })
          )}
        </div>
      </ComboboxContent>
    </ComboboxRoot>
  )
}

export default ProductCombobox