// Estadísticas que son promedios o porcentajes y se muestran con un decimal.
const CON_DECIMAL = new Set(['cmp_pct', 'avg', 'yds_g', 'rtg', 'rec_pct', 'yprr', 'pres_pct'])

export function formatear(clave: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (typeof valor === 'string') return valor
  if (typeof valor !== 'number' || Number.isNaN(valor)) return '—'
  return CON_DECIMAL.has(clave) ? valor.toFixed(1) : valor.toLocaleString('en-US')
}
