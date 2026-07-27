// Compartido entre todos los gráficos de área/barras del dashboard —
// evita que cada uno reinvente el mismo cálculo de escala "bonita" y que
// diverjan con el tiempo. Ver RevenueExpenseChart para el porqué del suelo
// mínimo (antes de esto, un periodo sin datos mostraba fracciones de euro
// sin sentido en el eje).

/** Redondea a un "paso bonito" (1/2/5 × 10^n) — nunca deja el step con decimales feos. */
function niceStep(roughStep: number): number {
  if (roughStep <= 0) return 10
  const exponent = Math.floor(Math.log10(roughStep))
  const base = Math.pow(10, exponent)
  const fraction = roughStep / base
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return niceFraction * base
}

export type AxisScale = { maxValue: number; ticks: number[] }

/**
 * Escala de eje Y con 4 tramos iguales, con un suelo mínimo para que un
 * gráfico sin apenas datos no muestre una rejilla en céntimos.
 */
export function niceAxisScale(rawMax: number, minFloor: number): AxisScale {
  const step = niceStep(Math.max(rawMax, minFloor) / 4)
  const maxValue = step * 4
  return { maxValue, ticks: [0, step, step * 2, step * 3, maxValue] }
}
