'use client'

import Image from 'next/image'
import { useDeferredValue, useMemo, useState } from 'react'
import { Package, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCategoriesQuery } from '@/lib/api/hooks/useCategory'
import { useProductsQuery } from '@/lib/api/hooks/useProduct'
import type { Category } from '@/types/category'
import type { Product } from '@/types/product'

type CategoryFilter = 'all' | number

type CategorySection = {
  id: number | 'uncategorized'
  name: string
  products: Product[]
}

const ALLOWED_REMOTE_IMAGE_HOSTS = new Set(['res.cloudinary.com'])
const IMAGE_PLACEHOLDER = '/placeholder.svg'

function getSafeImageSrc(value?: string | null) {
  const src = value?.trim()
  if (!src) return IMAGE_PLACEHOLDER

  if (src.startsWith('/') && !src.startsWith('//')) {
    return src
  }

  if (!src.includes('://') && !src.startsWith('data:')) {
    return `/${src.replace(/^\.?\/+/, '')}`
  }

  try {
    const parsed = new URL(src)
    if (!['http:', 'https:'].includes(parsed.protocol)) return IMAGE_PLACEHOLDER
    if (!ALLOWED_REMOTE_IMAGE_HOSTS.has(parsed.hostname)) return IMAGE_PLACEHOLDER
    return src
  } catch {
    return IMAGE_PLACEHOLDER
  }
}

function ProductUnits({ product }: { product: Product }) {
  const unitNames = useMemo(() => {
    if (product.productUnits?.length) {
      return product.productUnits.map((unit) => unit.unitMeasurement.name)
    }

    return []
  }, [product.productUnits])

  if (unitNames.length === 0) {
    return <p className="text-sm text-stone-400">Sin unidades registradas</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {unitNames.map((unitName) => (
        <span
          key={`${product.id}-${unitName}`}
          className="rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-800"
        >
          {unitName}
        </span>
      ))}
    </div>
  )
}

function ProductCard({ product, categoryName }: { product: Product; categoryName: string }) {
  return (
    <article className="group overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_18px_48px_rgba(24,24,27,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(24,24,27,0.09)]">
      <div className="relative aspect-[5/4] overflow-hidden bg-[linear-gradient(180deg,#f7fbef_0%,#ffffff_100%)]">
        <div className="absolute left-4 top-4 z-10 rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700 shadow-sm backdrop-blur">
          {categoryName}
        </div>
        <Image
          src={getSafeImageSrc(product.imageUrl)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-contain object-center p-5 transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-stone-950">{product.name}</h3>
          <p className="mt-2 min-h-[3.5rem] text-sm leading-6 text-stone-600">
            {product.description?.trim() || 'Sin descripción disponible'}
          </p>
        </div>

        <div className="border-t border-stone-100 pt-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Unidades</p>
          <ProductUnits product={product} />
        </div>
      </div>
    </article>
  )
}

function CatalogSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
          <div className="aspect-[5/4] animate-pulse bg-stone-100" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-stone-200" />
            <div className="h-4 w-full animate-pulse rounded-full bg-stone-200" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-stone-200" />
            <div className="flex gap-2 pt-2">
              <div className="h-7 w-20 animate-pulse rounded-full bg-stone-200" />
              <div className="h-7 w-24 animate-pulse rounded-full bg-stone-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CatalogPage() {
  const [searchValue, setSearchValue] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')
  const deferredSearchValue = useDeferredValue(searchValue)

  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError } = useCategoriesQuery()
  const { data: productsResponse, isLoading: productsLoading, isError: productsError } = useProductsQuery({
    limit: 1000,
    sortBy: 'name',
    order: 'asc',
    q: deferredSearchValue.trim() || undefined,
    categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
  })

  const isLoading = categoriesLoading || productsLoading
  const isError = categoriesError || productsError
  const products = useMemo(() => productsResponse?.items ?? [], [productsResponse])

  const sections = useMemo<CategorySection[]>(() => {
    const baseCategories =
      selectedCategory === 'all'
        ? categories
        : categories.filter((category: Category) => category.id === selectedCategory)

    const mappedSections: CategorySection[] = baseCategories
      .map((category: Category) => ({
        id: category.id,
        name: category.name,
        products: products.filter((product) => product.categoryId === category.id),
      }))
      .filter((section) => section.products.length > 0)

    const uncategorizedProducts = products.filter(
      (product) => !categories.some((category: Category) => category.id === product.categoryId)
    )

    if (uncategorizedProducts.length > 0 && selectedCategory === 'all') {
      mappedSections.push({
        id: 'uncategorized',
        name: 'Otros productos',
        products: uncategorizedProducts,
      })
    }

    return mappedSections
  }, [categories, products, selectedCategory])

  const activeCategoryName = useMemo(() => {
    if (selectedCategory === 'all') return 'Todas las categorías'
    return categories.find((category: Category) => category.id === selectedCategory)?.name || 'Categoría'
  }, [categories, selectedCategory])

  const handleReset = () => {
    setSearchValue('')
    setSelectedCategory('all')
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f9ef_0%,#ffffff_36%,#f9faf8_100%)] text-stone-900">
      <section className="border-b border-lime-100/80 bg-[radial-gradient(circle_at_top,rgba(140,198,63,0.17),transparent_36%)]">
        <div className="mx-auto max-w-7xl px-6 pb-10 pt-28 md:px-10 md:pb-14 md:pt-36">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime-700 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Catálogo Veryfrut
          </div>
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-tight text-stone-950 md:text-6xl">
                Explora nuestro catálogo por categorías
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 md:text-lg">
                Encuentra productos con una vista más visual, organizada y fácil de filtrar. Cada tarjeta muestra la
                imagen, el nombre, la descripción y sus unidades disponibles.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-stone-500">
              <Package className="h-4 w-4 text-lime-700" />
              <span>{productsResponse?.total ?? products.length} productos visibles</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 md:px-10">
        <div className="sticky top-20 z-20 rounded-[26px] border border-stone-200 bg-white/92 p-3 shadow-[0_18px_40px_rgba(24,24,27,0.06)] backdrop-blur">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1">
              <div className="mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-50 text-lime-700">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <Button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`rounded-2xl px-5 ${selectedCategory === 'all' ? 'bg-stone-950 text-white hover:bg-stone-900' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
              >
                Todas
              </Button>
              {categories.map((category: Category) => (
                <Button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-2xl px-5 ${selectedCategory === category.id ? 'bg-lime-600 text-white hover:bg-lime-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative min-w-[260px] flex-1 md:w-[320px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Buscar producto..."
                  className="h-11 rounded-2xl border-stone-200 bg-stone-50 pl-11 text-stone-700 shadow-none focus-visible:ring-lime-500"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="h-11 rounded-2xl border-stone-200 px-5"
              >
                Reset filtros
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-stone-500">Filtro activo</p>
            <h2 className="text-xl font-semibold tracking-tight text-stone-950">{activeCategoryName}</h2>
          </div>
          <p className="text-sm text-stone-500">
            {products.length} resultado{products.length === 1 ? '' : 's'}
            {deferredSearchValue.trim() ? ` para "${deferredSearchValue.trim()}"` : ''}
          </p>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <CatalogSkeleton />
          ) : isError ? (
            <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm">
              No se pudo cargar el catálogo en este momento.
            </div>
          ) : sections.length === 0 ? (
            <div className="rounded-[28px] border border-stone-200 bg-white p-12 text-center shadow-sm">
              <Package className="mx-auto h-10 w-10 text-stone-300" />
              <h3 className="mt-4 text-2xl font-semibold text-stone-900">No encontramos productos</h3>
              <p className="mt-2 text-stone-500">Prueba con otra búsqueda o cambia la categoría seleccionada.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {sections.map((section) => (
                <section key={section.id}>
                  <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700">Categoría</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950 md:text-3xl">{section.name}</h3>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-600">
                      {section.products.length} producto{section.products.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {section.products.map((product) => (
                      <ProductCard key={product.id} product={product} categoryName={section.name} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
