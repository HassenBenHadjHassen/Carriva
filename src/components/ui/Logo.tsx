import React from "react"
import { cn } from "../../lib/utils"

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: "text" | "mark" | "gradient"
  className?: string
}

export function Logo({
  variant = "text",
  className,
  ...props
}: LogoProps) {
  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-8 w-8 shrink-0", className)}
        {...props}
      >
        <defs>
          <linearGradient id="logoMarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="45%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>
        <text
          x="12"
          y="51"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="58"
          fontWeight="900"
          letterSpacing="-0.05em"
          fill="url(#logoMarkGrad)"
        >
          C
        </text>
      </svg>
    )
  }

  if (variant === "gradient") {
    return (
      <svg
        viewBox="0 0 170 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-8 w-auto shrink-0", className)}
        {...props}
      >
        <defs>
          <linearGradient id="logoFullGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="35%" stopColor="#2563EB" />
            <stop offset="85%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <text
          x="2"
          y="29"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="33"
          fontWeight="800"
          letterSpacing="-0.03em"
          fill="url(#logoFullGrad)"
        >
          Carriva
        </text>
      </svg>
    )
  }

  // Default: Text logo with gradient 'C' and currentColor 'arriva' (no background)
  return (
    <svg
      viewBox="0 0 170 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-auto shrink-0", className)}
      {...props}
    >
      <defs>
        <linearGradient id="logoPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="45%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <text
        x="2"
        y="29"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="33"
        fontWeight="800"
        letterSpacing="-0.03em"
      >
        <tspan fill="url(#logoPrimaryGrad)">C</tspan>
        <tspan fill="currentColor">arriva</tspan>
      </text>
    </svg>
  )
}
