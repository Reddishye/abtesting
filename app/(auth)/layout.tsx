'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const Grainient  = dynamic(() => import('@/components/Grainient'),  { ssr: false })
const GlitchText = dynamic(() => import('@/components/GlitchText'), { ssr: false })

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isSignup = pathname === '/signup'

  // One frozen snapshot per zone.
  // On navigation we update ONLY the destination zone; the source zone stays
  // unchanged until the Grainient has fully slid over it.
  // We intentionally omit `children` from the effect deps — Next.js App Router
  // creates new element references on every render, which would otherwise
  // re-trigger the effect and overwrite the frozen source zone mid-animation.
  const [loginZone,  setLoginZone]  = useState<React.ReactNode>(isSignup ? null : children)
  const [signupZone, setSignupZone] = useState<React.ReactNode>(isSignup ? children : null)

  useEffect(() => {
    if (isSignup) setSignupZone(children)
    else          setLoginZone(children)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignup])

  return (
    <>
      {/* ── Mobile: full-screen centered form, no animation ── */}
      <div className="flex lg:hidden items-center justify-center p-8 min-h-screen">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>

      {/* ── Desktop: fixed halves + sliding Grainient ── */}
      <div className="hidden lg:block relative min-h-screen overflow-hidden">

        {/* Signup form — lives in the left half */}
        <div className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            {signupZone}
          </div>
        </div>

        {/* Login / other forms — live in the right half */}
        <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            {loginZone}
          </div>
        </div>

        {/* Grainient panel — z-10, slides right on signup.
            Source zone stays frozen behind it; destination fades in as it reveals. */}
        <div
          className={`absolute inset-y-0 left-0 w-1/2 z-10 p-6 transition-transform duration-500 ease-in-out${isSignup ? ' translate-x-full' : ''}`}
        >
          <div className="relative h-full rounded-3xl overflow-hidden shadow-[0_32px_96px_-16px_rgba(0,0,0,0.45)] ring-2 ring-neutral-400/50 dark:ring-neutral-600">

            <Grainient
              grainAmount={0.08}
              warpStrength={1.2}
              contrast={1.4}
              saturation={1.1}
            />

            {/* Radial vignette */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_55%,rgba(0,0,0,0.28)_100%)]" />

            {/* Bottom-edge fade */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/40 to-transparent" />

            {/* Slogan — block is centered; lines stagger left→right→left */}
            <div className="absolute inset-0 flex flex-col justify-center items-center select-none">
              {/*
                items-start keeps lines left-aligned inside the block.
                The outer items-center centers the block in the panel.
              */}
              <div className="flex flex-col items-start">
                {/* "Move" — thin editorial italic serif */}
                <span
                  className="text-white leading-[0.85]"
                  style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontWeight: 300,
                    fontStyle: 'italic',
                    fontSize: 'clamp(5rem, 8.5vw, 8rem)',
                    marginLeft: 'clamp(0.5rem, 0.5vw, 1rem)',
                  }}
                >
                  Move
                </span>
                {/* "with" — heavy geometric sans, larger indent */}
                <span
                  className="font-black text-white tracking-tight leading-none"
                  style={{
                    fontSize: 'clamp(3rem, 5.5vw, 5rem)',
                    marginLeft: 'clamp(2rem, 4vw, 5rem)',
                  }}
                >
                  with
                </span>
                {/* "it." — canvas glitch: red/cyan channel split + scan-line strips */}
                <span
                  className="font-black text-white tracking-tight leading-none"
                  style={{ fontSize: 'clamp(3rem, 5.5vw, 5rem)' }}
                >
                  <GlitchText text="it." />
                </span>
              </div>
            </div>

            {/* Brand mark */}
            <div className="absolute bottom-6 left-8">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                  <span className="text-white text-[10px] font-bold tracking-tight">AB</span>
                </div>
                <span className="text-white/60 font-medium text-sm">ABPlatform</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  )
}
