"use client"

import React, { useEffect, useRef, useCallback } from "react"
import createGlobe from "cobe"

export interface PulseMarker {
  id: string
  location: [number, number]
  delay: number
  label?: string
}

export interface GlobePulseProps {
  markers?: PulseMarker[]
  className?: string
  speed?: number
  dark?: number
  baseColor?: [number, number, number]
  markerColor?: [number, number, number]
  glowColor?: [number, number, number]
  arcColor?: [number, number, number]
}

const defaultMarkers: PulseMarker[] = [
  { id: "cartagena", location: [10.39, -75.48], delay: 0, label: "Cartagena" },
  { id: "paris", location: [48.85, 2.35], delay: 0.4, label: "París" },
  { id: "tokyo", location: [35.68, 139.69], delay: 0.8, label: "Tokio" },
  { id: "newyork", location: [40.71, -74.0], delay: 1.2, label: "Nueva York" },
  { id: "rome", location: [41.9, 12.49], delay: 1.6, label: "Roma" },
]

export function GlobePulse({
  markers = defaultMarkers,
  className = "",
  speed = 0.003,
  dark = 1,
  baseColor = [0.18, 0.22, 0.32],
  markerColor = [0.0, 0.48, 1.0],
  glowColor = [0.0, 0.3, 0.85],
  arcColor = [0.68, 0.32, 0.87],
}: GlobePulseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        }
      }
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerUp])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId: number
    let phi = 0

    function init() {
      const width = canvas.offsetWidth
      if (width === 0 || globe) return

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width: width * 2,
        height: width * 2,
        phi: 0,
        theta: 0.2,
        dark,
        diffuse: 1.4,
        mapSamples: 16000,
        mapBrightness: dark ? 8 : 4,
        baseColor,
        markerColor,
        glowColor,
        markerElevation: 0.04,
        markers: markers.map((m) => ({ location: m.location, size: 0.035 })),
        arcs: [
          { from: [10.39, -75.48], to: [40.71, -74.0] },
          { from: [40.71, -74.0], to: [48.85, 2.35] },
          { from: [48.85, 2.35], to: [41.9, 12.49] },
          { from: [41.9, 12.49], to: [35.68, 139.69] },
        ],
        arcColor,
        arcWidth: 0.6,
        arcHeight: 0.3,
        opacity: 0.85,
      })

      function animate() {
        if (!isPausedRef.current) phi += speed
        if (globe) {
          globe.update({
            phi: phi + phiOffsetRef.current + dragOffset.current.phi,
            theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
          })
        }
        animationId = requestAnimationFrame(animate)
      }
      animate()
      setTimeout(() => canvas && (canvas.style.opacity = "1"), 50)
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect()
          init()
        }
      })
      ro.observe(canvas)
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (globe) globe.destroy()
    }
  }, [markers, speed, dark, baseColor, markerColor, glowColor, arcColor])

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <style>{`
        @keyframes pulse-expand {
          0% { transform: scale(0.3); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
    </div>
  )
}
