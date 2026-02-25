'use client'

import { useEffect, useRef } from 'react'

/**
 * Canvas glitch renderer — three-channel chromatic aberration.
 *
 * Each frame draws "it." three times:
 *   1. Red  (#ff0000)  — shifted far LEFT   → red fringe
 *   2. Cyan (#00ffff)  — shifted closer LEFT → cyan fringe
 *   3. White (#ffffff) — normal position     → base text
 *
 * The canvas uses mix-blend-mode: screen so the colored copies
 * ADD light to the gradient behind rather than covering it.
 * Channels are separated in the left fringe region = RGB split.
 *
 * On top of that, random horizontal strips fire every few frames
 * with extra per-band jitter → scan-line glitch aesthetic.
 *
 * Shift amounts oscillate via slow sines → constant, never pauses.
 */

const BLEED = 48   // canvas extends this many CSS px to the LEFT

function getFontFamily(): string {
  return (
    getComputedStyle(document.body)
      .getPropertyValue('--font-geist-sans')
      .trim() || 'sans-serif'
  )
}

export default function GlitchText({ text }: { text: string }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const canvas  = canvasRef.current
    const measure = measureRef.current
    if (!canvas || !measure) return

    const ctx = canvas.getContext('2d', { alpha: true })!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let raf: number
    const t0 = performance.now()

    // ── sizing ───────────────────────────────────────────────────────
    function syncSize() {
      const r = measure.getBoundingClientRect()
      canvas.width        = Math.round((r.width + BLEED) * dpr)
      canvas.height       = Math.round(r.height * dpr)
      canvas.style.width  = `${r.width + BLEED}px`
      canvas.style.height = `${r.height}px`
    }

    // ── main loop ─────────────────────────────────────────────────────
    function draw(now: number) {
      const t = (now - t0) / 1000
      const W = canvas.width
      const H = canvas.height

      ctx.clearRect(0, 0, W, H)

      const fs = parseFloat(getComputedStyle(measure).fontSize) * dpr
      ctx.font          = `900 ${fs}px ${getFontFamily()}, sans-serif`
      ctx.textBaseline  = 'top'
      ctx.letterSpacing = `${-0.025 * fs}px`

      // Text X inside the canvas (BLEED px from the left edge)
      const tx = BLEED * dpr
      // Text Y: slight padding so top ascenders aren't clipped
      const ty = H * 0.06

      // Channel shift amounts (physical px) — sine oscillation, always > 0
      const rs = (18 + Math.sin(t * 0.75)       * 10) * dpr   // 8–28 CSS px
      const cs = ( 6 + Math.sin(t * 0.95 + 0.8) *  4) * dpr  // 2–10 CSS px

      // ── three-channel draw ─────────────────────────────────────────
      ctx.fillStyle = '#ff0000'
      ctx.fillText(text, tx - rs, ty)

      ctx.fillStyle = '#00ffff'
      ctx.fillText(text, tx - cs, ty)

      ctx.fillStyle = '#ffffff'
      ctx.fillText(text, tx, ty)

      // ── scan-line strip glitch ─────────────────────────────────────
      // Fires ~1–2× per second; each strip lasts one frame (instant flash)
      if (Math.random() < 0.025) {
        const slY = Math.floor(Math.random() * H)
        const slH = Math.ceil(H * 0.04 + Math.random() * H * 0.14)
        const jR  = (Math.random() - 0.5) * 22 * dpr
        const jC  = (Math.random() - 0.5) * 10 * dpr

        ctx.save()
        ctx.beginPath()
        ctx.rect(0, slY, W, slH)
        ctx.clip()
        ctx.clearRect(0, slY, W, slH)

        ctx.fillStyle = '#ff0000'
        ctx.fillText(text, tx - rs + jR, ty)
        ctx.fillStyle = '#00ffff'
        ctx.fillText(text, tx - cs + jC, ty)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(text, tx, ty)

        ctx.restore()
      }

      raf = requestAnimationFrame(draw)
    }

    syncSize()
    const ro = new ResizeObserver(syncSize)
    ro.observe(measure)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [text])

  return (
    <span className="relative inline-block overflow-visible">
      {/*
        Invisible reference span: sizes the layout box and provides
        the computed font-size for the canvas to read.
      */}
      <span
        ref={measureRef}
        className="invisible whitespace-nowrap select-none"
        aria-hidden="true"
      >
        {text}
      </span>

      {/*
        Canvas extends BLEED px to the LEFT of the layout box.
        mix-blend-mode: screen → colored channels add light to the
        gradient rather than painting opaque rectangles over it.
      */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute top-0 pointer-events-none"
        style={{ left: -BLEED, mixBlendMode: 'screen' }}
      />

      <span className="sr-only">{text}</span>
    </span>
  )
}
