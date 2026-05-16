"use client"

import { useState, useCallback, useMemo } from "react"

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

interface CartProduct {
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
  quantity: number
  selectedUnitId: number
  cartItemId?: string
  rating?: number
}

export function useCart() {
  const [cart, setCart] = useState<CartProduct[]>([])

  const addToCart = useCallback((product: CartProduct, selectedUnitId: number) => {
    setCart((prevCart) => {
      // Buscar si el producto ya existe con la misma unidad
      const existingItem = prevCart.find(
        (item) => item.id === product.id && item.selectedUnitId === selectedUnitId && !item.cartItemId,
      )

      if (existingItem) {
        // Si existe, aumentar la cantidad
        return prevCart.map((item) =>
          item.id === product.id && item.selectedUnitId === selectedUnitId && !item.cartItemId
            ? { ...item, quantity: item.quantity + product.quantity }
            : item,
        )
      } else {
        // Si no existe, añadir como nuevo item
        return [
          ...prevCart,
          {
            ...product,
            selectedUnitId,
            cartItemId: `${product.id}-${selectedUnitId}-${Date.now()}`,
          },
        ]
      }
    })
  }, [])

  const addToCartAsDuplicate = useCallback((product: CartProduct, selectedUnitId: number) => {
    setCart((prevCart) => [
      ...prevCart,
      {
        ...product,
        selectedUnitId,
        cartItemId: `${product.id}-${selectedUnitId}-${Date.now()}`,
      },
    ])
  }, [])

  const updateCartItemQuantity = useCallback((productId: number, selectedUnitId: number, quantity: number, cartItemId?: string) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          const itemMatches = cartItemId
            ? item.cartItemId === cartItemId
            : item.id === productId && item.selectedUnitId === selectedUnitId && !item.cartItemId

          return itemMatches ? { ...item, quantity } : item
        })
        .filter((item) => item.quantity > 0),
    )
  }, [])

  const removeFromCart = useCallback((productId: number, selectedUnitId: number, cartItemId?: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => {
        if (cartItemId) {
          return item.cartItemId !== cartItemId
        }
        return !(item.id === productId && item.selectedUnitId === selectedUnitId)
      }),
    )
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }, [cart])

  const getTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }, [cart])

  const getTotalWeight = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }, [cart])

  return useMemo(
    () => ({
      cart,
      addToCart,
      addToCartAsDuplicate,
      updateCartItemQuantity,
      removeFromCart,
      clearCart,
      getTotalPrice,
      getTotalItems,
      getTotalWeight,
    }),
    [cart, addToCart, addToCartAsDuplicate, updateCartItemQuantity, removeFromCart, clearCart, getTotalPrice, getTotalItems, getTotalWeight],
  )
}
