export type RuleSeverity = 'info' | 'warning' | 'error'

export type RuleResult = {
  code: string
  severity: RuleSeverity
  title: string
  message: string
  source: string
  entityIds: string[]
  measured?: number
  required?: number | [number, number]
  unit?: 'mm' | 'degrees' | 'ratio' | 'count'
}

export type ValidationReport = {
  status: 'conform' | 'review' | 'impossible'
  results: RuleResult[]
  errors: number
  warnings: number
}
