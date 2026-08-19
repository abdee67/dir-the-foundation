import { redirect } from 'next/navigation'
import type { PageProps } from '@/lib/types'

// Category pages simply redirect to the products page with the category filter applied.
// e.g. /category/women → /products?category=women
export default async function CategoryPage({ params }: PageProps<{ cat: string }>) {
  const { cat } = await params
  redirect(`/products?category=${cat}`)
}
