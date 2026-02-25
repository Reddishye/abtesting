/**
 * GlitchText — scan-line displacement + chromatic aberration via SVG filters.
 *
 * Two-stage pipeline, both running on the already-rendered pixels:
 *
 * Stage 1 — feDisplacementMap + feTurbulence
 *   High Y-frequency fractal noise warps each horizontal scan-line of the text
 *   by a different amount. The letterforms themselves are deformed — not copies,
 *   not offsets, the actual shape of "i", "t", "." is corrupted per row.
 *   Low X-frequency keeps the disruption lateral (horizontal register loss).
 *
 * Stage 2 — feColorMatrix + feOffset (on the already-warped result)
 *   Red channel extracted → pushed further left.
 *   Cyan (G+B) channel extracted → pushed slightly left.
 *   Merged back: red fringe | cyan fringe | warped white.
 *
 * Result: one rendering, letterforms physically distorted, color channels
 * split within those distorted shapes. Looks like a CRT losing horizontal
 * sync while printing. Static — no animation, no moving copies.
 */
export default function GlitchText({ text }: { text: string }) {
  return (
    <>
      <svg
        width={0}
        height={0}
        aria-hidden="true"
        style={{ position: 'absolute', overflow: 'hidden' }}
      >
        <defs>
          <filter
            id="it-glitch"
            x="-50%"
            width="200%"
            y="-20%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            {/* ── Stage 1: scan-line displacement ────────────────────
                baseFrequency X=0.03 → slow horizontal drift across the text
                baseFrequency Y=0.85 → ~1px vertical period → each row shifts
                                        independently (true scan-line effect)
                scale=16 → ±8 px max lateral displacement per row            */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03 0.85"
              numOctaves="3"
              seed="11"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="16"
              xChannelSelector="R"
              yChannelSelector="G"
              result="warped"
            />

            {/* ── Stage 2: chromatic aberration on warped result ───── */}
            <feColorMatrix
              in="warped"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="R"
            />
            <feOffset in="R" dx="-18" dy="0" result="Rs" />

            <feColorMatrix
              in="warped"
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
              result="C"
            />
            <feOffset in="C" dx="-6" dy="0" result="Cs" />

            <feMerge>
              <feMergeNode in="Rs" />
              <feMergeNode in="Cs" />
              <feMergeNode in="warped" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <span style={{ filter: 'url(#it-glitch)', display: 'inline-block' }}>
        {text}
      </span>
    </>
  )
}
