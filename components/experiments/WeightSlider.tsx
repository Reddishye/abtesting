'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface WeightSliderProps {
  initialA?: number
  initialB?: number
  readOnly?: boolean
  onWeightsChange?: (a: number, b: number) => void
}

export function WeightSlider({
  initialA = 50,
  initialB = 50,
  readOnly = false,
  onWeightsChange,
}: WeightSliderProps) {
  const [weightA, setWeightA] = useState(initialA)

  function handleChange(value: number) {
    const clamped = Math.max(0, Math.min(100, value))
    setWeightA(clamped)
    onWeightsChange?.(clamped, 100 - clamped)
  }

  const weightB = 100 - weightA

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium w-16 text-blue-500">
          Variant A
        </span>
        <div className="flex-1 relative h-6 flex items-center">
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${weightA}%` }}
            />
          </div>
          {!readOnly && (
            <input
              type="range"
              min={0}
              max={100}
              value={weightA}
              onChange={(e) => handleChange(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              aria-label="Variant A weight"
            />
          )}
        </div>
        <span className="text-xs font-mono w-16 text-right text-blue-500">
          {weightA}%
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium w-16 text-purple-500">
          Variant B
        </span>
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${weightB}%` }}
          />
        </div>
        <span className="text-xs font-mono w-16 text-right text-purple-500">
          {weightB}%
        </span>
      </div>

      {/* Hidden inputs for form submission */}
      <Input type="hidden" name="weight_a" value={weightA} />
      <Input type="hidden" name="weight_b" value={weightB} />
    </div>
  )
}
