"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComboboxContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  searchValue: string
  onSearchValueChange: (value: string) => void
}

const ComboboxContext = React.createContext<ComboboxContextValue | undefined>(undefined)

function useCombobox() {
  const context = React.useContext(ComboboxContext)
  if (!context) {
    throw new Error("useCombobox must be used within a ComboboxProvider")
  }
  return context
}

interface ComboboxRootProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
}

function ComboboxRoot({ value = "", onValueChange, children }: ComboboxRootProps) {
  const [internalValue, setInternalValue] = React.useState(value)
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const currentValue = value !== undefined ? value : internalValue
  const handleValueChange = React.useCallback(
    (newValue: string) => {
      console.log("[ComboboxRoot] handleValueChange:", newValue)
      if (onValueChange) {
        onValueChange(newValue)
      } else {
        setInternalValue(newValue)
      }
      setSearchValue("")
    },
    [onValueChange]
  )

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value)
    }
  }, [value])

  const contextValue = React.useMemo(
    () => ({
      value: currentValue,
      onValueChange: handleValueChange,
      open,
      onOpenChange: setOpen,
      searchValue,
      onSearchValueChange: setSearchValue,
    }),
    [currentValue, handleValueChange, open, searchValue]
  )

  return (
    <ComboboxContext.Provider value={contextValue}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        {children}
      </PopoverPrimitive.Root>
    </ComboboxContext.Provider>
  )
}

function ComboboxTrigger({ className, children, ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  const { open } = useCombobox()
  
  return (
    <PopoverPrimitive.Trigger
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        "h-9",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className={cn("size-4 opacity-50 transition-transform", open && "rotate-180")} />
    </PopoverPrimitive.Trigger>
  )
}

function ComboboxContent({ className, children, ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 min-w-[8rem] origin-(--radix-popover-content-transform-origin) overflow-hidden rounded-md border shadow-md p-1",
          "max-h-[300px] overflow-y-auto",
          className
        )}
        align="start"
        sideOffset={4}
        {...props}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
}

function ComboboxInput({ className, placeholder, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const { searchValue, onSearchValueChange } = useCombobox()
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <input
      ref={inputRef}
      type="text"
      value={searchValue}
      onChange={(e) => onSearchValueChange(e.target.value)}
      placeholder={placeholder || "Buscar..."}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

interface ComboboxItemProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

function ComboboxItem({ value, children, className, disabled = false }: ComboboxItemProps) {
  const { value: currentValue, onValueChange, onOpenChange } = useCombobox()
  const isSelected = currentValue === value

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log("[ComboboxItem] handleMouseDown called - value:", value)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      console.log("[ComboboxItem] handleClick - value:", value)
      onValueChange(value)
      setTimeout(() => onOpenChange(false), 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled) {
      e.preventDefault()
      console.log("[ComboboxItem] handleKeyDown - value:", value)
      onValueChange(value)
      onOpenChange(false)
    }
  }

  return (
    <div
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected && "bg-accent text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="option"
      aria-selected={isSelected}
      data-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <CheckIcon className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
}

function ComboboxEmpty({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("py-6 text-center text-sm text-muted-foreground", className)}>
      {children}
    </div>
  )
}

export {
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxEmpty,
  useCombobox,
}