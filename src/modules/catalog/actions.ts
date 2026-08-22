'use server'

// Catalog module server actions (docs/conventions.md — Server actions).
// Every mutation: requireOrg() + requireRole(ctx,'manager') — RLS on
// products/categories/product_variants/product_images is admin-tier
// (owner|admin|manager) per supabase/migrations/0002_commerce.sql, and
// adjustStock also writes products/product_variants (not just the
// staff-tier inventory_movements table), so it is gated at 'manager' too
// for a consistent, friendly failure instead of a raw RLS rejection.

import { revalidatePath } from 'next/cache'
import type { ZodError } from 'zod'

import { requireOrg, requireRole } from '@/lib/auth'
import { getServerClient } from '@/lib/supabase/server'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import type { ActionResult } from '@/lib/types'
import type { Category, InventoryMovementType, Product } from '@/types/db'

import {
  adjustStockSchema,
  categorySchema,
  productActionSchema,
  saveImagesSchema,
  saveVariantsSchema,
  type AdjustStockInput,
  type CategoryInput,
  type ProductActionInput,
  type SaveImagesInput,
  type SaveVariantsInput,
} from './schemas'

function firstIssue(error: ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input'
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

/** Postgres unique_violation → a friendly message instead of the raw constraint name. */
function friendlyDbError(error: { code?: string; message: string }, entity: string): string {
  if (error.code === '23505') return `A ${entity} with this slug already exists.`
  return error.message
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function createProduct(input: ProductActionInput): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')

  const parsed = productActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  const data = parsed.data

  try {
    const supabase = await getServerClient()
    const { data: row, error } = await supabase
      .from('products')
      .insert({
        org_id: ctx.org.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        brand: data.brand,
        color: data.color,
        category_id: data.category_id,
        status: data.status,
        price: data.price,
        compare_at_price: data.compare_at_price,
        cost_price: data.cost_price,
        track_stock: data.track_stock,
        stock_qty: data.stock_qty,
        low_stock_threshold: data.low_stock_threshold,
        allow_backorder: data.allow_backorder,
        tags: data.tags.length ? data.tags : null,
        sale_ends_at: data.sale_ends_at ?? null,
        restock_at: data.restock_at ?? null,
      })
      .select('id')
      .single()

    if (error || !row) return { ok: false, error: friendlyDbError(error ?? { message: 'Failed to create product' }, 'product') }

    audit(ctx, 'create', 'product', row.id as string, undefined, data)
    revalidatePath('/admin/products')

    return { ok: true, data: { id: row.id as string } }
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Failed to create product') }
  }
}

export async function updateProduct(
  id: string,
  input: ProductActionInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')

  const parsed = productActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  const data = parsed.data

  try {
    const supabase = await getServerClient()

    const { data: before } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('org_id', ctx.org.id)
      .single()
    if (!before) return { ok: false, error: 'Product not found' }

    const { data: row, error } = await supabase
      .from('products')
      .update({
        name: data.name,
        slug: data.slug,
        description: data.description,
        brand: data.brand,
        color: data.color,
        category_id: data.category_id,
        status: data.status,
        price: data.price,
        compare_at_price: data.compare_at_price,
        cost_price: data.cost_price,
        track_stock: data.track_stock,
        stock_qty: data.stock_qty,
        low_stock_threshold: data.low_stock_threshold,
        allow_backorder: data.allow_backorder,
        tags: data.tags.length ? data.tags : null,
        sale_ends_at: data.sale_ends_at ?? null,
        restock_at: data.restock_at ?? null,
      })
      .eq('id', id)
      .eq('org_id', ctx.org.id)
      .select('id')
      .single()

    if (error || !row) return { ok: false, error: friendlyDbError(error ?? { message: 'Failed to update product' }, 'product') }

    audit(ctx, 'update', 'product', id, before, data)
    await maybeNotifyLowStock(ctx.org.id, before as Product, {
      stock_qty: data.stock_qty,
      low_stock_threshold: data.low_stock_threshold,
      name: data.name,
    }, id)

    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${id}`)

    return { ok: true, data: { id } }
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Failed to update product') }
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')

  try {
    const supabase = await getServerClient()

    const { data: before } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('org_id', ctx.org.id)
      .single()
    if (!before) return { ok: false, error: 'Product not found' }

    // order_items.product_id is ON DELETE SET NULL (snapshots survive);
    // product_variants/product_images/inventory_movements are ON DELETE
    // CASCADE — a plain delete here is safe (supabase/migrations/0002_commerce.sql).
    const { error } = await supabase.from('products').delete().eq('id', id).eq('org_id', ctx.org.id)
    if (error) return { ok: false, error: error.message }

    audit(ctx, 'delete', 'product', id, before, undefined)
    revalidatePath('/admin/products')

    return { ok: true }
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Failed to delete product') }
  }
}

// ---------------------------------------------------------------------------
// Variants — replace-set: delete removed ids, insert new rows, update the rest.
// ---------------------------------------------------------------------------

export async function saveVariants(input: SaveVariantsInput): Promise<ActionResult> {
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')

  const parsed = saveVariantsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  const { product_id, variants } = parsed.data

  try {
    const supabase = await getServerClient()

    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .eq('org_id', ctx.org.id)
      .single()
    if (!product) return { ok: false, error: 'Product not found' }

    const { data: existing, error: existingError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', product_id)
    if (existingError) return { ok: false, error: existingError.message }

    const existingIds = new Set((existing ?? []).map((v) => v.id as string))
    const keepIds = new Set(variants.filter((v) => v.id).map((v) => v.id as string))
    const removeIds = [...existingIds].filter((vid) => !keepIds.has(vid))

    if (removeIds.length) {
      const { error: delError } = await supabase.from('product_variants').delete().in('id', removeIds)
      if (delError) return { ok: false, error: delError.message }
    }

    const toInsert = variants
      .filter((v) => !v.id)
      .map((v, i) => ({
        org_id: ctx.org.id,
        product_id,
        name: v.name,
        price: v.price,
        compare_at_price: v.compare_at_price,
        stock_qty: v.stock_qty,
        options: v.options,
        is_default: v.is_default,
        position: v.position ?? i,
      }))
    if (toInsert.length) {
      const { error: insError } = await supabase.from('product_variants').insert(toInsert)
      if (insError) return { ok: false, error: insError.message }
    }

    const toUpdate = variants.filter((v) => v.id)
    for (const v of toUpdate) {
      const { error: updError } = await supabase
        .from('product_variants')
        .update({
          name: v.name,
          price: v.price,
          compare_at_price: v.compare_at_price,
          stock_qty: v.stock_qty,
          options: v.options,
          is_default: v.is_default,
          position: v.position,
        })
        .eq('id', v.id as string)
        .eq('product_id', product_id)
      if (updError) return { ok: false, error: updError.message }
    }

    // Clothing inventory is tracked per size variant; keep the parent product
    // quantity as the aggregate so admin lists and stock checks stay accurate.
    const { data: variantTotals, error: totalsError } = await supabase
      .from('product_variants')
      .select('stock_qty')
      .eq('org_id', ctx.org.id)
      .eq('product_id', product_id)
    if (totalsError) return { ok: false, error: totalsError.message }
    const totalStock = (variantTotals ?? []).reduce((sum, row) => sum + (row.stock_qty ?? 0), 0)
    const { error: productStockError } = await supabase
      .from('products')
      .update({ stock_qty: totalStock })
      .eq('id', product_id)
      .eq('org_id', ctx.org.id)
    if (productStockError) return { ok: false, error: productStockError.message }

    audit(ctx, 'update', 'product_variants', product_id, { count: existingIds.size }, { count: variants.length })
    revalidatePath(`/admin/products/${product_id}`)
    revalidatePath('/admin/products')

    return { ok: true }
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Failed to save variants') }
  }
}

// ---------------------------------------------------------------------------
// Images — replace-set, position-ordered, optional per-variant assignment.
// ---------------------------------------------------------------------------

export async function saveImages(input: SaveImagesInput): Promise<ActionResult> {
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')

  const parsed = saveImagesSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  const { product_id, images } = parsed.data

  try {
    const supabase = await getServerClient()

    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .eq('org_id', ctx.org.id)
      .single()
    if (!product) return { ok: false, error: 'Product not found' }

    const { data: existing, error: existingError } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', product_id)
    if (existingError) return { ok: false, error: existingError.message }

    const existingIds = new Set((existing ?? []).map((img) => img.id as string))
    const keepIds = new Set(images.filter((img) => img.id).map((img) => img.id as string))
    const removeIds = [...existingIds].filter((iid) => !keepIds.has(iid))

    if (removeIds.length) {
      const { error: delError } = await supabase.from('product_images').delete().in('id', removeIds)
      if (delError) return { ok: false, error: delError.message }
    }

    const toInsert = images
      .filter((img) => !img.id)
      .map((img, i) => ({
        org_id: ctx.org.id,
        product_id,
        media_id: img.media_id,
        variant_id: img.variant_id,
        position: img.position ?? i,
      }))
    if (toInsert.length) {
      const { error: insError } = await supabase.from('product_images').insert(toInsert)
      if (insError) return { ok: false, error: insError.message }
    }

    const toUpdate = images.filter((img) => img.id)
    for (const img of toUpdate) {
      const { error: updError } = await supabase
        .from('product_images')
        .update({ media_id: img.media_id, variant_id: img.variant_id, position: img.position })
        .eq('id', img.id as string)
        .eq('product_id', product_id)
      if (updError) return { ok: false, error: updError.message }
    }

    audit(ctx, 'update', 'product_images', product_id, { count: existingIds.size }, { count: images.length })
    revalidatePath(`/admin/products/${product_id}`)
    revalidatePath('/admin/products')

    return { ok: true }
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Failed to save images') }
  }
}

// ---------------------------------------------------------------------------
// Inventory — manual stock adjustment. Writes inventory_movements (type
// 'adjustment') + the denormalized stock_qty on the product or variant, in
// the same action (docs/architecture.md §3). Fires 'low_stock' when the
// resulting quantity crosses the threshold going down.
// ---------------------------------------------------------------------------

export async function adjustStock(input: AdjustStockInput): Promise<ActionResult> {
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')

  const parsed = adjustStockSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  const { product_id, variant_id, qty_delta, note } = parsed.data

  try {
    const supabase = await getServerClient()

    const { data: product } = await supabase
      .from('products')
      .select('id, name, stock_qty, low_stock_threshold, allow_backorder')
      .eq('id', product_id)
      .eq('org_id', ctx.org.id)
      .single()
    if (!product) return { ok: false, error: 'Product not found' }

    let beforeQty: number
    let afterQty: number

    if (variant_id) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('id, stock_qty')
        .eq('id', variant_id)
        .eq('product_id', product_id)
        .single()
      if (!variant) return { ok: false, error: 'Variant not found' }

      beforeQty = variant.stock_qty as number
      afterQty = beforeQty + qty_delta
      if (afterQty < 0 && !product.allow_backorder) {
        return { ok: false, error: 'Resulting stock cannot be negative' }
      }

      const { error: updError } = await supabase
        .from('product_variants')
        .update({ stock_qty: afterQty })
        .eq('id', variant_id)
      if (updError) return { ok: false, error: updError.message }
    } else {
      beforeQty = product.stock_qty as number
      afterQty = beforeQty + qty_delta
      if (afterQty < 0 && !product.allow_backorder) {
        return { ok: false, error: 'Resulting stock cannot be negative' }
      }

      const { error: updError } = await supabase
        .from('products')
        .update({ stock_qty: afterQty })
        .eq('id', product_id)
      if (updError) return { ok: false, error: updError.message }
    }

    const movementType: InventoryMovementType = 'adjustment'
    const { error: movError } = await supabase.from('inventory_movements').insert({
      org_id: ctx.org.id,
      product_id,
      variant_id: variant_id ?? null,
      qty_delta,
      type: movementType,
      reference: null,
      note,
      actor_id: ctx.user.id,
    })
    if (movError) return { ok: false, error: movError.message }

    audit(ctx, 'adjust_stock', 'product', product_id, { qty: beforeQty, variant_id }, { qty: afterQty, variant_id })

    const threshold = product.low_stock_threshold as number
    if (beforeQty >= threshold && afterQty < threshold) {
      await notify(ctx.org.id, 'low_stock', {
        title: `Low stock: ${product.name as string}`,
        body: `${afterQty} left (threshold ${threshold})`,
        link: `/admin/products/${product_id}`,
      })
    }

    revalidatePath('/admin/inventory')
    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${product_id}`)

    return { ok: true }
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Failed to adjust stock') }
  }
}

/** Shared by updateProduct (direct stock_qty edit) and adjustStock (ledger). */
async function maybeNotifyLowStock(
  orgId: string,
  before: Pick<Product, 'stock_qty'>,
  after: { stock_qty: number; low_stock_threshold: number; name: string },
  productId: string,
): Promise<void> {
  if (before.stock_qty >= after.low_stock_threshold && after.stock_qty < after.low_stock_threshold) {
    await notify(orgId, 'low_stock', {
      title: `Low stock: ${after.name}`,
      body: `${after.stock_qty} left (threshold ${after.low_stock_threshold})`,
      link: `/admin/products/${productId}`,
    })
  }
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function createCategory(input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')

  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  const data = parsed.data

  try {
    const supabase = await getServerClient()
    const { data: row, error } = await supabase
      .from('categories')
      .insert({ org_id: ctx.org.id, name: data.name, slug: data.slug, parent_id: data.parent_id })
      .select('id')
      .single()

    if (error || !row) return { ok: false, error: friendlyDbError(error ?? { message: 'Failed to create category' }, 'category') }

    audit(ctx, 'create', 'category', row.id as string, undefined, data)
    revalidatePath('/admin/categories')

    return { ok: true, data: { id: row.id as string } }
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Failed to create category') }
  }
}

export async function updateCategory(id: string, input: CategoryInput): Promise<ActionResult> {
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')

  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  const data = parsed.data

  if (data.parent_id === id) {
    return { ok: false, error: 'A category cannot be its own parent' }
  }

  try {
    const supabase = await getServerClient()

    const { data: before } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('org_id', ctx.org.id)
      .single()
    if (!before) return { ok: false, error: 'Category not found' }

    const { error } = await supabase
      .from('categories')
      .update({ name: data.name, slug: data.slug, parent_id: data.parent_id })
      .eq('id', id)
      .eq('org_id', ctx.org.id)

    if (error) return { ok: false, error: friendlyDbError(error, 'category') }

    audit(ctx, 'update', 'category', id, before as Category, data)
    revalidatePath('/admin/categories')
    revalidatePath('/admin/products')

    return { ok: true }
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Failed to update category') }
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const ctx = await requireOrg()
  requireRole(ctx, 'manager')

  try {
    const supabase = await getServerClient()

    const { data: before } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('org_id', ctx.org.id)
      .single()
    if (!before) return { ok: false, error: 'Category not found' }

    // categories.parent_id and products.category_id are both ON DELETE SET
    // NULL (supabase/migrations/0002_commerce.sql) — child categories and
    // products are automatically detached, no manual pre-null step needed.
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('org_id', ctx.org.id)
    if (error) return { ok: false, error: error.message }

    audit(ctx, 'delete', 'category', id, before as Category, undefined)
    revalidatePath('/admin/categories')
    revalidatePath('/admin/products')

    return { ok: true }
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Failed to delete category') }
  }
}
