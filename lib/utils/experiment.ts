import type { ExperimentWeights, Variant } from '@/lib/types/database.types'

/**
 * Randomly selects a variant based on configured weights.
 * weights.a + weights.b must equal 100.
 */
export function selectVariant(weights: ExperimentWeights): Variant {
  const rand = Math.random() * 100
  return rand < weights.a ? 'a' : 'b'
}
