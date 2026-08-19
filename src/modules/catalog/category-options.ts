export interface CategoryOption {
  id: string
  name: string
  parentName: string | null
}

/** Server-safe category projection for the product editor select. */
export function toCategoryOptions(
  rows: { id: string; name: string; parent_id: string | null }[],
): CategoryOption[] {
  const byId = new Map(rows.map((row) => [row.id, row]))
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentName: row.parent_id ? (byId.get(row.parent_id)?.name ?? null) : null,
  }))
}
