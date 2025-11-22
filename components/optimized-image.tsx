"use client"

import Image from "next/image"
import { useState } from "react"
import { ImageIcon } from "lucide-react"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down"
}

/**
 * Optimized Image Component
 *
 * Wrapper around Next.js Image with loading states and error handling
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  fill = false,
  objectFit = "cover",
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`} style={{ width, height }}>
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && <div className="absolute inset-0 animate-pulse bg-muted" style={{ width, height }} />}
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        className={`${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        style={fill ? { objectFit } : undefined}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
    </div>
  )
}
