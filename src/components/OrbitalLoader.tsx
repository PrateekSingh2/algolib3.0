"use client"

import React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const orbitalLoaderVariants = cva("flex gap-2 items-center justify-center", {
  variants: {
    messagePlacement: {
      bottom: "flex-col",
      top: "flex-col-reverse",
      right: "flex-row",
      left: "flex-row-reverse",
    },
  },
  defaultVariants: {
    messagePlacement: "bottom",
  },
})

export interface OrbitalLoaderProps {
  message?: string
  /**
   * Position of the message relative to the spinner.
   * @default bottom
   */
  messagePlacement?: "top" | "bottom" | "left" | "right"
  /**
   * Whether to center the loader across the entire screen.
   * @default true
   */
  fullScreen?: boolean
}

export function OrbitalLoader({
  className,
  message,
  messagePlacement,
  fullScreen = true,
  ...props
}: React.ComponentProps<"div"> & OrbitalLoaderProps) {
  
  // The core loader element with pure CSS animations
  const loaderContent = (
    <div className={cn(orbitalLoaderVariants({ messagePlacement }))}>
      <div className={cn("relative w-16 h-16", className)} {...props}>
        <div className="absolute inset-0 border-2 border-transparent border-t-foreground rounded-full animate-[spin_1s_linear_infinite]" />
        <div className="absolute inset-2 border-2 border-transparent border-t-foreground rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
        <div className="absolute inset-4 border-2 border-transparent border-t-foreground rounded-full animate-[spin_0.8s_linear_infinite]" />
      </div>
      {message && <div className="text-sm font-medium text-foreground/80">{message}</div>}
    </div>
  )

  // If fullScreen is true, wrap it in a fixed overlay to lock it to the center of the viewport
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex h-[100dvh] w-full items-center justify-center bg-background/50 backdrop-blur-sm">
        {loaderContent}
      </div>
    )
  }

  return loaderContent
}

export default OrbitalLoader