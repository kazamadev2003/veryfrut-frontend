"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Search, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxInput,
  ComboboxEmpty,
  ComboboxItem,
} from "@/components/ui/combobox"
import { Product } from "@/types/product"

interface SimpleProductComboboxProps {
  products: Product[]
  selectedProductId?: number
  onProductSelect: (productId: number) => void
  placeholder?: string
}

export function SimpleProductCombobox({
  products,
  selectedProductId,
  onProductSelect,
  placeholder = "Seleccionar producto..."
}: SimpleProductComboboxProps) {
  const [localSearchValue, setLocalSearchValue] = useState("")

  // Find selected product for display
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
    console.log("[SimpleProductCombobox] handleProductSelect:", productId)
    const id = parseInt(productId)
    setLocalSearchValue("")
    onProductSelect(id)
  }

  return (
    <ComboboxRoot
      value={selectedProductId?.toString() || ""}
      onValueChange={handleProductSelect}
    >
      <ComboboxTrigger className="w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedProduct ? (
            <>
              <Package className="h-4 w-4 text-orange-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{selectedProduct.name}</div>
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
              
              return (
                <ComboboxItem
                  key={product.id}
                  value={product.id.toString()}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pr-8 pl-3 text-sm outline-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground",
                    isSelected && "bg-accent text-accent-foreground",
                    "gap-3"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center">
                          <Package className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate">
                        {product.name}
                      </span>
                      
                      {product.description && (
                        <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <span className="absolute right-2 flex h-4 w-4 items-center justify-center">
                      <Package className="h-3 w-3 text-green-600" />
                    </span>
                  )}
                </ComboboxItem>
              )
            })
          )}
        </div>
      </ComboboxContent>
    </ComboboxRoot>
  )
}

export default SimpleProductCombobox

