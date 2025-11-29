import * as React from "react"

export interface DropdownMenuProps {
    children: React.ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
    return <div className="relative inline-block">{children}</div>
}

export interface DropdownMenuTriggerProps {
    children: React.ReactNode
    asChild?: boolean
}

export const DropdownMenuTrigger = React.forwardRef<
    HTMLButtonElement,
    DropdownMenuTriggerProps
>(({ children, asChild, ...props }, ref) => {
    if (asChild) {
        return <>{children}</>
    }
    return (
        <button ref={ref} {...props}>
            {children}
        </button>
    )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

export interface DropdownMenuContentProps {
    children: React.ReactNode
    align?: "start" | "center" | "end"
    className?: string
}

export function DropdownMenuContent({
    children,
    align = "center",
    className = "",
}: DropdownMenuContentProps) {
    const alignClass =
        align === "end"
            ? "right-0"
            : align === "start"
                ? "left-0"
                : "left-1/2 -translate-x-1/2"

    return (
        <div
            className={`absolute top-full mt-2 ${alignClass} bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 ${className}`}
        >
            {children}
        </div>
    )
}

export interface DropdownMenuItemProps {
    children: React.ReactNode
    onClick?: () => void
    className?: string
}

export function DropdownMenuItem({
    children,
    onClick,
    className = "",
}: DropdownMenuItemProps) {
    return (
        <div
            onClick={onClick}
            className={`px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors ${className}`}
        >
            {children}
        </div>
    )
}
