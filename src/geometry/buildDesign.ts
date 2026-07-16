import type { RingConfig } from '../domain/types'
import { validateDesign } from '../validation/validateDesign'
import type { ValidationReport } from '../validation/types'
import { buildSemanticLayout } from './buildLayout'
import type { SemanticLayout } from './types'

export type RingDesign = {
  layout: SemanticLayout
  report: ValidationReport
}

export function buildRingDesign(config: RingConfig): RingDesign {
  const layout = buildSemanticLayout(config)
  return { layout, report: validateDesign(layout) }
}
